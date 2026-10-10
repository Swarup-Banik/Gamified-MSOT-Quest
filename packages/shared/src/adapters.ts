import { Question, QuestionDifficulty, QuestionLanguage } from './types.js';

// ==========================================
// 1. MSOT Academic Data Adapter Interface
// ==========================================

export interface MSOTAttendanceRecord {
  studentId: string;
  courseCode: string;
  classDate: string;
  isPresent: boolean;
  verifiedByFacultyId: string;
}

export interface MSOTSubmissionRecord {
  studentId: string;
  assignmentId: string;
  courseCode: string;
  submittedAt: string;
  dueAt: string;
  isOnTime: boolean;
}

export interface MSOTTestScoreRecord {
  studentId: string;
  testId: string;
  courseCode: string;
  testDate: string;
  maxScore: number;
  obtainedScore: number;
  scorePercentage: number;
}

export interface MSOTClubActivityRecord {
  studentId: string;
  clubName: string;
  activityDate: string;
  hoursSpent: number;
  verifiedByCoordinatorId: string;
}

/**
 * MSOTDataAdapter provides read-only ingestion from official university sources.
 * STRICT NON-NEGOTIABLE RULE: This interface contains ONLY read methods.
 * No write methods exist anywhere to alter official grades or attendance.
 */
export interface MSOTDataAdapter {
  getAttendance(startDate: string, endDate: string): Promise<MSOTAttendanceRecord[]>;
  getSubmissions(startDate: string, endDate: string): Promise<MSOTSubmissionRecord[]>;
  getTestScores(testId?: string): Promise<MSOTTestScoreRecord[]>;
  getClubActivities(startDate: string, endDate: string): Promise<MSOTClubActivityRecord[]>;
}

export class MockMSOTDataAdapter implements MSOTDataAdapter {
  constructor(
    private attendance: MSOTAttendanceRecord[] = [],
    private submissions: MSOTSubmissionRecord[] = [],
    private testScores: MSOTTestScoreRecord[] = [],
    private clubActivities: MSOTClubActivityRecord[] = []
  ) {}

  async getAttendance(startDate: string, endDate: string): Promise<MSOTAttendanceRecord[]> {
    return this.attendance.filter(a => a.classDate >= startDate && a.classDate <= endDate && a.isPresent);
  }

  async getSubmissions(startDate: string, endDate: string): Promise<MSOTSubmissionRecord[]> {
    return this.submissions.filter(s => s.submittedAt >= startDate && s.submittedAt <= endDate);
  }

  async getTestScores(testId?: string): Promise<MSOTTestScoreRecord[]> {
    if (!testId) return this.testScores;
    return this.testScores.filter(t => t.testId === testId);
  }

  async getClubActivities(startDate: string, endDate: string): Promise<MSOTClubActivityRecord[]> {
    return this.clubActivities.filter(c => c.activityDate >= startDate && c.activityDate <= endDate);
  }
}

export class CsvJsonMSOTDataAdapter implements MSOTDataAdapter {
  private parsedData: {
    attendance: MSOTAttendanceRecord[];
    submissions: MSOTSubmissionRecord[];
    testScores: MSOTTestScoreRecord[];
    clubActivities: MSOTClubActivityRecord[];
  } = {
    attendance: [],
    submissions: [],
    testScores: [],
    clubActivities: [],
  };

  loadFromJson(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      this.parsedData = {
        attendance: data.attendance || [],
        submissions: data.submissions || [],
        testScores: data.testScores || [],
        clubActivities: data.clubActivities || [],
      };
    } catch (e) {
      console.error('Failed to parse MSOT JSON payload', e);
    }
  }

  async getAttendance(startDate: string, endDate: string): Promise<MSOTAttendanceRecord[]> {
    return this.parsedData.attendance.filter(a => a.classDate >= startDate && a.classDate <= endDate && a.isPresent);
  }

  async getSubmissions(startDate: string, endDate: string): Promise<MSOTSubmissionRecord[]> {
    return this.parsedData.submissions.filter(s => s.submittedAt >= startDate && s.submittedAt <= endDate);
  }

  async getTestScores(testId?: string): Promise<MSOTTestScoreRecord[]> {
    if (!testId) return this.parsedData.testScores;
    return this.parsedData.testScores.filter(t => t.testId === testId);
  }

  async getClubActivities(startDate: string, endDate: string): Promise<MSOTClubActivityRecord[]> {
    return this.parsedData.clubActivities.filter(c => c.activityDate >= startDate && c.activityDate <= endDate);
  }
}

// ==========================================
// 2. LLM Provider Adapter Interface
// ==========================================

export interface GeneratedQuestionSpec {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: QuestionDifficulty;
  language: QuestionLanguage;
  explanation: string;
  explanationHinglish?: string;
}

export interface LLMProvider {
  generateQuestions(params: {
    topicTitle: string;
    courseTitle: string;
    count: number;
    difficulty: QuestionDifficulty;
    language: QuestionLanguage;
  }): Promise<GeneratedQuestionSpec[]>;

  explainMistake(params: {
    questionPrompt: string;
    options: string[];
    correctOption: string;
    studentChoice: string;
    language: QuestionLanguage;
  }): Promise<string>;
}

export class MockLLMProvider implements LLMProvider {
  async generateQuestions(params: {
    topicTitle: string;
    courseTitle: string;
    count: number;
    difficulty: QuestionDifficulty;
    language: QuestionLanguage;
  }): Promise<GeneratedQuestionSpec[]> {
    const list: GeneratedQuestionSpec[] = [];
    for (let i = 1; i <= params.count; i++) {
      list.push({
        prompt: `In ${params.topicTitle} (${params.courseTitle}), what is the primary purpose of concept #${i}?`,
        options: [
          `Optimizes runtime complexity for ${params.topicTitle}`,
          `Bypasses memory allocation checks`,
          `Forces synchronous blocking execution`,
          `Resets thread safety locks`,
        ],
        correctOptionIndex: 0,
        difficulty: params.difficulty,
        language: params.language,
        explanation: `Concept #${i} improves throughput and runtime efficiency according to official syllabus benchmarks.`,
        explanationHinglish: `Yeh concept throughput aur runtime performance badhata hai as per standard syllabus.`,
      });
    }
    return list;
  }

  async explainMistake(params: {
    questionPrompt: string;
    options: string[];
    correctOption: string;
    studentChoice: string;
    language: QuestionLanguage;
  }): Promise<string> {
    if (params.language === 'HINGLISH') {
      return `Aapne choose kiya "${params.studentChoice}", par sahi answer hai "${params.correctOption}". Is topic me foundational property ye ensure karti hai ki constraints satisfy ho. Agli baar dhyan rahein!`;
    }
    return `You selected "${params.studentChoice}", but the correct answer is "${params.correctOption}". Notice how the core definition guarantees safety and prevents edge-case runtime failures. Keep practicing!`;
  }
}

export class HostedLLMProvider implements LLMProvider {
  constructor(private apiKey: string, private endpoint: string = 'https://api.openai.com/v1') {}

  async generateQuestions(params: {
    topicTitle: string;
    courseTitle: string;
    count: number;
    difficulty: QuestionDifficulty;
    language: QuestionLanguage;
  }): Promise<GeneratedQuestionSpec[]> {
    // Falls back gracefully to structured Mock generation if apiKey is omitted or unreachable
    if (!this.apiKey) {
      return new MockLLMProvider().generateQuestions(params);
    }
    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an educational assessment expert. Return JSON array of questions.',
            },
            {
              role: 'user',
              content: `Generate ${params.count} ${params.difficulty} questions on topic "${params.topicTitle}" for course "${params.courseTitle}" in language ${params.language}.`,
            },
          ],
        }),
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch {
      return new MockLLMProvider().generateQuestions(params);
    }
  }

  async explainMistake(params: {
    questionPrompt: string;
    options: string[];
    correctOption: string;
    studentChoice: string;
    language: QuestionLanguage;
  }): Promise<string> {
    if (!this.apiKey) {
      return new MockLLMProvider().explainMistake(params);
    }
    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Explain why the selected option is wrong without revealing questions outside this context.',
            },
            {
              role: 'user',
              content: `Question: ${params.questionPrompt}. Student chose: ${params.studentChoice}. Correct: ${params.correctOption}. Language: ${params.language}.`,
            },
          ],
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    } catch {
      return new MockLLMProvider().explainMistake(params);
    }
  }
}

export class OllamaLLMProvider implements LLMProvider {
  constructor(private endpoint: string = 'http://localhost:11434', private model: string = 'llama3') {}

  async generateQuestions(params: {
    topicTitle: string;
    courseTitle: string;
    count: number;
    difficulty: QuestionDifficulty;
    language: QuestionLanguage;
  }): Promise<GeneratedQuestionSpec[]> {
    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `Generate ${params.count} multiple choice questions for ${params.topicTitle}. Format strictly as JSON.`,
          stream: false,
        }),
      });
      const data = await res.json();
      return JSON.parse(data.response);
    } catch {
      return new MockLLMProvider().generateQuestions(params);
    }
  }

  async explainMistake(params: {
    questionPrompt: string;
    options: string[];
    correctOption: string;
    studentChoice: string;
    language: QuestionLanguage;
  }): Promise<string> {
    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `Explain mistake for: ${params.questionPrompt}. Student picked: ${params.studentChoice}. Correct: ${params.correctOption}.`,
          stream: false,
        }),
      });
      const data = await res.json();
      return data.response;
    } catch {
      return new MockLLMProvider().explainMistake(params);
    }
  }
}

// ==========================================
// 3. SSO Adapter Interface
// ==========================================

export interface SSOUserClaims {
  ssoUserId: string;
  email: string;
  name: string;
  campusCode: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
}

export interface SSOAdapter {
  verifyToken(token: string): Promise<SSOUserClaims | null>;
}

export class MockSSOAdapter implements SSOAdapter {
  async verifyToken(token: string): Promise<SSOUserClaims | null> {
    if (token.startsWith('msot-sso-')) {
      const parts = token.split('-');
      const id = parts[2] || 'student101';
      return {
        ssoUserId: id,
        email: `${id}@msot.edu.in`,
        name: `MSOT Scholar ${id}`,
        campusCode: 'CAMPUS_MAIN',
        role: 'STUDENT',
      };
    }
    return null;
  }
}

// ==========================================
// 4. Notification Channel Interface
// ==========================================

export type NotificationChannelType = 'IN_APP' | 'WEB_PUSH' | 'EMAIL' | 'BOT';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
  channel: NotificationChannelType;
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<boolean>;
}

export class DispatchNotificationAdapter implements NotificationChannel {
  private log: NotificationPayload[] = [];

  async send(payload: NotificationPayload): Promise<boolean> {
    this.log.push({ ...payload });
    return true;
  }

  getSentNotifications(): NotificationPayload[] {
    return [...this.log];
  }
}

// ==========================================
// 5. Coding Profile Adapter Interface
// ==========================================

export type CodingPlatform = 'LEETCODE' | 'CODEFORCES' | 'GITHUB';

export interface SolvedProblem {
  platform: CodingPlatform;
  problemId: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  solvedAt: string;
}

export interface CodingProfileAdapter {
  verifyOwnership(platform: CodingPlatform, handle: string, verificationToken: string): Promise<boolean>;
  fetchRecentSolves(platform: CodingPlatform, handle: string, sinceDate: string): Promise<SolvedProblem[]>;
}

export class MockCodingProfileAdapter implements CodingProfileAdapter {
  async verifyOwnership(platform: CodingPlatform, handle: string, verificationToken: string): Promise<boolean> {
    // In demo/testing, handles containing 'verified' or matching challenge token return true
    return verificationToken.length > 0 && !handle.includes('fake');
  }

  async fetchRecentSolves(platform: CodingPlatform, handle: string, sinceDate: string): Promise<SolvedProblem[]> {
    if (handle.includes('fake') || handle.includes('abuser')) {
      return [];
    }
    return [
      {
        platform,
        problemId: `${platform}_101`,
        title: 'Two Sum Variant',
        difficulty: 'EASY',
        solvedAt: new Date().toISOString(),
      },
      {
        platform,
        problemId: `${platform}_202`,
        title: 'LRU Cache Design',
        difficulty: 'MEDIUM',
        solvedAt: new Date().toISOString(),
      },
    ];
  }
}
