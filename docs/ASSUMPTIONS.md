# MSOT Quest — Documented Assumptions

This document outlines the architectural, game design, and domain assumptions made during the design and development of MSOT Quest.

## 1. Academic & Institutional Assumptions
1. **MSOT Campuses & Structure**:
   - MSOT operates 4 regional campuses (e.g. Main Campus, City Campus, North Tech Campus, Cyber Valley Campus).
   - Each campus contains academic Batches (e.g., Batch 2024, Batch 2025, Batch 2026), further subdivided into Sections (e.g., Section A, Section B, Section C).
2. **Grade Separation & MSOT Data Flow**:
   - Official academic systems (LMS, Attendance Biometrics, ERP Gradebook) are external and strictly read-only to MSOT Quest.
   - `MSOTDataAdapter` consumes official data via asynchronous batch feeds (JSON/CSV) or webhook pushes.
   - MSOT Quest never publishes any score back to the official gradebook. Official grades determine academic degrees; Quest XP measures engagement and mastery.
3. **Faculty & Administration Roles**:
   - Faculty members can author questions, review AI-generated questions, inspect student struggle points, send encouraging nudges, and void suspicious XP with a mandatory justification.
   - Administrators control system-wide XP rules, seasonal calendar, anti-gaming thresholds, and reward catalogs.

## 2. Game Mechanics & Balancing
1. **XP Rules & Limits**:
   - Standard action rewards follow the specification:
     - Class Attendance: 10 XP (per official verified class).
     - Homework Submission: 20 XP (on-time verified submission).
     - Daily Quiz: 15 base XP + 5 XP per correct answer.
     - Bi-weekly Test: Score % ÷ 2 (e.g. 80% yields 40 XP).
     - Verified Coding Solves: 10 (Easy), 20 (Medium), 40 (Hard), capped at 10 solves/day.
     - Club Activity: 25 XP per verified club session.
     - 7-Day Streak: 50 bonus XP.
     - Peer Help: 15 XP per accepted discussion response (max 3/day).
   - **Daily Soft Cap**: 150 XP per day. Points earned beyond 150 receive a 50% diminishing return multiplier (minimum 1 XP per action) to preserve balance against marathon grinding.
2. **Level Progression**:
   - Level curve formula: $\text{Required XP} = \lfloor 100 \times L^{1.5} \rfloor$.
   - Max level per season is uncapped, but primary cosmetic milestones unlock between Level 1 and 50.
3. **Streaks & Freezes**:
   - A day is marked active if the student completes "Today's Run" (daily quiz).
   - Maximum streak freezes held at any given time is capped at 2.
   - Freezes are automatically consumed if a student fails to complete Today's Run before midnight (student timezone, default UTC+05:30).
   - Make-up quests expire 48 hours after a broken streak and require completing a 5-question review challenge.
4. **Leagues & Promotion**:
   - Weekly leagues contain 20 students grouped by comparable XP tier (Bronze, Silver, Gold, Platinum, Diamond).
   - Top 20% (ranks 1–4) promote to the next tier; bottom 20% (ranks 17–20) relegate to the lower tier.
   - Relegation Shields prevent demotion once every 3 weeks.
   - "Ghost Mode" matches a student against their own previous week's cumulative daily XP trajectory.
   - "Improvement Ranking" calculates $\frac{\text{Current Week XP} - \text{Prior Week Baseline}}{\text{Prior Week Baseline}}$, enabling lower-tier students showing significant progress to rank at the top.
5. **Mistake Monsters & Spaced Repetition**:
   - Every incorrectly answered quiz question creates a Mistake Monster bound to that syllabus topic.
   - Spaced revenge rounds are scheduled at +1 day, +3 days, and +7 days.
   - Active monsters are capped at 5 per student to prevent demotivation; additional mistakes are queued quietly.
   - Defeating a monster awards standard question XP + a 10% bonus and registers in the Monster Codex.
6. **Chests, Rarity & Drops**:
   - Chest tiers: Wooden (Common/Uncommon heavy), Silver, Golden, Legendary.
   - Pity timers: Guaranteed Rare cosmetic within 5 chests; guaranteed Epic/Legendary within 15 chests.
   - Duplicate cosmetics automatically convert into Shards (Common: 10, Uncommon: 25, Rare: 75, Epic: 200, Legendary: 500).
   - Shards are spendable in the cosmetic workshop; lifetime XP is strictly preserved and never decremented by cosmetic purchases.

## 3. Technical & Architectural Assumptions
1. **Runtime & Infrastructure**:
   - Node.js 22 LTS with TypeScript across the monorepo.
   - Fastify for high-throughput, low-overhead HTTP API and WebSocket connection handling.
   - PostgreSQL 16 (or embedded PostgreSQL via `@electric-sql/pglite` / Docker container) for append-only transactional persistence.
   - Redis 7 (or high-fidelity in-memory Redis cluster emulation) for sub-millisecond sorted sets, streak tracking, rate limiting, and BullMQ queues.
   - Docker Compose orchestrates web, api, postgres, and redis services with zero external dependencies.
2. **Submissions Pipeline & Idempotency**:
   - Quiz attempts and battle submissions generate a deterministic UUID/hash (`idempotency_key`).
   - The submission payload is written to PostgreSQL prior to sending an acknowledgment response (`HTTP 202` / `HTTP 200`), ensuring zero lost submissions.
3. **Anonymization & Privacy**:
   - Students can enable "Anonymous Mode" at any time.
   - When enabled, the serialization layer dynamically replaces `User.name` and avatar with a deterministic yet non-reversible alias (e.g. "Swift Falcon 42") and a masked avatar.
   - Automated privacy tests verify that real names, emails, and identifiers never leak through REST responses, WebSocket broadcasts, or CSV exports.
4. **LLM Question Generation & Approvals**:
   - `LLMProvider` defines a standardized interface with two drivers:
     - `HostedLLMProvider` (mockable / API key driven).
     - `OllamaLLMProvider` (local self-hosted instance).
   - All AI-generated questions enter a `PENDING` state in the Faculty Approval Queue. No AI question can ever be served to students without explicit faculty verification (`APPROVED` or `EDITED`).
5. **Real-Time Scoreboard**:
   - WebSocket broadcast engine throttles and batches high-frequency team battle updates every 500ms, ensuring all connected clients receive updates well within the 2.0-second requirement under concurrent load.
