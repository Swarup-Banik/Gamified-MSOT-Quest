"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCodingProfileAdapter = exports.DispatchNotificationAdapter = exports.MockSSOAdapter = exports.OllamaLLMProvider = exports.HostedLLMProvider = exports.MockLLMProvider = exports.CsvJsonMSOTDataAdapter = exports.MockMSOTDataAdapter = void 0;
class MockMSOTDataAdapter {
    attendance;
    submissions;
    testScores;
    clubActivities;
    constructor(attendance = [], submissions = [], testScores = [], clubActivities = []) {
        this.attendance = attendance;
        this.submissions = submissions;
        this.testScores = testScores;
        this.clubActivities = clubActivities;
    }
    async getAttendance(startDate, endDate) {
        return this.attendance.filter(a => a.classDate >= startDate && a.classDate <= endDate && a.isPresent);
    }
    async getSubmissions(startDate, endDate) {
        return this.submissions.filter(s => s.submittedAt >= startDate && s.submittedAt <= endDate);
    }
    async getTestScores(testId) {
        if (!testId)
            return this.testScores;
        return this.testScores.filter(t => t.testId === testId);
    }
    async getClubActivities(startDate, endDate) {
        return this.clubActivities.filter(c => c.activityDate >= startDate && c.activityDate <= endDate);
    }
}
exports.MockMSOTDataAdapter = MockMSOTDataAdapter;
class CsvJsonMSOTDataAdapter {
    parsedData = {
        attendance: [],
        submissions: [],
        testScores: [],
        clubActivities: [],
    };
    loadFromJson(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.parsedData = {
                attendance: data.attendance || [],
                submissions: data.submissions || [],
                testScores: data.testScores || [],
                clubActivities: data.clubActivities || [],
            };
        }
        catch (e) {
            console.error('Failed to parse MSOT JSON payload', e);
        }
    }
    async getAttendance(startDate, endDate) {
        return this.parsedData.attendance.filter(a => a.classDate >= startDate && a.classDate <= endDate && a.isPresent);
    }
    async getSubmissions(startDate, endDate) {
        return this.parsedData.submissions.filter(s => s.submittedAt >= startDate && s.submittedAt <= endDate);
    }
    async getTestScores(testId) {
        if (!testId)
            return this.parsedData.testScores;
        return this.parsedData.testScores.filter(t => t.testId === testId);
    }
    async getClubActivities(startDate, endDate) {
        return this.parsedData.clubActivities.filter(c => c.activityDate >= startDate && c.activityDate <= endDate);
    }
}
exports.CsvJsonMSOTDataAdapter = CsvJsonMSOTDataAdapter;
class MockLLMProvider {
    async generateQuestions(params) {
        const list = [];
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
    async explainMistake(params) {
        if (params.language === 'HINGLISH') {
            return `Aapne choose kiya "${params.studentChoice}", par sahi answer hai "${params.correctOption}". Is topic me foundational property ye ensure karti hai ki constraints satisfy ho. Agli baar dhyan rahein!`;
        }
        return `You selected "${params.studentChoice}", but the correct answer is "${params.correctOption}". Notice how the core definition guarantees safety and prevents edge-case runtime failures. Keep practicing!`;
    }
}
exports.MockLLMProvider = MockLLMProvider;
class HostedLLMProvider {
    apiKey;
    endpoint;
    constructor(apiKey, endpoint = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }
    async generateQuestions(params) {
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
        }
        catch {
            return new MockLLMProvider().generateQuestions(params);
        }
    }
    async explainMistake(params) {
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
        }
        catch {
            return new MockLLMProvider().explainMistake(params);
        }
    }
}
exports.HostedLLMProvider = HostedLLMProvider;
class OllamaLLMProvider {
    endpoint;
    model;
    constructor(endpoint = 'http://localhost:11434', model = 'llama3') {
        this.endpoint = endpoint;
        this.model = model;
    }
    async generateQuestions(params) {
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
        }
        catch {
            return new MockLLMProvider().generateQuestions(params);
        }
    }
    async explainMistake(params) {
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
        }
        catch {
            return new MockLLMProvider().explainMistake(params);
        }
    }
}
exports.OllamaLLMProvider = OllamaLLMProvider;
class MockSSOAdapter {
    async verifyToken(token) {
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
exports.MockSSOAdapter = MockSSOAdapter;
class DispatchNotificationAdapter {
    log = [];
    async send(payload) {
        this.log.push({ ...payload });
        return true;
    }
    getSentNotifications() {
        return [...this.log];
    }
}
exports.DispatchNotificationAdapter = DispatchNotificationAdapter;
class MockCodingProfileAdapter {
    async verifyOwnership(platform, handle, verificationToken) {
        // In demo/testing, handles containing 'verified' or matching challenge token return true
        return verificationToken.length > 0 && !handle.includes('fake');
    }
    async fetchRecentSolves(platform, handle, sinceDate) {
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
exports.MockCodingProfileAdapter = MockCodingProfileAdapter;
