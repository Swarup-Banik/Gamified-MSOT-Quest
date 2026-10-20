import { CodingPlatform, CircuitBreakerState, ProviderHealth } from '@msot/shared';
import { db } from '../db.js';

export class CircuitBreakerManager {
  private lastRequestTime = new Map<CodingPlatform, number>();
  private readonly defaultCooldownMs: number;
  private readonly failureThreshold: number;
  private readonly minRequestIntervalMs: number;

  constructor() {
    this.failureThreshold = Number(process.env.CIRCUIT_BREAKER_FAIL_THRESHOLD || 5);
    this.defaultCooldownMs = Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS || 15 * 60 * 1000); // 15 mins
    this.minRequestIntervalMs = process.env.NODE_ENV === 'test' ? 0 : Number(process.env.PROVIDER_RATE_LIMIT_MS || 3000); // 3s polite limit, 0 in test
  }

  /**
   * Initializes or gets current provider health status
   */
  getHealth(provider: CodingPlatform): ProviderHealth {
    let health = db.providerHealth.get(provider);
    if (!health) {
      health = {
        provider,
        state: 'CLOSED',
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        cooldownUntil: null,
        lastErrorMessage: null,
      };
      db.providerHealth.set(provider, health);
    }

    // Check if cooldown expired in OPEN state -> transition to HALF_OPEN
    if (health.state === 'OPEN' && health.cooldownUntil) {
      const now = Date.now();
      const cooldownEnd = new Date(health.cooldownUntil).getTime();
      if (now >= cooldownEnd) {
        health.state = 'HALF_OPEN';
        db.providerHealth.set(provider, health);
      }
    }

    return health;
  }

  /**
   * Returns current health for all coding platforms
   */
  getAllHealth(): Record<CodingPlatform, ProviderHealth> {
    const providers: CodingPlatform[] = ['GITHUB', 'LEETCODE', 'HACKERRANK'];
    const res: any = {};
    for (const p of providers) {
      res[p] = this.getHealth(p);
    }
    return res;
  }

  /**
   * Checks whether an outbound call to the provider is permitted
   */
  canExecute(provider: CodingPlatform): { allowed: boolean; reason?: string } {
    const health = this.getHealth(provider);

    if (health.state === 'OPEN') {
      return {
        allowed: false,
        reason: `Provider circuit breaker is OPEN until ${health.cooldownUntil} due to repeated failures: ${health.lastErrorMessage}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Enforces global polite rate limiting (minimum delay between requests)
   */
  async throttle(provider: CodingPlatform): Promise<void> {
    const last = this.lastRequestTime.get(provider) || 0;
    const now = Date.now();
    const elapsed = now - last;

    if (elapsed < this.minRequestIntervalMs) {
      const waitTime = this.minRequestIntervalMs - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime.set(provider, Date.now());
  }

  /**
   * Records a successful provider interaction
   */
  recordSuccess(provider: CodingPlatform): void {
    const health = this.getHealth(provider);
    health.state = 'CLOSED';
    health.failureCount = 0;
    health.lastSuccessAt = new Date().toISOString();
    health.cooldownUntil = null;
    health.lastErrorMessage = null;
    db.providerHealth.set(provider, health);
  }

  /**
   * Records a provider failure, incrementing counter and tripping breaker if threshold reached
   */
  recordFailure(provider: CodingPlatform, error: Error | string, customCooldownMs?: number): ProviderHealth {
    const health = this.getHealth(provider);
    const msg = typeof error === 'string' ? error : error.message;

    health.failureCount++;
    health.lastFailureAt = new Date().toISOString();
    health.lastErrorMessage = msg;

    if (health.state === 'HALF_OPEN' || health.failureCount >= this.failureThreshold) {
      health.state = 'OPEN';
      const cooldownDuration = customCooldownMs ?? this.defaultCooldownMs;
      health.cooldownUntil = new Date(Date.now() + cooldownDuration).toISOString();
    }

    db.providerHealth.set(provider, health);
    return health;
  }

  /**
   * Administrative manual trip (for testing or emergency provider shutdown)
   */
  trip(provider: CodingPlatform, reason: string = 'Administrative manual trip', cooldownMs: number = 60000): void {
    const health = this.getHealth(provider);
    health.state = 'OPEN';
    health.lastErrorMessage = reason;
    health.cooldownUntil = new Date(Date.now() + cooldownMs).toISOString();
    db.providerHealth.set(provider, health);
  }

  /**
   * Administrative manual reset
   */
  reset(provider: CodingPlatform): void {
    this.recordSuccess(provider);
  }
}

export const circuitBreaker = new CircuitBreakerManager();
