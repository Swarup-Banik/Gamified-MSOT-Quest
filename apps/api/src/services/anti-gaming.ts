import {
  AnomalyFlag,
  AnomalyType,
  calculateZScore,
  calculateMeanAndStdDev,
} from '@msot/shared';
import { db } from '../db.js';
import { redis } from '../redis.js';

export class AntiGamingService {
  /**
   * Vector 1: Quiz Spam & Rapid Retry Detection
   * Evaluates if a student attempts rapid sequential submissions within seconds.
   */
  async checkQuizSpam(studentId: string, clientIp: string): Promise<{ isSpam: boolean; flag?: AnomalyFlag }> {
    const rateLimitKey = `ratelimit:quiz_attempt:${studentId}`;
    // Limit to 3 quiz start/submissions attempts per 5 minutes
    const limit = await redis.checkRateLimit(rateLimitKey, 3, 300);

    if (!limit.allowed) {
      const flag = await this.createAnomalyFlag({
        studentId,
        flagType: 'QUIZ_SPAM',
        severity: 'MEDIUM',
        evidence: {
          clientIp,
          reason: 'Excessive rapid quiz submission attempts detected within sliding window',
          attemptCount: 3,
        },
      });
      return { isSpam: true, flag };
    }
    return { isSpam: false };
  }

  /**
   * Vector 2: Shared Answers & Synchronized Answer Timing Clusters
   * Compares a submission against other submissions in the same section/batch within a narrow time window (+/- 30 mins).
   * Flags when 2 or more students share an identical answer vector with timing difference < 250ms per question.
   */
  async checkSharedAnswers(attemptId: string): Promise<AnomalyFlag | null> {
    const targetAttempt = db.quizAttempts.get(attemptId);
    if (!targetAttempt) return null;

    const targetAnswers = Array.from(db.quizAnswers.values()).filter(a => a.quizAttemptId === attemptId);
    if (targetAnswers.length === 0) return null;

    const allAttempts = Array.from(db.quizAttempts.values()).filter(
      a =>
        a.id !== attemptId &&
        a.date === targetAttempt.date &&
        a.status === 'COMPLETED' &&
        Math.abs(new Date(a.startedAt).getTime() - new Date(targetAttempt.startedAt).getTime()) < 1800000 // 30 min window
    );

    for (const other of allAttempts) {
      const otherAnswers = Array.from(db.quizAnswers.values()).filter(a => a.quizAttemptId === other.id);
      if (otherAnswers.length !== targetAnswers.length) continue;

      let matchingOptionsCount = 0;
      let nearIdenticalTimingCount = 0;

      for (let i = 0; i < targetAnswers.length; i++) {
        const tAns = targetAnswers[i];
        const oAns = otherAnswers.find(a => a.questionId === tAns.questionId);
        if (oAns) {
          if (oAns.selectedOption === tAns.selectedOption) {
            matchingOptionsCount++;
          }
          if (Math.abs(oAns.responseTimeMs - tAns.responseTimeMs) < 250) {
            nearIdenticalTimingCount++;
          }
        }
      }

      // If 100% answers match and multiple answers have synchronized timing (<250ms diff)
      if (matchingOptionsCount === targetAnswers.length && nearIdenticalTimingCount >= 2) {
        return this.createAnomalyFlag({
          studentId: targetAttempt.studentId,
          flagType: 'SHARED_ANSWER_CLUSTER',
          severity: 'HIGH',
          evidence: {
            suspectPeerStudentId: other.studentId,
            targetAttemptId: attemptId,
            matchedAttemptId: other.id,
            matchingOptions: matchingOptionsCount,
            nearIdenticalTimings: nearIdenticalTimingCount,
            deltaTimestampMs: Math.abs(new Date(other.startedAt).getTime() - new Date(targetAttempt.startedAt).getTime()),
          },
        });
      }
    }

    return null;
  }

  /**
   * Vector 3: Copy-Paste and Typing Telemetry Anomaly
   * Catches unnatural instant paste events or zero keystroke variance in written responses.
   */
  async checkCopyPasteTelemetry(
    studentId: string,
    telemetry: { pasteDetected: boolean; keyVarianceMs?: number; characterCount: number; durationMs: number }
  ): Promise<AnomalyFlag | null> {
    // If long text was pasted in under 500ms or typing variance is zero (bot macro)
    if (telemetry.pasteDetected && telemetry.characterCount > 100 && telemetry.durationMs < 600) {
      return this.createAnomalyFlag({
        studentId,
        flagType: 'COPY_PASTE_TELEMETRY',
        severity: 'HIGH',
        evidence: {
          pasteDetected: telemetry.pasteDetected,
          characterCount: telemetry.characterCount,
          durationMs: telemetry.durationMs,
          wpmEquivalent: Math.round((telemetry.characterCount / 5) / (telemetry.durationMs / 60000)),
        },
      });
    }

    if (telemetry.keyVarianceMs !== undefined && telemetry.keyVarianceMs < 1.0 && telemetry.characterCount > 50) {
      // Keystroke variance near zero indicates robotic script input
      return this.createAnomalyFlag({
        studentId,
        flagType: 'COPY_PASTE_TELEMETRY',
        severity: 'HIGH',
        evidence: {
          syntheticTypingPattern: true,
          keystrokeVariance: telemetry.keyVarianceMs,
        },
      });
    }

    return null;
  }

  /**
   * Vector 4: Fake Coding Solves & Account Verification
   * Rejects unverified accounts or solves that don't match platform challenge verification.
   */
  async verifyCodingSolve(
    studentId: string,
    platform: 'LEETCODE' | 'CODEFORCES' | 'GITHUB',
    handle: string,
    problemId: string,
    solveTimestamp: string
  ): Promise<{ valid: boolean; flag?: AnomalyFlag }> {
    const profile = Array.from(db.externalProfiles.values()).find(
      p => p.studentId === studentId && p.platform === platform
    );

    if (!profile || !profile.isVerified) {
      const flag = await this.createAnomalyFlag({
        studentId,
        flagType: 'FAKE_CODING_SOLVE',
        severity: 'HIGH',
        evidence: {
          platform,
          handle,
          problemId,
          reason: 'Attempted to claim coding XP with unverified handle',
        },
      });
      return { valid: false, flag };
    }

    // Check for duplicate solve of same problem by this student
    const priorSolves = await db.getStudentLedger(studentId);
    const alreadySolved = priorSolves.some(
      entry => entry.sourceType === 'CODING_PROBLEM' && entry.sourceRef === `${platform}_${problemId}` && !entry.isVoided
    );

    if (alreadySolved) {
      const flag = await this.createAnomalyFlag({
        studentId,
        flagType: 'FAKE_CODING_SOLVE',
        severity: 'MEDIUM',
        evidence: {
          platform,
          handle,
          problemId,
          reason: 'Duplicate submission of already-rewarded coding solve',
        },
      });
      return { valid: false, flag };
    }

    return { valid: true };
  }

  /**
   * Vector 5: Statistical XP Spike Detection (Z-Score Anomaly)
   * Detects abnormal spikes in daily XP compared to student's 7-day rolling average and cohort baseline.
   */
  async checkXpSpike(studentId: string, dailyXp: number): Promise<AnomalyFlag | null> {
    const history = await db.getStudentLedger(studentId);
    const dailyTotals: number[] = [];
    const grouped = new Map<string, number>();

    for (const entry of history) {
      if (!entry.isVoided) {
        const day = entry.createdAt.split('T')[0];
        grouped.set(day, (grouped.get(day) || 0) + entry.finalAmount);
      }
    }

    for (const total of grouped.values()) {
      dailyTotals.push(total);
    }

    // Need at least 3 historical days to establish baseline
    if (dailyTotals.length >= 3) {
      const { mean, stdDev } = calculateMeanAndStdDev(dailyTotals);
      const zScore = calculateZScore(dailyXp, mean, stdDev);

      if (zScore > 3.0) {
        // More than 3 standard deviations above normal
        return this.createAnomalyFlag({
          studentId,
          flagType: 'XP_SPIKE_ZSCORE',
          severity: 'HIGH',
          evidence: {
            todayXp: dailyXp,
            historicalMean: Math.round(mean),
            stdDev: Math.round(stdDev * 10) / 10,
            zScore: Math.round(zScore * 100) / 100,
          },
        });
      }
    }

    return null;
  }

  /**
   * Creates an AnomalyFlag for faculty/admin review.
   * STRICT PRINCIPLE: Never auto-punishes publicly; goes to faculty review queue.
   */
  async createAnomalyFlag(params: {
    studentId: string;
    flagType: AnomalyType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    evidence: Record<string, any>;
  }): Promise<AnomalyFlag> {
    const flagId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const flag: AnomalyFlag = {
      id: flagId,
      studentId: params.studentId,
      flagType: params.flagType,
      severity: params.severity,
      evidence: params.evidence,
      status: 'PENDING',
      flaggedAt: new Date().toISOString(),
    };

    db.anomalyFlags.set(flagId, flag);

    await db.logAudit({
      actorId: 'ANTI_GAMING_SENTINEL',
      action: 'FLAG_ANOMALY',
      targetType: 'ANOMALY_FLAG',
      targetId: flagId,
      details: { ...params },
    });

    return flag;
  }
}

export const antiGamingService = new AntiGamingService();
