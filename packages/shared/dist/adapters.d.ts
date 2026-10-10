import { QuestionDifficulty, QuestionLanguage } from './types.js';
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
export declare class MockMSOTDataAdapter implements MSOTDataAdapter {
    private attendance;
    private submissions;
    private testScores;
    private clubActivities;
    constructor(attendance?: MSOTAttendanceRecord[], submissions?: MSOTSubmissionRecord[], testScores?: MSOTTestScoreRecord[], clubActivities?: MSOTClubActivityRecord[]);
    getAttendance(startDate: string, endDate: string): Promise<MSOTAttendanceRecord[]>;
    getSubmissions(startDate: string, endDate: string): Promise<MSOTSubmissionRecord[]>;
    getTestScores(testId?: string): Promise<MSOTTestScoreRecord[]>;
    getClubActivities(startDate: string, endDate: string): Promise<MSOTClubActivityRecord[]>;
}
export declare class CsvJsonMSOTDataAdapter implements MSOTDataAdapter {
    private parsedData;
    loadFromJson(jsonString: string): void;
    getAttendance(startDate: string, endDate: string): Promise<MSOTAttendanceRecord[]>;
    getSubmissions(startDate: string, endDate: string): Promise<MSOTSubmissionRecord[]>;
    getTestScores(testId?: string): Promise<MSOTTestScoreRecord[]>;
    getClubActivities(startDate: string, endDate: string): Promise<MSOTClubActivityRecord[]>;
}
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
export declare class MockLLMProvider implements LLMProvider {
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
export declare class HostedLLMProvider implements LLMProvider {
    private apiKey;
    private endpoint;
    constructor(apiKey: string, endpoint?: string);
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
export declare class OllamaLLMProvider implements LLMProvider {
    private endpoint;
    private model;
    constructor(endpoint?: string, model?: string);
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
export declare class MockSSOAdapter implements SSOAdapter {
    verifyToken(token: string): Promise<SSOUserClaims | null>;
}
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
export declare class DispatchNotificationAdapter implements NotificationChannel {
    private log;
    send(payload: NotificationPayload): Promise<boolean>;
    getSentNotifications(): NotificationPayload[];
}
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
export declare class MockCodingProfileAdapter implements CodingProfileAdapter {
    verifyOwnership(platform: CodingPlatform, handle: string, verificationToken: string): Promise<boolean>;
    fetchRecentSolves(platform: CodingPlatform, handle: string, sinceDate: string): Promise<SolvedProblem[]>;
}
