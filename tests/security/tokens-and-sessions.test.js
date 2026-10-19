import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../apps/api/dist/server.js';
import { db } from '../../apps/api/dist/db.js';
import { sessionsService } from '../../apps/api/dist/services/sessions-service.js';

describe('Security: Token Lifecycle, Rotating Refresh Tokens & Replay Detection', () => {
  let app;

  before(async () => {
    app = await createServer();
    await app.ready();

    db.users.set('student_token_tester', {
      id: 'student_token_tester',
      email: 'token.tester@msot.edu.in',
      name: 'Token Tester',
      role: 'STUDENT',
      avatarId: 'avatar_1',
      anonymousAlias: 'Falcon 99',
      isAnonymous: false,
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  });

  after(async () => {
    await app.close();
  });

  it('Flow 1: Creating a session issues an access token and a refresh token', async () => {
    const session = await sessionsService.createSession({
      userId: 'student_token_tester',
      userAgent: 'Mozilla/5.0 Mac',
      ipAddress: '192.168.1.10',
    });

    assert.ok(session.accessToken, 'Access token must be returned');
    assert.ok(session.refreshToken, 'Refresh token must be returned');
    assert.equal(session.userId, 'student_token_tester');

    const verified = sessionsService.verifyAccessToken(session.accessToken);
    assert.ok(verified);
    assert.equal(verified.sub, 'student_token_tester');
  });

  it('Flow 2: Refreshing tokens rotates the refresh token and invalidates the previous token', async () => {
    const initialSession = await sessionsService.createSession({
      userId: 'student_token_tester',
      userAgent: 'Mozilla/5.0 Mac',
      ipAddress: '192.168.1.10',
    });

    const oldRefreshToken = initialSession.refreshToken;

    // First rotation
    const rotated = await sessionsService.rotateRefreshToken(oldRefreshToken, '192.168.1.10');
    assert.ok(rotated.accessToken);
    assert.ok(rotated.refreshToken);
    assert.notEqual(rotated.refreshToken, oldRefreshToken, 'New refresh token must be distinct');

    // Second rotation using the newly issued token succeeds
    const secondRotated = await sessionsService.rotateRefreshToken(rotated.refreshToken, '192.168.1.10');
    assert.ok(secondRotated.accessToken);
    assert.notEqual(secondRotated.refreshToken, rotated.refreshToken);
  });

  it('Flow 3: Replay Attack Detection - Reusing an old refresh token revokes the entire token family', async () => {
    const session = await sessionsService.createSession({
      userId: 'student_token_tester',
      userAgent: 'Mozilla/5.0 Mac',
      ipAddress: '192.168.1.10',
    });

    const originalToken = session.refreshToken;

    // Legitimate user rotates token
    const legitRotation = await sessionsService.rotateRefreshToken(originalToken, '192.168.1.10');
    assert.ok(legitRotation.refreshToken);

    // Attacker attempts to replay the stolen originalToken
    await assert.rejects(
      async () => {
        await sessionsService.rotateRefreshToken(originalToken, '10.0.0.99');
      },
      /replay attack detected/i,
      'Replay attack must be detected and throw an error'
    );

    // Verify that ALL sessions in that family have been revoked
    const remainingSessions = await sessionsService.listUserSessions('student_token_tester');
    const compromisedFamilySessions = remainingSessions.filter(s => s.tokenFamilyId === session.tokenFamilyId);
    assert.equal(compromisedFamilySessions.length, 0, 'All sessions in the compromised token family must be revoked');
  });

  it('Flow 4: Revoke all sessions invalidates all user tokens across all devices', async () => {
    // Create 3 active sessions for user
    await sessionsService.createSession({ userId: 'student_token_tester', userAgent: 'Mobile App', ipAddress: '1.1.1.1' });
    await sessionsService.createSession({ userId: 'student_token_tester', userAgent: 'Desktop App', ipAddress: '2.2.2.2' });
    await sessionsService.createSession({ userId: 'student_token_tester', userAgent: 'Tablet App', ipAddress: '3.3.3.3' });

    let active = await sessionsService.listUserSessions('student_token_tester');
    assert.ok(active.length >= 3);

    // Revoke all
    await sessionsService.revokeAllUserSessions('student_token_tester');

    active = await sessionsService.listUserSessions('student_token_tester');
    assert.equal(active.length, 0, 'All sessions must be cleanly revoked');
  });
});
