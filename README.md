# MSOT Quest — Gamified Learning Platform

> Turning everyday academic learning (classes, assignments, bi-weekly tests, coding practice) into an exhilarating game of points, streaks, leagues, and team battles across all campuses of MSOT.

[![Tests](https://img.shields.io/badge/tests-45%20passed-brightgreen.svg)](#running-tests)
[![Architecture](https://img.shields.io/badge/architecture-Monorepo%20TypeScript-blue.svg)](#tech-stack)
[![PWA](https://img.shields.io/badge/frontend-Mobile--First%20PWA-indigo.svg)](#features)
[![Principle%20%233](https://img.shields.io/badge/grade%20isolation-verified%20immutable-success.svg)](#non-negotiable-principles)
[![Security](https://img.shields.io/badge/auth-Argon2id%20%7C%20TOTP%20%7C%20DPDP%202023-purple.svg)](#security-and-authorization)

---

## 1. Quick Start

### Option A: One-Command Docker Compose (Full Stack)
Bring up the entire stack (PostgreSQL, Redis, API, Mailpit SMTP, and Next.js Web PWA):

```bash
docker compose up --build
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **Mailpit Web UI (Email Inbox)**: [http://localhost:8025](http://localhost:8025) (SMTP on `1025`)
- **Database**: PostgreSQL on port `5432`
- **Cache / Leaderboards**: Redis on port `6379`

### Option B: Local Direct Execution (Zero External Daemons Needed)
MSOT Quest includes embedded fallback persistence and Redis emulation so you can run and test the entire platform without Docker:

```bash
# 1. Install dependencies
npm install

# 2. Build shared contracts, API, and Web PWA
npm run build

# 3. Seed 1,020 students, 4 campuses, and 220+ syllabus questions
npm run seed

# 4. Start API Server (in terminal 1)
npm start

# 5. Start Next.js PWA (in terminal 2)
npm run dev --workspace=@msot/web
```

---

## 2. Demo Accounts & Credentials

The platform features full cryptographic authentication with Argon2id, rotating refresh tokens in `httpOnly` cookies, TOTP MFA, and DPDP Act 2023 consent flows:

| Role | Demo Email | Password | Quick-Login Demo Shortcut | Capabilities |
|---|---|---|---|---|
| **Student** | `student@msot.edu.in` | `StudentPass123!` | Click **"Student"** on Auth Modal / GM Drawer | Plays Today's Run, fights Mistake Monsters, competes in Gold League, opens Mystery Chests, crafts with Shards, views Skill Tree. |
| **Faculty** | `faculty@msot.edu.in` | `FacultyPass123!` | Click **"Faculty"** on Auth Modal / GM Drawer | Views struggling topics heatmap, sends gentle nudges to quiet students (5+ days inactive), reviews AI questions in approval queue, voids suspicious XP. |
| **Admin** | `admin@msot.edu.in` | `AdminPass123!` | Click **"Admin"** on Auth Modal / GM Drawer | Edits XP rules engine dynamically, manages user roles with step-up verification, inspects Z-score anomalies, audits security events and roster claim pipeline. |

> [!NOTE]
> In development/demo mode (`DEMO_MODE=true`), you can also click the quick-login pills at the bottom of the **Auth Modal** or use the **GM Drawer** (bottom-right floating icon) to toggle identities instantly without entering passwords. Production mode enforces mandatory credentials, email verification, and TOTP MFA for admins.

---

## 3. Non-Negotiable Principles (Enforced in Code)

1. **Learning First**: Every single XP point maps to a verified learning event (attendance, tests, homework, peer help, coding solve). Zero points for idle clicks.
2. **Fair and Inclusive**:
   - Weekly leagues group 20 students of comparable mastery.
   - **Improvement Ranking**: Students are ranked by growth percentage vs their own baseline, proving that bottom-quartile students can top the leaderboard.
   - **Relegation Shields**: Protects students against demotion.
   - **Ghost Mode**: Compete against your own previous week's performance.
3. **Strict Grade Separation (Principle #3)**:
   - Official academic marks (attendance, test marks) feed in as read-only inputs via `MSOTDataAdapter`.
   - **Verified Invariant**: Zero code paths write to grade data. Grade store objects are deeply frozen (`Object.isFrozen`) and mutating them throws a `TypeError`.

---

## 4. Key Features & Game-Feel Layer

- ⚡ **Today's Run**: The central 3-minute daily habit loop. Completing Today's Run maintains the student's daily streak.
- 👾 **Mistake Monsters & Monster Codex**:
  - Wrong answers spawn a Mistake Monster tied to that specific topic.
  - Returns in spaced "revenge rounds" (+1, +3, +7 days). Defeating it awards bonus XP and a permanent trophy in the **Monster Codex**.
  - Guardrail: Maximum 5 active monsters at a time.
- ❄️ **Streaks & Freezes**: Capped at 2 stored freezes; freezes apply automatically on a missed day without shaming copy. Make-up quests repair broken streaks.
- 🎁 **Mystery Chests & Pity Timers**:
  - Tiers: Wooden, Silver, Golden, Legendary.
  - Guaranteed Rare cosmetic in 5 chests; Guaranteed Epic in 15 chests.
  - Duplicates convert into **Shards** for crafting specific cosmetics in the Workshop.
- ⚔️ **Section vs Section Battles & Raid Boss**:
  - Sub-2-second live scoreboard updates over WebSockets.
  - **Participation Floor**: Team bonus requires at least 60% member participation, motivating top students to pull everyone in.
  - Shared Class Raid Boss HP bar reduced by collective submissions.
- 🕵️ **Anonymous Mode**:
  - Opt out of public leaderboards at any time.
  - Server-side anonymization dynamically masks identity as a friendly alias (e.g., *"Swift Falcon 42"*). Zero identity leakage across APIs or CSV exports.

---

## 5. Anti-Gaming Detection (5 Vectors)

MSOT Quest automatically detects and flags 5 cheating attack vectors:

1. **Quiz Spam & Retries**: Sliding-window rate limit (3 attempts / 5 mins) and strict database date constraint (1 scored attempt per calendar day).
2. **Shared Answer Clusters**: Flags submissions with identical option sequences and synchronized response timing ($|\Delta t| < 250\text{ms}$).
3. **Copy-Paste Telemetry**: Captures instant paste events (>100 chars in <600ms) and robotic keystroke interval variance (< 1.0ms).
4. **Fake Coding Solves**: Only verified accounts with challenge tokens count; duplicate problem solves are rejected.
5. **Statistical XP Spikes**: Flags spikes where daily XP exceeds $Z > 3.0$ standard deviations above individual and cohort rolling averages.

*All flags enter faculty review without public shaming. Faculty override wins.*

---

## 6. Running Tests & Generating Test Report

### Automated Test Suite (45 / 45 Green Across 11 Suites)
Run all unit, integration, fairness, privacy, and security tests:

```bash
npm test
```

The test runner executes 45 comprehensive automated tests covering:
1. **XP Correctness (10 Scenarios)**: Mathematical assertions on attendance, homework, daily quizzes, coding solves, streaks, peer help, and soft caps.
2. **Grade Immutability**: Proves zero write paths exist to mutate official marks; object freeze and 10,000 game XP verification.
3. **Anti-Gaming (5 Attack Vectors)**: Detection of quiz spam, shared answer clusters, copy-paste telemetry, fake coding practice, and statistical XP farming.
4. **Fairness & Mobility**: Proves bottom-quartile students achieve +256% growth and reach promotion zone.
5. **Privacy Audit**: Verifies zero identity leakage in leaderboards, live WebSockets, and CSV exports.
6. **Argon2id Calibration & Policy**: Validates passphrase length (min 10 chars), blacklist rejection, and verification latency (~95ms).
7. **Least Privilege RBAC Matrix**: Enforces deny-by-default (401/403) across student, faculty, and administrative boundaries.
8. **Privilege Escalation Prevention**: Blocks vertical self-promotion via registration payloads and horizontal preference tampering.
9. **Rate Limiting & Anti-Enumeration**: Thwarts brute-force attacks via generic error messages and 15-minute account lockouts after 5 failed attempts.
10. **Token Lifecycle & Replay Detection**: Validates rotating refresh tokens and invalidation of entire token families upon replay attack.
11. **TOTP MFA Engine**: RFC 6238 time-step verification, Base32 secrets, and single-use hashed backup codes.

### Run Load Benchmarks & Generate `docs/TEST_REPORT.md`
Execute the load benchmark runner (100, 300, 500 VUs and 300-student battle burst) and generate the official Test Report:

```bash
npm run test:report
```

Inspect the generated report at [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md).

### k6 Load Testing (Optional)
Run the k6 test script directly:

```bash
k6 run tests/load/k6-load-test.js
```

---

## 7. Security & Authorization Architecture

- 🛡️ **Argon2id Password Hashing**: Compliant with NIST SP 800-63B standards; verification latency target of ~100–300ms (measured at 95ms) to thwart GPU-based offline dictionary attacks.
- 🔑 **Rotating Refresh Tokens & Replay Defense**:
  - 15-minute JWT access tokens in memory / authorization headers.
  - 30-day rotating refresh tokens stored in `httpOnly`, `SameSite=Lax` cookies.
  - **Token Family Invalidation**: If an already-rotated or revoked refresh token is re-submitted (indicating token theft), the entire token family is immediately revoked, forcing re-authentication across all devices.
- ⏱️ **Brute-Force & Enumeration Protection**:
  - Generic error messages (`"Invalid email or password"`) for both existing and non-existing accounts prevent email enumeration.
  - Sliding-window rate limiter in Redis with progressive exponential backoff (2s, 5s) and a hard 15-minute account lockout after 5 consecutive failed attempts.
- 📱 **Multi-Factor Authentication (TOTP MFA)**:
  - Standard RFC 6238 time-based one-time password protocol compatible with Google Authenticator, Microsoft Authenticator, and 1Password.
  - 8 single-use cryptographically hashed backup codes for emergency account recovery.
  - Mandatory for administrators; optional for faculty and students.
  - Step-up re-authentication required for sensitive actions (e.g. role elevation).
- 📜 **DPDP Act 2023 Compliance**:
  - Versioned plain-language consent notices (`v2026.1`) with explicit opt-in checkboxes.
  - 1-click self-service JSON data export for portability.
  - 30-day account deletion grace period with irreversible anonymization of historic XP ledger entries upon permanent deletion.
- 📬 **Mailpit Local Email Server**:
  - Verification links, 6-digit verification codes, and password reset tokens dispatch over standard SMTP (port 1025) to Mailpit.
  - Inspect outgoing emails in real-time via the Mailpit web interface at [http://localhost:8025](http://localhost:8025).

---

## 8. Project Structure

```
msot-quest/
├── apps/
│   ├── api/                 # Fastify REST API, WebSocket live server, XP engine
│   └── web/                 # Next.js mobile-first PWA, Tailwind, Framer Motion
├── packages/
│   └── shared/              # TypeScript contracts, adapters, game formulas
├── docs/
│   ├── PLAN.md              # Master architecture and phase roadmap
│   ├── ASSUMPTIONS.md       # Documented system assumptions
│   └── TEST_REPORT.md       # Empirical test verification report
├── tests/
│   ├── unit/                # XP correctness, grade immutability, anti-gaming
│   ├── integration/         # Daily quiz submission, battles, faculty flow
│   ├── fairness/            # Bottom-quartile student mobility simulation
│   ├── privacy/             # Identity leakage scanner
│   └── load/                # k6 scripts & concurrency benchmark runner
├── docker-compose.yml       # Production/demo container orchestration
└── README.md                # Documentation & quick start guide
```
