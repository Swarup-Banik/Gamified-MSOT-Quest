import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import {
  generateAnonymousAlias,
  MockLLMProvider,
  MockSSOAdapter,
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

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(fastifyWebsocket);

  // Initialize DB data and rules
  await xpEngine.initializeDefaultRules();
  await cosmeticsService.initializeDefaultCosmetics();
  await battlesService.initializeDefaultEvents();

  // ----------------------------------------------------------------
  // Realtime WebSockets for Live Scoreboards (< 2.0s push latency)
  // ----------------------------------------------------------------
  app.register(async function (fastify) {
    fastify.get('/ws/live', { websocket: true }, (connection: any, req: FastifyRequest) => {
      const socket = connection.socket || connection;
      const sendJson = (payload: any) => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify(payload));
        }
      };

      sendJson({ type: 'CONNECTED', message: 'MSOT Quest Realtime Socket Connected' });

      // Subscribe to battle scoreboards & XP events
      const unsubscribeBattle = redis.subscribe('scoreboard:event:event_battle_1', msg => {
        sendJson({ type: 'BATTLE_UPDATE', data: JSON.parse(msg) });
      });
      const unsubscribeXp = redis.subscribe('xp:awarded', msg => {
        sendJson({ type: 'XP_BROADCAST', data: JSON.parse(msg) });
      });

      socket.on('close', async () => {
        (await unsubscribeBattle)();
        (await unsubscribeXp)();
      });
    });
  });

  // ----------------------------------------------------------------
  // Authentication & SSO
  // ----------------------------------------------------------------
  app.post('/api/auth/login', async (req: FastifyRequest<{ Body: { email: string; role?: string } }>, reply) => {
    const { email } = req.body || {};
    let user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      // Default fallback demo user
      const role = (req.body?.role as any) || (email?.includes('faculty') ? 'FACULTY' : email?.includes('admin') ? 'ADMIN' : 'STUDENT');
      const id = `usr_${Date.now()}`;
      user = {
        id,
        email: email || 'student@msot.edu.in',
        role,
        name: role === 'FACULTY' ? 'Prof. Sarah Jenkins' : role === 'ADMIN' ? 'Dean Arthur Vance' : 'Aarav Sharma',
        avatarId: 'avatar_1',
        anonymousAlias: generateAnonymousAlias(id),
        isAnonymous: false,
        campusId: 'campus_1',
        batchId: 'batch_2025',
        sectionId: 'sec_a',
        createdAt: new Date().toISOString(),
      };
      db.users.set(id, user);
    }

    let profile = await db.getStudentProfile(user.id);
    if (!profile && user.role === 'STUDENT') {
      profile = await xpEngine.recalculateProfile(user.id);
    }

    return { token: `token_${user.id}`, user, profile };
  });

  app.post('/api/auth/sso', async (req: FastifyRequest<{ Body: { ssoToken: string } }>, reply) => {
    const ssoAdapter = new MockSSOAdapter();
    const claims = await ssoAdapter.verifyToken(req.body.ssoToken);
    if (!claims) return reply.status(401).send({ error: 'Invalid SSO credentials' });
    return { success: true, claims };
  });

  app.get('/api/auth/me', async (req: FastifyRequest<{ Querystring: { userId?: string } }>, reply) => {
    const userId = req.query.userId || 'student_1';
    const user = db.users.get(userId) || Array.from(db.users.values())[0];
    if (!user) return reply.status(404).send({ error: 'User not found' });
    const profile = await db.getStudentProfile(user.id);
    return { user, profile };
  });

  // ----------------------------------------------------------------
  // Student Profile & XP Ledger
  // ----------------------------------------------------------------
  app.get('/api/student/profile', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    let profile = await db.getStudentProfile(studentId);
    if (!profile) {
      profile = await xpEngine.recalculateProfile(studentId);
    }
    const user = db.users.get(studentId);
    return { profile, user };
  });

  app.get('/api/student/xp-history', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const history = await db.getStudentLedger(studentId);
    return { history };
  });

  app.patch('/api/student/preferences', async (req: FastifyRequest<{ Body: { studentId: string; isAnonymous: boolean } }>) => {
    const { studentId, isAnonymous } = req.body;
    const user = db.users.get(studentId);
    if (!user) throw new Error('Student not found');
    user.isAnonymous = isAnonymous;
    db.users.set(studentId, user);
    return { success: true, user };
  });

  // ----------------------------------------------------------------
  // XP Rules Engine (Admin Configurable)
  // ----------------------------------------------------------------
  app.get('/api/admin/xp-rules', async () => {
    return { rules: Array.from(db.xpRules.values()), versions: db.xpRuleVersions };
  });

  app.post('/api/admin/xp-rules/:id', async (req: FastifyRequest<{
    Params: { id: string };
    Body: { updates: any; reason: string; changedByUserId: string };
  }>) => {
    const updated = await xpEngine.updateRule(
      req.params.id,
      req.body.updates,
      req.body.changedByUserId || 'admin_1',
      req.body.reason || 'Admin policy calibration'
    );
    return { success: true, rule: updated };
  });

  // ----------------------------------------------------------------
  // Daily Habit Loop (Today's Run) & Quizzes
  // ----------------------------------------------------------------
  app.get('/api/quiz/today', async (req: FastifyRequest<{ Querystring: { studentId?: string; language?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const language = (req.query.language as QuestionLanguage) || 'EN';

    // Pick 3-5 syllabus questions for active weekly topics
    const activeQuestions = Array.from(db.questions.values()).filter(
      q => q.status === 'APPROVED' && q.language === language
    );

    // Return 3 tailored questions
    const selected = activeQuestions.slice(0, 3);
    const sanitized = selected.map(q => ({
      id: q.id,
      topicId: q.topicId,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
      language: q.language,
    }));

    // Check if student already finished today's run
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
      clientSubmissionToken: string;
      date?: string;
    };
  }>, reply) => {
    try {
      const clientIp = req.ip || '127.0.0.1';
      // Anti-gaming check 1: Rapid spam rate limit
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

      // Anti-gaming check 2: Check for cluster similarity
      await antiGamingService.checkSharedAnswers(result.attempt.id);

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

  // ----------------------------------------------------------------
  // Mistake Monsters & Codex
  // ----------------------------------------------------------------
  app.get('/api/monsters/active', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
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

      // Register into Codex
      let codex = Array.from(db.monsterCodex.values()).find(
        c => c.studentId === req.body.studentId && c.speciesId === monster.speciesId
      );
      if (!codex) {
        codex = {
          id: `codex_${Date.now()}`,
          studentId: req.body.studentId,
          speciesId: monster.speciesId,
          defeatCount: 1,
          firstDefeatedAt: new Date().toISOString(),
        };
        db.monsterCodex.set(codex.id, codex);
      } else {
        codex.defeatCount++;
      }

      // Award XP
      const xpResult = await xpEngine.awardXP({
        studentId: req.body.studentId,
        actionType: 'DEFEAT_MISTAKE_MONSTER',
        sourceType: 'MONSTER_REVENGE',
        sourceRef: monster.id,
        reason: 'Defeated Mistake Monster in spaced repetition revenge round!',
      });

      return { defeated: true, xpEarned: xpResult.ledgerEntry.finalAmount, codexEntry: codex };
    }

    return { defeated: false, message: 'The monster evaded your attack! Review the concept and try again.' };
  });

  app.get('/api/monsters/codex', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
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

  // ----------------------------------------------------------------
  // Leagues & Social Dynamics
  // ----------------------------------------------------------------
  app.get('/api/leagues/weekly', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const standings = await leaguesService.getWeeklyLeague(studentId);
    return { standings, tier: 'GOLD', weekNumber: 4, daysRemaining: 3 };
  });

  app.get('/api/leagues/improvement', async () => {
    const standings = await leaguesService.getImprovementLeaderboard();
    return { standings };
  });

  app.get('/api/leagues/ghost', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const data = await leaguesService.getGhostModeData(studentId);
    return data;
  });

  // ----------------------------------------------------------------
  // Team Battles & Raid Boss
  // ----------------------------------------------------------------
  app.get('/api/battles/active', async () => {
    return { events: Array.from(db.teamEvents.values()) };
  });

  app.post('/api/battles/submit', async (req: FastifyRequest<{
    Body: { eventId: string; studentId: string; teamId: string; points: number };
  }>) => {
    const result = await battlesService.submitBattlePoints(req.body);
    return result;
  });

  // ----------------------------------------------------------------
  // Cosmetics & Mystery Chests
  // ----------------------------------------------------------------
  app.get('/api/cosmetics/catalog', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const all = Array.from(db.cosmetics.values());
    const ownedIds = new Set(
      db.userCosmetics.filter(uc => uc.studentId === studentId).map(uc => uc.cosmeticId)
    );
    const catalog = all.map(c => ({ ...c, isOwned: ownedIds.has(c.id) }));
    return { catalog };
  });

  app.get('/api/chests', async (req: FastifyRequest<{ Querystring: { studentId?: string } }>) => {
    const studentId = req.query.studentId || 'student_1';
    const list = Array.from(db.chests.values()).filter(c => c.studentId === studentId && c.status === 'UNOPENED');
    const pity = db.pityCounters.get(studentId) || { rarePity: 0, epicPity: 0 };
    return { chests: list, pity };
  });

  app.post('/api/chests/:id/open', async (req: FastifyRequest<{
    Params: { id: string };
    Body: { studentId: string };
  }>) => {
    const result = await cosmeticsService.openChest(req.params.id, req.body.studentId);
    return result;
  });

  app.post('/api/cosmetics/craft', async (req: FastifyRequest<{
    Body: { studentId: string; cosmeticId: string };
  }>) => {
    const result = await cosmeticsService.craftCosmetic(req.body.studentId, req.body.cosmeticId);
    return { success: true, record: result };
  });

  // ----------------------------------------------------------------
  // Faculty Dashboard & Anti-Gaming Admin
  // ----------------------------------------------------------------
  app.get('/api/faculty/engagement', async () => {
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

  app.get('/api/admin/anomalies', async () => {
    const list = Array.from(db.anomalyFlags.values());
    return { anomalies: list };
  });

  // ----------------------------------------------------------------
  // AI Study Buddy & External Profiles
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Pilot Analytics & Feedback
  // ----------------------------------------------------------------
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
