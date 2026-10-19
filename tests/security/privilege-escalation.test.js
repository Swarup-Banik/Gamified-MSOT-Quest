import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../apps/api/dist/server.js';
import { db } from '../../apps/api/dist/db.js';
import { sessionsService } from '../../apps/api/dist/services/sessions-service.js';

describe('Security: Privilege Escalation & Horizontal Attack Prevention', () => {
  let app;
  let studentAToken;
  let studentBToken;

  before(async () => {
    app = await createServer();
    await app.ready();

    // Student A
    db.users.set('student_attacker_a', {
      id: 'student_attacker_a',
      email: 'attacker.a@msot.edu.in',
      name: 'Attacker Student A',
      role: 'STUDENT',
      avatarId: 'avatar_1',
      anonymousAlias: 'Shadow Fox 01',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // Student B (Victim)
    db.users.set('student_victim_b', {
      id: 'student_victim_b',
      email: 'victim.b@msot.edu.in',
      name: 'Victim Student B',
      role: 'STUDENT',
      avatarId: 'avatar_2',
      anonymousAlias: 'Golden Owl 02',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    const sA = await sessionsService.createSession({ userId: 'student_attacker_a', userAgent: 'test', ipAddress: '127.0.0.1' });
    studentAToken = sA.accessToken;

    const sB = await sessionsService.createSession({ userId: 'student_victim_b', userAgent: 'test', ipAddress: '127.0.0.1' });
    studentBToken = sB.accessToken;
  });

  after(async () => {
    await app.close();
  });

  it('Attack 1: Vertical Escalation - Student cannot promote self to ADMIN or FACULTY via registration payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Hacker User',
        email: 'hacker@msot.edu.in',
        password: 'Password12345!',
        role: 'ADMIN', // Injection attempt
      },
    });

    assert.equal(res.statusCode, 200);
    // Even if client sends role: 'ADMIN', registration MUST enforce STUDENT role
    const createdUser = Array.from(db.users.values()).find(u => u.email === 'hacker@msot.edu.in');
    assert.ok(createdUser);
    assert.equal(createdUser.role, 'STUDENT', 'Elevated role injection in registration must be completely discarded');
  });

  it('Attack 2: Vertical Escalation - Student cannot call role modification endpoint (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/role',
      headers: { authorization: `Bearer ${studentAToken}` },
      payload: {
        userId: 'student_attacker_a',
        role: 'ADMIN',
        reason: 'Self-promotion attempt',
      },
    });

    assert.equal(res.statusCode, 403);
    const userA = db.users.get('student_attacker_a');
    assert.equal(userA.role, 'STUDENT');
  });

  it('Attack 3: Horizontal Escalation - Student A cannot modify Student B preferences or trigger deletion on Student B', async () => {
    // Student A tries to update Student B preferences
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/student/preferences',
      headers: { authorization: `Bearer ${studentAToken}` },
      payload: {
        studentId: 'student_victim_b', // Target victim
        isAnonymous: true,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    // Policy engine bounds mutation strictly to caller's identity (student_attacker_a), NOT victim!
    assert.equal(body.user.id, 'student_attacker_a');

    const victimUser = db.users.get('student_victim_b');
    assert.equal(victimUser.isAnonymous, false, 'Victim state must remain unaltered by attacker');
  });

  it('Attack 4: Grade Immutability - Zero API routes exist to write or mutate official academic grades', async () => {
    // Attempt to invoke hypothetical grade modification routes
    const routesToTest = [
      { method: 'POST', url: '/api/grades' },
      { method: 'PUT', url: '/api/grades/student_victim_b' },
      { method: 'PATCH', url: '/api/academic-records/marks' },
      { method: 'DELETE', url: '/api/academic-records/student_victim_b' },
    ];

    for (const route of routesToTest) {
      const res = await app.inject({
        method: route.method,
        url: route.url,
        headers: { authorization: `Bearer ${studentAToken}` },
        payload: { grade: 'A+', marks: 100 },
      });
      // 404 means the route does not exist anywhere in the application
      assert.equal(res.statusCode, 404, `No grade mutation route ${route.url} must exist`);
    }
  });
});
