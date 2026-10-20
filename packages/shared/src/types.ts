export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type UserStatus =
  | 'INVITED'
  | 'PENDING_APPROVAL'
  | 'EMAIL_VERIFICATION_PENDING'
  | 'EMAIL_VERIFIED'
  | 'CONSENTED'
  | 'PROFILE_SETUP'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface EquippedLoadout {
  avatar: string;
  companion: string;
  banner: string;
  frame: string;
  title?: string;
  streakFlame?: string;
  levelupEffect?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  fullName?: string;
  avatarId: string;
  equippedLoadout?: EquippedLoadout;
  anonymousAlias: string;
  isAnonymous: boolean;
  campusId: string;
  batchId: string;
  sectionId: string;
  rollNumber?: string;
  createdAt: string;
  lastLoginAt?: string;
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
  equippedLoadout?: EquippedLoadout;
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

export type CosmeticSlot =
  | 'AVATAR_SKIN'
  | 'COMPANION_SKIN'
  | 'PROFILE_BANNER'
  | 'FRAME'
  | 'TITLE'
  | 'STREAK_FLAME'
  | 'LEVELUP_EFFECT';

export type CosmeticType = CosmeticSlot | 'BACKGROUND';

export type UnlockType = 'starter' | 'chest' | 'achievement' | 'season' | 'quest';

export interface Cosmetic {
  id: string;
  slug: string;
  name: string;
  slot: CosmeticSlot;
  type?: CosmeticSlot; // Backward compatibility alias
  rarity: CosmeticRarity;
  description: string;
  shardCost: number;
  unlockType: UnlockType;
  unlockCondition?: string;
  achievementLocked?: boolean;
  requiredAchievement?: string;
  assetKey: string;
  themeTag: string;
  previewUrl?: string;
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

// -------------------------------------------------------------
// Authentication, Identity & Access Control Models
// -------------------------------------------------------------

export interface Credential {
  userId: string;
  passwordHash: string;
  lastChangedAt: string;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft' | 'msot_sso';
  providerUserId: string;
  email: string;
  createdAt: string;
}

export interface RosterEntry {
  id: string;
  email: string;
  fullName: string;
  rollNumber: string;
  campusId: string;
  batchId: string;
  sectionId: string;
  claimToken?: string;
  isClaimed: boolean;
  claimedAt?: string;
  claimedByUserId?: string;
  importedAt: string;
  importBatchId: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  assignedCampuses: string[];
  assignedCourses: string[];
  assignedSections: string[];
  tokenHash: string;
  expiresAt: string;
  isAccepted: boolean;
  invitedBy: string;
  createdAt: string;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface Session {
  id: string; // Token Family ID
  userId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface MfaSecret {
  userId: string;
  secretBase32: string;
  isEnabled: boolean;
  createdAt: string;
  backupCodesHash: string[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentVersion: string;
  consentedAt: string;
  ipAddress: string;
  userAgent: string;
  guardianConsentObtained?: boolean;
}

export interface ApprovalRequest {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  campusId: string;
  rollNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface FacultyAssignment {
  id: string;
  facultyId: string;
  campusId: string;
  courseId: string;
  sectionId: string;
  assignedAt: string;
}

export interface AuthAuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  actorId?: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: string;
  status: 'COMPLETED' | 'PENDING';
  dataJson?: string;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  scheduledPurgeAt: string;
  status: 'PENDING' | 'PURGED' | 'CANCELLED';
}

export interface UserScope {
  role: UserRole;
  assignedCampuses: string[];
  assignedCourses: string[];
  assignedSections: string[];
}

// --- EXTERNAL CODING INTEGRATIONS ---

export type CodingPlatform = 'GITHUB' | 'LEETCODE' | 'HACKERRANK';

export type ExternalAccountStatus = 'NOT_LINKED' | 'VERIFYING' | 'VERIFIED' | 'PAUSED' | 'REVOKED';

export interface CodingProviderCapabilities {
  supportsSolvedCounts: boolean;
  supportsPerProblemSubmissions: boolean;
  supportsOwnershipProof: boolean;
  supportsDifficulty: boolean;
  official: boolean;
}

export interface SolvedCountsByDifficulty {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export interface ExternalAccount {
  id: string;
  studentId: string;
  provider: CodingPlatform;
  handle: string;
  status: ExternalAccountStatus;
  verifiedAt: string | null;
  lastSyncAt: string | null;
  unlinkedAt?: string | null;
  baselineSolvedCounts: SolvedCountsByDifficulty;
  originalBaselineSolvedCounts: SolvedCountsByDifficulty;
  totalXpEarned: number;
  totalSolvesCount: number;
  encryptedOAuthToken?: string | null;
  consecutiveFailures: number;
  pauseReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalVerificationChallenge {
  id: string;
  studentId: string;
  provider: CodingPlatform;
  handle: string;
  challengeCode: string;
  expiresAt: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  createdAt: string;
}

export interface ExternalSolve {
  id: string;
  studentId: string;
  provider: CodingPlatform;
  problemSlug: string;
  problemTitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  solvedAt: string;
  source: 'SYNC_POLL' | 'MANUAL_SYNC' | 'FACULTY_CSV';
  awardedXp: number;
  awardedLedgerId: string;
  topicId?: string | null;
  isTopicAlignedBonus: boolean;
  idempotencyKey: string;
}

export interface ExternalSyncRun {
  id: string;
  studentId: string;
  provider: CodingPlatform;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CIRCUIT_OPEN';
  newSolvesDetected: number;
  xpAwarded: number;
  startedAt: string;
  completedAt: string;
  errorMessage?: string | null;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ProviderHealth {
  provider: CodingPlatform;
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureAt?: string | null;
  lastSuccessAt?: string | null;
  cooldownUntil?: string | null;
  lastErrorMessage?: string | null;
}

export interface CuratedProblemList {
  id: string;
  title: string;
  topicId: string;
  courseId: string;
  weekNumber: number;
  createdByFacultyId: string;
  createdAt: string;
}

export interface CuratedProblem {
  id: string;
  listId: string;
  provider: CodingPlatform;
  problemSlug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topicId: string;
  url?: string;
}

export interface GitHubActivityDay {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  commitCount: number;
  linesChanged: number;
  isNonFork: boolean;
  awardedLedgerId?: string;
  awardedXp: number;
}

export interface ExternalConsent {
  id: string;
  studentId: string;
  provider: CodingPlatform;
  consentedAt: string;
  revokedAt?: string | null;
  dataTypes: string[];
}

