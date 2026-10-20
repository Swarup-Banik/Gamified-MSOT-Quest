# MSOT Quest — Motion System Plan & Architecture

This document outlines the unified motion system, universal interaction feedback primitives, celebration tiers, Code Hub specifications, and performance/accessibility safeguards for MSOT Quest.

---

## 1. Non-Negotiable Motion Principles

1. **Learning-First & Non-Distracting**: Motion serves understanding, confirmation, and delight. It never obstructs reading, problem solving, or test taking.
2. **Universal Tactile Feedback**: Every interactive component (buttons, cards, tabs, toggles, badges, rows) responds to pointer and keyboard inputs with synchronized physical squash, pointer-anchored glow/ripple, sound tick, and haptics.
3. **Calm Zones**: Text reading areas, quiz question descriptions, and faculty/admin analytical consoles maintain zero ambient motion to protect cognitive focus.
4. **Seizure Safety (WCAG 2.3.1)**: Never flash more than 3 times per second; avoid high-contrast full-screen strobe flashes.
5. **Performance Budget**: Target constant 60 FPS on mid-range mobile devices; INP under 200ms under 4x CPU throttling; dynamic particle scaling based on live frame time.

---

## 2. Motion Tokens Specification

Defined centrally in `apps/web/src/lib/motion-tokens.ts`:

### 2.1 Durations
| Token | Duration | Usage |
|---|---|---|
| `instant` | `80ms` | Immediate press squashes, checkbox ticks, cursor blinks |
| `quick` | `160ms` | Tooltips, hover glows, micro-interactions, tab indicator glides |
| `base` | `240ms` | Standard transitions, card expansions, modal entrances |
| `slow` | `400ms` | Page transitions, drawer slides, accordion unfolding |
| `epic` | `900ms` | Chest unlocks, boss transformations, level-up fanfares |

### 2.2 Spring Presets
- **Snappy** (`stiffness: 420, damping: 28`): Fast UI controls, buttons, toggles, tab switches.
- **Bouncy** (`stiffness: 260, damping: 16`): Celebration pops, badges, XP bubbles, companion reactions.
- **Heavy** (`stiffness: 140, damping: 18`): Large chests, raid bosses, heavy panels, bottom sheets.

### 2.3 Stagger & Concurrency
- `staggerStep`: `40ms` between sequential list items.
- `maxHeroConcurrent`: Maximum **1** hero animation at any given instant.

---

## 3. Universal `<Pressable>` Primitive Architecture

All interactive elements wrap `<Pressable>` (`apps/web/src/components/ui/Pressable.tsx`), which coordinates:
1. **Squash & Spring Scale**: Scales to `0.95` on press, overshoots to `1.02` on release with the `snappy` spring.
2. **Pointer-Anchored Ripple**: Generates a radiating CSS radial-gradient wave from the exact `(clientX, clientY)` coordinates, tinted by role (`primary: #FFD23F`, `secondary: #22E3FF`, `danger: #FF4D5E`, `success: #7CF36B`).
3. **Audio Synthesis**: Synthesizes custom Web Audio ticks per role with distinct pitch and harmonic timbre.
4. **Haptic Pulse**: Fires `navigator.vibrate([10])` (or role-specific vibration patterns) on supported touch devices.
5. **Action Outcomes**:
   - **Success**: Emits miniature sparkle burst at cursor.
   - **Disabled/Blocked**: Executes gentle horizontal shake (`[-4px, 4px, -2px, 2px, 0px]`) and emits a soft muted bump sound + explanatory tooltip.
6. **Keyboard Parity**: `Enter` and `Space` triggers identical visual, audio, and state feedback.
7. **Audit Attribute**: Emits `data-pressable="true"` for automated linting and compliance tests.

---

## 4. Component Motion Roles Inventory

| Component Role | Behavior | Trigger / Cadence |
|---|---|---|
| **Entrance** | Staggered rise and settle (`y: 16 -> 0`, `opacity: 0 -> 1`). Numbers count up. | Executed once per session per screen; fast fade on revisit. |
| **Hover / Focus** | Subtle $-3^\circ$ to $+3^\circ$ 3D pointer tilt, card elevation (`translateY(-3px)`), Sunset Realm glow ring. | Desktop pointer move or keyboard focus. |
| **State Change** | Spring-animated slider indicator on tabs, FLIP layout animation on reordered rows, rank change arrows. | Data mutation, tab selection, filter change. |
| **Ambient** | Floating island bob (6s), lantern sway (4s), twinkling stars, drifting cloud layers. | Active only on Lobby Home hero; disabled in calm zones. |
| **Page Transition** | Shared-element persist for HUD/Avatar; 240ms crossfade; map node zoom-in; quiz portal swirl. | Route navigation. |
| **Data Fill** | XP bar traveling specular shine with spark particle at progress tip; animated odometer for counters. | XP/stat mutation. |
| **Companion** | Idle breathing, blinking, pointer gaze tracking, tap reactions, stretch on wake, sleep after 2 min idle. | User interactions & idle timer. |

---

## 5. Celebration Tiers Framework (`useReward`)

Celebrations are queued through `useReward(tier, context)` to prevent visual stacking:

| Tier | Triggers | Visual & Audio Budget | Max Duration |
|---|---|---|---|
| **Micro** | Button press, toggle switch | Button squash, pointer ripple, Web Audio tick, 10ms haptic | 120ms |
| **Small** | Correct quiz answer, quest step, verified coding solve | XP bubble float, 25-particle sparkle burst, rising arpeggio chime | 800ms |
| **Medium** | Daily Run cleared, Mistake Monster defeated, 7-day streak milestone | Banner swoosh, 60-particle canvas burst, fanfare chord, 40ms haptic | 1500ms |
| **Large** | Level-up, Mystery Chest unlock, weekly league promotion | Full-screen modal overlay, 120-particle dual confetti cannon, light rays, title card | 2500ms |
| **Epic** | Legendary drop, season boss defeat, semester grand victory | Multi-stage particle swirl, camera shake, orchestral fanfare, screen-wide radial glow | 3500ms |

*All celebrations can be instantly dismissed with a single tap or `Escape` key.*

---

## 6. Code Hub on Dashboard Specification

Directly positioned under the Lobby Hero banner:
1. **Three Platform Tiles**:
   - **LeetCode**: Handle, verified badge, solves today, XP this week, last sync timestamp, "Open LeetCode ↗", "Sync Solves" with animated ring.
   - **GitHub**: Handle, verified badge, active day status, commits, XP this week, "Open GitHub ↗", "Sync Commits".
   - **HackerRank**: Handle, verified badge, star level, faculty contest badge, "Open HackerRank ↗", "Sync Badges".
2. **Return-Sync Handler**: Automatically detects tab return (`document.visibilityState === 'visible'`). If cooldown has elapsed ($>60\text{s}$), performs background sync and fires a Small celebration if new solves are detected.
3. **Problem of the Day**: Pulled dynamically from faculty-curated syllabus lists (or topic-aligned fallback) with difficulty badge, XP reward indicator, and direct deep-link.
4. **Tile Expansion Modal**: Expands any tile to view weekly solve distribution, streak metrics, and recent verified submissions feed.

---

## 7. Performance & Sensory Accessibility Plan

1. **Reduced Motion Modes**:
   - `FULL`: All spring animations, ambient sky, 3D tilt, and full particle effects.
   - `REDUCED`: Disables parallax, ambient swaying, 3D tilt, and large particle cannons. Preserves essential squash feedback and state glides.
   - `MINIMAL`: Instant UI state transitions ($0\text{ms}$ duration), zero particles, zero ambient loops.
   - *Default automatically adheres to `prefers-reduced-motion` and low-power hardware.*
2. **Dynamic Quality Scaler**:
   - Samples frame times via `requestAnimationFrame`. If average frame rate drops below 45 FPS over 60 frames, particle budgets are automatically reduced by 50% and ambient CSS loops paused.
3. **Seizure Safeguards**:
   - Flashes are hard-limited to $\le 3\text{ Hz}$.
   - High-contrast full-screen white flashes are strictly prohibited; all celebratory glows use warm, diffused amber/violet tints.
