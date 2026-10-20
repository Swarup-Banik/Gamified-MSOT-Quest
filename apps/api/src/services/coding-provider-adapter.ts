import {
  CodingPlatform,
  CodingProviderCapabilities,
  SolvedCountsByDifficulty,
} from '@msot/shared';

export interface SolvedSubmission {
  problemSlug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  solvedAt: string;
  status: 'ACCEPTED' | 'REJECTED';
}

export interface GitHubDayTelemetry {
  date: string; // YYYY-MM-DD
  commitCount: number;
  linesChanged: number;
  isNonFork: boolean;
  mergedPullRequests: number;
}

export interface CodingProviderAdapter {
  readonly provider: CodingPlatform;
  readonly capabilities: CodingProviderCapabilities;
  verifyOwnership(handle: string, verificationToken: string): Promise<boolean>;
  fetchProfileStats(handle: string): Promise<{
    handle: string;
    solvedCounts: SolvedCountsByDifficulty;
    profileBio?: string;
  }>;
  fetchRecentSubmissions(handle: string, sinceDate?: string): Promise<SolvedSubmission[]>;
  fetchGitHubActivity?(handle: string, token?: string, sinceDate?: string): Promise<GitHubDayTelemetry[]>;
}

// ============================================================================
// Deterministic Mock Fixture Storage for Offline Demos and Tests
// ============================================================================

export const MOCK_FIXTURES = {
  LEETCODE: {
    // Normal active student
    alex_coder: {
      bio: 'Junior Software Engineer at MSOT | msot-verify-7f8a9b2c | Passionate about algorithms',
      stats: { easy: 14, medium: 8, hard: 2, total: 24 },
      submissions: [
        {
          problemSlug: 'two-sum',
          title: 'Two Sum',
          difficulty: 'EASY' as const,
          solvedAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
          status: 'ACCEPTED' as const,
        },
        {
          problemSlug: 'valid-parentheses',
          title: 'Valid Parentheses',
          difficulty: 'EASY' as const,
          solvedAt: new Date(Date.now() - 1800000).toISOString(), // 30m ago
          status: 'ACCEPTED' as const,
        },
        {
          problemSlug: 'lru-cache',
          title: 'LRU Cache',
          difficulty: 'MEDIUM' as const,
          solvedAt: new Date(Date.now() - 600000).toISOString(), // 10m ago
          status: 'ACCEPTED' as const,
        },
      ],
    },
    // Student with historical solves to test baseline isolation
    historic_master: {
      bio: 'Competitive Programmer | msot-verify-c84b12',
      stats: { easy: 100, medium: 200, hard: 50, total: 350 },
      submissions: [
        {
          problemSlug: 'median-of-two-sorted-arrays',
          title: 'Median of Two Sorted Arrays',
          difficulty: 'HARD' as const,
          solvedAt: new Date(Date.now() - 864000000).toISOString(), // 10 days ago (pre-link)
          status: 'ACCEPTED' as const,
        },
        {
          problemSlug: 'trapping-rain-water',
          title: 'Trapping Rain Water',
          difficulty: 'HARD' as const,
          solvedAt: new Date().toISOString(), // Newly solved today
          status: 'ACCEPTED' as const,
        },
      ],
    },
    // Bot / spammer to test velocity spike detection and daily 10-problem cap
    grind_bot: {
      bio: 'Scripted Account | msot-verify-bot99',
      stats: { easy: 50, medium: 10, hard: 0, total: 60 },
      submissions: Array.from({ length: 14 }, (_, i) => ({
        problemSlug: `problem-rapid-${i + 1}`,
        title: `Rapid Problem ${i + 1}`,
        difficulty: (i % 2 === 0 ? 'EASY' : 'MEDIUM') as 'EASY' | 'MEDIUM',
        solvedAt: new Date(Date.now() - (14 - i) * 30000).toISOString(), // 30s apart
        status: 'ACCEPTED' as const,
      })),
    },
    // Account count decrease tamper test
    tamper_account: {
      bio: 'msot-verify-tamper',
      stats: { easy: 5, medium: 2, hard: 0, total: 7 }, // Will drop in simulation
      submissions: [],
    },
    // Handle where challenge token was never added
    unverified_user: {
      bio: 'Just an empty bio without token.',
      stats: { easy: 10, medium: 5, hard: 1, total: 16 },
      submissions: [],
    },
  },

  HACKERRANK: {
    rohit_sharma: {
      bio: 'msot-verify-hr-101',
      stats: { easy: 12, medium: 6, hard: 1, total: 19 },
      submissions: [],
      badges: [
        { name: 'Problem Solving', stars: 5 },
        { name: 'Python', stars: 4 },
      ],
    },
  },

  GITHUB: {
    priya_github: {
      activity: [
        {
          date: new Date().toISOString().split('T')[0],
          commitCount: 4,
          linesChanged: 85,
          isNonFork: true,
          mergedPullRequests: 1,
        },
      ],
    },
    spammer_github: {
      activity: [
        {
          date: new Date().toISOString().split('T')[0],
          commitCount: 20,
          linesChanged: 2, // whitespace or fork
          isNonFork: false,
          mergedPullRequests: 0,
        },
      ],
    },
  },
};

// ============================================================================
// 1. GitHub Adapter (Official API & OAuth PKCE)
// ============================================================================

export class GitHubAdapter implements CodingProviderAdapter {
  readonly provider: CodingPlatform = 'GITHUB';
  readonly capabilities: CodingProviderCapabilities = {
    supportsSolvedCounts: false,
    supportsPerProblemSubmissions: false,
    supportsOwnershipProof: true,
    supportsDifficulty: false,
    official: true,
  };

  constructor(private mode: 'mock' | 'live' = 'mock') {}

  async verifyOwnership(handle: string, verificationToken: string): Promise<boolean> {
    // In mock mode, any non-fake token succeeds
    if (this.mode === 'mock') {
      return verificationToken.length > 0 && !handle.includes('invalid');
    }
    // In live mode, ownership is verified via OAuth token exchange callback
    return verificationToken.length > 0;
  }

  async fetchProfileStats(handle: string): Promise<{
    handle: string;
    solvedCounts: SolvedCountsByDifficulty;
    profileBio?: string;
  }> {
    return {
      handle,
      solvedCounts: { easy: 0, medium: 0, hard: 0, total: 0 },
      profileBio: `GitHub user @${handle}`,
    };
  }

  async fetchRecentSubmissions(handle: string): Promise<SolvedSubmission[]> {
    return [];
  }

  async fetchGitHubActivity(handle: string, token?: string, sinceDate?: string): Promise<GitHubDayTelemetry[]> {
    if (this.mode === 'mock') {
      const mock = (MOCK_FIXTURES.GITHUB as any)[handle];
      if (mock && mock.activity) {
        return mock.activity;
      }
      // Default mock activity for test accounts
      return [
        {
          date: new Date().toISOString().split('T')[0],
          commitCount: 3,
          linesChanged: 42,
          isNonFork: true,
          mergedPullRequests: 0,
        },
      ];
    }

    // Live mode: Call GitHub Events API
    try {
      const url = `https://api.github.com/users/${encodeURIComponent(handle)}/events/public`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub API HTTP ${res.status}`);
      }
      const events: any[] = await res.json();
      const today = new Date().toISOString().split('T')[0];
      const pushEvents = events.filter(e => e.type === 'PushEvent' && e.created_at?.startsWith(today));
      const prEvents = events.filter(e => e.type === 'PullRequestEvent' && e.payload?.action === 'closed' && e.payload?.pull_request?.merged);

      return [
        {
          date: today,
          commitCount: pushEvents.length,
          linesChanged: pushEvents.length * 20, // Estimated lines
          isNonFork: true,
          mergedPullRequests: prEvents.length,
        },
      ];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// 2. LeetCode Adapter (Community GraphQL & Public Bio Challenge)
// ============================================================================

export class LeetCodeAdapter implements CodingProviderAdapter {
  readonly provider: CodingPlatform = 'LEETCODE';
  readonly capabilities: CodingProviderCapabilities = {
    supportsSolvedCounts: true,
    supportsPerProblemSubmissions: true,
    supportsOwnershipProof: true,
    supportsDifficulty: true,
    official: false,
  };

  constructor(private mode: 'mock' | 'live' = 'mock') {}

  async verifyOwnership(handle: string, verificationToken: string): Promise<boolean> {
    if (this.mode === 'mock') {
      const fixture = (MOCK_FIXTURES.LEETCODE as any)[handle];
      if (fixture && fixture.bio) {
        if (fixture.bio.includes(verificationToken)) return true;
        if (fixture.bio.includes('msot-verify-') && verificationToken.startsWith('msot-verify-') && !handle.includes('unverified')) {
          return true;
        }
        return false;
      }
      // Fallback for custom test handles
      return verificationToken.length > 0 && !handle.includes('fake') && !handle.includes('unverified');
    }

    // Live mode: GraphQL query to LeetCode public profile endpoint
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            profile {
              aboutMe
            }
          }
        }
      `;
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
        },
        body: JSON.stringify({ query, variables: { username: handle } }),
      });
      if (!res.ok) return false;
      const data: any = await res.json();
      const aboutMe = data?.data?.matchedUser?.profile?.aboutMe || '';
      return aboutMe.includes(verificationToken);
    } catch {
      return false;
    }
  }

  async fetchProfileStats(handle: string): Promise<{
    handle: string;
    solvedCounts: SolvedCountsByDifficulty;
    profileBio?: string;
  }> {
    if (this.mode === 'mock') {
      const fixture = (MOCK_FIXTURES.LEETCODE as any)[handle];
      if (fixture) {
        return {
          handle,
          solvedCounts: { ...fixture.stats },
          profileBio: fixture.bio,
        };
      }
      return {
        handle,
        solvedCounts: { easy: 5, medium: 2, hard: 0, total: 7 },
        profileBio: `Mock LeetCode profile for ${handle}`,
      };
    }

    // Live GraphQL query
    try {
      const query = `
        query getUserStats($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              aboutMe
            }
          }
        }
      `;
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
        },
        body: JSON.stringify({ query, variables: { username: handle } }),
      });
      if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
      const data: any = await res.json();
      const acNums = data?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
      const counts: Record<string, number> = {};
      acNums.forEach((s: any) => {
        counts[s.difficulty.toUpperCase()] = s.count;
      });

      return {
        handle,
        solvedCounts: {
          easy: counts['EASY'] || 0,
          medium: counts['MEDIUM'] || 0,
          hard: counts['HARD'] || 0,
          total: counts['ALL'] || (counts['EASY'] || 0) + (counts['MEDIUM'] || 0) + (counts['HARD'] || 0),
        },
        profileBio: data?.data?.matchedUser?.profile?.aboutMe || '',
      };
    } catch (err: any) {
      throw new Error(`LeetCode profile query failed: ${err.message}`);
    }
  }

  async fetchRecentSubmissions(handle: string): Promise<SolvedSubmission[]> {
    if (this.mode === 'mock') {
      const fixture = (MOCK_FIXTURES.LEETCODE as any)[handle];
      if (fixture && fixture.submissions) {
        return fixture.submissions;
      }
      return [
        {
          problemSlug: 'reverse-linked-list',
          title: 'Reverse Linked List',
          difficulty: 'EASY',
          solvedAt: new Date().toISOString(),
          status: 'ACCEPTED',
        },
      ];
    }

    // Live GraphQL recentAcSubmissions query
    try {
      const query = `
        query getRecentAc($username: String!) {
          recentAcSubmissionList(username: $username, limit: 15) {
            titleSlug
            title
            timestamp
          }
        }
      `;
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
        },
        body: JSON.stringify({ query, variables: { username: handle } }),
      });
      if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
      const data: any = await res.json();
      const list = data?.data?.recentAcSubmissionList || [];

      return list.map((item: any) => ({
        problemSlug: item.titleSlug,
        title: item.title,
        difficulty: 'MEDIUM' as const, // Default difficulty if not returned in list
        solvedAt: new Date(Number(item.timestamp) * 1000).toISOString(),
        status: 'ACCEPTED' as const,
      }));
    } catch {
      return [];
    }
  }
}

// ============================================================================
// 3. HackerRank Adapter (Public Badges & Faculty CSV Import Primary)
// ============================================================================

export class HackerRankAdapter implements CodingProviderAdapter {
  readonly provider: CodingPlatform = 'HACKERRANK';
  readonly capabilities: CodingProviderCapabilities = {
    supportsSolvedCounts: true,
    supportsPerProblemSubmissions: false,
    supportsOwnershipProof: false, // Recommended to use bio challenge or faculty import
    supportsDifficulty: false,
    official: false,
  };

  constructor(private mode: 'mock' | 'live' = 'mock') {}

  async verifyOwnership(handle: string, verificationToken: string): Promise<boolean> {
    if (this.mode === 'mock') {
      const fixture = (MOCK_FIXTURES.HACKERRANK as any)[handle];
      if (fixture && fixture.bio) {
        if (fixture.bio.includes(verificationToken)) return true;
        if (fixture.bio.includes('msot-verify-') && verificationToken.startsWith('msot-verify-') && !handle.includes('unverified')) {
          return true;
        }
        return false;
      }
      return verificationToken.length > 0 && !handle.includes('fake') && !handle.includes('unverified');
    }
    // Live scraping fallback
    try {
      const res = await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/profile`, {
        headers: {
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
        },
      });
      if (!res.ok) return false;
      const data: any = await res.json();
      const bio = data?.model?.short_bio || '';
      return bio.includes(verificationToken);
    } catch {
      return false;
    }
  }

  async fetchProfileStats(handle: string): Promise<{
    handle: string;
    solvedCounts: SolvedCountsByDifficulty;
    profileBio?: string;
  }> {
    if (this.mode === 'mock') {
      const fixture = (MOCK_FIXTURES.HACKERRANK as any)[handle];
      if (fixture) {
        return {
          handle,
          solvedCounts: { ...fixture.stats },
          profileBio: fixture.bio,
        };
      }
      return {
        handle,
        solvedCounts: { easy: 8, medium: 2, hard: 0, total: 10 },
        profileBio: `Mock HackerRank profile for ${handle}`,
      };
    }

    try {
      const res = await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/badges`, {
        headers: {
          'User-Agent': 'MSOT-Quest-Learning-Platform/1.0 (+https://msot.edu.in)',
        },
      });
      if (!res.ok) throw new Error(`HackerRank HTTP ${res.status}`);
      const data: any = await res.json();
      const totalStars = (data?.models || []).reduce((acc: number, b: any) => acc + (b.stars || 0), 0);
      return {
        handle,
        solvedCounts: { easy: totalStars * 2, medium: 0, hard: 0, total: totalStars * 2 },
      };
    } catch (err: any) {
      throw new Error(`HackerRank fetch failed: ${err.message}`);
    }
  }

  async fetchRecentSubmissions(handle: string): Promise<SolvedSubmission[]> {
    // HackerRank public API does not provide submission history; returns empty array.
    // Relies on faculty CSV import for per-problem and contest telemetry.
    return [];
  }
}

// Factory Helper
export function getProviderAdapter(
  platform: CodingPlatform,
  mode: 'mock' | 'live' = (process.env.PROVIDER_MODE as any) || 'mock'
): CodingProviderAdapter {
  switch (platform) {
    case 'GITHUB':
      return new GitHubAdapter(mode);
    case 'LEETCODE':
      return new LeetCodeAdapter(mode);
    case 'HACKERRANK':
      return new HackerRankAdapter(mode);
    default:
      throw new Error(`Unsupported coding provider: ${platform}`);
  }
}
