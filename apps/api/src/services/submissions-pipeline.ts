import {
  QuizAttempt,
  QuizAnswer,
  MistakeMonster,
  Chest,
  ChestTier,
  StudentProfile,
} from '@msot/shared';
import { db } from '../db.js';
import { xpEngine } from './xp-engine.js';
import { redis } from '../redis.js';

export interface SubmitQuizAnswerPayload {
  questionId: string;
  selectedOption: number;
  responseTimeMs: number;
  pasteDetected?: boolean;
  typingTelemetry?: {
    keyIntervalMeanMs?: number;
    keyIntervalVarianceMs?: number;
    backspaceCount?: number;
  };
}

export interface SubmitQuizPayload {
  studentId: string;
  date: string;
  answers: SubmitQuizAnswerPayload[];
  clientSubmissionToken: string;
}

export class SubmissionsPipeline {
  /**
   * Processes a student's daily quiz submission.
   * Persists attempt and answers BEFORE acknowledging to guarantee zero loss.
   */
  async submitDailyQuiz(payload: SubmitQuizPayload): Promise<{
    attempt: QuizAttempt;
    score: number;
    maxScore: number;
    xpEarned: number;
    streak: number;
    chestAwarded?: Chest;
    monstersSpawned: MistakeMonster[];
    profile: StudentProfile;
  }> {
    const today = payload.date || new Date().toISOString().split('T')[0];
    const idempotencyKey = `quiz:${payload.studentId}:${today}:${payload.clientSubmissionToken}`;

    // 1. Anti-Gaming Check #1: Enforce 1 scored daily attempt
    for (const pastAttempt of db.quizAttempts.values()) {
      if (
        pastAttempt.studentId === payload.studentId &&
        pastAttempt.date === today &&
        pastAttempt.status === 'COMPLETED'
      ) {
        throw new Error('Daily quiz has already been completed for today. Only one scored attempt allowed per day.');
      }
    }

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const attempt: QuizAttempt = {
      id: attemptId,
      studentId: payload.studentId,
      date: today,
      status: 'STARTED',
      score: 0,
      maxScore: payload.answers.length,
      startedAt: new Date(Date.now() - 120000).toISOString(),
      idempotencyKey,
    };

    // PERSIST BEFORE ACKNOWLEDGE
    db.quizAttempts.set(attemptId, attempt);

    // 2. Score questions and record detailed telemetry
    let score = 0;
    const evaluatedAnswers: QuizAnswer[] = [];
    const monstersSpawned: MistakeMonster[] = [];

    for (const ans of payload.answers) {
      const question = db.questions.get(ans.questionId);
      const isCorrect = question ? question.correctOptionIndex === ans.selectedOption : false;
      if (isCorrect) score++;

      const answerId = `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const quizAnswer: QuizAnswer = {
        id: answerId,
        quizAttemptId: attemptId,
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
        responseTimeMs: ans.responseTimeMs,
        pasteDetected: ans.pasteDetected || false,
        typingTelemetry: ans.typingTelemetry,
      };

      db.quizAnswers.set(answerId, quizAnswer);
      evaluatedAnswers.push(quizAnswer);

      // Handle wrong answer -> Mistake Monster spawn
      if (!isCorrect && question) {
        const monster = await this.spawnOrEscalateMistakeMonster(payload.studentId, question.id, question.topicId);
        if (monster) {
          monstersSpawned.push(monster);
        }
      }
    }

    // Mark attempt completed
    attempt.score = score;
    attempt.status = 'COMPLETED';
    attempt.completedAt = new Date().toISOString();
    db.quizAttempts.set(attemptId, attempt);

    // 3. Award XP via XP Engine
    // 15 Base XP for completion
    const completionResult = await xpEngine.awardXP({
      studentId: payload.studentId,
      actionType: 'DAILY_QUIZ_COMPLETED',
      sourceType: 'QUIZ_ATTEMPT',
      sourceRef: attemptId,
      reason: `Completed daily quiz on ${today}`,
      eventTimestamp: attempt.completedAt,
    });

    // 5 XP per correct answer
    let correctBonusTotal = 0;
    if (score > 0) {
      const correctResult = await xpEngine.awardXP({
        studentId: payload.studentId,
        actionType: 'QUIZ_CORRECT_ANSWER',
        sourceType: 'QUIZ_ATTEMPT_SCORE',
        sourceRef: attemptId,
        customAmount: score * 5,
        reason: `${score} correct answers in daily quiz`,
        eventTimestamp: attempt.completedAt,
      });
      correctBonusTotal = correctResult.ledgerEntry.finalAmount;
    }

    const totalXpEarned = completionResult.ledgerEntry.finalAmount + correctBonusTotal;

    // 4. Update Streaks & Freezes
    const profile = await this.updateStudentStreak(payload.studentId, today);

    // Check for 7-day streak milestone bonus
    if (profile.currentStreak > 0 && profile.currentStreak % 7 === 0) {
      await xpEngine.awardXP({
        studentId: payload.studentId,
        actionType: 'SEVEN_DAY_STREAK',
        sourceType: 'STREAK_MILESTONE',
        sourceRef: `streak_${profile.currentStreak}`,
        reason: `Reached magnificent ${profile.currentStreak}-day learning streak!`,
        eventTimestamp: attempt.completedAt,
      });
    }

    // 5. Award Mystery Chest (learning-gated)
    const isPerfect = score === payload.answers.length && payload.answers.length > 0;
    const chestTier: ChestTier = isPerfect ? 'GOLDEN' : 'SILVER';
    const chest = await this.awardMysteryChest(payload.studentId, chestTier, `Completed daily quiz (${score}/${payload.answers.length})`);

    const finalProfile = await xpEngine.recalculateProfile(payload.studentId);

    return {
      attempt,
      score,
      maxScore: payload.answers.length,
      xpEarned: totalXpEarned,
      streak: finalProfile.currentStreak,
      chestAwarded: chest,
      monstersSpawned,
      profile: finalProfile,
    };
  }

  /**
   * Spawns a Mistake Monster tied to syllabus topic.
   * Respects guardrail: Maximum 5 active monsters at a time.
   */
  private async spawnOrEscalateMistakeMonster(
    studentId: string,
    questionId: string,
    topicId: string
  ): Promise<MistakeMonster | null> {
    // Count active monsters for student
    const activeMonsters = Array.from(db.mistakeMonsters.values()).filter(
      m => m.studentId === studentId && m.status === 'ACTIVE'
    );

    if (activeMonsters.length >= 5) {
      // Guardrail: max 5 active at a time to prevent demotivation
      return null;
    }

    // Find species for this topic
    let species = Array.from(db.monsterSpecies.values()).find(s => s.topicId === topicId);
    if (!species) {
      const topic = db.topics.get(topicId);
      species = {
        id: `spec_${topicId}`,
        topicId,
        name: topic ? `${topic.title.split(' ')[0]} Gremlin` : 'Memory Glitch',
        title: 'Curriculum Phantom',
        rarity: 'COMMON',
        imageUrl: '/monsters/common-glitch.svg',
        lore: `Manifested from a conceptual gap in ${topic?.title || 'syllabus'}.`,
      };
      db.monsterSpecies.set(species.id, species);
    }

    // Check if monster already active for this question
    let monster = Array.from(db.mistakeMonsters.values()).find(
      m => m.studentId === studentId && m.questionId === questionId && m.status === 'ACTIVE'
    );

    if (monster) {
      monster.wrongCount++;
      if (monster.wrongCount >= 3) {
        species.rarity = 'ELITE';
      }
      return monster;
    }

    // Create new monster with first revenge round in 1 day
    const nextRevenge = new Date();
    nextRevenge.setDate(nextRevenge.getDate() + 1);

    const monsterId = `mon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    monster = {
      id: monsterId,
      studentId,
      speciesId: species.id,
      questionId,
      wrongCount: 1,
      status: 'ACTIVE',
      nextRevengeAt: nextRevenge.toISOString(),
    };

    db.mistakeMonsters.set(monsterId, monster);
    return monster;
  }

  /**
   * Updates student streak counter safely and cleanly
   */
  private async updateStudentStreak(studentId: string, today: string): Promise<StudentProfile> {
    const profile = await xpEngine.recalculateProfile(studentId);

    if (profile.lastActiveDate === today) {
      return profile; // Already counted today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (profile.lastActiveDate === yesterdayStr) {
      // Continuous streak
      profile.currentStreak += 1;
    } else if (!profile.lastActiveDate) {
      // First day
      profile.currentStreak = 1;
    } else {
      // Missed day -> Check if freeze available
      if (profile.freezeCount > 0) {
        profile.freezeCount -= 1;
        profile.currentStreak += 1; // Preserved by freeze
      } else {
        // Broken streak -> Reset to 1 for today
        profile.currentStreak = 1;
      }
    }

    if (profile.currentStreak > profile.maxStreak) {
      profile.maxStreak = profile.currentStreak;
    }

    profile.lastActiveDate = today;
    await db.saveStudentProfile(profile);
    return profile;
  }

  /**
   * Awards learning-gated mystery chest
   */
  async awardMysteryChest(studentId: string, tier: ChestTier, source: string): Promise<Chest> {
    const chestId = `chest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chest: Chest = {
      id: chestId,
      studentId,
      tier,
      source,
      status: 'UNOPENED',
    };
    db.chests.set(chestId, chest);
    return chest;
  }
}

export const submissionsPipeline = new SubmissionsPipeline();
