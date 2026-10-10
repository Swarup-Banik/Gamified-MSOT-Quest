import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../apps/api/dist/server.js';
import { db } from '../../apps/api/dist/db.js';

describe('End-to-End API Integration: Submissions, Battles & Faculty Ops', () => {
  let app;

  before(async () => {
    app = await createServer();
    await app.ready();
    db.users.set('student_int_1', {
      id: 'student_int_1',
      email: 'aarav.int@msot.edu.in',
      name: 'Aarav Integration',
      role: 'STUDENT',
      avatarId: 'avatar_1',
      anonymousAlias: 'Swift Falcon 42',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      createdAt: new Date().toISOString(),
    });
  });

  after(async () => {
    await app.close();
  });

  it('Flow 1: Daily Quiz submission awards XP, spawns Mistake Monster on error, awards chest', async () => {
    // Seed question
    const q1 = {
      id: 'q_int_1',
      topicId: 'topic_recursion',
      prompt: 'Recursion base case prompt',
      options: ['Option A (Correct)', 'Option B (Wrong)'],
      correctOptionIndex: 0,
      difficulty: 'MEDIUM',
      language: 'EN',
      source: 'FACULTY',
      status: 'APPROVED',
      explanation: 'Base case explanation',
      createdAt: new Date().toISOString(),
    };
    db.questions.set(q1.id, q1);

    // Submit with wrong answer (option 1 instead of 0)
    const response = await app.inject({
      method: 'POST',
      url: '/api/quiz/submit',
      payload: {
        studentId: 'student_int_1',
        date: '2026-03-05',
        clientSubmissionToken: 'token_int_1',
        answers: [{ questionId: 'q_int_1', selectedOption: 1, responseTimeMs: 1500 }],
      },
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body);

    assert.equal(body.score, 0);
    assert.equal(body.xpEarned, 15); // 15 base XP for completing the run
    assert.ok(body.chestAwarded, 'Chest must be awarded');
    assert.equal(body.monstersSpawned.length, 1, 'Mistake monster must be spawned from wrong answer');
    assert.equal(body.monstersSpawned[0].questionId, 'q_int_1');
  });

  it('Flow 2: Defeating a Mistake Monster in spaced revenge round awards XP and codex unlock', async () => {
    // Fetch active monster
    const activeRes = await app.inject({
      method: 'GET',
      url: '/api/monsters/active?studentId=student_int_1',
    });
    assert.equal(activeRes.statusCode, 200);
    const activeData = JSON.parse(activeRes.body);
    assert.ok(activeData.monsters.length > 0);

    const monsterId = activeData.monsters[0].id;

    // Fight monster with correct answer (option 0)
    const fightRes = await app.inject({
      method: 'POST',
      url: `/api/monsters/${monsterId}/fight`,
      payload: { studentId: 'student_int_1', selectedOption: 0 },
    });
    assert.equal(fightRes.statusCode, 200);
    const fightData = JSON.parse(fightRes.body);
    assert.equal(fightData.defeated, true);
    assert.ok(fightData.xpEarned > 0);
    assert.ok(fightData.codexEntry);
  });

  it('Flow 3: Team Battle submission enforces participation floor and calculates qualification', async () => {
    const battleRes = await app.inject({
      method: 'POST',
      url: '/api/battles/submit',
      payload: {
        eventId: 'event_battle_1',
        studentId: 'student_battle_1',
        teamId: 'team_sec_b',
        points: 50,
      },
    });
    assert.equal(battleRes.statusCode, 200);
    const battleData = JSON.parse(battleRes.body);
    assert.equal(battleData.pointsAwarded, 50);
    assert.ok(battleData.event);
  });

  it('Flow 4: Faculty Question Approval Queue tracks status for Test Report (APPROVED/EDITED/REJECTED)', async () => {
    // Generate AI question
    const genRes = await app.inject({
      method: 'POST',
      url: '/api/quiz/generate',
      payload: {
        topicTitle: 'Recursion',
        courseTitle: 'DSA',
        count: 1,
        difficulty: 'MEDIUM',
        language: 'EN',
      },
    });
    assert.equal(genRes.statusCode, 200);
    const genData = JSON.parse(genRes.body);
    const qId = genData.questions[0].id;

    // Faculty reviews and approves without edits
    const reviewRes = await app.inject({
      method: 'POST',
      url: '/api/faculty/questions/review',
      payload: {
        questionId: qId,
        facultyId: 'faculty_sarah',
        decision: 'APPROVED',
        notes: 'High clarity and syllabus compliant',
      },
    });
    assert.equal(reviewRes.statusCode, 200);

    // Verify stats
    const statsRes = await app.inject({
      method: 'GET',
      url: '/api/faculty/review-stats',
    });
    assert.equal(statsRes.statusCode, 200);
    const stats = JSON.parse(statsRes.body);
    assert.ok(stats.totalReviewed >= 1);
    assert.ok(stats.acceptedWithoutEdits >= 1);
  });

  it('Flow 5: Faculty gently nudges a quiet student without shaming copy', async () => {
    const nudgeRes = await app.inject({
      method: 'POST',
      url: '/api/faculty/nudge',
      payload: { studentId: 'student_int_1', facultyId: 'faculty_sarah' },
    });
    assert.equal(nudgeRes.statusCode, 200);
    const nudgeData = JSON.parse(nudgeRes.body);
    assert.equal(nudgeData.success, true);
    assert.ok(nudgeData.message.length > 10);
    // Assert no shaming words in message
    assert.equal(/lazy|bad|fail|shame|worst/i.test(nudgeData.message), false);
  });
});
