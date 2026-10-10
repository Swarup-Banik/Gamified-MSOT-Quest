export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  name: string;
  avatarId: string;
  anonymousAlias: string;
  isAnonymous: boolean;
  campusId: string;
  batchId: string;
  sectionId: string;
  createdAt: string;
}

export interface StudentProfile {
  studentId: string;
  lifetimeXp: number;
  currentLevel: number;
  levelProgressPercent: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  spendableShards: number;
  currentStreak: number;
  maxStreak: number;
  freezeCount: number;
  lastActiveDate: string | null;
  personalBests: {
    maxDailyXp: number;
    highestStreak: number;
    monstersDefeated: number;
    perfectQuizzes: number;
  };
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  city: string;
}

export interface Batch {
  id: string;
  campusId: string;
  name: string;
  year: number;
}

export interface Section {
  id: string;
  batchId: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
}

export interface Topic {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
}

export type ActionType =
  | 'ATTEND_CLASS'
  | 'SUBMIT_HOMEWORK'
  | 'DAILY_QUIZ_COMPLETED'
  | 'QUIZ_CORRECT_ANSWER'
  | 'BIWEEKLY_TEST'
  | 'CODING_PROBLEM_SOLVED'
  | 'CLUB_ACTIVITY'
  | 'SEVEN_DAY_STREAK'
  | 'PEER_HELP'
  | 'DEFEAT_MISTAKE_MONSTER'
  | 'TEAM_BATTLE_WIN'
  | 'RAID_BOSS_DAMAGE'
  | 'MAKEUP_QUEST_COMPLETED';

export interface XPRule {
  id: string;
  actionType: ActionType;
  baseXp: number;
  formula?: string;
  dailyLimit?: number;
  perItemLimit?: number;
  enabled: boolean;
  effectiveFrom: string;
  version: number;
  description: string;
}

export interface XPLedgerEntry {
  id: string;
  studentId: string;
  ruleId: string;
  ruleVersion: number;
  sourceType: string;
  sourceRef: string;
  baseAmount: number;
  finalAmount: number;
  isDiminished: boolean;
  reason: string;
  metadata?: Record<string, any>;
  idempotencyKey: string;
  isVoided: boolean;
  voidReason?: string;
  voidBy?: string;
  voidRefId?: string;
  createdAt: string;
}

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionLanguage = 'EN' | 'HINGLISH';
export type QuestionReviewStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED';
export type QuestionSource = 'FACULTY' | 'AI';

export interface Question {
  id: string;
  topicId: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: QuestionDifficulty;
  language: QuestionLanguage;
  explanation: string;
  explanationHinglish?: string;
  source: QuestionSource;
  status: QuestionReviewStatus;
  reviewerId?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  date: string;
  status: 'STARTED' | 'COMPLETED';
  score: number;
  maxScore: number;
  startedAt: string;
  completedAt?: string;
  idempotencyKey: string;
}

export interface QuizAnswer {
  id: string;
  quizAttemptId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pasteDetected: boolean;
  typingTelemetry?: {
    keyIntervalMeanMs?: number;
    keyIntervalVarianceMs?: number;
    backspaceCount?: number;
  };
}

export type MonsterRarity = 'COMMON' | 'ELITE' | 'BOSS';

export interface MonsterSpecies {
  id: string;
  topicId: string;
  name: string;
  title: string;
  rarity: MonsterRarity;
  imageUrl: string;
  lore: string;
}

export interface MistakeMonster {
  id: string;
  studentId: string;
  speciesId: string;
  questionId: string;
  wrongCount: number;
  status: 'ACTIVE' | 'DEFEATED';
  nextRevengeAt: string;
  defeatedAt?: string;
}

export interface MonsterCodexEntry {
  id: string;
  studentId: string;
  speciesId: string;
  defeatCount: number;
  firstDefeatedAt: string;
}

export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface LeagueMembership {
  id: string;
  leagueWeekId: string;
  studentId: string;
  displayName: string;
  isAnonymous: boolean;
  startWeeklyXp: number;
  currentWeeklyXp: number;
  rank: number;
  shieldActive: boolean;
  growthRatePercent: number;
}

export type BattleEventType = 'SECTION_VS_SECTION' | 'CAMPUS_VS_CAMPUS' | 'RAID_BOSS';

export interface TeamEvent {
  id: string;
  title: string;
  type: BattleEventType;
  startTime: string;
  endTime: string;
  minParticipationRate: number; // e.g. 0.60 for 60%
  bossMaxHp?: number;
  bossCurrentHp?: number;
  teams: {
    id: string;
    name: string;
    score: number;
    participantCount: number;
    totalEligibleCount: number;
    participationRate: number;
    isQualifiedForBonus: boolean;
  }[];
}

export type CosmeticRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type CosmeticType =
  | 'AVATAR_SKIN'
  | 'COMPANION_SKIN'
  | 'FRAME'
  | 'TITLE'
  | 'BACKGROUND'
  | 'STREAK_FLAME'
  | 'LEVELUP_EFFECT';

export interface Cosmetic {
  id: string;
  name: string;
  type: CosmeticType;
  rarity: CosmeticRarity;
  shardCost: number;
  achievementLocked: boolean;
  requiredAchievement?: string;
  previewUrl: string;
}

export type ChestTier = 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY';

export interface Chest {
  id: string;
  studentId: string;
  tier: ChestTier;
  source: string;
  status: 'UNOPENED' | 'OPENED';
  openedAt?: string;
  awardedCosmetic?: Cosmetic;
  shardsEarned?: number;
}

export type AnomalyType =
  | 'QUIZ_SPAM'
  | 'SHARED_ANSWER_CLUSTER'
  | 'COPY_PASTE_TELEMETRY'
  | 'FAKE_CODING_SOLVE'
  | 'XP_SPIKE_ZSCORE'
  | 'DEVICE_IP_CLUSTER';

export interface AnomalyFlag {
  id: string;
  studentId: string;
  flagType: AnomalyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: Record<string, any>;
  status: 'PENDING' | 'REVIEWED' | 'VOIDED' | 'DISMISSED';
  flaggedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}
