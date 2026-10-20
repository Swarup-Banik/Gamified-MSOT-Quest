import crypto from 'node:crypto';
import {
  CodingPlatform,
  ExternalAccount,
  ExternalVerificationChallenge,
  ExternalSolve,
  ExternalSyncRun,
  CuratedProblemList,
  CuratedProblem,
  GitHubActivityDay,
  ExternalConsent,
  SolvedCountsByDifficulty,
  XPLedgerEntry,
} from '@msot/shared';
import { db } from '../db.js';
import { getProviderAdapter, CodingProviderAdapter } from './coding-provider-adapter.js';
import { circuitBreaker } from './circuit-breaker.js';
import { auditService } from './audit-service.js';
import { xpEngine } from './xp-engine.js';

export class CodingIntegrationService {
  private readonly encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || 'msot_quest_super_secret_token_encryption_key_2026';
  }

  // ==========================================================================
  // 1. Encryption & Token Security (AES-256-GCM)
  // ==========================================================================

  encryptToken(token: string): string {
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptToken(cipherText: string): string {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, tagHex, contentHex] = parts;
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(contentHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
  }

  // ==========================================================================
  // 2. Linking & Ownership Verification
  // ==========================================================================

  /**
   * Returns all connected accounts and provider capability status for a student.
   */
  async getConnectedAccounts(studentId: string) {
    const providers: CodingPlatform[] = ['GITHUB', 'LEETCODE', 'HACKERRANK'];
    return providers.map(provider => {
      const account = Array.from(db.externalAccounts.values()).find(
        acc => acc.studentId === studentId && acc.provider === provider && acc.status === 'VERIFIED'
      ) || null;
      const adapter = getProviderAdapter(provider);
      return {
        provider,
        linked: !!account,
        account,
        capabilities: adapter.capabilities,
      };
    });
  }

  /**
   * Record student consent for integration data ingestion
   */
  async recordConsent(
    studentId: string,
    provider: CodingPlatform,
    consentGiven: boolean,
    ipAddress: string = '127.0.0.1'
  ): Promise<ExternalConsent> {
    const consentId = `consent_${Date.now()}_${studentId}_${provider}`;
    const consent: ExternalConsent = {
      id: consentId,
      studentId,
      provider,
      consentedAt: new Date().toISOString(),
      dataTypes: ['public_profile', 'solved_counts', 'submission_history'],
    };
    if (consentGiven) {
      db.externalConsents.set(consentId, consent);
    }
    return consent;
  }

  /**
   * Generates a single-use ownership challenge code for LeetCode / HackerRank.
   */
  async createVerificationChallenge(
    studentId: string,
    provider: CodingPlatform,
    handle: string
  ): Promise<ExternalVerificationChallenge> {
    const normHandle = handle.trim().toLowerCase();

    // Enforce Unique Handle Constraint: Cannot link if another student owns this handle
    for (const acc of db.externalAccounts.values()) {
      if (
        acc.provider === provider &&
        acc.handle.toLowerCase() === normHandle &&
        acc.studentId !== studentId &&
        acc.status === 'VERIFIED'
      ) {
        throw new Error(
          `This ${provider} handle is already linked to another MSOT account. Each external handle can only be linked once.`
        );
      }
    }

    // Generate single-use random verification code (30-min expiration)
    const challengeCode = `msot-verify-${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const challengeId = `chlg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const challenge: ExternalVerificationChallenge = {
      id: challengeId,
      studentId,
      provider,
      handle: normHandle,
      challengeCode,
      expiresAt,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    db.externalVerificationChallenges.set(challengeId, challenge);

    // Record student consent
    await this.recordConsent(studentId, provider, true);

    return challenge;
  }

  /**
   * Verifies the ownership challenge and captures the link-time baseline.
   * Can be invoked with (challengeId) or (studentId, provider, handle, oAuthToken).
   */
  async verifyChallenge(
    param1: string,
    param2?: CodingPlatform,
    param3?: string,
    param4?: string
  ): Promise<ExternalAccount & { account: ExternalAccount; baseline: SolvedCountsByDifficulty }> {
    let studentId: string;
    let provider: CodingPlatform;
    let handle: string;
    let oAuthToken: string | undefined = param4;

    if (!param2) {
      // Lookup by challengeId
      const challenge = db.externalVerificationChallenges.get(param1);
      if (!challenge) {
        throw new Error(`Verification challenge with ID "${param1}" was not found or expired.`);
      }
      studentId = challenge.studentId;
      provider = challenge.provider;
      handle = challenge.handle;
    } else {
      studentId = param1;
      provider = param2;
      handle = param3!;
    }

    const normHandle = handle.trim().toLowerCase();
    const adapter = getProviderAdapter(provider);

    // Rate limiter & Circuit breaker check
    const health = circuitBreaker.canExecute(provider);
    if (!health.allowed) {
      throw new Error(health.reason);
    }
    await circuitBreaker.throttle(provider);

    // Check uniqueness constraint
    for (const acc of db.externalAccounts.values()) {
      if (
        acc.provider === provider &&
        acc.handle.toLowerCase() === normHandle &&
        acc.studentId !== studentId &&
        acc.status === 'VERIFIED'
      ) {
        throw new Error(`The handle "${normHandle}" is already linked by another MSOT student.`);
      }
    }

    // Find active challenge for non-OAuth providers
    let challengeToken = '';
    if (provider !== 'GITHUB') {
      const activeChallenge = Array.from(db.externalVerificationChallenges.values()).find(
        c =>
          c.studentId === studentId &&
          c.provider === provider &&
          c.handle.toLowerCase() === normHandle &&
          c.status === 'PENDING' &&
          new Date(c.expiresAt).getTime() > Date.now()
      );

      if (!activeChallenge) {
        throw new Error('No valid, unexpired challenge found for this handle. Please generate a new code.');
      }
      challengeToken = activeChallenge.challengeCode;
    } else {
      challengeToken = oAuthToken || 'mock_github_oauth_token';
    }

    // Call adapter ownership check
    const isOwner = await adapter.verifyOwnership(normHandle, challengeToken);
    if (!isOwner) {
      circuitBreaker.recordFailure(provider, 'Bio ownership token not found on profile');
      throw new Error(
        `Ownership verification failed: could not find challenge code "${challengeToken}" on the public profile for @${normHandle}.`
      );
    }
    circuitBreaker.recordSuccess(provider);

    // Take link-time baseline
    const profileStats = await adapter.fetchProfileStats(normHandle);
    const baseline = profileStats.solvedCounts || { easy: 0, medium: 0, hard: 0, total: 0 };

    // Check if account was previously unlinked to preserve original baseline
    const existingAccountId = `ext_${studentId}_${provider}`;
    const previousAccount = db.externalAccounts.get(existingAccountId);

    const originalBaseline = previousAccount?.originalBaselineSolvedCounts || { ...baseline };

    const account: ExternalAccount = {
      id: existingAccountId,
      studentId,
      provider,
      handle: normHandle,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      baselineSolvedCounts: baseline,
      originalBaselineSolvedCounts: originalBaseline,
      totalXpEarned: previousAccount?.totalXpEarned || 0,
      totalSolvesCount: previousAccount?.totalSolvesCount || 0,
      encryptedOAuthToken: oAuthToken ? this.encryptToken(oAuthToken) : null,
      consecutiveFailures: 0,
      createdAt: previousAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.externalAccounts.set(existingAccountId, account);

    // Mark challenge verified
    for (const c of db.externalVerificationChallenges.values()) {
      if (c.studentId === studentId && c.provider === provider && c.handle.toLowerCase() === normHandle) {
        c.status = 'VERIFIED';
      }
    }

    // Award zero-point cosmetic linking badge ("Connected Developer")
    auditService.logEvent({
      actorId: studentId,
      action: 'EXTERNAL_ACCOUNT_LINKED',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      metadata: { provider, handle: normHandle, baseline },
    });

    return Object.assign(account, { account, baseline: account.baselineSolvedCounts });
  }

  /**
   * Unlinks an external account immediately, wiping credentials while preserving historical ledger.
   */
  async unlinkAccount(studentId: string, provider: CodingPlatform): Promise<void> {
    const accountId = `ext_${studentId}_${provider}`;
    const account = db.externalAccounts.get(accountId);
    if (!account) return;

    account.status = 'REVOKED';
    account.encryptedOAuthToken = null;
    account.unlinkedAt = new Date().toISOString();
    account.updatedAt = new Date().toISOString();
    db.externalAccounts.set(accountId, account);

    auditService.logEvent({
      actorId: studentId,
      action: 'EXTERNAL_ACCOUNT_UNLINKED',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      metadata: { provider, handle: account.handle },
    });
  }

  /**
   * Retrieves all connection statuses for a student
   */
  getStudentConnections(studentId: string): Array<{
    provider: CodingPlatform;
    status: string;
    handle: string | null;
    lastSyncAt: string | null;
    verifiedAt: string | null;
    totalXpEarned: number;
    totalSolvesCount: number;
    capabilities: any;
    circuitState: string;
  }> {
    const platforms: CodingPlatform[] = ['GITHUB', 'LEETCODE', 'HACKERRANK'];

    return platforms.map(p => {
      const accountId = `ext_${studentId}_${p}`;
      const acc = db.externalAccounts.get(accountId);
      const adapter = getProviderAdapter(p);
      const health = circuitBreaker.getHealth(p);

      return {
        provider: p,
        status: acc?.status || 'NOT_LINKED',
        handle: acc?.status === 'VERIFIED' ? acc.handle : null,
        lastSyncAt: acc?.lastSyncAt || null,
        verifiedAt: acc?.verifiedAt || null,
        totalXpEarned: acc?.totalXpEarned || 0,
        totalSolvesCount: acc?.totalSolvesCount || 0,
        capabilities: adapter.capabilities,
        circuitState: health.state,
      };
    });
  }

  // ==========================================================================
  // 3. Sync Engine & Idempotent XP Calculation
  // ==========================================================================

  /**
   * Performs an idempotent sync for a single linked external account.
   */
  async syncAccount(
    studentId: string,
    provider: CodingPlatform,
    isManualTrigger: boolean = false
  ): Promise<{
    success: boolean;
    provider: CodingPlatform;
    newSolvesDetected: number;
    xpAwarded: number;
    details: Array<{ slug: string; difficulty: string; xp: number; reason: string }>;
    notice?: string;
  }> {
    const accountId = `ext_${studentId}_${provider}`;
    const account = db.externalAccounts.get(accountId);

    if (!account || account.status !== 'VERIFIED') {
      return {
        success: false,
        provider,
        newSolvesDetected: 0,
        xpAwarded: 0,
        details: [],
        notice: 'Account is not linked or verified.',
      };
    }

    // Circuit Breaker check
    const healthCheck = circuitBreaker.canExecute(provider);
    if (!healthCheck.allowed) {
      return {
        success: false,
        provider,
        newSolvesDetected: 0,
        xpAwarded: 0,
        details: [],
        notice: `${provider} sync is paused to respect rate limits. We'll catch up automatically!`,
      };
    }

    await circuitBreaker.throttle(provider);
    const adapter = getProviderAdapter(provider);
    const syncStartTime = new Date().toISOString();
    const details: Array<{ slug: string; difficulty: string; xp: number; reason: string }> = [];
    let totalXpGained = 0;
    let newSolvesCount = 0;

    try {
      // ----------------------------------------------------------------------
      // A. GitHub Sync Execution
      // ----------------------------------------------------------------------
      if (provider === 'GITHUB') {
        const token = account.encryptedOAuthToken ? this.decryptToken(account.encryptedOAuthToken) : undefined;
        const activities = (await adapter.fetchGitHubActivity?.(account.handle, token)) || [];

        for (const act of activities) {
          const dayKey = `gh_day_${studentId}_${act.date}`;
          // Anti-gaming: Ignore forks or commits with < 10 lines changed
          if (!act.isNonFork || act.linesChanged < 10 || act.commitCount === 0) {
            continue;
          }

          if (!db.githubActivityDays.has(dayKey)) {
            // Award GitHub Active Coding Day (10 XP, max 1/day)
            const xpAward = 10;
            const awardRes = await xpEngine.awardXP({
              studentId,
              actionType: 'CODING_PROBLEM_SOLVED',
              sourceType: 'CODING_PLATFORM',
              sourceRef: `github_commits_${act.date}`,
              reason: `GitHub Active Coding Day (${act.commitCount} commits, ${act.linesChanged} lines)`,
              customAmount: xpAward,
              idempotencyKey: dayKey,
            });

            db.githubActivityDays.set(dayKey, {
              id: dayKey,
              studentId,
              date: act.date,
              commitCount: act.commitCount,
              linesChanged: act.linesChanged,
              isNonFork: act.isNonFork,
              awardedLedgerId: awardRes.ledgerEntry.id,
              awardedXp: xpAward,
            });

            totalXpGained += xpAward;
            newSolvesCount++;
            details.push({
              slug: `github-${act.date}`,
              difficulty: 'EASY',
              xp: xpAward,
              reason: awardRes.ledgerEntry.reason,
            });
          }
        }
      }

      // ----------------------------------------------------------------------
      // B. LeetCode & HackerRank Sync Execution
      // ----------------------------------------------------------------------
      if (provider === 'LEETCODE' || provider === 'HACKERRANK') {
        const stats = await adapter.fetchProfileStats(account.handle);

        // Anti-Gaming Check: Count Decrease Detection
        if (stats.solvedCounts.total < account.baselineSolvedCounts.total) {
          account.status = 'PAUSED';
          account.pauseReason = `Tamper detected: Solved count dropped from ${account.baselineSolvedCounts.total} to ${stats.solvedCounts.total}`;
          db.externalAccounts.set(accountId, account);

          db.anomalyFlags.set(`tamper_${Date.now()}_${studentId}`, {
            id: `tamper_${Date.now()}_${studentId}`,
            studentId,
            flagType: 'FAKE_CODING_SOLVE',
            severity: 'HIGH',
            evidence: {
              metric: 'EXTERNAL_COUNT_DROP',
              observedValue: stats.solvedCounts.total,
              expectedThreshold: account.baselineSolvedCounts.total,
              zScore: 3.5,
            },
            status: 'PENDING',
            flaggedAt: new Date().toISOString(),
          });

          return {
            success: false,
            provider,
            newSolvesDetected: 0,
            xpAwarded: 0,
            details: [],
            notice: 'Sync paused: External profile reported a decrease in solved count. Admin review required.',
          };
        }

        const recentSubmissions = await adapter.fetchRecentSubmissions(account.handle);

        // Filter: only accepted submissions occurring strictly after account.verifiedAt
        const verifiedTimestamp = new Date(account.verifiedAt || 0).getTime();
        const validNewSubmissions = recentSubmissions.filter(s => {
          const subTimestamp = new Date(s.solvedAt).getTime();
          return s.status === 'ACCEPTED' && subTimestamp >= verifiedTimestamp;
        });

        // Anti-Gaming Velocity Check: >5 solves in under 15 minutes
        if (validNewSubmissions.length > 5) {
          const timestamps = validNewSubmissions.map(s => new Date(s.solvedAt).getTime()).sort();
          const span = timestamps[timestamps.length - 1] - timestamps[0];
          if (span < 15 * 60 * 1000) {
            db.anomalyFlags.set(`spike_${Date.now()}_${studentId}`, {
              id: `spike_${Date.now()}_${studentId}`,
              studentId,
              flagType: 'XP_SPIKE_ZSCORE',
              severity: 'HIGH',
              evidence: {
                metric: 'RAPID_EXTERNAL_SOLVES',
                observedValue: validNewSubmissions.length,
                expectedThreshold: 5,
                zScore: 4.0,
              },
              status: 'PENDING',
              flaggedAt: new Date().toISOString(),
            });
          }
        }

        // Daily Cap check: count solves already awarded today across all external providers
        const todayStr = new Date().toISOString().split('T')[0];
        const solvesTodayCount = Array.from(db.externalSolves.values()).filter(
          s => s.studentId === studentId && s.solvedAt.startsWith(todayStr)
        ).length;

        let currentDailyCount = solvesTodayCount;

        for (const sub of validNewSubmissions) {
          const idempotencyKey = `ext_solve_${studentId}_${provider}_${sub.problemSlug}`;
          if (db.externalSolves.has(idempotencyKey)) {
            continue; // Already processed
          }

          // Check for Topic-Aligned Curated Problem Bonus (+25%)
          const matchedCurated = Array.from(db.curatedProblems.values()).find(
            cp => cp.provider === provider && cp.problemSlug.toLowerCase() === sub.problemSlug.toLowerCase()
          );

          // Calculate XP with daily 10-problem cap
          const difficultyMap = { EASY: 10, MEDIUM: 20, HARD: 40 };
          const base = difficultyMap[sub.difficulty] || 10;
          const isTopicAligned = !!matchedCurated;
          const bonus = isTopicAligned ? Math.round(base * 0.25) : 0;

          let awardedXp = 0;
          let reason = '';

          if (currentDailyCount < 10) {
            awardedXp = base + bonus;
            reason = isTopicAligned
              ? `Verified ${provider} ${sub.title} (${sub.difficulty}): +${awardedXp} XP (Includes +25% topic bonus)`
              : `Verified ${provider} ${sub.title} (${sub.difficulty}): +${awardedXp} XP`;
            currentDailyCount++;
          } else {
            awardedXp = 0;
            reason = `Verified ${provider} ${sub.title} (${sub.difficulty}): 0 XP (Daily cap of 10 solves reached)`;
          }

          let ledgerId = '';
          if (awardedXp > 0) {
            const awardRes = await xpEngine.awardXP({
              studentId,
              actionType: 'CODING_PROBLEM_SOLVED',
              sourceType: 'CODING_PLATFORM',
              sourceRef: `${provider}:${sub.problemSlug}`,
              reason,
              customAmount: awardedXp,
              idempotencyKey,
            });
            ledgerId = awardRes.ledgerEntry.id;
          }

          const solveRecord: ExternalSolve = {
            id: idempotencyKey,
            studentId,
            provider,
            problemSlug: sub.problemSlug,
            problemTitle: sub.title,
            difficulty: sub.difficulty,
            solvedAt: sub.solvedAt,
            source: isManualTrigger ? 'MANUAL_SYNC' : 'SYNC_POLL',
            awardedXp,
            awardedLedgerId: ledgerId,
            topicId: matchedCurated?.topicId || null,
            isTopicAlignedBonus: isTopicAligned,
            idempotencyKey,
          };

          db.externalSolves.set(idempotencyKey, solveRecord);
          totalXpGained += awardedXp;
          newSolvesCount++;
          details.push({
            slug: sub.problemSlug,
            difficulty: sub.difficulty,
            xp: awardedXp,
            reason,
          });
        }
      }

      // Record successful health and sync metrics
      circuitBreaker.recordSuccess(provider);
      account.lastSyncAt = new Date().toISOString();
      account.totalXpEarned += totalXpGained;
      account.totalSolvesCount += newSolvesCount;
      account.consecutiveFailures = 0;
      db.externalAccounts.set(accountId, account);

      db.externalSyncRuns.push({
        id: `sync_${Date.now()}_${studentId}_${provider}`,
        studentId,
        provider,
        status: 'SUCCESS',
        newSolvesDetected: newSolvesCount,
        xpAwarded: totalXpGained,
        startedAt: syncStartTime,
        completedAt: new Date().toISOString(),
      });

      return {
        success: true,
        provider,
        newSolvesDetected: newSolvesCount,
        xpAwarded: totalXpGained,
        details,
      };
    } catch (err: any) {
      circuitBreaker.recordFailure(provider, err);
      account.consecutiveFailures++;
      db.externalAccounts.set(accountId, account);

      db.externalSyncRuns.push({
        id: `sync_${Date.now()}_${studentId}_${provider}`,
        studentId,
        provider,
        status: 'FAILED',
        newSolvesDetected: 0,
        xpAwarded: 0,
        startedAt: syncStartTime,
        completedAt: new Date().toISOString(),
        errorMessage: err.message,
      });

      return {
        success: false,
        provider,
        newSolvesDetected: 0,
        xpAwarded: 0,
        details: [],
        notice: `Sync encountered an issue: ${err.message}. Progress is preserved.`,
      };
    }
  }

  // ==========================================================================
  // 4. Faculty Problem Lists & CSV Fallback
  // ==========================================================================

  /**
   * Returns all curated problem lists and their associated problems.
   */
  async getCuratedLists() {
    return Array.from(db.curatedProblemLists.values()).map(list => ({
      ...list,
      problems: Array.from(db.curatedProblems.values()).filter(p => p.listId === list.id),
    }));
  }

  /**
   * Creates a curated problem list tagged to a syllabus topic.
   */
  async createCuratedList(
    facultyIdOrData: string | { title: string; topicTag: string; weekNumber: number; createdBy: string; problems?: any[] },
    title?: string,
    topicId?: string,
    courseId?: string,
    weekNumber?: number,
    problems?: Array<{ provider: CodingPlatform; problemSlug: string; title: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; url?: string }>
  ): Promise<CuratedProblemList> {
    let facultyId = '';
    let t = '';
    let topId = '';
    let cId = 'default_course';
    let wk = 1;
    let probs: any[] = [];

    if (typeof facultyIdOrData === 'object') {
      facultyId = facultyIdOrData.createdBy;
      t = facultyIdOrData.title;
      topId = facultyIdOrData.topicTag;
      wk = facultyIdOrData.weekNumber;
      probs = facultyIdOrData.problems || [];
    } else {
      facultyId = facultyIdOrData;
      t = title!;
      topId = topicId!;
      cId = courseId || 'default_course';
      wk = weekNumber || 1;
      probs = problems || [];
    }

    const listId = `cplist_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const list: CuratedProblemList = {
      id: listId,
      title: t,
      topicId: topId,
      courseId: cId,
      weekNumber: wk,
      createdByFacultyId: facultyId,
      createdAt: new Date().toISOString(),
    };

    db.curatedProblemLists.set(listId, list);

    for (const p of probs) {
      const probId = `cprob_${listId}_${p.provider}_${p.problemSlug}`;
      const curated: CuratedProblem = {
        id: probId,
        listId,
        provider: p.provider,
        problemSlug: p.problemSlug,
        title: p.title,
        difficulty: p.difficulty,
        topicId: topId,
        url: p.url,
      };
      db.curatedProblems.set(probId, curated);
    }

    return list;
  }

  /**
   * Ingests a HackerRank contest or test CSV with dry-run support.
   */
  async importContestCsv(
    facultyId: string,
    csvContent: string,
    dryRun: boolean = true
  ): Promise<{
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    totalProjectedXp: number;
    preview: any[];
    committed: boolean;
  }> {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const emailIdx = header.indexOf('email');
    const slugIdx = header.indexOf('problem_slug') !== -1 ? header.indexOf('problem_slug') : header.indexOf('slug');
    const diffIdx = header.indexOf('difficulty');
    const scoreIdx = header.indexOf('score');

    if (emailIdx === -1 || slugIdx === -1) {
      throw new Error('CSV missing required columns: "email" and "problem_slug".');
    }

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let totalProjectedXp = 0;
    const preview: any[] = [];

    const difficultyMap = { easy: 10, medium: 20, hard: 40 };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim());
      const email = cols[emailIdx]?.toLowerCase();
      const slug = cols[slugIdx]?.toLowerCase();
      const diffRaw = (cols[diffIdx] || 'MEDIUM').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      const score = Number(cols[scoreIdx] || 100);

      // Match student by email
      const matchedUser = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email);
      if (!matchedUser) {
        invalidCount++;
        preview.push({ row: i, email, status: 'INVALID', reason: 'Student email not found on MSOT roster' });
        continue;
      }

      const idempotencyKey = `ext_solve_${matchedUser.id}_HACKERRANK_${slug}`;
      if (db.externalSolves.has(idempotencyKey)) {
        duplicateCount++;
        preview.push({ row: i, email, slug, status: 'DUPLICATE', reason: 'Solve already recorded' });
        continue;
      }

      const base = difficultyMap[diffRaw.toLowerCase() as keyof typeof difficultyMap] || 20;
      const awardedXp = score >= 50 ? base : 0;
      totalProjectedXp += awardedXp;
      validCount++;

      preview.push({
        row: i,
        studentId: matchedUser.id,
        email,
        slug,
        difficulty: diffRaw,
        score,
        awardedXp,
        status: 'VALID',
      });

      // Commit if not a dry-run
      if (!dryRun && awardedXp > 0) {
        const awardRes = await xpEngine.awardXP({
          studentId: matchedUser.id,
          actionType: 'CODING_PROBLEM_SOLVED',
          sourceType: 'CODING_PLATFORM',
          sourceRef: `HACKERRANK:${slug}`,
          reason: `Faculty-verified HackerRank assessment: ${slug} (${diffRaw})`,
          customAmount: awardedXp,
          idempotencyKey,
        });
        const ledgerId = awardRes.ledgerEntry.id;

        db.externalSolves.set(idempotencyKey, {
          id: idempotencyKey,
          studentId: matchedUser.id,
          provider: 'HACKERRANK',
          problemSlug: slug,
          problemTitle: slug.replace(/-/g, ' '),
          difficulty: diffRaw,
          solvedAt: new Date().toISOString(),
          source: 'FACULTY_CSV',
          awardedXp,
          awardedLedgerId: ledgerId,
          topicId: null,
          isTopicAlignedBonus: false,
          idempotencyKey,
        });
      }
    }

    return {
      validCount,
      invalidCount,
      duplicateCount,
      totalProjectedXp,
      preview,
      committed: !dryRun,
    };
  }

  // Aliases for route handlers and external callers
  syncExternalAccount = this.syncAccount.bind(this);
  generateVerificationChallenge = this.createVerificationChallenge.bind(this);
  importFacultyCodingCsv = this.importContestCsv.bind(this);
}

export const codingIntegrationService = new CodingIntegrationService();
