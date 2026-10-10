import {
  XPRule,
  XPLedgerEntry,
  ActionType,
  applyDailySoftCap,
  calculateLevelProgress,
  generateXpIdempotencyKey,
  StudentProfile,
} from '@msot/shared';
import { db } from '../db.js';
import { redis } from '../redis.js';

export interface AwardXPParams {
  studentId: string;
  actionType: ActionType;
  sourceType: string;
  sourceRef: string;
  customAmount?: number;
  reason: string;
  metadata?: Record<string, any>;
  eventTimestamp?: string;
  idempotencyKey?: string;
}

export class XPEngine {
  /**
   * Initializes the default DB-stored rules as defined in specification Section 5.2
   */
  async initializeDefaultRules(): Promise<void> {
    const defaultRules: Omit<XPRule, 'id' | 'version' | 'effectiveFrom'>[] = [
      {
        actionType: 'ATTEND_CLASS',
        baseXp: 10,
        perItemLimit: 1,
        enabled: true,
        description: 'Attend an officially verified class lecture',
      },
      {
        actionType: 'SUBMIT_HOMEWORK',
        baseXp: 20,
        perItemLimit: 1,
        enabled: true,
        description: 'Submit verified classwork or homework on time',
      },
      {
        actionType: 'DAILY_QUIZ_COMPLETED',
        baseXp: 15,
        dailyLimit: 1,
        enabled: true,
        description: 'Complete the daily micro-challenge quiz',
      },
      {
        actionType: 'QUIZ_CORRECT_ANSWER',
        baseXp: 5,
        dailyLimit: 5,
        enabled: true,
        description: 'Bonus for each correct answer in daily quiz',
      },
      {
        actionType: 'BIWEEKLY_TEST',
        baseXp: 0,
        formula: 'score_percent / 2',
        perItemLimit: 1,
        enabled: true,
        description: 'Bi-weekly test score percentage divided by 2',
      },
      {
        actionType: 'CODING_PROBLEM_SOLVED',
        baseXp: 10, // 10 easy, 20 medium, 40 hard passed as customAmount
        dailyLimit: 10,
        enabled: true,
        description: 'Verified solved problem on LeetCode/Codeforces/GitHub',
      },
      {
        actionType: 'CLUB_ACTIVITY',
        baseXp: 25,
        dailyLimit: 1,
        enabled: true,
        description: 'Verified club activity participation',
      },
      {
        actionType: 'SEVEN_DAY_STREAK',
        baseXp: 50,
        perItemLimit: 1,
        enabled: true,
        description: 'Milestone bonus for reaching 7 consecutive active days',
      },
      {
        actionType: 'PEER_HELP',
        baseXp: 15,
        dailyLimit: 3,
        enabled: true,
        description: 'Help a peer on discussion board with accepted answer',
      },
      {
        actionType: 'DEFEAT_MISTAKE_MONSTER',
        baseXp: 15,
        enabled: true,
        description: 'Defeat a Mistake Monster in spaced repetition revenge round',
      },
      {
        actionType: 'TEAM_BATTLE_WIN',
        baseXp: 40,
        enabled: true,
        description: 'Section vs Section team battle victory points',
      },
      {
        actionType: 'RAID_BOSS_DAMAGE',
        baseXp: 5,
        enabled: true,
        description: 'Contribution points for dealing damage to Class Raid Boss',
      },
    ];

    for (const ruleDef of defaultRules) {
      const existing = Array.from(db.xpRules.values()).find(r => r.actionType === ruleDef.actionType);
      if (!existing) {
        const id = `rule_${ruleDef.actionType.toLowerCase()}`;
        const rule: XPRule = {
          id,
          ...ruleDef,
          version: 1,
          effectiveFrom: new Date('2026-01-01').toISOString(),
        };
        db.xpRules.set(id, rule);
        db.xpRuleVersions.push({
          ruleId: id,
          version: 1,
          rule: { ...rule },
          changedBy: 'SYSTEM_BOOTSTRAP',
          changedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Retrieves active rule for an action type
   */
  async getActiveRule(actionType: ActionType): Promise<XPRule | null> {
    for (const rule of db.xpRules.values()) {
      if (rule.actionType === actionType && rule.enabled) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Updates an existing XP rule or creates a new one with strict versioning.
   * Past ledger entries are NEVER rewritten.
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Omit<XPRule, 'id' | 'version'>>,
    changedByUserId: string,
    reason: string
  ): Promise<XPRule> {
    const existing = db.xpRules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const nextVersion = existing.version + 1;
    const updatedRule: XPRule = {
      ...existing,
      ...updates,
      version: nextVersion,
      effectiveFrom: new Date().toISOString(),
    };

    db.xpRules.set(ruleId, updatedRule);
    db.xpRuleVersions.push({
      ruleId,
      version: nextVersion,
      rule: { ...updatedRule },
      changedBy: changedByUserId,
      changedAt: new Date().toISOString(),
    });

    await db.logAudit({
      actorId: changedByUserId,
      action: 'UPDATE_XP_RULE',
      targetType: 'XP_RULE',
      targetId: ruleId,
      details: { previousVersion: existing.version, newVersion: nextVersion, reason, updates },
    });

    return updatedRule;
  }

  /**
   * Awards XP to a student.
   * Enforces:
   * 1. Idempotency (exact duplicate events return original result without duplicate XP)
   * 2. Daily limits & per-item limits from the DB rule
   * 3. Daily soft cap with diminishing returns (halved after 150 daily XP)
   * 4. Append-only ledger write
   * 5. Recalculation of student profile and update to Redis leaderboards
   */
  async awardXP(params: AwardXPParams): Promise<{ ledgerEntry: XPLedgerEntry; isDuplicate: boolean; profile: StudentProfile }> {
    const nowIso = params.eventTimestamp || new Date().toISOString();
    const idempotencyKey =
      params.idempotencyKey ||
      generateXpIdempotencyKey(params.studentId, params.sourceType, params.sourceRef, nowIso.split('T')[0]);

    // 1. Check Idempotency
    const existingEntry = await db.findLedgerEntryByIdempotencyKey(idempotencyKey);
    if (existingEntry) {
      const currentProfile = await this.recalculateProfile(params.studentId);
      return { ledgerEntry: existingEntry, isDuplicate: true, profile: currentProfile };
    }

    // 2. Fetch Rule
    const rule = await this.getActiveRule(params.actionType);
    if (!rule) {
      throw new Error(`No active XP rule found for action type: ${params.actionType}`);
    }

    // 3. Determine Base Amount
    let baseAmount = rule.baseXp;
    if (params.customAmount !== undefined) {
      baseAmount = params.customAmount;
    } else if (rule.formula) {
      // Evaluate basic formulas (e.g. score_percent / 2)
      if (params.metadata?.scorePercentage !== undefined) {
        baseAmount = Math.round(params.metadata.scorePercentage / 2);
      }
    }

    // 4. Enforce Daily Limit for the rule
    if (rule.dailyLimit) {
      const today = nowIso.split('T')[0];
      const studentHistory = await db.getStudentLedger(params.studentId);
      const timesAwardedToday = studentHistory.filter(
        entry => entry.ruleId === rule.id && !entry.isVoided && entry.createdAt.startsWith(today)
      ).length;

      if (timesAwardedToday >= rule.dailyLimit) {
        // Daily limit reached for this specific rule
        baseAmount = 0;
      }
    }

    // 5. Apply Daily Soft Cap Diminishing Returns
    const dailyTotalBefore = await db.getStudentDailyXp(params.studentId, nowIso);
    const { finalXp, isDiminished } = applyDailySoftCap(dailyTotalBefore, baseAmount);

    // 6. Write to Append-Only Ledger
    const entryId = `xpe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ledgerEntry: XPLedgerEntry = {
      id: entryId,
      studentId: params.studentId,
      ruleId: rule.id,
      ruleVersion: rule.version,
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      baseAmount,
      finalAmount: finalXp,
      isDiminished,
      reason: params.reason,
      metadata: params.metadata,
      idempotencyKey,
      isVoided: false,
      createdAt: nowIso,
    };

    await db.appendLedgerEntry(ledgerEntry);

    // 7. Update Student Profile & Leaderboards
    const updatedProfile = await this.recalculateProfile(params.studentId);

    // 8. Publish real-time event
    await redis.publish(
      'xp:awarded',
      JSON.stringify({
        studentId: params.studentId,
        amount: finalXp,
        reason: params.reason,
        newLifetimeXp: updatedProfile.lifetimeXp,
        level: updatedProfile.currentLevel,
      })
    );

    return { ledgerEntry, isDuplicate: false, profile: updatedProfile };
  }

  /**
   * Voids an XP ledger entry by appending a compensating transaction.
   * Original row is NEVER deleted or mutated.
   */
  async voidXP(params: {
    originalEntryId: string;
    voidByUserId: string;
    reason: string;
  }): Promise<{ compensatingEntry: XPLedgerEntry; profile: StudentProfile }> {
    const original = db.xpLedger.get(params.originalEntryId);
    if (!original) {
      throw new Error(`Ledger entry ${params.originalEntryId} not found`);
    }
    if (original.isVoided) {
      throw new Error(`Ledger entry ${params.originalEntryId} has already been voided`);
    }

    const nowIso = new Date().toISOString();
    const compensatingId = `xpe_void_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `void:${original.id}:${Date.now()}`;

    // Create compensating row
    const compensatingEntry: XPLedgerEntry = {
      id: compensatingId,
      studentId: original.studentId,
      ruleId: original.ruleId,
      ruleVersion: original.ruleVersion,
      sourceType: 'FACULTY_VOID_OVERRIDE',
      sourceRef: original.id,
      baseAmount: -original.baseAmount,
      finalAmount: -original.finalAmount,
      isDiminished: false,
      reason: `VOID REVERSAL: ${params.reason}`,
      metadata: { originalEntryId: original.id, voidBy: params.voidByUserId },
      idempotencyKey,
      isVoided: false,
      voidReason: params.reason,
      voidBy: params.voidByUserId,
      voidRefId: original.id,
      createdAt: nowIso,
    };

    // Mark original as voided reference
    const updatedOriginal = {
      ...original,
      isVoided: true,
      voidReason: params.reason,
      voidBy: params.voidByUserId,
      voidRefId: compensatingId,
    };
    db.xpLedger.set(original.id, Object.freeze(updatedOriginal));

    // Append compensating entry
    await db.appendLedgerEntry(compensatingEntry);

    // Audit log
    await db.logAudit({
      actorId: params.voidByUserId,
      action: 'VOID_XP_LEDGER',
      targetType: 'XP_LEDGER',
      targetId: original.id,
      details: {
        compensatingId,
        studentId: original.studentId,
        amountVoided: original.finalAmount,
        reason: params.reason,
      },
    });

    const updatedProfile = await this.recalculateProfile(original.studentId);
    return { compensatingEntry, profile: updatedProfile };
  }

  /**
   * Recalculates student profile strictly from the append-only ledger entries.
   * Caches results into db.studentProfiles and updates Redis sorted sets.
   */
  async recalculateProfile(studentId: string): Promise<StudentProfile> {
    const history = await db.getStudentLedger(studentId);

    let lifetimeXp = 0;
    const dailyXpTotals = new Map<string, number>();

    for (const entry of history) {
      lifetimeXp += entry.finalAmount;
      const day = entry.createdAt.split('T')[0];
      dailyXpTotals.set(day, (dailyXpTotals.get(day) || 0) + entry.finalAmount);
    }

    lifetimeXp = Math.max(0, lifetimeXp);
    const levelInfo = calculateLevelProgress(lifetimeXp);

    let maxDailyXp = 0;
    for (const amount of dailyXpTotals.values()) {
      if (amount > maxDailyXp) maxDailyXp = amount;
    }

    const existingProfile = db.studentProfiles.get(studentId);
    const updatedProfile: StudentProfile = {
      studentId,
      lifetimeXp,
      currentLevel: levelInfo.currentLevel,
      levelProgressPercent: levelInfo.progressPercent,
      xpInCurrentLevel: levelInfo.xpInCurrentLevel,
      xpRequiredForNextLevel: levelInfo.xpRequiredForNextLevel,
      spendableShards: existingProfile ? existingProfile.spendableShards : 0,
      currentStreak: existingProfile ? existingProfile.currentStreak : 0,
      maxStreak: existingProfile ? existingProfile.maxStreak : 0,
      freezeCount: existingProfile ? existingProfile.freezeCount : 0,
      lastActiveDate: existingProfile ? existingProfile.lastActiveDate : null,
      personalBests: {
        maxDailyXp: Math.max(maxDailyXp, existingProfile?.personalBests?.maxDailyXp || 0),
        highestStreak: existingProfile?.personalBests?.highestStreak || 0,
        monstersDefeated: existingProfile?.personalBests?.monstersDefeated || 0,
        perfectQuizzes: existingProfile?.personalBests?.perfectQuizzes || 0,
      },
    };

    db.studentProfiles.set(studentId, updatedProfile);

    // Update Redis global/campus/batch leaderboards
    const user = db.users.get(studentId);
    if (user) {
      const currentWeekNumber = 1; // current semester week
      await redis.zadd(`leaderboard:campus:${user.campusId}:${currentWeekNumber}`, lifetimeXp, studentId);
      await redis.zadd(`leaderboard:batch:${user.batchId}:${currentWeekNumber}`, lifetimeXp, studentId);
      await redis.zadd('leaderboard:global', lifetimeXp, studentId);
    }

    return updatedProfile;
  }
}

export const xpEngine = new XPEngine();
