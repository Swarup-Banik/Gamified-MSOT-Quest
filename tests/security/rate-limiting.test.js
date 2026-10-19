import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../apps/api/dist/server.js';
import { rateLimiter } from '../../apps/api/dist/services/rate-limiter.js';

describe('Security: Brute-Force Rate Limiting & User Enumeration Protection', () => {
  let app;

  before(async () => {
    app = await createServer();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('Defense 1: Generic Error Messages - Returns identical message whether email exists or not', async () => {
    // 1. Existing user with wrong password
    const existingRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'student@msot.edu.in',
        password: 'IncorrectPassword999!',
      },
    });
    assert.equal(existingRes.statusCode, 401);
    const existingBody = JSON.parse(existingRes.body);

    // 2. Non-existent user
    const nonExistentRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'ghost.user.does.not.exist@msot.edu.in',
        password: 'SomeRandomPassword123!',
      },
    });
    assert.equal(nonExistentRes.statusCode, 401);
    const nonExistentBody = JSON.parse(nonExistentRes.body);

    // Assert identical messages to prevent user enumeration
    assert.equal(existingBody.error, nonExistentBody.error);
    assert.match(existingBody.error, /invalid email or password/i);
  });

  it('Defense 2: Exponential Backoff & Lockout - Progressive delays and blocking after 5 failed attempts', async () => {
    const testIp = '198.51.100.42';
    const testIdentifier = 'brute.force.target@msot.edu.in';

    // Reset rate limiter for test
    await rateLimiter.reset(testIdentifier, testIp);

    // 4 failed attempts should succeed but track count
    for (let i = 1; i <= 4; i++) {
      const allowed = await rateLimiter.checkLoginRateLimit(testIdentifier, testIp);
      assert.equal(allowed.allowed, true, `Attempt ${i} should be allowed`);
      await rateLimiter.recordFailedLogin(testIdentifier, testIp);
    }

    // 5th failed attempt triggers lockout
    await rateLimiter.recordFailedLogin(testIdentifier, testIp);

    const lockedCheck = await rateLimiter.checkLoginRateLimit(testIdentifier, testIp);
    assert.equal(lockedCheck.allowed, false, '6th attempt must be blocked by rate limiter');
    assert.ok(lockedCheck.lockoutRemainingSeconds > 0, 'Lockout countdown must be active');
    assert.match(lockedCheck.reason || '', /too many failed attempts/i);
  });
});
