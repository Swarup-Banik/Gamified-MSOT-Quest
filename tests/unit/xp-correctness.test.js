import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { xpEngine } from '../../apps/api/dist/services/xp-engine.js';

describe('XP Correctness Test Suite (10 Deterministic Scenarios)', () => {
  beforeEach(async () => {
    db.clearForTesting();
    await xpEngine.initializeDefaultRules();
  });

  // Independent expected fixtures
  const expectedFixtures = [
    { studentId: 'stu_1', name: 'Class Attendee', expectedXp: 10 },
    { studentId: 'stu_2', name: 'Homework Submitter', expectedXp: 20 },
    { studentId: 'stu_3', name: 'Perfect Quiz Finisher', expectedXp: 30 },
    { studentId: 'stu_4', name: 'Bi-Weekly Test Taker', expectedXp: 42 },
    { studentId: 'stu_5', name: 'Multi-Tier Coder', expectedXp: 70 },
    { studentId: 'stu_6', name: 'Club Enthusiast', expectedXp: 25 },
    { studentId: 'stu_7', name: 'Streak Champion', expectedXp: 50 },
    { studentId: 'stu_8', name: 'Helpful Peer', expectedXp: 45 },
    { studentId: 'stu_9', name: 'Soft-Cap Exceeder', expectedXp: 165 }, // 150 + floor(30 * 0.5) = 165
    { studentId: 'stu_10', name: 'Voided Transactor', expectedXp: 0 },
  ];

  it('Scenario 1: Attend a class (10 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_1',
      actionType: 'ATTEND_CLASS',
      sourceType: 'OFFICIAL_ATTENDANCE',
      sourceRef: 'lec_101',
      reason: 'Attended lecture 101',
    });
    const profile = await xpEngine.recalculateProfile('stu_1');
    assert.equal(profile.lifetimeXp, expectedFixtures[0].expectedXp);
  });

  it('Scenario 2: Submit homework on time (20 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_2',
      actionType: 'SUBMIT_HOMEWORK',
      sourceType: 'ASSIGNMENT',
      sourceRef: 'hw_dsa_1',
      reason: 'Submitted DSA assignment 1 on time',
    });
    const profile = await xpEngine.recalculateProfile('stu_2');
    assert.equal(profile.lifetimeXp, expectedFixtures[1].expectedXp);
  });

  it('Scenario 3: Daily quiz completed with 3/3 correct answers (15 + 3*5 = 30 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_3',
      actionType: 'DAILY_QUIZ_COMPLETED',
      sourceType: 'QUIZ_ATTEMPT',
      sourceRef: 'quiz_day_1',
      reason: 'Completed daily quiz',
    });
    await xpEngine.awardXP({
      studentId: 'stu_3',
      actionType: 'QUIZ_CORRECT_ANSWER',
      sourceType: 'QUIZ_ATTEMPT_SCORE',
      sourceRef: 'quiz_day_1',
      customAmount: 15,
      reason: '3 correct answers',
    });
    const profile = await xpEngine.recalculateProfile('stu_3');
    assert.equal(profile.lifetimeXp, expectedFixtures[2].expectedXp);
  });

  it('Scenario 4: Bi-weekly test score 84% (84 ÷ 2 = 42 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_4',
      actionType: 'BIWEEKLY_TEST',
      sourceType: 'TEST_RECORD',
      sourceRef: 'test_mid_1',
      metadata: { scorePercentage: 84 },
      reason: 'Scored 84% on bi-weekly test',
    });
    const profile = await xpEngine.recalculateProfile('stu_4');
    assert.equal(profile.lifetimeXp, expectedFixtures[3].expectedXp);
  });

  it('Scenario 5: Solved 1 Easy (10 XP), 1 Medium (20 XP), 1 Hard (40 XP) coding problem (70 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_5',
      actionType: 'CODING_PROBLEM_SOLVED',
      sourceType: 'CODING_PROBLEM',
      sourceRef: 'lc_1',
      customAmount: 10,
      reason: 'Solved Easy problem',
    });
    await xpEngine.awardXP({
      studentId: 'stu_5',
      actionType: 'CODING_PROBLEM_SOLVED',
      sourceType: 'CODING_PROBLEM',
      sourceRef: 'lc_2',
      customAmount: 20,
      reason: 'Solved Medium problem',
    });
    await xpEngine.awardXP({
      studentId: 'stu_5',
      actionType: 'CODING_PROBLEM_SOLVED',
      sourceType: 'CODING_PROBLEM',
      sourceRef: 'lc_3',
      customAmount: 40,
      reason: 'Solved Hard problem',
    });
    const profile = await xpEngine.recalculateProfile('stu_5');
    assert.equal(profile.lifetimeXp, expectedFixtures[4].expectedXp);
  });

  it('Scenario 6: Club activity participation (25 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_6',
      actionType: 'CLUB_ACTIVITY',
      sourceType: 'CLUB_RECORD',
      sourceRef: 'hackathon_club_1',
      reason: 'Participated in Coding Club Saturday meetup',
    });
    const profile = await xpEngine.recalculateProfile('stu_6');
    assert.equal(profile.lifetimeXp, expectedFixtures[5].expectedXp);
  });

  it('Scenario 7: 7-day streak milestone bonus (50 XP)', async () => {
    await xpEngine.awardXP({
      studentId: 'stu_7',
      actionType: 'SEVEN_DAY_STREAK',
      sourceType: 'STREAK_MILESTONE',
      sourceRef: 'streak_7',
      reason: '7-day streak bonus',
    });
    const profile = await xpEngine.recalculateProfile('stu_7');
    assert.equal(profile.lifetimeXp, expectedFixtures[6].expectedXp);
  });

  it('Scenario 8: Help a peer on discussion board (3 accepted answers * 15 = 45 XP)', async () => {
    for (let i = 1; i <= 3; i++) {
      await xpEngine.awardXP({
        studentId: 'stu_8',
        actionType: 'PEER_HELP',
        sourceType: 'FORUM_ANSWER',
        sourceRef: `answer_${i}`,
        reason: `Peer answer #${i} accepted`,
      });
    }
    const profile = await xpEngine.recalculateProfile('stu_8');
    assert.equal(profile.lifetimeXp, expectedFixtures[7].expectedXp);
  });

  it('Scenario 9: Daily soft cap with diminishing returns (180 raw XP -> 165 effective XP)', async () => {
    const todayIso = '2026-03-01T10:00:00.000Z';
    // Award 150 XP (up to cap)
    await xpEngine.awardXP({
      studentId: 'stu_9',
      actionType: 'ATTEND_CLASS',
      sourceType: 'CUSTOM',
      sourceRef: 'bulk_1',
      customAmount: 150,
      reason: 'Initial 150 XP up to cap',
      eventTimestamp: todayIso,
    });

    // Award 30 XP beyond cap -> receives 50% = 15 XP
    await xpEngine.awardXP({
      studentId: 'stu_9',
      actionType: 'ATTEND_CLASS',
      sourceType: 'CUSTOM',
      sourceRef: 'bulk_2',
      customAmount: 30,
      reason: 'Over-cap grinding portion',
      eventTimestamp: todayIso,
    });

    const profile = await xpEngine.recalculateProfile('stu_9');
    assert.equal(profile.lifetimeXp, expectedFixtures[8].expectedXp);
  });

  it('Scenario 10: Idempotency deduplication and Compensating Void (20 XP -> void -> 0 XP)', async () => {
    const key = 'idem_key_unique_stu_10';
    // First award
    const award1 = await xpEngine.awardXP({
      studentId: 'stu_10',
      actionType: 'SUBMIT_HOMEWORK',
      sourceType: 'ASSIGNMENT',
      sourceRef: 'hw_test_10',
      reason: 'Submitted homework',
      idempotencyKey: key,
    });
    assert.equal(award1.isDuplicate, false);
    assert.equal(award1.ledgerEntry.finalAmount, 20);

    // Duplicate attempt with same idempotency key
    const award2 = await xpEngine.awardXP({
      studentId: 'stu_10',
      actionType: 'SUBMIT_HOMEWORK',
      sourceType: 'ASSIGNMENT',
      sourceRef: 'hw_test_10',
      reason: 'Submitted homework again',
      idempotencyKey: key,
    });
    assert.equal(award2.isDuplicate, true);

    let profile = await xpEngine.recalculateProfile('stu_10');
    assert.equal(profile.lifetimeXp, 20);

    // Admin/Faculty voids the entry
    await xpEngine.voidXP({
      originalEntryId: award1.ledgerEntry.id,
      voidByUserId: 'faculty_sarah',
      reason: 'Plagiarism detected on homework submission',
    });

    profile = await xpEngine.recalculateProfile('stu_10');
    assert.equal(profile.lifetimeXp, expectedFixtures[9].expectedXp);

    // Assert ledger integrity: original row exists + compensating row exists
    const ledger = await db.getStudentLedger('stu_10');
    assert.equal(ledger.length, 2);
    assert.equal(ledger[0].finalAmount, 20);
    assert.equal(ledger[0].isVoided, true);
    assert.equal(ledger[1].finalAmount, -20);
    assert.equal(ledger[1].sourceType, 'FACULTY_VOID_OVERRIDE');
  });
});
