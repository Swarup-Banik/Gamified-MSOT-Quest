import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { antiGamingService } from '../../apps/api/dist/services/anti-gaming.js';
import { submissionsPipeline } from '../../apps/api/dist/services/submissions-pipeline.js';
import { xpEngine } from '../../apps/api/dist/services/xp-engine.js';

describe('Anti-Gaming Verification Suite (5 Attack Vectors)', () => {
  beforeEach(async () => {
    db.clearForTesting();
    await xpEngine.initializeDefaultRules();
  });

  it('Vector 1: Catches Quiz Spam & Multiple Scored Daily Attempts', async () => {
    // Student 1 submits once
    await submissionsPipeline.submitDailyQuiz({
      studentId: 'cheater_1',
      date: '2026-03-01',
      clientSubmissionToken: 'token_first',
      answers: [],
    });

    // Attempt second scored quiz on same day -> Must be rejected!
    await assert.rejects(
      async () => {
        await submissionsPipeline.submitDailyQuiz({
          studentId: 'cheater_1',
          date: '2026-03-01',
          clientSubmissionToken: 'token_spam',
          answers: [],
        });
      },
      /Daily quiz has already been completed for today/,
      'Must reject multiple scored attempts on same date'
    );
  });

  it('Vector 2: Catches Shared Answers & Synchronized Response Timing Clusters', async () => {
    const q1Id = 'q_cluster_1';
    const q2Id = 'q_cluster_2';
    db.questions.set(q1Id, { id: q1Id, topicId: 'topic_1', prompt: 'Q1', options: ['A', 'B'], correctOptionIndex: 0 });
    db.questions.set(q2Id, { id: q2Id, topicId: 'topic_1', prompt: 'Q2', options: ['A', 'B'], correctOptionIndex: 0 });

    // Student A submits
    const attemptA = await submissionsPipeline.submitDailyQuiz({
      studentId: 'student_a',
      date: '2026-03-02',
      clientSubmissionToken: 'token_a',
      answers: [
        { questionId: q1Id, selectedOption: 0, responseTimeMs: 1420 },
        { questionId: q2Id, selectedOption: 1, responseTimeMs: 2150 },
      ],
    });

    // Student B submits identical options with near-identical timing (<250ms diff)
    const attemptB = await submissionsPipeline.submitDailyQuiz({
      studentId: 'student_b',
      date: '2026-03-02',
      clientSubmissionToken: 'token_b',
      answers: [
        { questionId: q1Id, selectedOption: 0, responseTimeMs: 1450 }, // 30ms diff
        { questionId: q2Id, selectedOption: 1, responseTimeMs: 2180 }, // 30ms diff
      ],
    });

    // Check shared answers detector
    const flag = await antiGamingService.checkSharedAnswers(attemptB.attempt.id);
    assert.ok(flag, 'Cluster of synchronized answers must be flagged');
    assert.equal(flag.flagType, 'SHARED_ANSWER_CLUSTER');
    assert.equal(flag.severity, 'HIGH');
    assert.equal(flag.evidence.suspectPeerStudentId, 'student_a');
  });

  it('Vector 3: Catches Copy-Paste & Synthetic Robotic Typing Telemetry', async () => {
    // Instant paste of large text (>100 chars in 200ms)
    const flag1 = await antiGamingService.checkCopyPasteTelemetry('cheater_3', {
      pasteDetected: true,
      characterCount: 350,
      durationMs: 250,
    });
    assert.ok(flag1, 'Instant bulk text paste must be flagged');
    assert.equal(flag1.flagType, 'COPY_PASTE_TELEMETRY');
    assert.equal(flag1.severity, 'HIGH');

    // Robotic typing cadence with near-zero keystroke variance
    const flag2 = await antiGamingService.checkCopyPasteTelemetry('cheater_3b', {
      pasteDetected: false,
      characterCount: 120,
      durationMs: 3000,
      keyVarianceMs: 0.2, // bot macro typing with uniform 25ms delay
    });
    assert.ok(flag2, 'Synthetic automated keystroke intervals must be flagged');
    assert.equal(flag2.evidence.syntheticTypingPattern, true);
  });

  it('Vector 4: Rejects Fake Coding Practice & Unverified Accounts', async () => {
    // Unverified profile solve attempt
    const res1 = await antiGamingService.verifyCodingSolve(
      'cheater_4',
      'LEETCODE',
      'unverified_handle',
      'problem_42',
      new Date().toISOString()
    );
    assert.equal(res1.valid, false);
    assert.ok(res1.flag);
    assert.equal(res1.flag.flagType, 'FAKE_CODING_SOLVE');

    // Setup verified profile
    db.externalProfiles.set('ext_p1', {
      id: 'ext_p1',
      studentId: 'cheater_4',
      platform: 'LEETCODE',
      handle: 'valid_coder',
      isVerified: true,
      verificationChallenge: 'MSOT_VERIFY_XYZ',
      totalSolves: 5,
    });

    // Valid first solve
    const res2 = await antiGamingService.verifyCodingSolve(
      'cheater_4',
      'LEETCODE',
      'valid_coder',
      'problem_42',
      new Date().toISOString()
    );
    assert.equal(res2.valid, true);

    // Award XP for problem_42
    await xpEngine.awardXP({
      studentId: 'cheater_4',
      actionType: 'CODING_PROBLEM_SOLVED',
      sourceType: 'CODING_PROBLEM',
      sourceRef: 'LEETCODE_problem_42',
      reason: 'Solved LeetCode 42',
    });

    // Replay attack: submitting same problem again
    const res3 = await antiGamingService.verifyCodingSolve(
      'cheater_4',
      'LEETCODE',
      'valid_coder',
      'problem_42',
      new Date().toISOString()
    );
    assert.equal(res3.valid, false, 'Duplicate solve must be rejected');
    assert.equal(res3.flag?.severity, 'MEDIUM');
  });

  it('Vector 5: Catches Statistical XP Spikes via Z-Score Anomaly Detection', async () => {
    const studentId = 'cheater_5';
    // Seed 5 historical days with steady ~25 XP/day
    const dailySeedAmounts = [20, 25, 30, 25, 28];
    for (let day = 1; day <= 5; day++) {
      await xpEngine.awardXP({
        studentId,
        actionType: 'ATTEND_CLASS',
        sourceType: 'CLASS',
        sourceRef: `day_${day}`,
        customAmount: dailySeedAmounts[day - 1],
        reason: 'Normal daily lecture',
        eventTimestamp: `2026-02-0${day}T10:00:00.000Z`,
      });
    }

    // Normal day: 35 XP -> Z-Score is small -> No flag
    const normalFlag = await antiGamingService.checkXpSpike(studentId, 35);
    assert.equal(normalFlag, null);

    // Abnormal day: Sudden massive 500 XP spike -> Z-Score > 3.0 -> Anomaly Flagged!
    const spikeFlag = await antiGamingService.checkXpSpike(studentId, 500);
    assert.ok(spikeFlag, 'Massive statistical XP spike must be flagged');
    assert.equal(spikeFlag.flagType, 'XP_SPIKE_ZSCORE');
    assert.equal(spikeFlag.severity, 'HIGH');
    assert.ok(spikeFlag.evidence.zScore > 3.0, `Z-Score must exceed 3.0 (got ${spikeFlag.evidence.zScore})`);
  });
});
