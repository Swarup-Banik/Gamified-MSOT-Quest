# Authentication & Authorization Architecture: MSOT Quest

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Auditor / Architect:** Senior Full-Stack Security Engineer & System Architect  
**Compliance Target:** India Digital Personal Data Protection Act 2023 (DPDP Act), OWASP Top 10 (2025/2026), NIST SP 800-63B  

---

## 1. Executive Summary & Core Invariants

MSOT Quest requires a battle-tested, secure, enterprise-grade identity, authentication, and authorization system catering to over 1,000 students across 4 physical campuses, alongside institutional faculty and system administrators. 

### Core Non-Negotiable Invariants
1. **Deny by Default:** Every route, API endpoint, and WebSocket topic is inaccessible unless an explicit, auditable permission policy permits access.
2. **Immutable Academic Marks:** Official grade inputs (attendance, test marks) remain deeply read-only inputs for XP calculation. There is zero database write path, API endpoint, or administrative override that can alter official academic transcripts.
3. **Ironclad Peer Anonymity:** When anonymous mode is toggled, student real names and institutional IDs are masked across all public leaderboards, API responses, WebSocket broadcasts, and CSV exports. Faculty see real identities *strictly* within their assigned sections to provide academic support, with every access recorded in an immutable audit ledger.
4. **Role Isolation:** Roles (`STUDENT`, `FACULTY`, `ADMIN`) are immutable by self-service. Faculty and Admin accounts are strictly invite-only; self-registration is permanently restricted to students.
5. **No Client-Side Trust:** All token validations, scopes, rate limits, and lifecycle gates are enforced authoritatively on the backend server.

---

## 2. Account Acquisition & Registration Paths

```
                     ┌──────────────────────────────────────────────┐
                     │            User Registration Flow            │
                     └──────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
          [ Institutional Email ]                           [ Roster Invitation ]
                    │                                               │
           Matches Allowed Domain?                          Pre-Created Claim Token?
             ├── No ──> Reject (400)                          ├── Yes ──> Auto-Populate Campus/
             └── Yes                                          │           Batch/Section
                    │                                         └── No  ──> Manual Email Match
         Matches Roster Entry?
             ├── Yes ──> Link to Roster, Issue Email Verification
             └── No  ──> Create as 'PENDING_APPROVAL' (Admin/Faculty Review Queue)
                    │
            [ Verify Email Link ]
                    │
            [ Mandatory DPDP Consent ]
                    │
            [ Profile Setup & Companion Onboarding ]
                    │
            [ State = 'ACTIVE' (Land on Lobby Home) ]
```

### 1. Roster Claim (Primary Student Path)
- Administrators or Faculty upload authorized roster files (`CSV` or `JSON`) containing:
  - `institutionalEmail` (e.g., `student@msot.edu.in`)
  - `fullName` (e.g., `Aarav Sharma`)
  - `rollNumber` (e.g., `2025-CS-042`)
  - `campusId` (`campus_1` through `campus_4`)
  - `batchId` (`batch_2025`)
  - `sectionId` (`sec_a`, `sec_b`)
- Pre-claims generate an initial `RosterEntry` with a single-use cryptographically random claim token.
- When a student signs up using their institutional email, the system automatically binds the account to the roster record, establishing the ground truth for institutional attendance and test mark ingestion.

### 2. Institutional Email Self-Signup
- Students register with an email checked against `ALLOWED_EMAIL_DOMAINS` (default: `msot.edu.in`, configurable via environment variables).
- **If on roster:** Account transitions to `EMAIL_VERIFICATION_PENDING`.
- **If on allowed domain but absent from roster:** Account transitions to `PENDING_APPROVAL`. It enters the faculty/admin approval queue where institutional identity can be verified before granting platform access.

### 3. Google Sign-In (OIDC) & SSO Adapter
- Supported via an extensible `SSOProvider` interface:
  ```typescript
  export interface SSOUserProfile {
    provider: 'google' | 'microsoft' | 'msot_sso';
    providerUserId: string;
    email: string;
    emailVerified: boolean;
    hostedDomain?: string;
    fullName: string;
  }
  
  export interface SSOProvider {
    verifyIdToken(token: string): Promise<SSOUserProfile>;
    getAuthorizationUrl(state: string, redirectUri: string): string;
  }
  ```
- **Strict Security Rules:**
  - Token signature and claims verified server-side (never trusting client claims).
  - Hosted domain (`hd` claim) must strictly match `ALLOWED_EMAIL_DOMAINS`.
  - Email verified flag from provider must be `true`.
  - Auto-linking to an existing account is permitted *only* if the provider email exactly matches an existing verified email.

### 4. Baseline Email + Password
- Minimum password length: 10 characters.
- Evaluated against a built-in blacklist of the top 1,000 most common passwords (e.g., `password123`, `qwerty1234`).
- No arbitrary complexity gimmicks (punctuation/number mandates) to encourage passphrases.

### 5. Invite-Only Elevated Accounts
- Faculty and Admin accounts **cannot** be self-registered.
- Generated strictly via Admin-initiated invitations with pre-assigned role and scopes.
- No public API allows a user to elevate their own role (`role` field is strictly stripped from self-service user update endpoints).

---

## 3. Account Lifecycle & State Machine

Every user record maintains a lifecycle `status`:

```
   [INVITED] ──────────────┐
      │                    ▼
      │            [PENDING_APPROVAL]
      │                    │ (Admin approves)
      ▼                    ▼
   [EMAIL_VERIFICATION_PENDING]
      │ (User clicks single-use link or enters token)
      ▼
   [EMAIL_VERIFIED]
      │ (User accepts plain-language DPDP consent)
      ▼
   [CONSENTED]
      │ (User chooses display name, alias, and companion)
      ▼
   [PROFILE_SETUP]
      │ (Completes tutorial quiz & receives welcome chest)
      ▼
   [ACTIVE] ◄────────────────────────────────────────┐
      │                                              │ (Admin reactivates)
      ├── (Suspended by Admin for violation) ──────> [SUSPENDED]
      │
      └── (User requests data erasure) ────────────> [DEACTIVATED] (30-day grace)
```

### Route Gating Policy by State
- State `PENDING_APPROVAL`: Can only see the "Application Pending Review" screen.
- State `EMAIL_VERIFICATION_PENDING`: Can only access `/api/auth/verify-email` and resend endpoints.
- State `EMAIL_VERIFIED`: Redirected automatically to the `/consent` screen.
- State `CONSENTED`: Redirected automatically to the `/profile-setup` onboarding wizard.
- State `ACTIVE`: Full access to student features.
- State `SUSPENDED` / `DEACTIVATED`: All sessions instantly terminated; 403 Forbidden shown.

---

## 4. Cryptographic Standards & Session Architecture

### 1. Password Hashing: Argon2id
- **Algorithm:** Argon2id (hybrid data-dependent + data-independent memory access resistant to GPU and side-channel attacks).
- **Calibrated Parameters (100–300 ms target latency):**
  - Memory Cost (`m`): 64 MB (65,536 KiB)
  - Time Cost (`t`): 3 iterations
  - Parallelism (`p`): 1 thread
  - Hash Length: 32 bytes
  - Salt: 16 cryptographically random bytes generated via `crypto.randomBytes(16)`.
- Re-tested under load to guarantee 1,000 concurrent student logins do not saturate the Node.js event loop (using thread pools).

### 2. Session Management & Rotating Refresh Tokens
- **Access Token:** Short-lived JWT (15 minutes lifespan).
  - Payload: `{ sub: userId, role: Role, scope: UserScope, sessionId: string }`
  - Signed using HMAC-SHA256 with an ephemeral/configurable `JWT_SECRET`.
- **Refresh Token:** High-entropy random 256-bit string (32 bytes hex).
  - Stored strictly as a SHA-256 hash in the database.
  - Delivered strictly in an `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth` cookie.
- **Refresh Token Family & Reuse Detection:**
  - Each login creates a `Session` (Token Family).
  - Upon token refresh, the current refresh token is invalidated and a new one is issued within the same family.
  - **Replay Attack Detection:** If an already-invalidated refresh token is submitted, the **entire token family** is immediately revoked. All active sessions for that device are killed, and the security event is logged as an attack alert.

### 3. CSRF Protection
- Double-Submit Cookie pattern and custom `x-msot-csrf` header required for all state-changing mutating requests (`POST`, `PUT`, `DELETE`).
- SameSite cookie policies prevent cross-origin ambient credential delivery.

---

## 5. Multi-Factor Authentication (MFA)

- **Standard:** RFC 6238 TOTP (Time-Based One-Time Password) with SHA-1, 30-second step, 6 digits.
- **Policy:**
  - **Student:** Optional.
  - **Faculty:** Optional (recommended).
  - **Administrator:** **Mandatory**. Admin accounts cannot execute administrative functions without an enrolled and verified TOTP device.
- **Recovery Codes:** 8 single-use 10-character alphanumeric recovery codes generated upon setup, hashed with SHA-256 before storage.
- **Step-Up Re-Authentication:** Re-authentication (password confirmation or TOTP code) required for sensitive administrative and account actions:
  - Changing user roles.
  - Voiding XP in bulk.
  - Importing / undoing student rosters.
  - Exporting data audit files.
  - Changing account email or password.

---

## 6. Authorization Policy Layer (Deny-by-Default)

### RBAC + ABAC Policy Matrix

| Action / Route Category | Required Role | Required Scope Constraints |
|---|---|---|
| **View Own Dashboard / Run** | `STUDENT`, `FACULTY`, `ADMIN` | `userId === session.userId` |
| **Submit Quiz / Revenge Duel** | `STUDENT` | `userId === session.userId` |
| **View Public Leaderboard** | `STUDENT`, `FACULTY`, `ADMIN` | Anonymity mask applied server-side |
| **Contribute Team Battle** | `STUDENT` | `campusId === session.campusId` |
| **Faculty Section Review** | `FACULTY`, `ADMIN` | `sectionId IN session.assignedSections` |
| **Faculty Void XP** | `FACULTY`, `ADMIN` | Target student must belong to assigned section |
| **Faculty Nudge Student** | `FACULTY`, `ADMIN` | Target student must belong to assigned section |
| **Roster Import / Preview / Undo** | `ADMIN` | Global scope + Step-Up Auth |
| **User Directory & Role Elevation** | `ADMIN` | Global scope + Step-Up Auth |
| **Audit Logs Inspection** | `ADMIN` | Global scope |

### Server-Side Data Layer Scoping
Even if a developer accidentally omits a route guard, the repository/data-access layer enforces scope automatically:
```typescript
// Example: Faculty repository query scoping
export function scopeStudentQueryForFaculty(facultyId: string, baseFilter: any) {
  const assignments = db.facultyAssignments.filter(a => a.facultyId === facultyId);
  const allowedSectionIds = assignments.map(a => a.sectionId);
  return {
    ...baseFilter,
    sectionId: { $in: allowedSectionIds }
  };
}
```

---

## 7. Rate Limiting, Brute Force & Lockout (Redis)

- **Endpoints Covered:**
  - `/api/auth/login`: 5 failed attempts per 15-minute window per IP & per account.
  - `/api/auth/forgot-password`: 3 requests per hour per email.
  - `/api/auth/verify-email/resend`: 1 request per 2 minutes per email.
- **Exponential Backoff:** Failed attempts trigger progressive delays:
  - Attempt 1–3: Instant response.
  - Attempt 4: 2.0s delay.
  - Attempt 5: 5.0s delay.
  - Attempt 6+: 15-minute cooldown.
- **Generic Responses:** All credential failures return an identical generic error message: `"Invalid email or password"`, preventing user enumeration attacks.

---

## 8. Compliance: India DPDP Act 2023 & Data Rights

1. **Clear Notice & Purpose Limitation:** The consent screen explicitly delineates:
   - Purpose: Academic gamification and peer retention.
   - Data Ingested: Attendance logs and test marks (read-only XP inputs).
   - Visibility: Peers see anonymous aliases; faculty see assigned section data; admins see audit logs.
   - Non-negotiable: Game points *never* affect official GPA/grades.
2. **Right to Access / Data Portability:** Students can click "Download My Data" in their settings to immediately download a standardized JSON bundle containing their profile, XP transaction history, badges, and feedback submissions.
3. **Right to Erasure (Soft-Delete Grace Period):**
   - Deletion requests initiate a 30-day reversible grace period (status: `DEACTIVATED`).
   - Upon finalization, user identity is permanently erased, while the XP transaction log is **anonymized** (associated with `user_purged_xxxx`) so historical cohort analytics and audit ledger integrity remain unbroken.

---

## 9. Relational Data Model (16 Entities)

```
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│     User        │1     1│     Credential     │       │     OAuthAccount       │
├─────────────────┤───────├────────────────────┤       ├────────────────────────┤
│ id              │       │ userId (FK)        │       │ id                     │
│ email           │       │ passwordHash       │       │ userId (FK)            │
│ role            │       │ lastChangedAt      │       │ provider               │
│ status          │       └────────────────────┘       │ providerUserId         │
│ fullName        │                                    └────────────────────────┘
│ anonymousAlias  │       ┌────────────────────┐
│ isAnonymous     │1     *│      Session       │       ┌────────────────────────┐
│ campusId        │───────├────────────────────┤       │   FacultyAssignment    │
│ batchId         │       │ id (FamilyId)      │       ├────────────────────────┤
│ sectionId       │       │ userId (FK)        │       │ id                     │
│ rollNumber      │       │ refreshTokenHash   │       │ facultyId (FK)         │
│ createdAt       │       │ userAgent          │       │ campusId               │
└────────┬────────┘       │ ipAddress          │       │ courseId               │
         │                │ expiresAt          │       │ sectionId              │
         │                │ isRevoked          │       └────────────────────────┘
         │                └────────────────────┘
         │
         │1      *┌────────────────────┐               ┌────────────────────────┐
         ├────────┤   ConsentRecord    │               │     AuthAuditEvent     │
         │        ├────────────────────┤               ├────────────────────────┤
         │        │ userId (FK)        │               │ id                     │
         │        │ consentVersion     │               │ timestamp              │
         │        │ consentedAt        │               │ userId                 │
         │        │ ipAddress          │               │ action                 │
         │        └────────────────────┘               │ status ('OK'|'FAIL')   │
         │                                             │ ipAddress              │
         │1      1┌────────────────────┐               │ userAgent              │
         ├────────┤     MfaSecret      │               │ metadata (JSON)        │
         │        ├────────────────────┤               └────────────────────────┘
         │        │ userId (FK)        │
         │        │ secretBase32       │               ┌────────────────────────┐
         │        │ isEnabled          │               │      RosterEntry       │
         │        │ backupCodesHash[]  │               ├────────────────────────┤
         │        └────────────────────┘               │ id                     │
         │                                             │ email                  │
         │1      *┌────────────────────┐               │ fullName               │
         ├────────┤  EmailVerifyToken  │               │ rollNumber             │
         │        ├────────────────────┤               │ campusId / batch / sec │
         │        │ tokenHash          │               │ isClaimed              │
         │        │ expiresAt          │               └────────────────────────┘
         │        └────────────────────┘
         │
         │1      *┌────────────────────┐               ┌────────────────────────┐
         └────────┤ PasswordResetToken │               │    ApprovalRequest     │
                  ├────────────────────┤               ├────────────────────────┤
                  │ tokenHash          │               │ id                     │
                  │ expiresAt          │               │ userId (FK)            │
                  │ isUsed             │               │ status ('PENDING'...)  │
                  └────────────────────┘               │ reviewedBy (FK)        │
                                                       └────────────────────────┘
```

---

## 10. Threat Modeling (STRIDE Matrix)

| Threat Category | Potential Attack Vector | Applied Mitigation |
|---|---|---|
| **Spoofing** | Forged JWT access token or fake Google OIDC token | Server-side signature verification; Google OIDC token verified via Google public certs; checks `hd` and `email_verified`. |
| **Tampering** | User elevates own role to Admin via `PUT /api/users/me` | Role field stripped from input validation schemas; Central policy layer forbids role mutation without `ADMIN` role + step-up auth. |
| **Repudiation** | Administrator voids XP or alters roster, then denies it | Every administrative mutation logs actor, IP, timestamp, and diff to immutable `AuthAuditEvent`. |
| **Information Disclosure** | Anonymized student names exposed in leaderboards or CSVs | Server-side masking filter executes at serialization layer across REST, WebSockets, and exports. |
| **Denial of Service** | Argon2id login flood saturates backend CPU | Rate limiting per IP and per account in Redis; progressive exponential delays; generic failure messages. |
| **Elevation of Privilege** | Replay of stolen refresh token | Token family tracking immediately revokes all sessions in family upon detection of an already-used token. |

---

## 11. Mail Delivery Architecture & Mailpit Integration

In `docker-compose.yml`, an isolated local SMTP/Web mail catcher service is provisioned:
- **Image:** `axllent/mailpit:latest`
- **SMTP Port:** `1025` (consumed by `@msot/api` via `MailAdapter`)
- **Web UI Port:** `8025` (accessible by developers to inspect verification links and password reset tokens in real-time)

```typescript
export interface MailAdapter {
  sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;
}
```

---

## 12. Verification & Testing Blueprint

1. **Authorization Matrix Test:** Programmatic test checking all endpoints against all roles (`ANONYMOUS`, `STUDENT`, `FACULTY_IN_SCOPE`, `FACULTY_OUT_OF_SCOPE`, `ADMIN`).
2. **Session Security Test:** Token family replay detection, `logout-all` invalidation, session revoking.
3. **Argon2id Load Benchmark:** 1,000 simulated logins measuring p95 latency ($< 300\text{ ms}$) and 0% error rate.
4. **Anonymity Leak Test:** Validating that zero student real names escape to peers.
