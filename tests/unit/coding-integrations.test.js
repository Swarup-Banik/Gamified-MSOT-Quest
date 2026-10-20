import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { xpEngine } from '../../apps/api/dist/services/xp-engine.js';
import { codingIntegrationService } from '../../apps/api/dist/services/coding-integration-service.js';
import { getProviderAdapter } from '../../apps/api/dist/services/coding-provider-adapter.js';

describe('Verified Coding Practice Integrations: Adapters, Baselines & XP Engine', () => {
  const studentA = 'student_test_a';
  const studentB = 'student_test_b';
  const facultyUser = 'faculty_sarah';

  beforeEach(async () => {
    db.clearForTesting();
    await xpEngine.initializeDefaultRules();

    // Seed student users
    db.users.set(studentA, {
      id: studentA,
      email: 'student.a@msot.edu.in',
      name: 'Aarav Sharma',
      role: 'STUDENT',
      status: 'ACTIVE',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.users.set(studentB, {
      id: studentB,
      email: 'student.b@msot.edu.in',
      name: 'Bhavna Patel',
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

  it('1. Provider Capabilities: Verifies capability flags for GitHub, LeetCode, and HackerRank', () => {
    const gh = getProviderAdapter('GITHUB');
    const lc = getProviderAdapter('LEETCODE');
    const hr = getProviderAdapter('HACKERRANK');

    // GitHub
    assert.equal(gh.capabilities.official, true, 'GitHub adapter must be official');
    assert.equal(gh.capabilities.supportsOwnershipProof, true, 'GitHub supports ownership proof');
    assert.equal(gh.capabilities.supportsSolvedCounts, false, 'GitHub does not track problem solve counts');

    // LeetCode
    assert.equal(lc.capabilities.official, false, 'LeetCode is unoffical community GraphQL');
    assert.equal(lc.capabilities.supportsSolvedCounts, true, 'LeetCode supports solved counts');
    assert.equal(lc.capabilities.supportsDifficulty, true, 'LeetCode categorizes Easy/Medium/Hard');
    assert.equal(lc.capabilities.supportsOwnershipProof, true, 'LeetCode supports bio challenge ownership proof');

    // HackerRank
    assert.equal(hr.capabilities.official, false, 'HackerRank student solve API is unofficial');
    assert.equal(hr.capabilities.supportsPerProblemSubmissions, false, 'HackerRank does not provide individual public problem solves');
  });

  it('2. Link-Time Baseline: Historic solves earn 0 retroactive XP', async () => {
    // 1. Generate challenge for alex_coder (historic solves = 24)
    const challenge = await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    assert.ok(challenge.challengeCode.startsWith('msot-verify-'), 'Challenge code format must match');

    // 2. Verify account
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');
    assert.equal(account.status, 'VERIFIED');
    assert.equal(account.baselineSolvedCounts.total, 24, 'Baseline captured from mock profile');
    assert.equal(account.baselineSolvedCounts.easy, 14);
    assert.equal(account.baselineSolvedCounts.medium, 8);
    assert.equal(account.baselineSolvedCounts.hard, 2);

    // 3. Confirm 0 retroactive XP was awarded to student
    const ledger = await db.getStudentLedger(studentA);
    assert.equal(ledger.length, 0, 'No retroactive ledger entries should be created for historic solves');
    const profile = db.studentProfiles.get(studentA);
    assert.equal(profile.lifetimeXp, 0, 'Lifetime XP must remain 0 after linking baseline');
  });

  it('3. Incremental Solves: Awards verified XP (10 Easy, 20 Medium, 40 Hard)', async () => {
    // Link account
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');

    // Simulate account verified 2 hours ago so recent solves (1h, 30m, 10m ago) count as post-verification
    account.verifiedAt = new Date(Date.now() - 7200000).toISOString();
    db.externalAccounts.set(account.id, account);

    // Sync account (alex_coder fixture contains two Easy and one Medium post-baseline solves)
    const syncResult = await codingIntegrationService.syncAccount(studentA, 'LEETCODE', true);

    assert.equal(syncResult.success, true);
    assert.equal(syncResult.newSolvesDetected, 3, 'Should detect three new problem submissions');
    // Problem 1 (Easy, 10 XP) + Problem 2 (Easy, 10 XP) + Problem 3 (Medium, 20 XP) = 40 XP
    assert.equal(syncResult.xpAwarded, 40, 'Should award 10 + 10 + 20 = 40 XP');

    // Verify append-only ledger entries
    const ledger = await db.getStudentLedger(studentA);
    assert.equal(ledger.length, 3, 'Three ledger transactions recorded');
    assert.ok(ledger.some(l => l.baseAmount === 10 && l.sourceRef.includes('two-sum')));
    assert.ok(ledger.some(l => l.baseAmount === 10 && l.sourceRef.includes('valid-parentheses')));
    assert.ok(ledger.some(l => l.baseAmount === 20 && l.sourceRef.includes('lru-cache')));

    // Verify profile updated
    const profile = db.studentProfiles.get(studentA);
    assert.equal(profile.lifetimeXp, 40, 'Profile lifetime XP must reflect 40 XP');
  });

  it('4. Topic-Aligned Curated Problem Bonus: Awards +25% bonus for syllabus problems', async () => {
    // Faculty creates curated problem list with "lru-cache"
    await codingIntegrationService.createCuratedList(
      facultyUser,
      'Week 4: Hash Maps & Caches',
      'topic_caches',
      'course_dsa',
      4,
      [
        {
          provider: 'LEETCODE',
          problemSlug: 'lru-cache',
          title: 'LRU Cache',
          difficulty: 'MEDIUM',
        },
      ]
    );

    // Link and simulate verified 2h ago
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');
    account.verifiedAt = new Date(Date.now() - 7200000).toISOString();
    db.externalAccounts.set(account.id, account);

    const syncResult = await codingIntegrationService.syncAccount(studentA, 'LEETCODE', true);

    // 2 Easy problems = 2 * 10 = 20 XP
    // 1 Medium problem (LRU Cache) curated = 20 + 25% (5 XP) = 25 XP
    // Total = 45 XP
    assert.equal(syncResult.xpAwarded, 45, 'Curated problem should receive +25% bonus');
    const solveLru = Array.from(db.externalSolves.values()).find(s => s.problemSlug === 'lru-cache');
    assert.equal(solveLru.isTopicAlignedBonus, true, 'isTopicAlignedBonus flag set');
    assert.equal(solveLru.awardedXp, 25);
  });

  it('5. Daily Cap Enforcement: Solves beyond 10 problems/day award 0 XP', async () => {
    // Seed 10 existing external solves today
    const today = new Date().toISOString();
    for (let i = 1; i <= 10; i++) {
      const key = `seed_solve_${i}`;
      db.externalSolves.set(key, {
        id: key,
        studentId: studentA,
        provider: 'LEETCODE',
        problemSlug: `prior-problem-${i}`,
        problemTitle: `Prior Problem ${i}`,
        difficulty: 'EASY',
        solvedAt: today,
        source: 'SYNC_POLL',
        awardedXp: 10,
        awardedLedgerId: `ledger_prior_${i}`,
        topicId: null,
        isTopicAlignedBonus: false,
        idempotencyKey: key,
      });
    }

    // Now link and sync alex_coder with verified 2h ago
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    const account = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');
    account.verifiedAt = new Date(Date.now() - 7200000).toISOString();
    db.externalAccounts.set(account.id, account);

    const syncResult = await codingIntegrationService.syncAccount(studentA, 'LEETCODE', true);

    assert.equal(syncResult.newSolvesDetected, 3, 'Solves are still recorded');
    assert.equal(syncResult.xpAwarded, 0, 'Zero XP awarded due to daily cap of 10 solves');
  });

  it('6. Relink Preserves Original Baseline: Unlinking and reconnecting does not reset baseline', async () => {
    // Initial link
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    const acc1 = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');
    assert.equal(acc1.originalBaselineSolvedCounts.total, 24);

    // Unlink
    await codingIntegrationService.unlinkAccount(studentA, 'LEETCODE');
    const unlinked = db.externalAccounts.get(`ext_${studentA}_LEETCODE`);
    assert.equal(unlinked.status, 'REVOKED');
    assert.equal(unlinked.encryptedOAuthToken, null);

    // Reconnect
    await codingIntegrationService.createVerificationChallenge(studentA, 'LEETCODE', 'alex_coder');
    const acc2 = await codingIntegrationService.verifyChallenge(studentA, 'LEETCODE', 'alex_coder');

    // Original baseline from first link must be preserved
    assert.equal(acc2.originalBaselineSolvedCounts.total, 24, 'Original baseline must be retained upon relinking');
  });

  it('7. GitHub Active Coding Day: Awards 10 XP for >=10 lines non-fork commits (max 1/day)', async () => {
    // Link GitHub
    await codingIntegrationService.createVerificationChallenge(studentA, 'GITHUB', 'priya_github');
    await codingIntegrationService.verifyChallenge(studentA, 'GITHUB', 'priya_github', 'mock_token');

    // Sync GitHub
    const res = await codingIntegrationService.syncAccount(studentA, 'GITHUB', true);
    assert.equal(res.success, true);
    // priya_github has 1 active non-fork day with 3 commits and 45 lines changed
    assert.equal(res.xpAwarded, 10, 'Active coding day earns 10 XP');

    // Syncing again on same day awards 0 duplicate XP (idempotent)
    const res2 = await codingIntegrationService.syncAccount(studentA, 'GITHUB', true);
    assert.equal(res2.xpAwarded, 0, 'Duplicate sync on same day yields 0 new XP');
  });

  it('8. Faculty HackerRank Contest CSV: Dry-run preview and commit flow', async () => {
    const csvData = [
      'hacker_id,email,problem_slug,difficulty,score,solved_at',
      'alex_coder,student.a@msot.edu.in,arrays-ds,EASY,100,2026-10-19T10:00:00Z',
      'bhavna_coder,student.b@msot.edu.in,2d-array,EASY,100,2026-10-19T10:30:00Z',
      'unknown_user,ghost@msot.edu.in,simple-array-sum,EASY,100,2026-10-19T11:00:00Z',
    ].join('\n');

    // 1. Dry run
    const preview = await codingIntegrationService.importContestCsv(facultyUser, csvData, true);
    assert.equal(preview.committed, false, 'Dry-run should not commit');
    assert.equal(preview.validCount, 2, 'Should validate 2 known students');
    assert.equal(preview.invalidCount, 1, 'Should flag 1 unknown email');
    assert.equal(preview.totalProjectedXp, 20, '2 problems * 10 XP = 20 projected XP');

    // Confirm no ledger entries written yet
    assert.equal((await db.getStudentLedger(studentA)).length, 0);

    // 2. Commit run
    const commitResult = await codingIntegrationService.importContestCsv(facultyUser, csvData, false);
    assert.equal(commitResult.committed, true);
    assert.equal(commitResult.validCount, 2);

    // Confirm ledger entries written
    const ledgerA = await db.getStudentLedger(studentA);
    assert.equal(ledgerA.length, 1);
    assert.equal(ledgerA[0].baseAmount, 10);
    assert.ok(ledgerA[0].sourceRef.includes('HACKERRANK:arrays-ds'));
  });
});
