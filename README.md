# MSOT Quest — Gamified Learning Platform

> Turning everyday academic learning (classes, assignments, bi-weekly tests, coding practice) into an exhilarating game of points, streaks, leagues, and team battles across all campuses of MSOT.

[![Tests](https://img.shields.io/badge/tests-26%20passed-brightgreen.svg)](#running-tests)
[![Architecture](https://img.shields.io/badge/architecture-Monorepo%20TypeScript-blue.svg)](#tech-stack)
[![PWA](https://img.shields.io/badge/frontend-Mobile--First%20PWA-indigo.svg)](#features)
[![Principle%20%233](https://img.shields.io/badge/grade%20isolation-verified%20immutable-success.svg)](#non-negotiable-principles)

---

## 1. Quick Start

### Option A: One-Command Docker Compose (Full Stack)
Bring up the entire stack (PostgreSQL, Redis, API, and Next.js Web PWA):

```bash
docker compose up --build
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000](http://localhost:4000)
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

## 2. Demo Logins by Role

The web app includes an instant role switcher in the top navigation header:

| Role | Demo Identity | Sample Credentials / Switcher | Capabilities |
|---|---|---|---|
| **Student** | Aarav Sharma | `student@msot.edu.in` (Click **Student**) | Plays Today's Run, fights Mistake Monsters, competes in Gold League, opens Mystery Chests, crafts with Shards, views Skill Tree. |
| **Faculty** | Prof. Sarah Jenkins | `faculty@msot.edu.in` (Click **Faculty**) | Views struggling topics heatmap, sends gentle nudges to quiet students (5+ days inactive), reviews AI questions in approval queue, voids suspicious XP. |
| **Admin** | Dean Arthur Vance | `admin@msot.edu.in` (Click **Admin**) | Edits XP rules engine dynamically without code changes, inspects statistical Z-score anomalies, audits ledger history. |

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

### Automated Test Suite (26 / 26 Green)
Run all unit, integration, fairness, and privacy tests:

```bash
npm test
```

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

## 7. Project Structure

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
