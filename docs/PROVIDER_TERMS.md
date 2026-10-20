# MSOT Quest — Third-Party Coding Platform Terms & Compliance Notice

**Document Version:** 1.0.0  
**Status:** Advisory for MSOT Academic & Legal Council  
**Date:** 2026-10-20  

---

## 1. Overview & Purpose

This document provides a legal, ethical, and operational assessment of the third-party coding platform integrations supported by MSOT Quest:
- **GitHub** (Official Partner API / OAuth)
- **LeetCode** (Community GraphQL / Public Profile Scraping)
- **HackerRank** (Public Profile Data & Faculty CSV Fallback)

MSOT Quest prioritizes student data security, ethical web scraping, and educational compliance. Administrators can toggle any integration on or off instantaneously via environment variables or the Game Master dashboard.

---

## 2. Platform Compliance Matrix

| Platform | Official Public API? | Terms of Service Consideration | MSOT Quest Risk Rating | Admin Feature Flag |
|---|:---:|---|:---:|---|
| **GitHub** | **Yes** (REST & GraphQL API v3/v4) | Standard Developer API Terms; requires standard OAuth application registration with MSOT domain. | **LOW / GREEN** (Fully compliant) | `ENABLE_GITHUB_SYNC=true` |
| **LeetCode** | **No** (Community reverse-engineered GraphQL) | LeetCode's Terms of Use restrict automated scraping or accessing data without express authorization. | **MEDIUM / YELLOW** (Unofficial; rate-limited) | `ENABLE_LEETCODE_SYNC=true` |
| **HackerRank** | **No** for public student data (HackerRank for Work is commercial) | Public profile scraping is unofficial. Faculty contest export via CSV is platform-agnostic and compliant. | **LOW-MEDIUM / YELLOW** (Use Faculty CSV in production) | `ENABLE_HACKERRANK_SYNC=true` |

---

## 3. Platform Breakdown

### 1. GitHub
- **API Status**: Official GitHub REST API v3 and GraphQL API v4.
- **Authentication**: OAuth 2.0 with minimal read-only scope (`read:user`).
- **Data Accessed**: Public profile username, public repository commit history (timestamps and additions/deletions), and pull requests in classroom repositories.
- **Rate Limits**: 5,000 authenticated requests/hour per OAuth token. MSOT Quest operates well below this limit via 60-minute staggered polling.
- **Recommendation**: Approved for institutional deployment without restriction.

### 2. LeetCode
- **API Status**: Unofficial. LeetCode operates an internal GraphQL endpoint (`https://leetcode.com/graphql`) utilized by the web application for public user profiles, solved question counts, and submission calendars.
- **Data Accessed**: Public profile only (number of solved problems by difficulty, submission calendar, and user bio for challenge codes). **No passwords, cookies, or session tokens are ever requested or stored.**
- **Terms & Risks**:
  - LeetCode terms state that users may not *"use any robot, spider, crawler, scraper, or other automated means or interface not provided by us to access the Site."*
  - Endpoints can change without advance notice, potentially causing sync failures.
  - Excessive requests can lead to IP address rate-limiting (HTTP 429).
- **Mitigation in MSOT Quest**:
  - Circuit breaker trips automatically upon 5 errors or 429 status codes, backing off for 15 minutes.
  - Identified User-Agent (`MSOT-Quest-Learning-Platform/1.0; educational-verification`).
  - Feature flag `ENABLE_LEETCODE_SYNC` allows immediate shutoff if requested by LeetCode or MSOT administration.
  - Mock mode (`PROVIDER_MODE=mock`) enables offline demonstrations and automated testing.

### 3. HackerRank
- **API Status**: Unofficial for individual profiles. HackerRank for Work exists for corporate assessments, but there is no public student API.
- **Data Accessed**: Public badges, star ratings, and domain ranks.
- **Terms & Risks**:
  - Public profile structure changes periodically.
  - Does not expose individual problem slugs or solve timestamps publicly.
- **Mitigation in MSOT Quest**:
  - **Faculty CSV Import**: Recommended primary mechanism for HackerRank. Faculty export contest or classroom test results and upload via the secure MSOT Quest CSV import wizard, avoiding scraping entirely.

---

## 4. Administrative Toggles

Administrators and faculty can control external integration behavior at any time:

```bash
# Environment Configuration (.env)
PROVIDER_MODE=mock              # 'mock' for offline testing/demo; 'live' for real HTTP polling
ENABLE_GITHUB_SYNC=true         # Toggle GitHub integration
ENABLE_LEETCODE_SYNC=true       # Toggle LeetCode integration
ENABLE_HACKERRANK_SYNC=true     # Toggle HackerRank integration
PROVIDER_RATE_LIMIT_MS=3000     # Minimum delay between third-party requests (3s)
CIRCUIT_BREAKER_FAIL_THRESHOLD=5 # Consecutive errors before breaker trips
```

---

## 5. Student Consent & Transparency Notice

When a student accesses **Me > Connections**, the platform displays a clear, plain-language consent notice:
1. Only publicly visible profile activity is read.
2. Credentials and passwords are never collected.
3. Students may disconnect their accounts at any time, immediately removing all external tokens from the database.
4. Coding practice is purely an optional source of gamified XP and has no bearing on official academic grades.
