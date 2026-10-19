import argon2, { HashOptions } from 'argon2';
import crypto from 'node:crypto';

/**
 * High-security Argon2id Password Hashing Service
 * Tuned to target 100-300ms verification latency per NIST SP 800-63B guidelines,
 * resistant to GPU cracking and side-channel timing attacks.
 */

export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

// Built-in list of very common compromised passwords
const COMMON_PASSWORDS = new Set([
  'password123',
  'password1234',
  'admin12345',
  'qwerty12345',
  'msotsecret2026',
  '1234567890',
  'welcome1234',
  'letmein1234',
  'student1234',
  'college1234',
  'campus12345',
  'ilovecoding1',
]);

export class Argon2Service {
  // Argon2id tuned parameters
  private readonly options: HashOptions & { raw?: false } = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 1,    // 1 thread
    hashLength: 32,
    raw: false,
  };

  /**
   * Validates password strength without arbitrary composition gimmicks.
   * Mandates minimum length of 10 and rejects blacklisted common passwords.
   */
  validatePasswordPolicy(password: string): PasswordValidationResult {
    if (!password || typeof password !== 'string') {
      return { valid: false, reason: 'Password is required' };
    }

    if (password.length < 10) {
      return {
        valid: false,
        reason: 'Password must be at least 10 characters long',
      };
    }

    if (COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
      return {
        valid: false,
        reason: 'This password is too common and easily guessable. Please choose a passphrase.',
      };
    }

    return { valid: true };
  }

  /**
   * Hashes a password using Argon2id.
   */
  async hash(password: string): Promise<string> {
    const policy = this.validatePasswordPolicy(password);
    if (!policy.valid) {
      throw new Error(policy.reason || 'Password does not meet security requirements');
    }

    return await argon2.hash(password, this.options);
  }

  /**
   * Verifies a plain text password against an Argon2id hash.
   */
  async verify(hash: string, plainText: string): Promise<boolean> {
    if (!hash || !plainText) return false;
    try {
      return await argon2.verify(hash, plainText);
    } catch (err) {
      return false;
    }
  }

  /**
   * Generates a single-use high-entropy crypto token (hex) and its SHA-256 hash.
   */
  generateSecureToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  /**
   * Computes SHA-256 hash for lookup.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const argon2Service = new Argon2Service();
