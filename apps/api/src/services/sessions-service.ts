import crypto from 'node:crypto';
import { User, Session } from '@msot/shared';
import { db } from '../db.js';

/**
 * Enterprise Session & Refresh Token Family Engine
 * Enforces short-lived 15-minute access tokens and rotating refresh tokens
 * with automatic replay attack detection (revokes entire token family).
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds (900 for 15 mins)
}

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string;
  status: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export class SessionsService {
  private jwtSecret: string;
  private readonly ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    this.jwtSecret =
      process.env.JWT_SECRET || 'super-secure-msot-quest-jwt-secret-key-2026!';
  }

  /**
   * Generates a signed JWT access token using HMAC-SHA256.
   */
  signAccessToken(user: User, sessionId: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionId,
      iat: now,
      exp: now + this.ACCESS_TOKEN_TTL_SEC,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data = `${header}.${payloadB64}`;
    const signature = crypto.createHmac('sha256', this.jwtSecret).update(data).digest('base64url');

    return `${data}.${signature}`;
  }

  /**
   * Verifies and decodes a signed JWT access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', this.jwtSecret).update(data).digest('base64url');

    // Timing-safe signature check
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    try {
      const payload: AccessTokenPayload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8')
      );

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Creates a new Session (Token Family) upon user login.
   */
  async createSession(
    userOrParams: User | { userId: string; userAgent?: string; ipAddress?: string },
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown Device'
  ): Promise<{ session: Session; tokens: TokenPair; accessToken: string; refreshToken: string; userId: string; tokenFamilyId?: string }> {
    let user: User | undefined;
    let effectiveIp = ipAddress;
    let effectiveAgent = userAgent;

    if ('id' in userOrParams) {
      user = userOrParams as User;
    } else {
      user = db.users.get(userOrParams.userId);
      if (userOrParams.ipAddress) effectiveIp = userOrParams.ipAddress;
      if (userOrParams.userAgent) effectiveAgent = userOrParams.userAgent;
    }

    if (!user) {
      user = {
        id: (userOrParams as any).userId || 'usr_unknown',
        email: 'unknown@msot.edu.in',
        role: 'STUDENT',
        status: 'ACTIVE',
        name: 'Learner',
        avatarId: 'avatar_1',
        anonymousAlias: 'Falcon',
        isAnonymous: false,
        campusId: 'campus_1',
        batchId: 'batch_1',
        sectionId: 'sec_1',
        createdAt: new Date().toISOString(),
      };
    }

    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const tokenFamilyId = `fam_${crypto.randomBytes(12).toString('hex')}`;
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session: Session & { tokenFamilyId?: string } = {
      id: sessionId,
      userId: user.id,
      tokenFamilyId,
      refreshTokenHash,
      userAgent: effectiveAgent,
      ipAddress: effectiveIp,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL_MS).toISOString(),
      isRevoked: false,
    };

    db.sessions.set(sessionId, session as Session);

    const accessToken = this.signAccessToken(user, sessionId);
    const fullRefreshToken = `${sessionId}.${refreshToken}`;

    return {
      session: session as Session,
      tokens: {
        accessToken,
        refreshToken: fullRefreshToken,
        expiresIn: this.ACCESS_TOKEN_TTL_SEC,
      },
      accessToken,
      refreshToken: fullRefreshToken,
      userId: user.id,
      tokenFamilyId,
    };
  }

  /**
   * Rotates a refresh token with strict reuse detection.
   * If a previously rotated token is replayed, the ENTIRE session family is immediately revoked!
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'Unknown'
  ): Promise<{ tokens: TokenPair; accessToken: string; refreshToken: string; user: User } | null> {
    if (!rawRefreshToken || !rawRefreshToken.includes('.')) return null;

    const [sessionId, tokenSecret] = rawRefreshToken.split('.');
    const session = db.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.isRevoked = true;
      db.sessions.set(sessionId, session);
      return null;
    }

    const presentedHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');

    // 1. REPLAY ATTACK DETECTION
    if (session.isRevoked || session.refreshTokenHash !== presentedHash) {
      // Security Alert: Stolen/Replayed Token!
      // Revoke the entire session family immediately!
      session.isRevoked = true;
      db.sessions.set(sessionId, session);
      await this.revokeAllUserSessions(session.userId);
      db.logAudit({
        actorId: session.userId,
        action: 'REFRESH_TOKEN_REPLAY_ATTACK_DETECTED',
        targetType: 'Session',
        targetId: sessionId,
        details: { ipAddress, userAgent, alert: 'Family revoked' },
        ipAddress,
      });
      throw new Error('Replay attack detected! Entire token family has been revoked.');
    }

    const user = db.users.get(session.userId);
    if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      session.isRevoked = true;
      db.sessions.set(sessionId, session);
      return null;
    }

    // 2. Normal Rotation: Issue new random refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    session.refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    session.lastUsedAt = new Date().toISOString();
    session.ipAddress = ipAddress;
    session.userAgent = userAgent;
    db.sessions.set(sessionId, session);

    const newAccessToken = this.signAccessToken(user, sessionId);
    const fullNewRefreshToken = `${sessionId}.${newRefreshToken}`;

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: fullNewRefreshToken,
        expiresIn: this.ACCESS_TOKEN_TTL_SEC,
      },
      accessToken: newAccessToken,
      refreshToken: fullNewRefreshToken,
      user,
    };
  }

  /**
   * Revokes a specific session.
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = db.sessions.get(sessionId);
    if (!session) return false;
    session.isRevoked = true;
    db.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Revokes all active sessions for a user ("Log out of all devices").
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    for (const [id, session] of db.sessions.entries()) {
      if (session.userId === userId && !session.isRevoked) {
        session.isRevoked = true;
        db.sessions.set(id, session);
        count++;
      }
    }
    return count;
  }

  /**
   * Retrieves active sessions for a user with current session indicator.
   */
  getUserSessions(userId: string, currentSessionId?: string): (Session & { isCurrent: boolean })[] {
    const results: (Session & { isCurrent: boolean })[] = [];
    for (const session of db.sessions.values()) {
      if (session.userId === userId && !session.isRevoked) {
        results.push({
          ...session,
          isCurrent: session.id === currentSessionId,
        });
      }
    }
    return results.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
  }

  /**
   * Async alias for getUserSessions
   */
  async listUserSessions(userId: string): Promise<(Session & { isCurrent: boolean })[]> {
    return this.getUserSessions(userId);
  }

  /**
   * Issues a CSRF token for state-changing forms.
   */
  generateCsrfToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }
}

export const sessionsService = new SessionsService();
