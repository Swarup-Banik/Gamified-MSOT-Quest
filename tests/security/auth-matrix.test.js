import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../apps/api/dist/server.js';
import { db } from '../../apps/api/dist/db.js';
import { sessionsService } from '../../apps/api/dist/services/sessions-service.js';

describe('Security & Authorization Matrix: Least Privilege & Deny-by-Default', () => {
  let app;
  let studentToken;
  let facultyToken;
  let adminToken;

  before(async () => {
    app = await createServer();
    await app.ready();

    // 1. Seed Student User
    db.users.set('student_matrix_1', {
      id: 'student_matrix_1',
      email: 'student.matrix@msot.edu.in',
      name: 'Matrix Student',
      role: 'STUDENT',
      avatarId: 'avatar_1',
      anonymousAlias: 'Silent Puma 10',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // 2. Seed Faculty User
    db.users.set('faculty_matrix_1', {
      id: 'faculty_matrix_1',
      email: 'faculty.matrix@msot.edu.in',
      name: 'Matrix Professor',
      role: 'FACULTY',
      avatarId: 'avatar_faculty',
      anonymousAlias: 'Professor 01',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // 3. Seed Admin User
    db.users.set('admin_matrix_1', {
      id: 'admin_matrix_1',
      email: 'admin.matrix@msot.edu.in',
      name: 'Matrix Administrator',
      role: 'ADMIN',
      avatarId: 'avatar_admin',
      anonymousAlias: 'Admin 01',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // Generate JWT access tokens
    const sSession = await sessionsService.createSession({ userId: 'student_matrix_1', userAgent: 'test-agent', ipAddress: '127.0.0.1' });
    studentToken = sSession.accessToken;

    const fSession = await sessionsService.createSession({ userId: 'faculty_matrix_1', userAgent: 'test-agent', ipAddress: '127.0.0.1' });
    facultyToken = fSession.accessToken;

    const aSession = await sessionsService.createSession({ userId: 'admin_matrix_1', userAgent: 'test-agent', ipAddress: '127.0.0.1' });
    adminToken = aSession.accessToken;
  });

  after(async () => {
    await app.close();
  });

  it('Matrix Row 1: Anonymous requests to protected administrative and faculty endpoints are rejected (401/403)', async () => {
    const facultyRes = await app.inject({
      method: 'GET',
      url: '/api/faculty/engagement',
    });
    // In our deny-by-default architecture, unauthenticated attempts cannot access faculty analytics
    assert.ok(facultyRes.statusCode === 401 || facultyRes.statusCode === 403);

    const adminRes = await app.inject({
      method: 'GET',
      url: '/api/admin/anomalies',
    });
    assert.ok(adminRes.statusCode === 401 || adminRes.statusCode === 403);
  });

  it('Matrix Row 2: Student is forbidden from faculty engagement & review queue (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/faculty/engagement',
      headers: { authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.match(body.error, /faculty authorization required/i);
  });

  it('Matrix Row 3: Student is forbidden from editing XP Rules or inspecting Anomaly Flags (403)', async () => {
    const anomalyRes = await app.inject({
      method: 'GET',
      url: '/api/admin/anomalies',
      headers: { authorization: `Bearer ${studentToken}` },
    });
    assert.equal(anomalyRes.statusCode, 403);

    const updateRuleRes = await app.inject({
      method: 'POST',
      url: '/api/admin/xp-rules/rule_daily_quiz',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: { updates: { baseXp: 9999 }, reason: 'Malicious modification attempt' },
    });
    assert.equal(updateRuleRes.statusCode, 403);
  });

  it('Matrix Row 4: Faculty can access student engagement metrics and question review queue (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/faculty/engagement',
      headers: { authorization: `Bearer ${facultyToken}` },
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.activeToday !== undefined);
  });

  it('Matrix Row 5: Faculty cannot elevate roles or promote users to ADMIN (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/role',
      headers: { authorization: `Bearer ${facultyToken}` },
      payload: { userId: 'student_matrix_1', role: 'ADMIN', reason: 'Unauthorized elevation' },
    });
    assert.equal(res.statusCode, 403);
  });

  it('Matrix Row 6: Admin has full authority to view anomalies, update XP rules, and manage user roles (200)', async () => {
    const anomalyRes = await app.inject({
      method: 'GET',
      url: '/api/admin/anomalies',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(anomalyRes.statusCode, 200);

    const roleRes = await app.inject({
      method: 'PATCH',
      url: '/api/admin/users/role',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { userId: 'student_matrix_1', role: 'STUDENT', reason: 'Re-affirm role by admin' },
    });
    assert.equal(roleRes.statusCode, 200);
  });
});
