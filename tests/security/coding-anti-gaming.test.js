import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { xpEngine } from '../../apps/api/dist/services/xp-engine.js';
import { codingIntegrationService } from '../../apps/api/dist/services/coding-integration-service.js';
import { circuitBreaker } from '../../apps/api/dist/services/circuit-breaker.js';

describe('Coding Integrations Security & Anti-Gaming Defense Suite', () => {
  const studentA = 'student_sec_a';
  const studentB = 'student_sec_b';

  beforeEach(async () => {
    db.clearForTesting();
    await xpEngine.initializeDefaultRules();
    circuitBreaker.reset('LEETCODE');
    circuitBreaker.reset('GITHUB');
    circuitBreaker.reset('HACKERRANK');

    db.users.set(studentA, {
      id: studentA,
      email: 'student.sec.a@msot.edu.in',
      name: 'Priya Sharma',
      role: 'STUDENT',
      status: 'ACTIVE',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.users.set(studentB, {
      id: studentB,
      email: 'student.sec.b@msot.edu.in',
      name: 'Rohan Verma',
      role: 'STUDENT',
      status: 'ACTIVE',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.studentProfiles.set(studentA, {
      studentId: studentA,
      lifetimeXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      streakFreezeCount: 1,
      spendableShards: 50,
      equippedLoadout: {
        avatar: 'avatar_fox_novice',
        companion: 'comp_kitsune_ember',
        banner: 'banner_sunset_campus',
        frame: 'frame_rustic_wood',
        title: 'title_junior_scholar',
        flame: 'flame_ember_sparks',
        levelUpEffect: 'fx_lantern_burst',
      },
      completedQuestionIds: [],
      updatedAt: new Date().toISOString(),
    });
  });

  it('Attack Vector 1: Fake or unverified handle is rejected (challenge code mismatch)', async () => {
    // Generate challenge for unverified_user (fixture does not have challenge code)
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'unverified_user');

    await assert.rejects(
      async () => {
        await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'unverified_user');
      },
      /Ownership verification failed/,
      'Must reject linking when challenge code is not present in external bio'
    );

    // Confirm no external account record was activated
    const account = db.externalAccounts.get(`ext_${studentA}_LEETCODE`);
    assert.equal(account, undefined, 'No verified account record should be saved');
  });

  it('Attack Vector 2: Unique handle collision is rejected across MSOT students', async () => {
    // Student A links alex_coder
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');

    // Student B attempts to link the exact same handle
    await assert.rejects(
      async () => {
        await codingIntegrationService.createVerificationChallenge(studentB, 'LEETCODE', 'alex_coder');
      },
      /already linked to another MSOT account/,
      'Must reject duplicate handle linking attempts across students'
    );
  });

  it('Attack Vector 3: Count decrease tamper detection pauses sync and flags anomaly', async () => {
    // Link tamper_account (initial baseline = 7 solves)
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'tamper_account');
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'tamper_account');
    assert.equal(account.baselineSolvedCounts.total, 7);

    // Simulate tampering: artificially set baseline higher than what adapter reports (drops to 5)
    account.baselineSolvedCounts.total = 10;
    account.verifiedAt = new Date(Date.now() - 3600000).toISOString();
    db.externalAccounts.set(account.id, account);

    // Run sync
    const res = await codingIntegrationService.syncAccount(studentA, 'LEETCODE', true);
    assert.equal(res.success, false, 'Sync must fail when solve count decrease is detected');
    assert.equal(res.xpAwarded, 0, 'Zero XP awarded');
    assert.ok(res.notice.includes('decrease in solved count'), 'Notice informs user of admin review requirement');

    // Verify Anomaly Flag was raised
    const flags = Array.from(db.anomalyFlags.values());
    const tamperFlag = flags.find(f => f.studentId === studentA && f.evidence?.metric === 'EXTERNAL_COUNT_DROP');
    assert.ok(tamperFlag, 'EXTERNAL_COUNT_DROP anomaly flag must be created');
    assert.equal(tamperFlag.flagType, 'FAKE_CODING_SOLVE');
    assert.equal(tamperFlag.severity, 'HIGH');
    assert.equal(tamperFlag.status, 'PENDING');
  });

  it('Attack Vector 4: Rapid solve velocity spike (>5 solves in 15m) flags anomaly', async () => {
    // Link grind_bot (contains 14 solves within 7 minutes)
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'grind_bot');
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'grind_bot');

    // Set verifiedAt to 30 minutes ago
    account.verifiedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    db.externalAccounts.set(account.id, account);

    // Run sync
    await codingIntegrationService.syncAccount(studentA, 'LEETCODE', true);

    // Verify velocity spike anomaly flag was registered
    const flags = Array.from(db.anomalyFlags.values());
    const spikeFlag = flags.find(f => f.studentId === studentA && f.evidence?.metric === 'RAPID_EXTERNAL_SOLVES');
    assert.ok(spikeFlag, 'RAPID_EXTERNAL_SOLVES anomaly flag must be generated for scripted velocity');
    assert.equal(spikeFlag.flagType, 'XP_SPIKE_ZSCORE');
    assert.equal(spikeFlag.severity, 'HIGH');
  });

  it('Attack Vector 5: GitHub commit spam filtration (forks and <10 lines ignored)', async () => {
    // Spammer GitHub fixture contains forks and 0-line/1-line commit days
    await codingIntegrationService.createVerificationChallenge(studentA, 'GITHUB', 'spammer_github');
    await codingIntegrationService.verifyChallenge(studentA, 'GITHUB', 'spammer_github', 'mock_token');

    const res = await codingIntegrationService.syncAccount(studentA, 'GITHUB', true);
    assert.equal(res.newSolvesDetected, 0, 'Spam commits on forks or with <10 lines changed must yield 0 active days');
    assert.equal(res.xpAwarded, 0, '0 XP awarded for commit spam');
  });

  it('Attack Vector 6: Circuit breaker trips after 5 consecutive failures and fails gracefully', async () => {
    const provider = 'LEETCODE';

    // Verify circuit breaker starts in CLOSED state
    assert.equal(circuitBreaker.getHealth(provider).state, 'CLOSED');
    assert.equal(circuitBreaker.canExecute(provider).allowed, true);

    // Record 5 consecutive provider errors
    for (let i = 1; i <= 5; i++) {
      circuitBreaker.recordFailure(provider, `HTTP 502 Bad Gateway attempt ${i}`);
    }

    // Verify circuit breaker tripped to OPEN
    const health = circuitBreaker.getHealth(provider);
    assert.equal(health.state, 'OPEN', 'Circuit breaker must enter OPEN state after 5 failures');
    assert.equal(health.failureCount, 5);
    assert.ok(health.cooldownUntil !== null, 'Cooldown timestamp must be scheduled');

    // Outbound requests must now be blocked
    const check = circuitBreaker.canExecute(provider);
    assert.equal(check.allowed, false, 'Requests must be blocked when breaker is OPEN');
    assert.ok(check.reason.includes('circuit breaker is OPEN'));
  });

  it('Attack Vector 7: Circuit breaker cooldown expiration recovers via HALF_OPEN to CLOSED', async () => {
    const provider = 'LEETCODE';

    // Trip breaker with an expired cooldown (1 second in the past)
    circuitBreaker.trip(provider, 'Downstream rate limit', -1000);

    // Inspecting health should automatically transition from OPEN to HALF_OPEN
    const health = circuitBreaker.getHealth(provider);
    assert.equal(health.state, 'HALF_OPEN', 'Expired cooldown must transition breaker to HALF_OPEN');

    // A single successful response resets breaker back to CLOSED
    circuitBreaker.recordSuccess(provider);
    const recoveredHealth = circuitBreaker.getHealth(provider);
    assert.equal(recoveredHealth.state, 'CLOSED', 'Successful operation must restore breaker to CLOSED');
    assert.equal(recoveredHealth.failureCount, 0);
  });
});
