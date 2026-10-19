const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

let accessToken: string | null = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('msot_access_token');
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('msot_access_token', token);
    } else {
      localStorage.removeItem('msot_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Send httpOnly cookies for rotating refresh tokens
    headers,
  });

  if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    // Attempt token refresh via httpOnly cookie
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        const retryRes = await fetch(url, { ...options, credentials: 'include', headers });
        if (retryRes.ok) return retryRes.json();
      }
    } catch {
      // Refresh failed
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${res.status}: Failed to fetch ${path}`);
  }
  return res.json();
}

export const api = {
  // ----------------------------------------------------
  // Identity, Authentication & Lifecycle
  // ----------------------------------------------------
  register: (payload: {
    email: string;
    password: string;
    name: string;
    rollNumber?: string;
    campusId?: string;
    batchId?: string;
    sectionId?: string;
  }) => fetchJson<{ success: boolean; status: string; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  claimInvitation: (payload: { token: string; password: string; name?: string }) =>
    fetchJson<{ success: boolean; message: string; user: any; profile: any; accessToken: string }>('/auth/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload: { token?: string; code?: string; email?: string }) =>
    fetchJson<{ success: boolean; message: string; user: any }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendVerification: (email: string) =>
    fetchJson<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload: { email: string; password?: string; role?: string; totpCode?: string; backupCode?: string }) =>
    fetchJson<{
      success: boolean;
      mfaRequired?: boolean;
      ticket?: string;
      accessToken: string;
      user: any;
      profile: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleSSO: (idToken: string) =>
    fetchJson<{ success: boolean; accessToken: string; user: any; profile: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  logout: () =>
    fetchJson<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  logoutAll: () =>
    fetchJson<{ success: boolean }>('/auth/logout-all', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    fetchJson<{ user: any; profile: any; activeSessionCount: number }>('/auth/me'),

  forgotPassword: (email: string) =>
    fetchJson<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    fetchJson<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // DPDP Act Consent
  recordConsent: (payload: { noticeVersion: string; acceptedPurposeIds: string[] }) =>
    fetchJson<{ success: boolean; consentRecord: any }>('/auth/consent', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Profile Setup Wizard
  completeProfileSetup: (payload: {
    avatarId: string;
    displayName: string;
    companionChoice: string;
    preferredLanguage: 'EN' | 'HINGLISH';
  }) => fetchJson<{ success: boolean; user: any; profile: any }>('/auth/profile-setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Sessions Management
  getSessions: () =>
    fetchJson<{ sessions: any[] }>('/auth/sessions'),

  revokeSession: (sessionId: string) =>
    fetchJson<{ success: boolean }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    }),

  // Multi-Factor Authentication (TOTP)
  setupMfa: () =>
    fetchJson<{ secret: string; uri: string; backupCodes: string[] }>('/auth/mfa/setup', {
      method: 'POST',
    }),

  enableMfa: (code: string) =>
    fetchJson<{ success: boolean; backupCodes: string[] }>('/auth/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  disableMfa: (payload: { password?: string; totpCode?: string }) =>
    fetchJson<{ success: boolean }>('/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // DPDP Data Rights
  exportData: () =>
    fetchJson<any>('/auth/dpdp/export'),

  deleteAccount: (payload: { reason?: string }) =>
    fetchJson<{ success: boolean; message: string; scheduledDeletionAt: string }>('/auth/dpdp/delete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ----------------------------------------------------
  // Admin & Faculty Roster & Approval Management
  // ----------------------------------------------------
  previewRoster: (csvContent: string) =>
    fetchJson<{
      totalRows: number;
      validCount: number;
      invalidCount: number;
      preview: any[];
      errors: any[];
    }>('/admin/roster/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),

  importRoster: (rows: any[]) =>
    fetchJson<{ success: boolean; batchId: string; importedCount: number }>('/admin/roster/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),

  undoRoster: (batchId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/admin/roster/undo/${batchId}`, {
      method: 'POST',
    }),

  getPendingApprovals: () =>
    fetchJson<{ requests: any[] }>('/admin/approvals'),

  reviewApproval: (payload: { requestId: string; decision: 'APPROVED' | 'REJECTED'; notes?: string }) =>
    fetchJson<{ success: boolean; message: string }>('/admin/approvals/review', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getUsersDirectory: (params?: { role?: string; status?: string; campusId?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<{ users: any[] }>(`/admin/users${q ? `?${q}` : ''}`);
  },

  updateUserStatus: (payload: { userId: string; status: string; reason: string }) =>
    fetchJson<{ success: boolean; user: any }>('/admin/users/status', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateUserRole: (payload: { userId: string; role: string; reason: string }) =>
    fetchJson<{ success: boolean; user: any }>('/admin/users/role', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getAuditLogs: (params?: { actorId?: string; action?: string; targetType?: string; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<{ logs: any[] }>(`/admin/audit-logs${q ? `?${q}` : ''}`);
  },

  // ----------------------------------------------------
  // Student Profile, Gameplay & Quizzes
  // ----------------------------------------------------
  getProfile: (studentId: string = 'student_1') =>
    fetchJson<{ profile: any; user: any }>(`/student/profile?studentId=${studentId}`),

  getXpHistory: (studentId: string = 'student_1') =>
    fetchJson<{ history: any[] }>(`/student/xp-history?studentId=${studentId}`),

  toggleAnonymous: (studentId: string, isAnonymous: boolean) =>
    fetchJson<{ success: boolean; user: any }>('/student/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ studentId, isAnonymous }),
    }),

  getTodayQuiz: (studentId: string = 'student_1', language: string = 'EN') =>
    fetchJson<{ questions: any[]; alreadyCompleted: boolean; date: string }>(
      `/quiz/today?studentId=${studentId}&language=${language}`
    ),

  submitQuiz: (studentId: string, answers: any[]) =>
    fetchJson<any>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        answers,
        clientSubmissionToken: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      }),
    }),

  // Mistake Monsters
  getActiveMonsters: (studentId: string = 'student_1') =>
    fetchJson<{ monsters: any[] }>(`/monsters/active?studentId=${studentId}`),

  fightMonster: (monsterId: string, studentId: string, selectedOption: number) =>
    fetchJson<any>(`/monsters/${monsterId}/fight`, {
      method: 'POST',
      body: JSON.stringify({ studentId, selectedOption }),
    }),

  getMonsterCodex: (studentId: string = 'student_1') =>
    fetchJson<{ codex: any[]; completionRate: number }>(`/monsters/codex?studentId=${studentId}`),

  // Leagues & Social
  getWeeklyLeague: (studentId: string = 'student_1') =>
    fetchJson<{ standings: any[]; tier: string; weekNumber: number; daysRemaining: number }>(
      `/leagues/weekly?studentId=${studentId}`
    ),

  getImprovementLeaderboard: () =>
    fetchJson<{ standings: any[] }>('/leagues/improvement'),

  getGhostMode: (studentId: string = 'student_1') =>
    fetchJson<any>(`/leagues/ghost?studentId=${studentId}`),

  // Team Battles & Raid Boss
  getActiveBattles: () =>
    fetchJson<{ events: any[] }>('/battles/active'),

  submitBattlePoints: (eventId: string, studentId: string, teamId: string, points: number) =>
    fetchJson<any>('/battles/submit', {
      method: 'POST',
      body: JSON.stringify({ eventId, studentId, teamId, points }),
    }),

  // Cosmetics & Mystery Chests
  getCosmeticsCatalog: (studentId: string = 'student_1') =>
    fetchJson<{
      catalog: any[];
      equippedLoadout: any;
      completionBySlot: Record<string, { owned: number; total: number; percent: number }>;
      totalCompletionPercent: number;
      spendableShards: number;
    }>(`/cosmetics/catalog?studentId=${studentId}`),

  getMyCosmetics: (studentId: string = 'student_1') =>
    fetchJson<{
      cosmetics: any[];
      equippedLoadout: any;
      spendableShards: number;
    }>(`/me/cosmetics?studentId=${studentId}`),

  equipCosmetic: (cosmeticId: string, studentId?: string, slot?: string) =>
    fetchJson<{ success: boolean; equippedLoadout: any; message: string }>('/me/cosmetics/equip', {
      method: 'POST',
      body: JSON.stringify({ cosmeticId, studentId, slot }),
    }),

  unequipCosmetic: (slot: string, studentId?: string) =>
    fetchJson<{ success: boolean; equippedLoadout: any }>('/me/cosmetics/unequip', {
      method: 'POST',
      body: JSON.stringify({ slot, studentId }),
    }),

  getChests: (studentId: string = 'student_1') =>
    fetchJson<{ chests: any[]; pity: any }>(`/chests?studentId=${studentId}`),

  openChest: (chestId: string, studentId: string) =>
    fetchJson<any>(`/chests/${chestId}/open`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  craftCosmetic: (studentId: string, cosmeticId: string) =>
    fetchJson<any>('/cosmetics/craft', {
      method: 'POST',
      body: JSON.stringify({ studentId, cosmeticId }),
    }),

  // Game Master Demo Helpers
  grantRandomCosmetic: (studentId: string = 'student_1') =>
    fetchJson<any>('/admin/demo/grant-cosmetic', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  grantDemoChest: (tier: string = 'GOLDEN', studentId: string = 'student_1') =>
    fetchJson<any>('/admin/demo/grant-chest', {
      method: 'POST',
      body: JSON.stringify({ tier, studentId }),
    }),

  resetStarterLoadout: (studentId: string = 'student_1') =>
    fetchJson<any>('/admin/demo/reset-starter-loadout', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  // Faculty Dashboard
  getFacultyEngagement: () =>
    fetchJson<any>('/faculty/engagement'),

  getFacultyStruggles: () =>
    fetchJson<any[]>('/faculty/struggles'),

  getFacultyQuietStudents: () =>
    fetchJson<any[]>('/faculty/quiet-students'),

  sendNudge: (studentId: string, facultyId: string = 'faculty_sarah') =>
    fetchJson<any>('/faculty/nudge', {
      method: 'POST',
      body: JSON.stringify({ studentId, facultyId }),
    }),

  getQuestionQueue: () =>
    fetchJson<{ questions: any[] }>('/faculty/questions/queue'),

  reviewQuestion: (payload: any) =>
    fetchJson<any>('/faculty/questions/review', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin XP Rules & Anti-Gaming
  getXpRules: () =>
    fetchJson<{ rules: any[]; versions: any[] }>('/admin/xp-rules'),

  updateXpRule: (id: string, updates: any, reason: string) =>
    fetchJson<any>(`/admin/xp-rules/${id}`, {
      method: 'POST',
      body: JSON.stringify({ updates, reason, changedByUserId: 'admin_1' }),
    }),

  getAnomalies: () =>
    fetchJson<{ anomalies: any[] }>('/admin/anomalies'),

  voidXp: (originalEntryId: string, reason: string) =>
    fetchJson<any>('/faculty/void-xp', {
      method: 'POST',
      body: JSON.stringify({ originalEntryId, voidByUserId: 'faculty_sarah', reason }),
    }),

  // AI Study Buddy
  explainMistake: (payload: any) =>
    fetchJson<{ explanation: string }>('/study-buddy/explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Pilot Feedback
  submitFeedback: (payload: any) =>
    fetchJson<any>('/pilot/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
