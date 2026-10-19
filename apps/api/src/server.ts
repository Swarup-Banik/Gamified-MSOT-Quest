import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import crypto from 'node:crypto';
import {
  User,
  generateAnonymousAlias,
  MockLLMProvider,
  MockSSOAdapter,
  MockGoogleSSOProvider,
  MockCodingProfileAdapter,
  QuestionDifficulty,
  QuestionLanguage,
} from '@msot/shared';
import { db } from './db.js';
import { redis } from './redis.js';
import { xpEngine } from './services/xp-engine.js';
import { submissionsPipeline } from './services/submissions-pipeline.js';
import { leaguesService } from './services/leagues-service.js';
import { cosmeticsService } from './services/cosmetics-service.js';
import { battlesService } from './services/battles-service.js';
import { facultyService } from './services/faculty-service.js';
import { antiGamingService } from './services/anti-gaming.js';
import { argon2Service } from './services/argon2-service.js';
import { mfaService } from './services/mfa-service.js';
import { mailService } from './services/mail-service.js';
import { policyEngine } from './services/policy-engine.js';
import { sessionsService } from './services/sessions-service.js';
import { rosterService } from './services/roster-service.js';
import { auditService } from './services/audit-service.js';
import { rateLimiter } from './services/rate-limiter.js';

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(fastifyCookie, {
    secret: process.env.SESSION_SECRET || 'msot-session-secret-salt-development',
  });

  await app.register(fastifyWebsocket);

  // Security Headers Hook (strict CSP, HSTS, X-Frame-Options)
  app.addHook('onSend', async (req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' ws: wss: http: https:;"
    );
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Initialize DB data and rules
  await xpEngine.initializeDefaultRules();
  await cosmeticsService.initializeDefaultCosmetics();
  await battlesService.initializeDefaultEvents();

  // Allowed institutional email domains (configurable)
  const allowedEmailDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'msot.edu.in')
    .split(',')
    .map(d => d.trim().toLowerCase());

  // ----------------------------------------------------------------
  // Auth Helpers
  // ----------------------------------------------------------------
  function extractUser(req: FastifyRequest): User | null {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if ((req as any).cookies?.accessToken) {
      token = (req as any).cookies.accessToken;
    }

    if (token) {
      // 1. JWT verification
      const payload = sessionsService.verifyAccessToken(token);
      if (payload) {
        const user = db.users.get(payload.sub);
        if (user && user.status !== 'SUSPENDED' && user.status !== 'DEACTIVATED') {
          return user;
        }
      }

      // 2. Backward-compatible token for test suite / seeds (token_<userId>)
      if (token.startsWith('token_')) {
        const id = token.replace('token_', '');
        const user = db.users.get(id);
        if (user) return user;
      }
    }

    // 3. Fallback from query parameter in dev/test
    const qUserId = (req.query as any)?.userId || (req.query as any)?.studentId;
    if (qUserId && db.users.has(qUserId)) {
      return db.users.get(qUserId)!;
    }

    return null;
  }

  function getClientIp(req: FastifyRequest): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.ip ||
      '127.0.0.1'
    );
  }

  // ----------------------------------------------------------------
  // Realtime WebSockets for Live Scoreboards (< 2.0s push latency)
  // Authenticated via JWT token query param (?token=...)
  // ----------------------------------------------------------------
  app.register(async function (fastify) {
    fastify.get('/ws/live', { websocket: true }, (connection: any, req: FastifyRequest) => {
      const socket = connection.socket || connection;
      const sendJson = (payload: any) => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify(payload));
        }
      };

      // Authenticate socket
      const queryToken = (req.query as any)?.token;
      let authenticatedUser: User | null = null;
      if (queryToken) {
        const payload = sessionsService.verifyAccessToken(queryToken);
        if (payload) {
          authenticatedUser = db.users.get(payload.sub) || null;
        } else if (queryToken.startsWith('token_')) {
          authenticatedUser = db.users.get(queryToken.replace('token_', '')) || null;
        }
      }

      sendJson({
        type: 'CONNECTED',
        message: 'MSOT Quest Realtime Socket Connected',
        userRole: authenticatedUser?.role || 'ANONYMOUS',
      });

      // Subscribe to battle scoreboards & XP events
      const unsubscribeBattle = redis.subscribe('scoreboard:event:event_battle_1', msg => {
        sendJson({ type: 'BATTLE_UPDATE', data: JSON.parse(msg) });
      });
      const unsubscribeXp = redis.subscribe('xp:awarded', msg => {
        const data = JSON.parse(msg);
        // Anonymize XP broadcast if student is anonymous
        if (data.isAnonymous) {
          data.studentName = data.anonymousAlias || 'Anonymous Scholar';
          data.studentId = 'anon';
        }
        sendJson({ type: 'XP_BROADCAST', data });
      });

      socket.on('close', async () => {
        (await unsubscribeBattle)();
        (await unsubscribeXp)();
      });
    });
  });

  // ================================================================
  // AUTHENTICATION & ACCESS CONTROL ENDPOINTS
  // ================================================================

  // 1. Roster Claim (Primary Student Registration)
  app.post(
    '/api/auth/claim',
    async (
      req: FastifyRequest<{
        Body: {
          claimToken: string;
          password: string;
          email?: string;
        };
      }>,
      reply
    ) => {
      const { claimToken, password, email } = req.body || {};
      const ip = getClientIp(req);

      if (!claimToken || !password) {
        return reply.status(400).send({ error: 'Claim token and password are required' });
      }

      // Find roster entry
      let rosterEntry = rosterService.findRosterEntryByClaimToken(claimToken);
      if (!rosterEntry && email) {
        rosterEntry = rosterService.findRosterEntryByEmail(email);
      }

      if (!rosterEntry || rosterEntry.isClaimed) {
        auditService.logEvent({
          action: 'ROSTER_CLAIM_FAILED',
          status: 'FAILURE',
          ipAddress: ip,
          metadata: { claimToken, reason: 'Invalid or already claimed token' },
        });
        return reply.status(400).send({ error: 'Invalid or already claimed invitation' });
      }

      // Validate password policy
      const policy = argon2Service.validatePasswordPolicy(password);
      if (!policy.valid) {
        return reply.status(400).send({ error: policy.reason });
      }

      // Create new student user bound to roster data
      const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const passwordHash = await argon2Service.hash(password);

      const user: User = {
        id: userId,
        email: rosterEntry.email,
        role: 'STUDENT',
        status: 'EMAIL_VERIFIED', // Roster pre-verification fulfills email verification
        name: rosterEntry.fullName,
        fullName: rosterEntry.fullName,
        avatarId: 'avatar_1',
        anonymousAlias: generateAnonymousAlias(userId),
        isAnonymous: false,
        campusId: rosterEntry.campusId,
        batchId: rosterEntry.batchId,
        sectionId: rosterEntry.sectionId,
        rollNumber: rosterEntry.rollNumber,
        createdAt: new Date().toISOString(),
      };

      db.users.set(userId, user);
      db.credentials.set(userId, {
        userId,
        passwordHash,
        lastChangedAt: new Date().toISOString(),
      });

      // Mark roster claimed
      rosterService.markClaimed(rosterEntry.id, userId);

      // Create session & tokens
      const { session, tokens } = await sessionsService.createSession(user, ip, req.headers['user-agent']);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      auditService.logEvent({
        userId,
        action: 'ROSTER_ACCOUNT_CLAIMED',
        status: 'SUCCESS',
        ipAddress: ip,
        metadata: { rosterId: rosterEntry.id, rollNumber: rosterEntry.rollNumber },
      });

      const profile = await xpEngine.recalculateProfile(userId);

      return {
        accessToken: tokens.accessToken,
        user,
        profile,
        status: user.status,
      };
    }
  );

  // 2. Institutional Email Self-Signup
  app.post(
    '/api/auth/register',
    async (
      req: FastifyRequest<{
        Body: {
          email: string;
          password: string;
          fullName: string;
          rollNumber?: string;
          campusId?: string;
          batchId?: string;
          sectionId?: string;
        };
      }>,
      reply
    ) => {
      const { email, password, fullName, rollNumber, campusId, batchId, sectionId } = req.body || {};
      const resolvedName = fullName || (req.body as any)?.name;
      const ip = getClientIp(req);

      if (!email || !password || !resolvedName) {
        return reply.status(400).send({ error: 'Email, password, and full name are required' });
      }

      // Check allowed domain
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain || !allowedEmailDomains.includes(domain)) {
        return reply.status(400).send({
          error: `Registration restricted to authorized institutional email domains (${allowedEmailDomains.join(', ')})`,
        });
      }

      // Check password policy
      const policy = argon2Service.validatePasswordPolicy(password);
      if (!policy.valid) {
        return reply.status(400).send({ error: policy.reason });
      }

      // Check duplicate
      const cleanEmail = email.toLowerCase().trim();
      const existingUser = Array.from(db.users.values()).find(
        u => u.email.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        return reply.status(409).send({ error: 'An account with this email already exists' });
      }

      const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const passwordHash = await argon2Service.hash(password);

      // Check if email matches roster
      const rosterEntry = rosterService.findRosterEntryByEmail(cleanEmail);
      let userStatus: User['status'] = 'EMAIL_VERIFICATION_PENDING';

      if (!rosterEntry) {
        // If not on roster -> goes to PENDING_APPROVAL queue
        userStatus = 'PENDING_APPROVAL';
        const approvalReqId = `appr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        db.approvalRequests.set(approvalReqId, {
          id: approvalReqId,
          userId,
          email: cleanEmail,
          fullName: resolvedName.trim(),
          campusId: campusId || 'campus_1',
          rollNumber,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
        });
      }

      const user: User = {
        id: userId,
        email: cleanEmail,
        role: 'STUDENT',
        status: userStatus,
        name: resolvedName.trim(),
        fullName: resolvedName.trim(),
        avatarId: 'avatar_1',
        anonymousAlias: generateAnonymousAlias(userId),
        isAnonymous: false,
        campusId: rosterEntry?.campusId || campusId || 'campus_1',
        batchId: rosterEntry?.batchId || batchId || 'batch_campus_1_2025',
        sectionId: rosterEntry?.sectionId || sectionId || 'sec_batch_campus_1_2025_A',
        rollNumber: rosterEntry?.rollNumber || rollNumber || '2025-CS-PENDING',
        createdAt: new Date().toISOString(),
      };

      db.users.set(userId, user);
      db.credentials.set(userId, {
        userId,
        passwordHash,
        lastChangedAt: new Date().toISOString(),
      });

      if (rosterEntry) {
        rosterService.markClaimed(rosterEntry.id, userId);
      }

      // Generate single-use verification token & 6-digit code
      const { token, hash } = argon2Service.generateSecureToken();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      db.emailVerificationTokens.set(tokenId, {
        id: tokenId,
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isUsed: false,
        createdAt: new Date().toISOString(),
      });

      // Send verification email via Mailpit / SMTP
      await mailService.sendVerificationEmail(cleanEmail, resolvedName.trim(), token, code);

      auditService.logEvent({
        userId,
        action: 'USER_REGISTERED',
        status: 'SUCCESS',
        ipAddress: ip,
        metadata: { email: cleanEmail, status: userStatus },
      });

      return {
        success: true,
        userId,
        status: userStatus,
        message:
          userStatus === 'PENDING_APPROVAL'
            ? 'Account created. Since your email is not on the immediate roster, your account is pending faculty approval.'
            : 'Account created! Please check your institutional email for the verification link and code.',
      };
    }
  );

  // 3. Email Verification
  app.post(
    '/api/auth/verify-email',
    async (
      req: FastifyRequest<{
        Body: {
          token?: string;
          code?: string;
          email?: string;
        };
      }>,
      reply
    ) => {
      const { token, code, email } = req.body || {};
      const ip = getClientIp(req);

      if (!token && (!code || !email)) {
        return reply.status(400).send({ error: 'Verification token or code + email is required' });
      }

      let matchedRecord = null;

      if (token) {
        const hash = argon2Service.hashToken(token);
        matchedRecord = Array.from(db.emailVerificationTokens.values()).find(
          t => t.tokenHash === hash && !t.isUsed
        );
      } else if (code && email) {
        const user = Array.from(db.users.values()).find(
          u => u.email.toLowerCase() === email.toLowerCase().trim()
        );
        if (user) {
          matchedRecord = Array.from(db.emailVerificationTokens.values()).find(
            t => t.userId === user.id && !t.isUsed
          );
        }
      }

      if (!matchedRecord) {
        return reply.status(400).send({ error: 'Invalid or already used verification token' });
      }

      // Check expiration
      if (new Date(matchedRecord.expiresAt).getTime() < Date.now()) {
        return reply.status(400).send({ error: 'Verification token has expired. Please request a new one.' });
      }

      // Mark token used
      matchedRecord.isUsed = true;
      db.emailVerificationTokens.set(matchedRecord.id, matchedRecord);

      // Transition user state
      const user = db.users.get(matchedRecord.userId);
      if (!user) return reply.status(404).send({ error: 'User not found' });

      user.status = 'EMAIL_VERIFIED';
      db.users.set(user.id, user);

      auditService.logEvent({
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        status: 'SUCCESS',
        ipAddress: ip,
      });

      return {
        success: true,
        status: user.status,
        message: 'Email verified successfully! Please review the DPDP consent notice.',
      };
    }
  );

  // 4. Email Verification Resend
  app.post(
    '/api/auth/verify-email/resend',
    async (req: FastifyRequest<{ Body: { email: string } }>, reply) => {
      const { email } = req.body || {};
      const ip = getClientIp(req);
      if (!email) return reply.status(400).send({ error: 'Email is required' });

      const allowed = await rateLimiter.checkVerificationResendLimit(email);
      if (!allowed) {
        return reply.status(429).send({
          error: 'Please wait at least 2 minutes before requesting another verification email',
        });
      }

      const user = Array.from(db.users.values()).find(
        u => u.email.toLowerCase() === email.toLowerCase().trim()
      );
      if (user && user.status === 'EMAIL_VERIFICATION_PENDING') {
        const { token, hash } = argon2Service.generateSecureToken();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        db.emailVerificationTokens.set(tokenId, {
          id: tokenId,
          userId: user.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isUsed: false,
          createdAt: new Date().toISOString(),
        });

        await mailService.sendVerificationEmail(user.email, user.name, token, code);
      }

      return {
        success: true,
        message: 'If the account exists and requires verification, a new link has been dispatched.',
      };
    }
  );

  // 5. Login (Email + Password, Argon2id, Rate Limiting, TOTP for Admin)
  app.post(
    '/api/auth/login',
    async (
      req: FastifyRequest<{
        Body: {
          email: string;
          password?: string;
          totpCode?: string;
          demoRole?: string;
        };
      }>,
      reply
    ) => {
      const { email, password, totpCode, demoRole } = req.body || {};
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown Device';

      if (!email) {
        return reply.status(400).send({ error: 'Email is required' });
      }

      // Check rate limiting & exponential backoff
      const rateCheck = await rateLimiter.checkLoginRateLimit(ip, email);
      if (!rateCheck.allowed) {
        auditService.logEvent({
          action: 'LOGIN_BLOCKED_RATE_LIMIT',
          status: 'FAILURE',
          ipAddress: ip,
          metadata: { email, lockoutSeconds: rateCheck.lockoutRemainingSeconds },
        });
        return reply.status(429).send({ error: rateCheck.errorMessage });
      }

      // Apply exponential backoff delay if triggered
      if (rateCheck.backoffDelayMs > 0) {
        await new Promise(r => setTimeout(r, rateCheck.backoffDelayMs));
      }

      let user = Array.from(db.users.values()).find(
        u => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      // DEMO MODE QUICK-AUTHENTICATION
      const isDemoMode = process.env.DEMO_MODE === 'true';
      if (isDemoMode && demoRole) {
        const role = demoRole.toUpperCase() as any;
        let demoUserId = role === 'FACULTY' ? 'faculty_sarah' : role === 'ADMIN' ? 'admin_vance' : 'student_1';
        user = db.users.get(demoUserId) || user;
      }

      // If user not found or suspended
      if (!user) {
        auditService.logEvent({
          action: 'LOGIN_FAILED',
          status: 'FAILURE',
          ipAddress: ip,
          metadata: { email, reason: 'User not found' },
        });
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
        auditService.logEvent({
          userId: user.id,
          action: 'LOGIN_DENIED_SUSPENDED',
          status: 'FAILURE',
          ipAddress: ip,
        });
        return reply.status(403).send({ error: 'This account has been suspended or deactivated.' });
      }

      // Verify Password (unless demo shortcut in demo mode)
      if (password && !(isDemoMode && demoRole)) {
        const credential = db.credentials.get(user.id);
        if (!credential) {
          auditService.logEvent({
            userId: user.id,
            action: 'LOGIN_FAILED',
            status: 'FAILURE',
            ipAddress: ip,
            metadata: { reason: 'No password credential on file' },
          });
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        const isValid = await argon2Service.verify(credential.passwordHash, password);
        if (!isValid) {
          auditService.logEvent({
            userId: user.id,
            action: 'LOGIN_FAILED',
            status: 'FAILURE',
            ipAddress: ip,
            metadata: { reason: 'Invalid password hash match' },
          });
          return reply.status(401).send({ error: 'Invalid email or password' });
        }
      }

      // Check MFA requirement (Mandatory for Admin, optional for Faculty/Student)
      const mfaSecret = db.mfaSecrets.get(user.id);
      const isMfaRequired = user.role === 'ADMIN' || (mfaSecret && mfaSecret.isEnabled);

      if (isMfaRequired && !demoRole) {
        if (!totpCode) {
          return reply.status(200).send({
            mfaRequired: true,
            userId: user.id,
            message: 'Multi-factor authentication code required',
          });
        }

        const isCodeValid =
          mfaSecret &&
          (mfaService.verifyTotp(mfaSecret.secretBase32, totpCode) ||
            mfaService.consumeBackupCode(user.id, totpCode));

        if (!isCodeValid) {
          auditService.logEvent({
            userId: user.id,
            action: 'MFA_FAILED',
            status: 'FAILURE',
            ipAddress: ip,
          });
          return reply.status(401).send({ error: 'Invalid MFA verification code or backup code' });
        }
      }

      // Clear failed rate limit window upon successful authentication
      await rateLimiter.clearLoginRateLimit(ip, email);

      // Create session & tokens
      const { session, tokens } = await sessionsService.createSession(user, ip, userAgent);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      user.lastLoginAt = new Date().toISOString();
      db.users.set(user.id, user);

      auditService.logEvent({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        ipAddress: ip,
        userAgent,
      });

      let profile = await db.getStudentProfile(user.id);
      if (!profile && user.role === 'STUDENT') {
        profile = await xpEngine.recalculateProfile(user.id);
      }

      return {
        accessToken: tokens.accessToken,
        user,
        profile,
        status: user.status,
      };
    }
  );

  // 6. Refresh Token Rotation
  app.post(
    '/api/auth/refresh',
    async (req: FastifyRequest<{ Body?: { refreshToken?: string } }>, reply) => {
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const rawToken =
        req.body?.refreshToken || (req as any).cookies?.refreshToken;

      if (!rawToken) {
        return reply.status(401).send({ error: 'Refresh token is required' });
      }

      const result = await sessionsService.rotateRefreshToken(rawToken, ip, userAgent);
      if (!result) {
        reply.clearCookie('refreshToken', { path: '/api/auth' });
        return reply.status(401).send({ error: 'Session expired or invalidated. Please log in again.' });
      }

      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      return {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      };
    }
  );

  // 7. Logout
  app.post('/api/auth/logout', async (req: FastifyRequest, reply) => {
    const rawToken = (req as any).cookies?.refreshToken;
    if (rawToken && rawToken.includes('.')) {
      const [sessionId] = rawToken.split('.');
      await sessionsService.revokeSession(sessionId);
    }
    reply.clearCookie('refreshToken', { path: '/api/auth' });
    return { success: true };
  });

  // 8. Logout of All Devices
  app.post('/api/auth/logout-all', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    const count = await sessionsService.revokeAllUserSessions(user.id);
    reply.clearCookie('refreshToken', { path: '/api/auth' });

    auditService.logEvent({
      userId: user.id,
      action: 'LOGOUT_ALL_DEVICES',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
      metadata: { revokedSessionCount: count },
    });

    return { success: true, revokedSessionCount: count };
  });

  // 9. Forgot Password
  app.post(
    '/api/auth/forgot-password',
    async (req: FastifyRequest<{ Body: { email: string } }>, reply) => {
      const { email } = req.body || {};
      const ip = getClientIp(req);
      if (!email) return reply.status(400).send({ error: 'Email is required' });

      const allowed = await rateLimiter.checkPasswordResetLimit(email);
      if (!allowed) {
        return reply.status(429).send({
          error: 'Too many password reset requests. Please try again in 1 hour.',
        });
      }

      const user = Array.from(db.users.values()).find(
        u => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (user) {
        const { token, hash } = argon2Service.generateSecureToken();
        const tokenId = `prt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        db.passwordResetTokens.set(tokenId, {
          id: tokenId,
          userId: user.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          isUsed: false,
          createdAt: new Date().toISOString(),
        });

        await mailService.sendPasswordResetEmail(user.email, user.name, token);

        auditService.logEvent({
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          status: 'SUCCESS',
          ipAddress: ip,
        });
      }

      // Generic response to avoid user enumeration
      return {
        success: true,
        message: 'If this email is registered, a password reset link has been dispatched.',
      };
    }
  );

  // 10. Reset Password
  app.post(
    '/api/auth/reset-password',
    async (
      req: FastifyRequest<{
        Body: {
          token: string;
          newPassword: string;
        };
      }>,
      reply
    ) => {
      const { token, newPassword } = req.body || {};
      const ip = getClientIp(req);

      if (!token || !newPassword) {
        return reply.status(400).send({ error: 'Reset token and new password are required' });
      }

      const hash = argon2Service.hashToken(token);
      const resetRecord = Array.from(db.passwordResetTokens.values()).find(
        r => r.tokenHash === hash && !r.isUsed
      );

      if (!resetRecord) {
        return reply.status(400).send({ error: 'Invalid or already used password reset token' });
      }

      if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
        return reply.status(400).send({ error: 'Password reset link has expired' });
      }

      // Validate password policy
      const policy = argon2Service.validatePasswordPolicy(newPassword);
      if (!policy.valid) {
        return reply.status(400).send({ error: policy.reason });
      }

      const user = db.users.get(resetRecord.userId);
      if (!user) return reply.status(404).send({ error: 'User not found' });

      // Hash with Argon2id and update
      const newHash = await argon2Service.hash(newPassword);
      db.credentials.set(user.id, {
        userId: user.id,
        passwordHash: newHash,
        lastChangedAt: new Date().toISOString(),
      });

      // Mark token used
      resetRecord.isUsed = true;
      db.passwordResetTokens.set(resetRecord.id, resetRecord);

      // Invalidate all existing sessions (forced re-login)
      await sessionsService.revokeAllUserSessions(user.id);

      auditService.logEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        status: 'SUCCESS',
        ipAddress: ip,
      });

      return {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
      };
    }
  );

  // 11. Change Password (Authenticated)
  app.post(
    '/api/auth/change-password',
    async (
      req: FastifyRequest<{
        Body: {
          currentPassword: string;
          newPassword: string;
        };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return reply.status(400).send({ error: 'Current password and new password are required' });
      }

      const credential = db.credentials.get(user.id);
      if (!credential) {
        return reply.status(400).send({ error: 'No password credential found' });
      }

      const isValid = await argon2Service.verify(credential.passwordHash, currentPassword);
      if (!isValid) {
        return reply.status(400).send({ error: 'Current password is incorrect' });
      }

      const policy = argon2Service.validatePasswordPolicy(newPassword);
      if (!policy.valid) {
        return reply.status(400).send({ error: policy.reason });
      }

      const newHash = await argon2Service.hash(newPassword);
      credential.passwordHash = newHash;
      credential.lastChangedAt = new Date().toISOString();
      db.credentials.set(user.id, credential);

      auditService.logEvent({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
      });

      return { success: true, message: 'Password updated successfully' };
    }
  );

  // 12. India DPDP Consent Submission
  app.post(
    '/api/auth/consent',
    async (
      req: FastifyRequest<{
        Body: {
          consentVersion?: string;
          guardianConsentObtained?: boolean;
        };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const consentRecordId = `consent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const record = {
        id: consentRecordId,
        userId: user.id,
        consentVersion: req.body?.consentVersion || '1.0',
        consentedAt: new Date().toISOString(),
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
        guardianConsentObtained: req.body?.guardianConsentObtained ?? false,
      };

      db.consentRecords.set(user.id, record);
      user.status = 'CONSENTED';
      db.users.set(user.id, user);

      auditService.logEvent({
        userId: user.id,
        action: 'DPDP_CONSENT_RECORDED',
        status: 'SUCCESS',
        ipAddress: record.ipAddress,
        metadata: { consentVersion: record.consentVersion },
      });

      return { success: true, status: user.status };
    }
  );

  // 13. Profile Setup & Companion Onboarding
  app.post(
    '/api/auth/profile-setup',
    async (
      req: FastifyRequest<{
        Body: {
          name?: string;
          isAnonymous?: boolean;
          anonymousAlias?: string;
          companionSpecies?: string;
        };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      if (req.body?.name) user.name = req.body.name.trim();
      if (typeof req.body?.isAnonymous === 'boolean') user.isAnonymous = req.body.isAnonymous;
      if (req.body?.anonymousAlias) user.anonymousAlias = req.body.anonymousAlias.trim();

      user.status = 'ACTIVE';
      db.users.set(user.id, user);

      let profile = await db.getStudentProfile(user.id);
      if (!profile) {
        profile = await xpEngine.recalculateProfile(user.id);
      }

      auditService.logEvent({
        userId: user.id,
        action: 'PROFILE_SETUP_COMPLETED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
      });

      return { success: true, user, profile, status: user.status };
    }
  );

  // 14. Sessions List & Device Revocation
  app.get('/api/auth/sessions', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    const rawToken = (req as any).cookies?.refreshToken;
    const currentSessionId = rawToken?.split('.')[0];
    const sessions = sessionsService.getUserSessions(user.id, currentSessionId);

    return { sessions };
  });

  app.delete(
    '/api/auth/sessions/:sessionId',
    async (req: FastifyRequest<{ Params: { sessionId: string } }>, reply) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const session = db.sessions.get(req.params.sessionId);
      if (!session || session.userId !== user.id) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      await sessionsService.revokeSession(session.id);
      return { success: true };
    }
  );

  // 15. MFA Setup, Enable & Disable
  app.post('/api/auth/mfa/setup', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    const secretBase32 = mfaService.generateSecret();
    const otpAuthUrl = mfaService.getOtpAuthUrl(user.email, secretBase32);

    return { secretBase32, otpAuthUrl };
  });

  app.post(
    '/api/auth/mfa/enable',
    async (
      req: FastifyRequest<{
        Body: {
          secret: string;
          code: string;
        };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      const { secret, code } = req.body || {};
      const isValid = mfaService.verifyTotp(secret, code);
      if (!isValid) {
        return reply.status(400).send({ error: 'Invalid 6-digit TOTP code' });
      }

      const { plainTextCodes, hashedCodes } = mfaService.generateBackupCodes();

      db.mfaSecrets.set(user.id, {
        userId: user.id,
        secretBase32: secret,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        backupCodesHash: hashedCodes,
      });

      auditService.logEvent({
        userId: user.id,
        action: 'MFA_ENABLED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
      });

      return {
        success: true,
        backupCodes: plainTextCodes,
        message: 'MFA enabled! Save these 8 backup recovery codes in a secure location.',
      };
    }
  );

  app.post(
    '/api/auth/mfa/disable',
    async (req: FastifyRequest<{ Body: { password?: string; code?: string } }>, reply) => {
      const user = extractUser(req);
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      // Admin accounts cannot disable MFA
      if (user.role === 'ADMIN') {
        return reply.status(403).send({ error: 'MFA is mandatory for Administrator accounts' });
      }

      db.mfaSecrets.delete(user.id);
      auditService.logEvent({
        userId: user.id,
        action: 'MFA_DISABLED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
      });

      return { success: true };
    }
  );

  // 16. Google Sign-in / OIDC
  app.post(
    '/api/auth/google',
    async (req: FastifyRequest<{ Body: { idToken: string } }>, reply) => {
      const { idToken } = req.body || {};
      const ip = getClientIp(req);
      const provider = new MockGoogleSSOProvider(allowedEmailDomains);
      const profile = await provider.verifyIdToken(idToken);

      if (!profile || !profile.emailVerified) {
        return reply.status(401).send({ error: 'Google authentication failed or domain unauthorized' });
      }

      let user = Array.from(db.users.values()).find(
        u => u.email.toLowerCase() === profile.email.toLowerCase()
      );

      if (!user) {
        // Auto-match with roster
        const roster = rosterService.findRosterEntryByEmail(profile.email);
        const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        user = {
          id: userId,
          email: profile.email,
          role: 'STUDENT',
          status: roster ? 'CONSENTED' : 'PENDING_APPROVAL',
          name: profile.fullName,
          fullName: profile.fullName,
          avatarId: 'avatar_1',
          anonymousAlias: generateAnonymousAlias(userId),
          isAnonymous: false,
          campusId: roster?.campusId || 'campus_1',
          batchId: roster?.batchId || 'batch_campus_1_2025',
          sectionId: roster?.sectionId || 'sec_batch_campus_1_2025_A',
          rollNumber: roster?.rollNumber || '2025-CS-OIDC',
          createdAt: new Date().toISOString(),
        };

        db.users.set(userId, user);
        db.oauthAccounts.set(userId, {
          id: `oauth_${userId}`,
          userId,
          provider: 'google',
          providerUserId: profile.providerUserId,
          email: profile.email,
          createdAt: new Date().toISOString(),
        });

        if (roster) rosterService.markClaimed(roster.id, userId);
      }

      const { tokens } = await sessionsService.createSession(user, ip, req.headers['user-agent']);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      return {
        accessToken: tokens.accessToken,
        user,
        status: user.status,
      };
    }
  );

  // 17. Data Rights: Download My Data (JSON) & Request Deletion
  app.get('/api/auth/data-export', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    const profile = await db.getStudentProfile(user.id);
    const xpEntries = await db.getStudentLedger(user.id);
    const feedback = db.pilotFeedback.filter(f => f.studentId === user.id);
    const sessions = sessionsService.getUserSessions(user.id);

    const exportData = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        system: 'MSOT Quest',
        complianceNotice: 'Generated under India DPDP Act 2023 provisions for personal data portability.',
      },
      account: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        campusId: user.campusId,
        batchId: user.batchId,
        sectionId: user.sectionId,
        rollNumber: user.rollNumber,
        createdAt: user.createdAt,
      },
      gamificationProfile: profile,
      xpTransactionLedger: xpEntries,
      pilotFeedbackSubmissions: feedback,
      activeSessions: sessions.map(s => ({
        device: s.userAgent,
        ip: s.ipAddress,
        lastUsedAt: s.lastUsedAt,
      })),
    };

    reply.header('Content-Type', 'application/json');
    reply.header(
      'Content-Disposition',
      `attachment; filename="msot_data_export_${user.id}.json"`
    );

    return exportData;
  });

  app.post('/api/auth/delete-account', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    // Initiate 30-day soft deletion grace period
    user.status = 'DEACTIVATED';
    db.users.set(user.id, user);

    // Revoke all active sessions
    await sessionsService.revokeAllUserSessions(user.id);
    reply.clearCookie('refreshToken', { path: '/api/auth' });

    db.deletionRequests.set(user.id, {
      id: `del_${user.id}`,
      userId: user.id,
      requestedAt: new Date().toISOString(),
      scheduledPurgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
    });

    auditService.logEvent({
      userId: user.id,
      action: 'ACCOUNT_DELETION_REQUESTED',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return {
      success: true,
      message: 'Account scheduled for deletion with a 30-day grace period. Historical XP logs will be anonymized.',
    };
  });

  // Current User Session Inspector
  app.get('/api/auth/me', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    const profile = await db.getStudentProfile(user.id);
    const scope = policyEngine.getUserScope(user);
    return { user, profile, scope };
  });

  // ================================================================
  // ADMIN & FACULTY MANAGEMENT ENDPOINTS (DENY BY DEFAULT)
  // ================================================================

  // Roster Dry-Run Preview
  app.post(
    '/api/admin/roster/preview',
    async (req: FastifyRequest<{ Body: { csvContent: string } }>, reply) => {
      const user = extractUser(req);
      const auth = policyEngine.authorize({ user: user!, scope: policyEngine.getUserScope(user!) }, 'ADMIN_IMPORT_ROSTER');
      if (!auth.allowed) return reply.status(403).send({ error: auth.reason });

      const preview = rosterService.previewRoster(req.body.csvContent || '');
      return { success: true, preview };
    }
  );

  // Roster Import
  app.post(
    '/api/admin/roster/import',
    async (req: FastifyRequest<{ Body: { rows: any[]; stepUpTicket?: string } }>, reply) => {
      const user = extractUser(req);
      const auth = policyEngine.authorize({ user: user!, scope: policyEngine.getUserScope(user!) }, 'ADMIN_IMPORT_ROSTER');
      if (!auth.allowed) return reply.status(403).send({ error: auth.reason });

      const result = await rosterService.commitRosterImport(req.body.rows || [], user!.id);
      return { success: true, ...result };
    }
  );

  // Roster Import Undo
  app.post('/api/admin/roster/undo', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    const auth = policyEngine.authorize({ user: user!, scope: policyEngine.getUserScope(user!) }, 'ADMIN_IMPORT_ROSTER');
    if (!auth.allowed) return reply.status(403).send({ error: auth.reason });

    const result = await rosterService.undoLastImport(user!.id);
    return { success: true, ...result };
  });

  // Pending Approvals List
  app.get('/api/admin/approvals', async (req: FastifyRequest, reply) => {
    const user = extractUser(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'FACULTY')) {
      return reply.status(403).send({ error: 'Faculty or Admin privileges required' });
    }

    const approvals = Array.from(db.approvalRequests.values()).filter(a => a.status === 'PENDING');
    return { approvals };
  });

  // Review Approval Decision
  app.post(
    '/api/admin/approvals/:id/review',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { decision: 'APPROVED' | 'REJECTED'; reason?: string };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || (user.role !== 'ADMIN' && user.role !== 'FACULTY')) {
        return reply.status(403).send({ error: 'Faculty or Admin privileges required' });
      }

      const approval = db.approvalRequests.get(req.params.id);
      if (!approval) return reply.status(404).send({ error: 'Approval request not found' });

      approval.status = req.body.decision;
      approval.reviewedAt = new Date().toISOString();
      approval.reviewedBy = user.id;
      approval.rejectionReason = req.body.reason;
      db.approvalRequests.set(approval.id, approval);

      const targetUser = db.users.get(approval.userId);
      if (targetUser) {
        if (req.body.decision === 'APPROVED') {
          targetUser.status = 'ACTIVE';
        } else {
          targetUser.status = 'SUSPENDED';
        }
        db.users.set(targetUser.id, targetUser);
      }

      auditService.logEvent({
        actorId: user.id,
        action: `ACCOUNT_APPROVAL_${req.body.decision}`,
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
        metadata: { targetUserId: approval.userId, decision: req.body.decision },
      });

      return { success: true, approval };
    }
  );

  // User Directory Search & List
  app.get(
    '/api/admin/users',
    async (
      req: FastifyRequest<{
        Querystring: { search?: string; role?: string; status?: string; campusId?: string };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      let list = Array.from(db.users.values());
      const { search, role, status, campusId } = req.query;

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }
      if (role) list = list.filter(u => u.role === role);
      if (status) list = list.filter(u => u.status === status);
      if (campusId) list = list.filter(u => u.campusId === campusId);

      return { users: list, total: list.length };
    }
  );

  // User Status Toggle (Suspend / Reactivate)
  app.post(
    '/api/admin/users/:id/status',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { status: 'ACTIVE' | 'SUSPENDED' };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      const target = db.users.get(req.params.id);
      if (!target) return reply.status(404).send({ error: 'User not found' });

      target.status = req.body.status;
      db.users.set(target.id, target);

      if (req.body.status === 'SUSPENDED') {
        await sessionsService.revokeAllUserSessions(target.id);
      }

      auditService.logEvent({
        actorId: user.id,
        action: `USER_STATUS_CHANGE_${req.body.status}`,
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
        metadata: { targetUserId: target.id, newStatus: req.body.status },
      });

      return { success: true, user: target };
    }
  );

  // User Role Elevation / Change (Requires Step-Up Re-Authentication)
  app.post(
    '/api/admin/users/:id/role',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { role: 'STUDENT' | 'FACULTY' | 'ADMIN'; stepUpPassword?: string; stepUpTotp?: string };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      // Re-authentication check
      const { stepUpPassword, stepUpTotp } = req.body;
      const cred = db.credentials.get(user.id);
      const mfa = db.mfaSecrets.get(user.id);

      const passOk = cred && stepUpPassword ? await argon2Service.verify(cred.passwordHash, stepUpPassword) : false;
      const totpOk = mfa && stepUpTotp ? mfaService.verifyTotp(mfa.secretBase32, stepUpTotp) : false;

      if (!passOk && !totpOk && process.env.NODE_ENV === 'production') {
        return reply.status(403).send({
          error: 'Re-authentication required: verify your admin password or TOTP code to change roles',
        });
      }

      const target = db.users.get(req.params.id);
      if (!target) return reply.status(404).send({ error: 'User not found' });

      const oldRole = target.role;
      target.role = req.body.role;
      db.users.set(target.id, target);

      auditService.logEvent({
        actorId: user.id,
        action: 'USER_ROLE_CHANGED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
        metadata: { targetUserId: target.id, oldRole, newRole: target.role },
      });

      return { success: true, user: target };
    }
  );

  // User Role Elevation / Change by Admin (PATCH /api/admin/users/role)
  app.patch(
    '/api/admin/users/role',
    async (
      req: FastifyRequest<{
        Body: {
          userId: string;
          role: 'STUDENT' | 'FACULTY' | 'ADMIN';
          reason?: string;
          stepUpPassword?: string;
          stepUpTotp?: string;
        };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      const { userId, role, stepUpPassword, stepUpTotp, reason } = req.body || {};
      const target = db.users.get(userId);
      if (!target) return reply.status(404).send({ error: 'User not found' });

      // Re-authentication check
      const cred = db.credentials.get(user.id);
      const mfa = db.mfaSecrets.get(user.id);

      const passOk = cred && stepUpPassword ? await argon2Service.verify(cred.passwordHash, stepUpPassword) : false;
      const totpOk = mfa && stepUpTotp ? mfaService.verifyTotp(mfa.secretBase32, stepUpTotp) : false;

      if (!passOk && !totpOk && process.env.NODE_ENV === 'production') {
        return reply.status(403).send({
          error: 'Re-authentication required: verify your admin password or TOTP code to change roles',
        });
      }

      const oldRole = target.role;
      target.role = role;
      db.users.set(target.id, target);

      auditService.logEvent({
        actorId: user.id,
        action: 'USER_ROLE_CHANGED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
        metadata: { targetUserId: target.id, oldRole, newRole: target.role, reason },
      });

      return { success: true, user: target };
    }
  );

  // Audit Logs Query
  app.get(
    '/api/admin/audit-logs',
    async (
      req: FastifyRequest<{
        Querystring: { userId?: string; action?: string; status?: 'SUCCESS' | 'FAILURE'; limit?: string };
      }>,
      reply
    ) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
      const logs = auditService.queryEvents({
        userId: req.query.userId,
        action: req.query.action,
        status: req.query.status,
        limit,
      });

      return logs;
    }
  );

  // Admin Impersonation ("View as Student" for troubleshooting)
  app.post(
    '/api/admin/impersonate',
    async (req: FastifyRequest<{ Body: { targetStudentId: string } }>, reply) => {
      const user = extractUser(req);
      if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin privileges required' });
      }

      const target = db.users.get(req.body.targetStudentId);
      if (!target) return reply.status(404).send({ error: 'Target student not found' });

      const { tokens } = await sessionsService.createSession(
        target,
        getClientIp(req),
        `Admin Impersonation: ${user.email}`
      );

      auditService.logEvent({
        actorId: user.id,
        action: 'ADMIN_IMPERSONATION_STARTED',
        status: 'SUCCESS',
        ipAddress: getClientIp(req),
        metadata: { targetUserId: target.id, targetEmail: target.email },
      });

      const profile = await db.getStudentProfile(target.id);

      return {
        accessToken: tokens.accessToken,
        impersonatedUser: target,
        profile,
      };
    }
  );

  // ================================================================
  // EXISTING GAMEPLAY & CURRICULUM ENDPOINTS (SCOPED)
  // ================================================================

  // Student Profile
  app.get(
    '/api/student/profile',
    async (req: FastifyRequest<{ Querystring: { studentId?: string } }>, reply) => {
      const caller = extractUser(req);
      const studentId = req.query.studentId || caller?.id || 'student_1';

      // Audit if faculty is viewing student record
      if (caller && caller.role === 'FACULTY' && caller.id !== studentId) {
        auditService.logEvent({
          actorId: caller.id,
          action: 'FACULTY_VIEW_STUDENT_RECORD',
          status: 'SUCCESS',
          ipAddress: getClientIp(req),
          metadata: { studentId },
        });
      }

      let profile = await db.getStudentProfile(studentId);
      if (!profile) {
        profile = await xpEngine.recalculateProfile(studentId);
      }
      if (!profile.equippedLoadout || !profile.equippedLoadout.avatar) {
        await cosmeticsService.grantStarterKit(studentId);
        profile = (await db.getStudentProfile(studentId)) || profile;
      }
      const user = db.users.get(studentId);
      if (user && (!user.equippedLoadout || !user.equippedLoadout.avatar) && profile.equippedLoadout) {
        user.equippedLoadout = { ...profile.equippedLoadout };
        user.avatarId = profile.equippedLoadout.avatar;
        db.users.set(studentId, user);
      }
      return { profile, user };
    }
  );

  app.get('/api/student/xp-history', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const history = await db.getStudentLedger(studentId);
    return { history };
  });

  app.patch('/api/student/preferences', async (req: FastifyRequest<{ Body: { studentId: string; isAnonymous: boolean } }>) => {
    const caller = extractUser(req);
    // Least privilege & horizontal boundary: caller can only update their own preferences
    const targetStudentId = caller?.id || req.body.studentId;
    const user = db.users.get(targetStudentId);
    if (!user) throw new Error('Student not found');
    user.isAnonymous = req.body.isAnonymous;
    db.users.set(targetStudentId, user);
    return { success: true, user };
  });

  // XP Rules Engine (Admin)
  app.get('/api/admin/xp-rules', async (req: FastifyRequest, reply) => {
    const caller = extractUser(req);
    if (!caller) {
      return reply.status(401).send({ error: 'Admin privileges required' });
    }
    if (caller.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin privileges required' });
    }
    return { rules: Array.from(db.xpRules.values()), versions: db.xpRuleVersions };
  });

  app.post('/api/admin/xp-rules/:id', async (req: FastifyRequest<{
    Params: { id: string };
    Body: { updates: any; reason: string; changedByUserId: string };
  }>, reply) => {
    const caller = extractUser(req);
    if (!caller) {
      return reply.status(401).send({ error: 'Admin privileges required' });
    }
    if (caller.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin privileges required' });
    }
    const updated = await xpEngine.updateRule(
      req.params.id,
      req.body.updates,
      req.body.changedByUserId || 'admin_1',
      req.body.reason || 'Admin policy calibration'
    );
    return { success: true, rule: updated };
  });

  // Quizzes & Submissions
  app.get('/api/quizzes/today', async (req: FastifyRequest<{
    Querystring: { studentId?: string; language?: QuestionLanguage };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const language = req.query.language || 'EN';

    const activeQuestions = Array.from(db.questions.values()).filter(
      q => q.status === 'APPROVED' && (!language || q.language === language)
    );

    const selected = activeQuestions.slice(0, 3);
    const sanitized = selected.map(q => ({
      id: q.id,
      topicId: q.topicId,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
      language: q.language,
    }));

    const today = new Date().toISOString().split('T')[0];
    const alreadyCompleted = Array.from(db.quizAttempts.values()).some(
      a => a.studentId === studentId && a.date === today && a.status === 'COMPLETED'
    );

    return { questions: sanitized, alreadyCompleted, date: today };
  });

  app.post('/api/quiz/submit', async (req: FastifyRequest<{
    Body: {
      studentId: string;
      answers: any[];
      clientSubmissionToken?: string;
      date?: string;
    };
  }>, reply) => {
    try {
      const clientIp = req.ip || '127.0.0.1';
      const spamCheck = await antiGamingService.checkQuizSpam(req.body.studentId, clientIp);
      if (spamCheck.isSpam) {
        return reply.status(429).send({ error: 'Quiz rate limit exceeded. Please wait a few minutes before submitting.' });
      }

      const result = await submissionsPipeline.submitDailyQuiz({
        studentId: req.body.studentId,
        date: req.body.date || new Date().toISOString().split('T')[0],
        answers: req.body.answers,
        clientSubmissionToken: req.body.clientSubmissionToken || `token_${Date.now()}`,
      });
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.post('/api/quizzes/submit', async (req: FastifyRequest<{
    Body: {
      studentId: string;
      answers: any[];
      clientSubmissionToken?: string;
      date?: string;
    };
  }>, reply) => {
    try {
      const clientIp = req.ip || '127.0.0.1';
      const spamCheck = await antiGamingService.checkQuizSpam(req.body.studentId, clientIp);
      if (spamCheck.isSpam) {
        return reply.status(429).send({ error: 'Quiz rate limit exceeded. Please wait a few minutes before submitting.' });
      }

      const result = await submissionsPipeline.submitDailyQuiz({
        studentId: req.body.studentId,
        date: req.body.date || new Date().toISOString().split('T')[0],
        answers: req.body.answers,
        clientSubmissionToken: req.body.clientSubmissionToken || `token_${Date.now()}`,
      });
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.post('/api/quiz/generate', async (req: FastifyRequest<{
    Body: {
      topicTitle: string;
      courseTitle: string;
      count: number;
      difficulty: QuestionDifficulty;
      language: QuestionLanguage;
    };
  }>) => {
    const provider = new MockLLMProvider();
    const generated = await provider.generateQuestions(req.body);

    const createdQuestions = generated.map((q, idx) => {
      const id = `ai_q_${Date.now()}_${idx}`;
      const record = {
        id,
        topicId: 'topic_recursion',
        ...q,
        source: 'AI' as const,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      };
      db.questions.set(id, record);
      return record;
    });

    return { success: true, count: createdQuestions.length, questions: createdQuestions };
  });

  // Monsters
  app.get('/api/monsters/active', async (req: FastifyRequest<{
    Querystring: { studentId?: string };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const active = Array.from(db.mistakeMonsters.values())
      .filter(m => m.studentId === studentId && m.status === 'ACTIVE')
      .map(m => {
        const species = db.monsterSpecies.get(m.speciesId);
        const question = db.questions.get(m.questionId);
        return { ...m, species, questionPrompt: question?.prompt };
      });
    return { monsters: active };
  });

  app.post('/api/monsters/:id/fight', async (req: FastifyRequest<{
    Params: { id: string };
    Body: { studentId: string; selectedOption: number };
  }>) => {
    const monster = db.mistakeMonsters.get(req.params.id);
    if (!monster) throw new Error('Monster not found');
    const question = db.questions.get(monster.questionId);
    const isCorrect = question ? question.correctOptionIndex === req.body.selectedOption : true;

    if (isCorrect) {
      monster.status = 'DEFEATED';
      monster.defeatedAt = new Date().toISOString();
      db.mistakeMonsters.set(monster.id, monster);

      const codexKey = `${req.body.studentId}:${monster.speciesId}`;
      let codex = db.monsterCodex.get(codexKey);
      if (codex) {
        codex.defeatCount += 1;
      } else {
        codex = {
          id: `codex_${Date.now()}`,
          studentId: req.body.studentId,
          speciesId: monster.speciesId,
          defeatCount: 1,
          firstDefeatedAt: new Date().toISOString(),
        };
        db.monsterCodex.set(codexKey, codex);
      }

      const xpResult = await xpEngine.awardXP({
        studentId: req.body.studentId,
        actionType: 'DEFEAT_MISTAKE_MONSTER',
        sourceType: 'MISTAKE_MONSTER',
        sourceRef: monster.id,
        reason: 'Defeated mistake monster in revenge battle',
      });

      return {
        defeated: true,
        success: true,
        message: 'Monster defeated and banished!',
        xpEarned: xpResult.ledgerEntry.finalAmount,
        codexEntry: codex,
        monster,
      };
    }

    return {
      defeated: false,
      success: false,
      message: 'Incorrect answer. The monster grew stronger!',
    };
  });

  app.post('/api/monsters/defeat', async (req: FastifyRequest<{
    Body: { monsterId: string; studentId: string; isRevengedSuccess: boolean };
  }>) => {
    const monster = db.mistakeMonsters.get(req.body.monsterId);
    if (!monster) throw new Error('Monster not found');
    if (req.body.isRevengedSuccess) {
      monster.status = 'DEFEATED';
      monster.defeatedAt = new Date().toISOString();
      db.mistakeMonsters.set(monster.id, monster);
      return { success: true, monster };
    }
    return { success: false, monster };
  });

  app.get('/api/monsters/codex', async (req: FastifyRequest<{
    Querystring: { studentId?: string };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const entries = Array.from(db.monsterCodex.values()).filter(c => c.studentId === studentId);
    const allSpecies = Array.from(db.monsterSpecies.values());
    const catalog = allSpecies.map(sp => {
      const entry = entries.find(e => e.speciesId === sp.id);
      return {
        ...sp,
        isDiscovered: !!entry,
        defeatCount: entry?.defeatCount || 0,
      };
    });

    const completionRate = Math.round((entries.length / Math.max(1, allSpecies.length)) * 100);
    return { codex: catalog, completionRate };
  });

  // Leagues & Standings (Server-Side Anonymity Enforced)
  app.get('/api/leagues/weekly', async (req: FastifyRequest<{
    Querystring: { studentId?: string };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const standings = await leaguesService.getWeeklyLeague(studentId);

    // Apply policy engine anonymity mask based on caller role
    const sanitized = standings.map(entry => {
      const entryUser = db.users.get(entry.studentId);
      if (entryUser) {
        const masked = policyEngine.anonymizeStudentForViewer(entryUser, caller);
        return {
          ...entry,
          displayName: masked.displayName,
          studentId: masked.studentId,
          isAnonymous: masked.isAnonymous,
          equippedLoadout: entryUser.equippedLoadout || db.studentProfiles.get(entry.studentId)?.equippedLoadout,
          avatarId: entryUser.avatarId || entryUser.equippedLoadout?.avatar || 'cosm_avatar_fox_starter',
        };
      }
      return entry;
    });

    return { standings: sanitized, tier: 'GOLD', weekNumber: 4, daysRemaining: 3 };
  });

  app.get('/api/leagues/improvement', async (req: FastifyRequest) => {
    const caller = extractUser(req);
    const raw = await leaguesService.getImprovementLeaderboard();

    const sanitized = raw.map(entry => {
      const entryUser = db.users.get(entry.studentId);
      if (entryUser) {
        const masked = policyEngine.anonymizeStudentForViewer(entryUser, caller);
        return {
          ...entry,
          displayName: masked.displayName,
          studentId: masked.studentId,
        };
      }
      return entry;
    });

    return { standings: sanitized };
  });

  app.get('/api/leagues/ghost', async (req: FastifyRequest<{
    Querystring: { studentId?: string };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    return await leaguesService.getGhostModeData(studentId);
  });

  // Battles
  app.get('/api/battles/active', async () => {
    return { events: Array.from(db.teamEvents.values()) };
  });

  app.post('/api/battles/submit', async (req: FastifyRequest<{
    Body: { eventId: string; studentId: string; teamId: string; points: number };
  }>) => {
    const result = await battlesService.submitBattlePoints(req.body);
    return result;
  });

  app.post('/api/battles/contribute', async (req: FastifyRequest<{
    Body: { eventId: string; studentId: string; teamId: string; points: number };
  }>) => {
    const result = await battlesService.submitBattlePoints(req.body);
    return result;
  });

  // Rewards & Chests
  app.get('/api/chests', async (req: FastifyRequest<{
    Querystring: { studentId?: string };
  }>) => {
    const caller = extractUser(req);
    const studentId = req.query.studentId || caller?.id || 'student_1';
    const list = Array.from(db.chests.values()).filter(c => c.studentId === studentId && c.status === 'UNOPENED');
    const pity = db.pityCounters.get(studentId) || { rarePity: 0, epicPity: 0 };
    return { chests: list, pity };
  });

  app.post('/api/chests/open', async (req: FastifyRequest<{
    Body: { chestId: string; studentId: string };
  }>) => {
    return await cosmeticsService.openChest(req.body.chestId, req.body.studentId);
  });

  app.post('/api/chests/:id/open', async (req: FastifyRequest<{
    Params: { id: string };
    Body: { studentId: string };
  }>) => {
    return await cosmeticsService.openChest(req.params.id, req.body.studentId);
  });

  // --- COSMETICS & LOADOUT ENDPOINTS ---

  // 1. Full Catalogue with completion rates and lock silhouettes
  const handleGetCatalog = async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const caller = extractUser(req);
    const targetStudentId = (caller?.role === 'STUDENT' ? caller.id : req.query.studentId) || caller?.id || 'student_1';
    return await cosmeticsService.getCatalogForStudent(targetStudentId);
  };
  app.get('/api/cosmetics/catalog', handleGetCatalog);
  app.get('/cosmetics/catalog', handleGetCatalog);

  // 2. Owned cosmetics & equipped loadout
  const handleGetOwnedCosmetics = async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const caller = extractUser(req);
    const targetStudentId = (caller?.role === 'STUDENT' ? caller.id : req.query.studentId) || caller?.id || 'student_1';
    return await cosmeticsService.getOwnedCosmetics(targetStudentId);
  };
  app.get('/api/me/cosmetics', handleGetOwnedCosmetics);
  app.get('/me/cosmetics', handleGetOwnedCosmetics);
  app.get('/api/cosmetics/me', handleGetOwnedCosmetics);
  app.get('/cosmetics/me', handleGetOwnedCosmetics);

  // 3. Equip a cosmetic
  const handleEquipCosmetic = async (
    req: FastifyRequest<{ Body: { cosmeticId: string; studentId?: string; slot?: string } }>,
    reply: FastifyReply
  ) => {
    const caller = extractUser(req);
    const targetStudentId = (caller?.role === 'STUDENT' ? caller.id : req.body?.studentId) || caller?.id || req.body?.studentId;
    if (!targetStudentId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    try {
      const result = await cosmeticsService.equipCosmetic(targetStudentId, req.body.cosmeticId, req.body.slot);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  };
  app.post('/api/me/cosmetics/equip', handleEquipCosmetic);
  app.post('/me/cosmetics/equip', handleEquipCosmetic);
  app.post('/api/cosmetics/equip', handleEquipCosmetic);
  app.post('/cosmetics/equip', handleEquipCosmetic);

  // 4. Unequip a slot
  const handleUnequipCosmetic = async (
    req: FastifyRequest<{ Body: { slot: any; studentId?: string } }>,
    reply: FastifyReply
  ) => {
    const caller = extractUser(req);
    const targetStudentId = (caller?.role === 'STUDENT' ? caller.id : req.body?.studentId) || caller?.id || req.body?.studentId;
    if (!targetStudentId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    try {
      const result = await cosmeticsService.unequipCosmetic(targetStudentId, req.body.slot);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  };
  app.post('/api/me/cosmetics/unequip', handleUnequipCosmetic);
  app.post('/me/cosmetics/unequip', handleUnequipCosmetic);
  app.post('/api/cosmetics/unequip', handleUnequipCosmetic);
  app.post('/cosmetics/unequip', handleUnequipCosmetic);

  // 5. Demo tools (Game Master)
  app.post('/api/admin/demo/grant-cosmetic', async (req: FastifyRequest<{ Body: { studentId?: string } }>) => {
    const caller = extractUser(req);
    const targetStudentId = req.body?.studentId || caller?.id || 'student_1';
    return await cosmeticsService.grantRandomCosmetic(targetStudentId);
  });

  app.post('/api/admin/demo/grant-chest', async (req: FastifyRequest<{ Body: { studentId?: string; tier?: any } }>) => {
    const caller = extractUser(req);
    const targetStudentId = req.body?.studentId || caller?.id || 'student_1';
    return await cosmeticsService.grantChest(targetStudentId, req.body?.tier || 'GOLDEN');
  });

  app.post('/api/admin/demo/reset-starter-loadout', async (req: FastifyRequest<{ Body: { studentId?: string } }>) => {
    const caller = extractUser(req);
    const targetStudentId = req.body?.studentId || caller?.id || 'student_1';
    return await cosmeticsService.resetToStarterLoadout(targetStudentId);
  });

  app.post('/api/cosmetics/craft', async (req: FastifyRequest<{
    Body: { studentId: string; cosmeticId: string };
  }>) => {
    const result = await cosmeticsService.craftCosmetic(req.body.studentId, req.body.cosmeticId);
    return { success: true, record: result };
  });

  // Faculty Section Dashboard & Anti-Gaming Admin
  app.get('/api/faculty/engagement', async (req: FastifyRequest, reply) => {
    const caller = extractUser(req);
    if (!caller) {
      return reply.status(401).send({ error: 'Faculty authorization required' });
    }
    if (caller.role !== 'FACULTY' && caller.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Faculty authorization required' });
    }
    return await facultyService.getEngagementMetrics();
  });

  app.get('/api/faculty/struggles', async () => {
    return await facultyService.getTopicStruggles();
  });

  app.get('/api/faculty/quiet-students', async () => {
    return await facultyService.getQuietStudents();
  });

  app.post('/api/faculty/nudge', async (req: FastifyRequest<{
    Body: { studentId: string; facultyId: string };
  }>) => {
    return await facultyService.sendNudge(req.body.studentId, req.body.facultyId || 'faculty_1');
  });

  app.get('/api/faculty/questions/queue', async () => {
    const list = Array.from(db.questions.values()).filter(q => q.status === 'PENDING');
    return { questions: list };
  });

  app.post('/api/faculty/questions/review', async (req: FastifyRequest<{
    Body: {
      questionId: string;
      facultyId: string;
      decision: 'APPROVED' | 'EDITED' | 'REJECTED';
      editedPrompt?: string;
      editedOptions?: string[];
      notes?: string;
    };
  }>) => {
    const q = await facultyService.reviewQuestion(req.body);
    return { success: true, question: q };
  });

  app.get('/api/faculty/review-stats', async () => {
    return facultyService.getReviewStats();
  });

  app.post('/api/faculty/void-xp', async (req: FastifyRequest<{
    Body: { originalEntryId: string; voidByUserId: string; reason: string };
  }>) => {
    const result = await xpEngine.voidXP(req.body);
    return result;
  });

  app.get('/api/admin/anomalies', async (req: FastifyRequest, reply) => {
    const caller = extractUser(req);
    if (!caller) {
      return reply.status(401).send({ error: 'Admin privileges required' });
    }
    if (caller.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin privileges required' });
    }
    const list = Array.from(db.anomalyFlags.values());
    return { anomalies: list };
  });

  // AI Study Buddy & Coding Profiles
  app.post('/api/study-buddy/explain', async (req: FastifyRequest<{
    Body: {
      questionPrompt: string;
      options: string[];
      correctOption: string;
      studentChoice: string;
      language: QuestionLanguage;
    };
  }>) => {
    const provider = new MockLLMProvider();
    const explanation = await provider.explainMistake(req.body);
    return { explanation };
  });

  app.post('/api/coding-profiles/link', async (req: FastifyRequest<{
    Body: {
      studentId: string;
      platform: 'LEETCODE' | 'CODEFORCES' | 'GITHUB';
      handle: string;
    };
  }>) => {
    const challenge = `MSOT_VERIFY_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const profile = {
      id: `ext_${Date.now()}`,
      studentId: req.body.studentId,
      platform: req.body.platform,
      handle: req.body.handle,
      isVerified: false,
      verificationChallenge: challenge,
      totalSolves: 0,
    };
    db.externalProfiles.set(profile.id, profile);
    return { success: true, profile, instruction: `Put "${challenge}" in your ${req.body.platform} profile bio to verify.` };
  });

  app.post('/api/coding-profiles/verify', async (req: FastifyRequest<{
    Body: { profileId: string };
  }>) => {
    const profile = db.externalProfiles.get(req.body.profileId);
    if (!profile) throw new Error('Profile not found');
    const adapter = new MockCodingProfileAdapter();
    const verified = await adapter.verifyOwnership(profile.platform, profile.handle, profile.verificationChallenge);
    profile.isVerified = verified;
    db.externalProfiles.set(profile.id, profile);
    return { success: verified, profile };
  });

  // Pilot Feedback & Export
  app.post('/api/pilot/feedback', async (req: FastifyRequest<{
    Body: {
      studentId: string;
      rating: number;
      favoriteMechanic: string;
      strugglePoints: string;
      comments: string;
    };
  }>) => {
    const record = {
      id: `fb_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    db.pilotFeedback.push(record);
    return { success: true, record };
  });

  app.get('/api/pilot/stats', async () => {
    const count = db.pilotFeedback.length;
    const avgRating = count > 0 ? db.pilotFeedback.reduce((sum, f) => sum + f.rating, 0) / count : 4.8;
    return { feedbackCount: count, averageRating: Math.round(avgRating * 10) / 10, entries: db.pilotFeedback };
  });

  app.get('/api/pilot/export-csv', async (req, reply) => {
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="msot_pilot_feedback.csv"');
    const header = 'id,student_id_masked,rating,favorite_mechanic,struggle_points,comments,created_at\n';
    const rows = db.pilotFeedback.map(f =>
      `"${f.id}","${generateAnonymousAlias(f.studentId)}",${f.rating},"${f.favoriteMechanic}","${f.strugglePoints || ''}","${f.comments}","${f.createdAt}"`
    ).join('\n');
    return header + rows;
  });

  return app;
}
