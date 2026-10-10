const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${res.status}: Failed to fetch ${path}`);
  }
  return res.json();
}

export const api = {
  // Auth & Profile
  login: (email: string, role?: string) =>
    fetchJson<{ token: string; user: any; profile: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  getProfile: (studentId: string = 'student_1') =>
    fetchJson<{ profile: any; user: any }>(`/student/profile?studentId=${studentId}`),

  getXpHistory: (studentId: string = 'student_1') =>
    fetchJson<{ history: any[] }>(`/student/xp-history?studentId=${studentId}`),

  toggleAnonymous: (studentId: string, isAnonymous: boolean) =>
    fetchJson<{ success: boolean; user: any }>('/student/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ studentId, isAnonymous }),
    }),

  // Daily Run & Quizzes
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
    fetchJson<{ catalog: any[] }>(`/cosmetics/catalog?studentId=${studentId}`),

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
