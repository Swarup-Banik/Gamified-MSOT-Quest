# MSOT Quest — Cosmetics, Avatars, Banners & Companion Diagnosis Report

**Date:** 2026-10-20  
**Status:** Completed Diagnostic Investigation  
**Author:** Full-Stack & Game Feel Architecture Team  

---

## 1. Database Analysis

| Entity / Collection | Seeded Count | Expected Baseline | Diagnostic Finding |
|---|---|---|---|
| `Cosmetics` | **7 items** | **≥60 items** | Catalogue is severely deficient. Only 7 items exist in total, leaving slots like Profile Banners completely empty (0 banners), only 1 Frame, only 1 Title, only 1 Companion skin, and only 2 Avatar skins. |
| `UserCosmetics` | **0 records** | **≥5 starter items per user** | Freshly created students (and existing test accounts) own **zero** cosmetics. When a student opens their collection, their owned list is completely empty. |
| `CollectionBookEntries` | **0 (No model)** | **Slot-based registry** | The system lacked a formal collection book schema tracking completion percentages per slot and unlock status. |
| `Chests` | **0 records** | **≥1 starter vault** | No starter chests were granted to new accounts upon registration or onboarding. |
| `ChestDropTables` | **Embedded logic** | **Configurable drop rates** | Drop rates were hardcoded in `CosmeticsService.openChest()` rather than operating from an inspectable, deterministic loot table. |
| `MonsterSpecies` | **33 species** | **33 species** | Monster species exist, but codex unlocked entries were disconnected from cosmetic unlock achievements. |

### Starter Kit Deficiency
In `server.ts` and `seed.ts`, when a student registered or was seeded:
- `avatarId` was set to a plain string like `'avatar_1'` or `'avatar_fox'`.
- No entry was written to `db.userCosmetics`.
- No loadout was initialized.
- New users started with a completely blank wardrobe on Day 1.

---

## 2. API Endpoint Analysis

Direct inspection of HTTP endpoints revealed major missing contracts:

1. **`GET /api/cosmetics/catalog`**:
   - Existed, but only returned the 7 legacy items.
   - Returned raw database records with an incomplete `isOwned` boolean.
   - Lacked required fields: `equipped` state per slot, `unlockHint`, `unlockType`, `silhouetteKey`, and slot-based filtering.
2. **`GET /api/me/cosmetics`**:
   - **404 Not Found**: Endpoint did not exist anywhere in `apps/api/src/server.ts`.
3. **`POST /api/me/cosmetics/equip`**:
   - **404 Not Found**: No route existed to equip items into specific slots (`avatar`, `companion`, `banner`, `frame`, `title`, `streakFlame`, `levelupEffect`).
4. **`POST /api/me/cosmetics/unequip`**:
   - **404 Not Found**: No route existed to unequip or revert to defaults.
5. **`POST /api/cosmetics/craft`**:
   - Existed, but lacked identity verification (accepted `studentId` from request body without checking caller JWT).

---

## 3. Auth & Authorization Side Effects

1. **Route Policy Isolation**:
   - The recent authentication overhaul (`/api/auth/*`) enforced strict RBAC and deny-by-default on admin/faculty routes.
   - However, cosmetics endpoints were not bound to caller identity: `GET /api/cosmetics/catalog?studentId=...` allowed arbitrary student queries without extracting caller claims.
   - `POST /api/cosmetics/craft` did not verify whether the caller owns the student profile being modified.
2. **Policy Enforcement Needed**:
   - All `/api/me/cosmetics/*` routes must extract caller identity from JWT (`extractUser(req)`).
   - Horizontal boundary: a student may only equip, unequip, or craft items for their own account.
   - Public inspection endpoints (e.g., viewing another player's equipped loadout in leagues) must only expose public visual tokens (avatar, frame, title, banner) while strictly scrubbing private identifiers when anonymous mode is active.

---

## 4. Frontend Component Analysis

1. **`CollectionAndChests.tsx`**:
   - Sub-tab state defaulted to `CHESTS`.
   - In `COSMETICS` mode, rendered only a plain text card (`item.name`, `item.description`, `item.shardCost`, and a `Craft` button).
   - **Zero art rendered**: Did not attempt to render an image, SVG, or icon.
   - Lacked slot tabs (Avatars, Companions, Banners, Frames, Titles, Flames, Effects).
   - Lacked rarity filter chips, locked item silhouettes, unlock requirement hints, and completion progress rings.
2. **`FloatingGameHUD.tsx`**:
   - Hardcoded line 55: `<CompanionAvatar species="fox" mood="happy" size={36} />`.
   - Completely ignored `user.equippedLoadout` and `user.avatarId`.
   - Never displayed equipped frames, titles, or avatar skins.
3. **`ProfileAndSettings.tsx` (Me Page)**:
   - Line 220: Header card had no banner.
   - Avatar was rendered as a small circle inside a generic Tailwind CSS border.
   - Equipped titles, frames, and companions were completely absent from the user profile display.
4. **Leaderboards & Section Battles**:
   - League table rows (`WeeklyLeagues.tsx`) and battle rosters rendered generic placeholder icons instead of player-equipped avatars, frames, and titles.

---

## 5. Asset Pipeline & Content Security Policy (CSP)

1. **Missing Static Files**:
   - `CosmeticsService` referenced preview URLs like `/cosmetics/falcon-cadet.svg`, `/cosmetics/quantum-scholar.svg`, `/cosmetics/celestial-dragon.svg`, etc.
   - None of these files existed in `apps/web/public/cosmetics/` (the directory did not exist).
   - Any attempt to load these files resulted in HTTP 404 broken image icons.
2. **Asset Adapter Incomplete**:
   - `AssetAdapter.ts` was an empty shell (43 lines) containing only string helper methods (`getCompanionLabel`). It had zero procedural fallback generation, zero asset manifest mapping, and zero support for avatars, banners, frames, or effects.
3. **Content Security Policy (CSP) Verification**:
   - In `apps/api/src/server.ts`, CSP was configured as:
     ```
     default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' ws: wss: http: https:;
     ```
   - `img-src 'self' data: https:` permits same-origin static assets and `data:` URIs.
   - Inline parametric React SVGs (`<svg>...</svg>`) are first-class DOM elements and do not violate CSP.
   - **Resolution strategy**: Build an SVG procedural composer for every cosmetic item, ensuring 100% reliable rendering with zero broken image dependencies, backed by `assets/cosmetics/manifest.json`.

---

## 6. Equip State & Loadout Architecture

1. **Missing Data Contract**:
   - The system lacked an `EquippedLoadout` model defining the 7 active slots:
     ```typescript
     export interface EquippedLoadout {
       avatar: string;        // cosmetic id
       companion: string;     // cosmetic id
       banner: string;        // cosmetic id
       frame: string;         // cosmetic id
       title: string;         // cosmetic id
       streakFlame: string;   // cosmetic id
       levelupEffect: string; // cosmetic id
     }
     ```
2. **Storage Disconnect**:
   - `db.userCosmetics` had a loose boolean `isEquipped: boolean`, which allowed multiple items of the same type to be marked as equipped, or items with no slot mapping.
   - There was no synchronized `equippedLoadout` object persisted on `StudentProfile` or `User`.
3. **Propagation Disconnect**:
   - `xpEngine.recalculateProfile()` and `api.getStudentProfile()` returned numerical stats (`lifetimeXp`, `level`, `streak`) without loadout metadata.

---

## 7. Execution Plan to Fix All Root Causes

- **Phase 1: Shared Models & 60+ Item Catalogue**
  - Define `EquippedLoadout`, `CosmeticSlot`, `UnlockType`, and updated `Cosmetic` in `packages/shared/src/types.ts`.
  - Create idempotent seed data with **65 items** across the 7 slots matching exact rarity requirements:
    - Common: 20
    - Uncommon: 15
    - Rare: 12
    - Epic: 8 (achievement/season/quest locked)
    - Legendary: 5 (achievement locked)
- **Phase 2: Database & Backend Engine**
  - Implement starter kit provisioning: every new user receives and equips 4 default starter items (`starter_avatar_fox`, `starter_companion_kitsune`, `starter_banner_sunset`, `starter_frame_wood`) plus 4 bonus Common/Uncommon items.
  - Implement backfill migration for existing seeded users.
  - Add `GET /api/cosmetics/catalog`, `GET /api/me/cosmetics`, `POST /api/me/cosmetics/equip`, and `POST /api/me/cosmetics/unequip`.
  - Attach `equippedLoadout` and resolved cosmetic details to `StudentProfile` and `User` payloads.
- **Phase 3: Procedural Art Generators ("Art without an Art Team")**
  - Build `AvatarComposer.tsx`: Multi-layered parametric SVG rendering bodies, faces, outfits, accessories, and rarity glints/auras.
  - Build `BannerGenerator.tsx`: Sunset Realm responsive SVG landscapes (twilight skies, floating islands, crystal peaks, constellations, lanterns).
  - Build `FrameGenerator.tsx`, `FlameGenerator.tsx`, `TitleBadge.tsx`, and `EffectRenderer.tsx`.
  - Update `AssetAdapter.ts` with procedural fallbacks and manifest registration.
- **Phase 4: Sunset Realm UI Overhaul**
  - Redesign `CollectionAndChests.tsx`:
    - Full Cosmetic Collection Book with 7 slot tabs.
    - Rarity filter chips with shape/icon differentiation.
    - Completion progress rings per slot and overall.
    - Full-art owned cards with "Equip / Equipped" toggle.
    - Silhouette cards for locked items with clear unlock hints.
    - Interactive Item Detail Sheet with live avatar preview.
  - Update `FloatingGameHUD.tsx` to render equipped avatar, frame, and companion.
  - Update `ProfileAndSettings.tsx` to render the wide banner header with overlapping framed avatar, title, and companion.
  - Update league table rows and team battle scoreboards to reflect equipped loadouts.
- **Phase 5: Demo Support & Automated Tests**
  - Add GM Drawer controls: "Grant Random Cosmetic (Rarity X)", "Grant Chest", "Reset Loadout to Starter".
  - Add comprehensive automated test suite verifying seed idempotency, starter kit grants, equip authorization, loadout persistence, and procedural fallback rendering.

---

## 8. Implementation & Verification Results

All five phases of the execution plan have been implemented and verified end to end:

1. **Shared Models & 60-Item Master Catalogue**:
   - Master catalogue containing **60 unique cosmetics** defined in `apps/api/src/services/cosmetics-catalog.ts` with the exact required rarity spread:
     - **Common**: 20 items (shard costs 50)
     - **Uncommon**: 15 items (shard costs 90-100)
     - **Rare**: 12 items (shard costs 250)
     - **Epic**: 8 items (shard costs 500, quest/achievement locked)
     - **Legendary**: 5 items (shard costs 1100-1500, mastery/achievement locked)
   - 7 slots fully populated: `AVATAR_SKIN` (10), `COMPANION_SKIN` (8), `PROFILE_BANNER` (10), `FRAME` (9), `TITLE` (9), `STREAK_FLAME` (7), `LEVELUP_EFFECT` (7).
   - `packages/shared/src/types.ts` compiled with `EquippedLoadout`, `CosmeticSlot`, `UnlockType`, and updated `Cosmetic` contracts.

2. **Starter Kit & Database Provisioning**:
   - `cosmeticsService.grantStarterKit(studentId)` grants and equips default items (`cosm_avatar_fox_starter`, `cosm_comp_kitsune_starter`, `cosm_banner_sunset_starter`, `cosm_frame_wood_starter`, `cosm_title_junior_scholar`, `cosm_flame_warm_lantern`, `cosm_effect_confetti_spark`), plus bonus starter items.
   - `backfillAllStudentsStarterKit()` backfills starter kits across all registered students.

3. **Procedural Vector Art Pipeline ("Art Without an Art Team")**:
   - `AvatarComposer.tsx`: Multi-layered procedural character renderer supporting kitsune foxes, midnight owls, cyber falcons, twilight scholars, knights, archmages, sovereigns, and code artisans with rarity auras and glints.
   - `BannerGenerator.tsx`: Responsive vector landscapes for all 10 banner keys with SVG twilight gradients, starry skies, floating crystal peaks, neon skylines, aurora citadel, and cosmic nebula.
   - `FrameGenerator.tsx`: 9 distinct decorative avatar frame rings (wood, stone, bronze, silver, emerald vine, prismatic crystal, neon overdrive, gilded crest, astral halo).
   - `FlameGenerator.tsx`: Animated streak flames for all 7 styles (warm lantern, courtyard hearth, verdant wisp, supernova cobalt, amethyst blaze, plasma storm, phoenix sunburst).
   - `TitleBadge.tsx`: Colorblind-accessible badges with geometric symbols (`●`, `◆`, `⬢`, `★`, `👑`) and rarity tiers.
   - `AssetAdapter.tsx`: Unified preview component with silhouette locking and fallback generators.
   - `manifest.json`: Public cosmetic asset manifest mapping all 60 items.

4. **API Endpoints**:
   - `GET /api/cosmetics/catalog` (returns catalogue, completion rates, and equipped loadout)
   - `GET /api/me/cosmetics` (returns owned items and equipped loadout)
   - `POST /api/me/cosmetics/equip` (equips owned item with slot isolation)
   - `POST /api/me/cosmetics/unequip` (resets slot to starter default)
   - `POST /api/admin/demo/grant-cosmetic`, `POST /api/admin/demo/grant-chest`, `POST /api/admin/demo/reset-starter-loadout`.

5. **Sunset Realm UI Overhaul**:
   - `CollectionAndChests.tsx`: 7 slot tabs, rarity filter chips, SVG radial completion rings, visual art cards with equip toggles and locked silhouettes, and interactive inspection sheet.
   - `FloatingGameHUD.tsx`: Equipped framed avatar and animated streak flame.
   - `ProfileAndSettings.tsx`: Wide 21/9 landscape banner header with overlapping framed avatar, companion mascot, title badge, and quick stats.
   - `LeaguesAndBattles.tsx`: Leaderboard rows render player-equipped framed avatars.
   - `GameMasterDrawer.tsx`: GM tools to grant random cosmetic, award mystery vaults, and reset starter loadout.

6. **Automated Verification**:
   - All 62 tests across 13 suites pass with 100% success rate:
     - `tests/unit/cosmetics-catalog.test.js`: 7 tests passing
     - `tests/security/cosmetics-auth.test.js`: 10 tests passing
     - All 45 pre-existing tests (XP correctness, grade immutability, anti-gaming, rate limiting, token lifecycle, auth matrix, argon2 load, privacy): 100% passing.

