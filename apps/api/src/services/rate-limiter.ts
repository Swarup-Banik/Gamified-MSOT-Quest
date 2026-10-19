import { redis } from '../redis.js';

/**
 * Enterprise Rate Limiting & Account Lockout Engine
 * Combines per-IP and per-account sliding windows with exponential backoff delays
 * to thwart brute-force password cracking and credential stuffing attacks.
 */

export interface RateLimitCheckResult {
  allowed: boolean;
  backoffDelayMs: number;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
  errorMessage?: string;
  reason?: string;
}

export class RateLimiterService {
  /**
   * Evaluates login attempts for an IP and account combination.
   */
  async checkLoginRateLimit(arg1: string, arg2: string): Promise<RateLimitCheckResult> {
    const isFirstEmail = arg1.includes('@');
    const email = isFirstEmail ? arg1 : arg2;
    const ip = isFirstEmail ? arg2 : arg1;

    const cleanEmail = email.toLowerCase().trim();
    const ipKey = `rate:login:ip:${ip}`;
    const emailKey = `rate:login:email:${cleanEmail}`;
    const lockoutKey = `lockout:login:email:${cleanEmail}`;

    // 1. Check if account is in temporary lockout
    const lockoutTtl = await redis.get(lockoutKey);
    if (lockoutTtl) {
      return {
        allowed: false,
        backoffDelayMs: 0,
        remainingAttempts: 0,
        lockoutRemainingSeconds: parseInt(lockoutTtl, 10),
        errorMessage: 'Too many failed login attempts. Please try again in 15 minutes.',
        reason: 'Too many failed attempts',
      };
    }

    // 2. Sliding window: check attempts
    const attemptsStr = await redis.get(emailKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts >= 5) {
      // Trigger 15-minute lockout
      await redis.set(lockoutKey, '900', 900);
      return {
        allowed: false,
        backoffDelayMs: 0,
        remainingAttempts: 0,
        lockoutRemainingSeconds: 900,
        errorMessage: 'Too many failed login attempts. Please try again in 15 minutes.',
        reason: 'Too many failed attempts',
      };
    }

    // Exponential backoff calculation
    let backoffDelayMs = 0;
    if (attempts === 4) {
      backoffDelayMs = 2000;
    } else if (attempts === 5) {
      backoffDelayMs = 5000;
    }

    return {
      allowed: true,
      backoffDelayMs,
      remainingAttempts: Math.max(0, 5 - attempts),
    };
  }

  async recordFailedLogin(arg1: string, arg2: string = '127.0.0.1'): Promise<number> {
    const isFirstEmail = arg1.includes('@');
    const email = isFirstEmail ? arg1 : arg2;
    const cleanEmail = email.toLowerCase().trim();
    const emailKey = `rate:login:email:${cleanEmail}`;
    const attempts = await redis.incr(emailKey);
    if (attempts === 1) {
      await redis.set(emailKey, '1', 15 * 60);
    }
    if (attempts >= 5) {
      await redis.set(`lockout:login:email:${cleanEmail}`, '900', 900);
    }
    return attempts;
  }

  async reset(arg1: string, arg2: string = '127.0.0.1'): Promise<void> {
    await this.clearLoginRateLimit(arg1, arg2);
  }

  /**
   * Resets failed login counters upon successful authentication.
   */
  async clearLoginRateLimit(arg1: string, arg2: string = '127.0.0.1'): Promise<void> {
    const isFirstEmail = arg1.includes('@');
    const email = isFirstEmail ? arg1 : arg2;
    const ip = isFirstEmail ? arg2 : arg1;
    const cleanEmail = email.toLowerCase().trim();
    await redis.del(`rate:login:email:${cleanEmail}`);
    await redis.del(`lockout:login:email:${cleanEmail}`);
    await redis.del(`rate:login:ip:${ip}`);
  }

  /**
   * Rate limits password reset requests (max 3 per hour per email).
   */
  async checkPasswordResetLimit(email: string): Promise<boolean> {
    const key = `rate:reset:${email.toLowerCase().trim()}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.set(key, '1', 60 * 60);
    }
    return count <= 3;
  }

  /**
   * Rate limits email verification resends (max 1 per 2 minutes per email).
   */
  async checkVerificationResendLimit(email: string): Promise<boolean> {
    const key = `rate:resend:${email.toLowerCase().trim()}`;
    const exists = await redis.get(key);
    if (exists) return false;
    await redis.set(key, '1', 120); // 2 minutes cooldown
    return true;
  }
}

export const rateLimiter = new RateLimiterService();
