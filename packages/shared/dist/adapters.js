"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMailAdapter = exports.MockGoogleSSOProvider = exports.MockCodingProfileAdapter = exports.DispatchNotificationAdapter = exports.MockSSOAdapter = exports.OllamaLLMProvider = exports.HostedLLMProvider = exports.MockLLMProvider = exports.CsvJsonMSOTDataAdapter = exports.MockMSOTDataAdapter = void 0;
exports.parseRosterCsv = parseRosterCsv;
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
class MockGoogleSSOProvider {
    allowedDomains;
    constructor(allowedDomains = ['msot.edu.in']) {
        this.allowedDomains = allowedDomains;
    }
    async verifyIdToken(token) {
        if (!token || token.startsWith('invalid'))
            return null;
        // Supports demo token: google-token-email@msot.edu.in
        const email = token.includes('@') ? token.replace(/^google-token-/, '') : 'student@msot.edu.in';
        const domain = email.split('@')[1] || '';
        if (!this.allowedDomains.includes(domain)) {
            return null;
        }
        return {
            provider: 'google',
            providerUserId: `g_${Buffer.from(email).toString('hex').slice(0, 16)}`,
            email,
            emailVerified: true,
            hostedDomain: domain,
            fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        };
    }
    getAuthorizationUrl(state, redirectUri) {
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    }
}
exports.MockGoogleSSOProvider = MockGoogleSSOProvider;
class MockMailAdapter {
    sent = [];
    async sendEmail(to, subject, htmlBody, textBody) {
        this.sent.push({
            to,
            subject,
            htmlBody,
            textBody,
            sentAt: new Date().toISOString(),
        });
        return true;
    }
    getSentEmails() {
        return [...this.sent];
    }
    clear() {
        this.sent = [];
    }
}
exports.MockMailAdapter = MockMailAdapter;
function parseRosterCsv(csvContent, existingEmails) {
    const lines = csvContent
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);
    if (lines.length === 0) {
        return {
            totalRows: 0,
            validRows: [],
            invalidRows: [],
            duplicateRows: [],
            matchedExistingCount: 0,
            newStudentCount: 0,
        };
    }
    // Header verification: email,fullName,rollNumber,campusId,batchId,sectionId
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const emailIdx = header.findIndex(h => h.includes('email'));
    const nameIdx = header.findIndex(h => h.includes('name'));
    const rollIdx = header.findIndex(h => h.includes('roll'));
    const campusIdx = header.findIndex(h => h.includes('campus'));
    const batchIdx = header.findIndex(h => h.includes('batch'));
    const secIdx = header.findIndex(h => h.includes('section') || h.includes('sec'));
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const seenEmails = new Set();
    const seenRolls = new Set();
    let matchedExistingCount = 0;
    let newStudentCount = 0;
    for (let i = 1; i < lines.length; i++) {
        const rawTokens = lines[i].split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        if (rawTokens.length < 4) {
            invalidRows.push({ row: i + 1, data: lines[i], reason: 'Insufficient columns' });
            continue;
        }
        const email = rawTokens[emailIdx >= 0 ? emailIdx : 0]?.toLowerCase() || '';
        const fullName = rawTokens[nameIdx >= 0 ? nameIdx : 1] || '';
        const rollNumber = rawTokens[rollIdx >= 0 ? rollIdx : 2] || '';
        const campusId = rawTokens[campusIdx >= 0 ? campusIdx : 3] || 'campus_1';
        const batchId = rawTokens[batchIdx >= 0 ? batchIdx : 4] || 'batch_2025';
        const sectionId = rawTokens[secIdx >= 0 ? secIdx : 5] || 'sec_a';
        if (!email || !email.includes('@') || !fullName || !rollNumber) {
            invalidRows.push({
                row: i + 1,
                data: lines[i],
                reason: 'Missing email, name, or roll number',
            });
            continue;
        }
        if (seenEmails.has(email) || seenRolls.has(rollNumber)) {
            duplicateRows.push({ row: i + 1, email, rollNumber });
            continue;
        }
        seenEmails.add(email);
        seenRolls.add(rollNumber);
        if (existingEmails.has(email)) {
            matchedExistingCount++;
        }
        else {
            newStudentCount++;
        }
        validRows.push({
            email,
            fullName,
            rollNumber,
            campusId,
            batchId,
            sectionId,
        });
    }
    return {
        totalRows: lines.length - 1,
        validRows,
        invalidRows,
        duplicateRows,
        matchedExistingCount,
        newStudentCount,
    };
}
