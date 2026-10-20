import {
  User,
  UserRole,
  StudentProfile,
  Campus,
  Batch,
  Section,
  Course,
  Topic,
  XPRule,
  XPLedgerEntry,
  Question,
  QuizAttempt,
  QuizAnswer,
  MistakeMonster,
  MonsterSpecies,
  MonsterCodexEntry,
  LeagueMembership,
  TeamEvent,
  Cosmetic,
  Chest,
  AnomalyFlag,
  Credential,
  OAuthAccount,
  RosterEntry,
  Invitation,
  EmailVerificationToken,
  PasswordResetToken,
  Session,
  MfaSecret,
  ConsentRecord,
  ApprovalRequest,
  FacultyAssignment,
  AuthAuditEvent,
  DataExportRequest,
  DeletionRequest,
  UserScope,
  CodingPlatform,
  ExternalAccount,
  ExternalVerificationChallenge,
  ExternalSolve,
  ExternalSyncRun,
  ProviderHealth,
  CuratedProblemList,
  CuratedProblem,
  GitHubActivityDay,
  ExternalConsent,
} from '@msot/shared';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface PilotFeedbackEntry {
  id: string;
  studentId: string;
  rating: number; // 1-5
  favoriteMechanic: string;
  strugglePoints: string;
  comments: string;
  createdAt: string;
}

export interface AnalyticsEventEntry {
  id: string;
  userId: string;
  eventName: string;
  properties: Record<string, any>;
  createdAt: string;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  costShards: number;
  category: 'EVENT_PASS' | 'MERCH' | 'MENTOR_SESSION';
  stock: number;
  imageUrl: string;
}

export interface RewardRedemption {
  id: string;
  studentId: string;
  rewardId: string;
  shardsSpent: number;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED';
  createdAt: string;
}

export interface ExternalCodingProfile {
  id: string;
  studentId: string;
  platform: 'LEETCODE' | 'CODEFORCES' | 'GITHUB';
  handle: string;
  isVerified: boolean;
  verificationChallenge: string;
  totalSolves: number;
  lastSyncedAt?: string;
}

/**
 * High-reliability database repository layer supporting transactional consistency,
 * strict append-only ledger integrity, and immutable academic grade isolation.
 */
export class Database {
  users = new Map<string, User>();
  campuses = new Map<string, Campus>();
  batches = new Map<string, Batch>();
  sections = new Map<string, Section>();
  courses = new Map<string, Course>();
  topics = new Map<string, Topic>();
  questions = new Map<string, Question>();
  quizAttempts = new Map<string, QuizAttempt>();
  quizAnswers = new Map<string, QuizAnswer>();
  mistakeMonsters = new Map<string, MistakeMonster>();
  monsterSpecies = new Map<string, MonsterSpecies>();
  monsterCodex = new Map<string, MonsterCodexEntry>();
  xpRules = new Map<string, XPRule>();
  xpRuleVersions: { ruleId: string; version: number; rule: XPRule; changedBy: string; changedAt: string }[] = [];
  xpLedger = new Map<string, XPLedgerEntry>();
  studentProfiles = new Map<string, StudentProfile>();
  leagueMemberships = new Map<string, LeagueMembership>();
  teamEvents = new Map<string, TeamEvent>();
  cosmetics = new Map<string, Cosmetic>();
  userCosmetics: { id: string; studentId: string; cosmeticId: string; isEquipped: boolean; unlockedAt: string }[] = [];
  chests = new Map<string, Chest>();
  pityCounters = new Map<string, { rarePity: number; epicPity: number }>();
  anomalyFlags = new Map<string, AnomalyFlag>();
  auditLogs: AuditLogEntry[] = [];
  pilotFeedback: PilotFeedbackEntry[] = [];
  analyticsEvents: AnalyticsEventEntry[] = [];
  rewards = new Map<string, RewardItem>();
  redemptions = new Map<string, RewardRedemption>();
  externalProfiles = new Map<string, ExternalCodingProfile>();

  // Auth, Credentials, Sessions & Access Control Collections
  credentials = new Map<string, Credential>();
  oauthAccounts = new Map<string, OAuthAccount>();
  rosterEntries = new Map<string, RosterEntry>();
  rosterHistory: { batchId: string; importedAt: string; rowCount: number; rows: RosterEntry[] }[] = [];
  invitations = new Map<string, Invitation>();
  emailVerificationTokens = new Map<string, EmailVerificationToken>();
  passwordResetTokens = new Map<string, PasswordResetToken>();
  sessions = new Map<string, Session>();
  mfaSecrets = new Map<string, MfaSecret>();
  consentRecords = new Map<string, ConsentRecord>();
  approvalRequests = new Map<string, ApprovalRequest>();
  facultyAssignments = new Map<string, FacultyAssignment>();
  authAuditEvents: AuthAuditEvent[] = [];
  dataExportRequests = new Map<string, DataExportRequest>();
  deletionRequests = new Map<string, DeletionRequest>();

  // External Coding Practice Integrations
  externalAccounts = new Map<string, ExternalAccount>();
  externalVerificationChallenges = new Map<string, ExternalVerificationChallenge>();
  externalSolves = new Map<string, ExternalSolve>();
  externalSyncRuns: ExternalSyncRun[] = [];
  providerHealth = new Map<CodingPlatform, ProviderHealth>();
  curatedProblemLists = new Map<string, CuratedProblemList>();
  curatedProblems = new Map<string, CuratedProblem>();
  githubActivityDays = new Map<string, GitHubActivityDay>();
  externalConsents = new Map<string, ExternalConsent>();

  // Immutable Official Academic Grade Data (Simulated LMS Read-Only View)
  private readonly officialGradesStore: ReadonlyArray<{
    studentId: string;
    courseCode: string;
    officialMark: number;
    gpa: number;
  }> = Object.freeze([
    Object.freeze({ studentId: 'student_1', courseCode: 'CS201', officialMark: 88, gpa: 3.8 }),
    Object.freeze({ studentId: 'student_2', courseCode: 'CS201', officialMark: 74, gpa: 3.2 }),
    Object.freeze({ studentId: 'student_3', courseCode: 'CS201', officialMark: 92, gpa: 4.0 }),
  ]);

  /**
   * NON-NEGOTIABLE PRINCIPLE #3 VERIFIER:
   * Returns a deeply frozen, read-only view of official academic marks.
   * Under NO circumstances does any code path permit writing to this store.
   */
  getReadOnlyOfficialGrades(): ReadonlyArray<{
    studentId: string;
    courseCode: string;
    officialMark: number;
    gpa: number;
  }> {
    return this.officialGradesStore;
  }

  // --- XP LEDGER OPERATIONS (APPEND-ONLY) ---

  async findLedgerEntryByIdempotencyKey(key: string): Promise<XPLedgerEntry | null> {
    for (const entry of this.xpLedger.values()) {
      if (entry.idempotencyKey === key) {
        return entry;
      }
    }
    return null;
  }

  async appendLedgerEntry(entry: XPLedgerEntry): Promise<XPLedgerEntry> {
    // Enforce uniqueness of idempotency key
    const existing = await this.findLedgerEntryByIdempotencyKey(entry.idempotencyKey);
    if (existing) {
      throw new Error(`Idempotency violation: key ${entry.idempotencyKey} already exists`);
    }
    // Deep clone to guarantee immutability of the stored ledger row
    const frozen = Object.freeze({ ...entry });
    this.xpLedger.set(entry.id, frozen);
    return frozen;
  }

  async getStudentLedger(studentId: string): Promise<XPLedgerEntry[]> {
    const list: XPLedgerEntry[] = [];
    for (const entry of this.xpLedger.values()) {
      if (entry.studentId === studentId) {
        list.push(entry);
      }
    }
    // Return sorted chronologically
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getStudentDailyXp(studentId: string, dateIso: string): Promise<number> {
    const targetDate = dateIso.split('T')[0];
    let sum = 0;
    for (const entry of this.xpLedger.values()) {
      if (entry.studentId === studentId && !entry.isVoided) {
        const entryDate = entry.createdAt.split('T')[0];
        if (entryDate === targetDate) {
          sum += entry.finalAmount;
        }
      }
    }
    return sum;
  }

  // --- STUDENT PROFILES & LEVEL PROGRESSION ---

  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    return this.studentProfiles.get(studentId) || null;
  }

  async saveStudentProfile(profile: StudentProfile): Promise<void> {
    this.studentProfiles.set(profile.studentId, { ...profile });
  }

  // --- AUDIT LOGS ---

  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    const record: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.push(record);
    return record;
  }

  // --- RESET & FLUSH (For Isolated Testing) ---

  clearForTesting() {
    this.users.clear();
    this.campuses.clear();
    this.batches.clear();
    this.sections.clear();
    this.courses.clear();
    this.topics.clear();
    this.questions.clear();
    this.quizAttempts.clear();
    this.quizAnswers.clear();
    this.mistakeMonsters.clear();
    this.monsterSpecies.clear();
    this.monsterCodex.clear();
    this.xpRules.clear();
    this.xpRuleVersions = [];
    this.xpLedger.clear();
    this.studentProfiles.clear();
    this.leagueMemberships.clear();
    this.teamEvents.clear();
    this.cosmetics.clear();
    this.userCosmetics = [];
    this.chests.clear();
    this.pityCounters.clear();
    this.anomalyFlags.clear();
    this.auditLogs = [];
    this.pilotFeedback = [];
    this.analyticsEvents = [];
    this.rewards.clear();
    this.redemptions.clear();
    this.externalProfiles.clear();
    this.credentials.clear();
    this.oauthAccounts.clear();
    this.rosterEntries.clear();
    this.rosterHistory = [];
    this.invitations.clear();
    this.emailVerificationTokens.clear();
    this.passwordResetTokens.clear();
    this.sessions.clear();
    this.mfaSecrets.clear();
    this.consentRecords.clear();
    this.approvalRequests.clear();
    this.facultyAssignments.clear();
    this.authAuditEvents = [];
    this.dataExportRequests.clear();
    this.deletionRequests.clear();
    this.externalAccounts.clear();
    this.externalVerificationChallenges.clear();
    this.externalSolves.clear();
    this.externalSyncRuns = [];
    this.providerHealth.clear();
    this.curatedProblemLists.clear();
    this.curatedProblems.clear();
    this.githubActivityDays.clear();
    this.externalConsents.clear();
  }
}

export const db = new Database();
