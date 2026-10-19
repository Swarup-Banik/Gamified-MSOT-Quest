# MSOT Quest — Game Feel & UI/UX Design Plan

> Art Direction: "Campus Realm" — A twilight fantasy campus where lantern-lit towers, glowing study paths, and mischievous Mistake Monsters turn everyday academic progress into a tangible, tactile game world.

---

## 1. Art Direction & Design Tokens

### 1.1 Palette Tokens

All colors are strictly tokenized in CSS custom properties and Tailwind extensions.

| Token Name | Hex | Role & Usage |
|---|---|---|
| `twilight-ink` | `#1B1740` | Main deep app background (midnight campus sky) |
| `dusk-plum` | `#2D2466` | Panels, HUD surface, secondary containers, modal shells |
| `lantern-gold` | `#FFC83D` | Primary XP, active buttons, gold rewards, primary callouts |
| `mint-spark` | `#3DDC97` | Correct answer bursts, success toasts, streak protected status |
| `coral-imp` | `#FF5E6C` | Mistake Monsters, gentle wrong-answer nudges (never alarming) |
| `sky-pop` | `#4CC9F0` | Informational badges, links, shields, and streak freeze crystals |

#### Theme Modes
- **Twilight (Default Dark)**: `#1B1740` base with `#2D2466` cards and glowing lanterns.
- **Daybreak (Optional Light)**: Warm parchment `#F8F6F0` base, morning stone `#EAE4F5` cards, amber and violet accents. Respects `prefers-color-scheme` on first load with explicit toggle in settings.

### 1.2 Rarity Hierarchy (Color & Shape Accessible)

To guarantee WCAG AA and color-blind clarity, every rarity tier is distinguished by both a color and a unique geometric symbol:

| Tier | Hex Token | Shape / Glyph | Special FX |
|---|---|---|---|
| **Common** | `#9AA3B2` | Circle (`●`) | Clean sticker border, matte finish |
| **Uncommon** | `#3DDC97` | Diamond (`◆`) | Subtle emerald glow |
| **Rare** | `#4CC9F0` | Triangle (`▲`) | Crystalline pulse and glint |
| **Epic** | `#B26CFF` | Hexagon (`⬡`) | Violet lightning arc particles |
| **Legendary** | Shimmer `#FFC83D` ⇄ `#FF8A3D` | Crown / Star (`★`) | Animated dual-gold gradient sweep + glint particles |

### 1.3 Typography

- **Display & HUD**: `Lilita One`, display numbers, level counters, and big event banners with subtle stroke/drop-shadow for physical toy-like presence.
- **Body & Learning Copy**: `Nunito Sans` (weight 500 & 700), clean line-height for rapid comprehension.
- **Dyslexia-Friendly Mode**: Toggle in settings swapping typography to `OpenDyslexic` or high-legibility sans with increased letter spacing.
- **Copywriting Rule**: Friendly sentence case throughout. No shouting all-caps labels, no aggressive countdowns, no shaming.

### 1.4 Tactile 3D Surfaces & Controls

- **3D Game Buttons**: Built with a 4px solid bottom bevel border (`box-shadow: 0 4px 0 var(--border-shade)`). On active/pressed state, button translates downward 3px with zero lag, simulating an arcade tactile switch with audio and haptic feedback.
- **Differentiated Cards**:
  - *Quiz Card*: Rounded-3xl with paper-grain feel, thick sticker border.
  - *Reward Card*: Beveled corners with gold rivet accents.
  - *Battle Card*: Angled corners with energetic neon piping.
  - *Monster Card*: Organic asymmetrical rounded edges with playful imp horns on top.

---

## 2. Component Inventory & Design System

1. **Tokens & Theme Provider (`src/components/theme/ThemeProvider.tsx`)**
   - Theme toggle (Twilight vs Daybreak), OpenDyslexic font toggle, Reduced-Motion toggle, Sound FX volume.
2. **GameButton (`src/components/ui/GameButton.tsx`)**
   - Variants: Primary (Lantern Gold), Secondary (Dusk Plum), Danger/Imp (Coral), Ghost/Outline.
   - Built-in press-down animation, audio click trigger, and optional haptic pulse.
3. **GameCard (`src/components/ui/GameCard.tsx`)**
   - Shape variants: Standard, Quiz, Reward, Battle, Monster.
4. **Persistent HUD (`src/components/layout/HUDHeader.tsx`)**
   - Avatar with animated level ring;
   - Real-time animated XP bar with floating `+XP` numbers;
   - Streak flame counter with clickable freeze days sheet;
   - Shard counter (`💎`) opening Shard Workshop;
   - Sound toggle (`🔊 / 🔇`) & Notification bell.
5. **Bottom Game Bar (`src/components/layout/BottomTabBar.tsx`)**
   - 5 Tabs: **Home** (Today's Run), **Map** (Syllabus World), **Arena** (Leagues & Battles), **Codex** (Monsters & Vault), **Me** (Profile & Heatmap).
   - Bouncy icon scale and lantern glow on active tab.
6. **ComboMeter (`src/components/quiz/ComboMeter.tsx`)**
   - Multiplier bar that increases with consecutive correct answers ($1\times \to 2\times \to 3\times$), boosting visual juice and chest upgrade chances.
7. **Interactive Quiz Suite (`src/components/quiz/`)**:
   - `QuizEngine.tsx`: Main driver managing progress, combo, timer, and finish state.
   - `FormatMultipleChoice.tsx`: Single-choice and True/False cards with tactile radio badges.
   - `FormatDragToOrder.tsx`: Re-ordering lines of code or algorithm steps with drag/touch handles.
   - `FormatMatchPairs.tsx`: Tap pairs on left and right to link concepts with connecting glow.
   - `FormatFillBlank.tsx`: Tap missing token chips to populate code/logic blanks.
   - `FormatSpotTheBug.tsx`: Interactive syntax-highlighted code block where clicking the erroneous line reveals the patch.
8. **MistakeMonsterBattle (`src/components/monsters/MistakeMonsterBattle.tsx`)**
   - Turn-based encounter with SVG animated monster, floating HP bar, hit sparks, revenge question challenge, shard drop on defeat.
9. **SyllabusWorldMap (`src/components/map/SyllabusWorldMap.tsx`)**
   - Parallax scrollable map with lantern towers, glowing topic nodes, fog-of-war on locked future weeks, walking companion avatar, and region boss portals.
10. **MysteryChestOpening (`src/components/rewards/MysteryChestOpening.tsx`)**
    - Tap-and-hold to shake chest, vibration rumble, lid explosion, flipping card reveal with rarity effects (lightning for Epic, solar flood for Legendary), pity counter bar.
11. **Parametric SVG Asset Engine (`src/components/assets/`)**:
    - `CompanionAvatar.tsx`: Generative companion (Fox, Owl, Dragon, Golem) with evolution states.
    - `MonsterAvatar.tsx`: Procedural topic monster generator (Gremlin, Chimera, Archon).
12. **Game Master / Time Machine Demo Panel (`src/components/demo/TimeMachinePanel.tsx`)**
    - Admin/judge floating toolbar: Fast-forward calendar days, roll over weekly league, spawn instant monster, trigger live battle burst, 3-minute scripted showcase replay.
13. **Storybook Component Showcase (`src/components/storybook/ComponentShowcase.tsx`)**
    - Built-in interactive design system explorer documenting tokens, buttons, cards, quiz formats, and sound previews.

---

## 3. Screen Wireframes (ASCII Architecture)

### 3.1 Persistent App Shell & HUD

```
+-------------------------------------------------------------------------+
| [Avatar Lvl 7]  [==== XP 450/700 ====]  [Flame 14 ❄️2]  [💎 350] [🔔] [🔊] |
+-------------------------------------------------------------------------+
|                                                                         |
|                          ACTIVE TAB SCREEN VIEW                         |
|                                                                         |
+-------------------------------------------------------------------------+
|    [ ⚡ Home ]    [ 🗺️ Map ]    [ ⚔️ Arena ]    [ 📖 Codex ]    [ 👤 Me ]    |
+-------------------------------------------------------------------------+
```

### 3.2 Home: Today's Run (Habit Trail)

```
+-------------------------------------------------------------------------+
|  TODAY'S ADVENTURE                                                      |
|  "Week 4: Recursion & Backtracking"                                      |
|                                                                         |
|         (1) Daily Quiz ------> (2) Quest Step ------> (3) [ 🎁 CHEST ]  |
|            [Done ✓]                 [Active]             [Locked]       |
|                                                                         |
|                  +--------------------------------+                     |
|                  |     [ 3D LANTERN GOLD CTA ]    |                     |
|                  |     CONTINUE TODAY'S RUN       |                     |
|                  +--------------------------------+                     |
|                                                                         |
|  [ 🦊 Companion: "Keep it up! Just 1 step to today's gold chest!" ]    |
|                                                                         |
|  MISTAKE MONSTERS (REVENGE ROUNDS READY):                               |
|  +-----------------------+     +-----------------------+                |
|  | [👾 Stack Gremlin]    |     | [👾 Two-Pointer Fiend]|                |
|  | Missed 2 days ago     |     | Missed yesterday      |                |
|  | [ BATTLE FOR +15 XP ] |     | [ BATTLE FOR +15 XP ] |                |
|  +-----------------------+     +-----------------------+                |
+-------------------------------------------------------------------------+
```

### 3.3 Interactive Quiz Screen (Drag-to-Order & Bug-Spotting)

```
+-------------------------------------------------------------------------+
|  < Exit        Question 3 of 5    [Combo x3 🔥]          [⏱️ 0:42 Blitz]|
+-------------------------------------------------------------------------+
|  SPOT THE BUG: Tap the line that causes infinite recursion             |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | 1 | function factorial(n) {                                       |  |
|  | 2 |   if (n === 0) return 1;                                      |  |
|  | 3 |   return n * factorial(n); // <-- TAP HERE TO CATCH BUG      |  |
|  | 4 | }                                                             |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [ ✓ Correct Line Selected! Green spark + 10 XP + Combo Up! ]           |
|  Explanation: Recursion parameter must decrease toward base case.       |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                      NEXT QUESTION >>>                            |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

### 3.4 Mistake Monster Battle (Turn-Based Feel)

```
+-------------------------------------------------------------------------+
|                           REVENGE ENCOUNTER                             |
|                                                                         |
|                             [ 👾 ELITE ]                                |
|                        COLOSSAL RECURSION CHIMERA                       |
|                       HP: [============       ] 65/100                  |
|                                                                         |
|       [ 💥 Slash Spark! ]                                               |
|                                                                         |
|  "What condition unwinds call frames safely?"                           |
|  [ A. Base case returns value ]  <-- (Player attacks monster!)          |
|  [ B. Infinite loop allocation ]                                        |
|                                                                         |
|  Defeat Reward: +15 XP • Shard Drops • Trophy in Codex                  |
+-------------------------------------------------------------------------+
```

### 3.5 Syllabus World Map

```
+-------------------------------------------------------------------------+
|  CAMPUS REALM: COMPUTER SCIENCE SYLLABUS                                |
|                                                                         |
|      [ Week 1: Arrays ] ★★★ (Completed)                                 |
|             \                                                           |
|          [ Week 2: Linked Lists ] ★★★ (Completed)                       |
|                \                                                        |
|             [ Week 3: Stacks & Queues ] ★★★ (Completed)                 |
|                   \                                                     |
|                [ Week 4: Recursion ] ⚡ [🦊 You are here] (Active)        |
|                      \                                                  |
|                   ☁️ ☁️ ☁️ [ Week 5: Binary Trees ] (Fog of War) ☁️ ☁️     |
|                         \                                               |
|                      [ 💀 ARCHON OF TREES: REGION BOSS ]                |
+-------------------------------------------------------------------------+
```

### 3.6 Arena: Leagues & Live Team Battle

```
+-------------------------------------------------------------------------+
|  [ Weekly League ]  |  [ Improvement Rank ]  |  [ Section Battle ]      |
+-------------------------------------------------------------------------+
|  SECTION CLASH: Algorithms Sprint                                       |
|  Section A Cyberhawks  [==================    ] 1,450 pts (72% contrib) |
|  Section B Code Titans [==============        ] 1,180 pts (48% contrib) |
|                                                                         |
|  PARTICIPATION FLOOR: 60% Required for Team XP Multiplier               |
|  [ Section A: Floor Unlocked! ✓ ]    [ Section B: 12% to Unlock ⚠️ ]    |
|                                                                         |
|  TEAM QUICK EMOTES:  [ 👏 Good Job! ] [ 🚀 Keep Going! ] [ 🔥 On Fire! ]|
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |           [ CONTRIBUTE 25 PTS (SOLVE PROBLEM) ]                   |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 4. Animation Kit & Sound Inventory

### 4.1 Animation Specifications (Framer Motion)
- **Spring Defaults**: `{ type: "spring", stiffness: 450, damping: 28 }` for snappy toy feel.
- **Button Press**: `whileTap={{ scale: 0.94, y: 3 }}`.
- **XP Number Floaters**: Spring rise `y: [0, -32]`, opacity fade `[1, 0]`, with scale pop.
- **Reduced-Motion Fallback**: Automatically bypasses translate/shake transforms and defaults to clean instant fades when `prefers-reduced-motion` is active.

### 4.2 Unified `useReward()` Hook
Coordinates visual, sound, and haptic feedback into one clean call:

```ts
const { triggerReward } = useReward();

// Trigger a correct answer reward
triggerReward({
  type: 'CORRECT_ANSWER',
  xpAmount: 15,
  comboCount: 3,
});

// Trigger a chest unlock
triggerReward({
  type: 'CHEST_OPEN',
  rarity: 'LEGENDARY',
});
```

### 4.3 Web Audio Sound Manager Inventory
Pure Web Audio API synthesizer — zero external audio files, operates instantly offline:

| Sound Key | Frequency / Waveform | Feeling |
|---|---|---|
| `tap` | Sine pulse `800Hz \to 1200Hz`, 25ms | Snappy plastic switch click |
| `correct` | Major triad arpeggio `E5 \to G#5 \to B5`, 180ms | Bright celebratory chime |
| `wrong` | Soft triangle descending `220Hz \to 175Hz`, 150ms | Gentle friendly thud |
| `combo` | Stepped pitch based on multiplier `440 \times (1 + 0.15 \times n)\text{Hz}` | Ascending energetic surge |
| `levelUp` | Fanfare sequence `C5 \to E5 \to G5 \to C6` with reverb tail | Triumphant orchestral rise |
| `chestShake` | Low rumbling noise filter `80Hz`, 200ms | Heavy wooden resonance |
| `chestOpen` | Ascending glissando with harmonic shimmer | Magically opening gateway |
| `monsterHit` | Punchy square-wave pulse with frequency sweep | Satisfying arcade impact |
| `monsterDefeat` | Rapid arpeggio burst ending in high chime | Victory explosion |

---

## 5. Implementation Roadmap (Phases)

- **Phase A**: Tokens, Theme provider, Sound Kit, `useReward()` hook, and Storybook component playground.
- **Phase B**: Parametric SVG assets (Companions, Avatars, Monster species, Chests).
- **Phase C**: 5 Interactive Quiz formats (Multiple Choice, Drag-to-Order, Match Pairs, Fill Blank, Spot the Bug) + Combo meter.
- **Phase D**: Screens revamp (Today's Run, Mistake Monster Battle, Illustrated World Map, Chest Opening, Arena Podium & Emotes, Me Profile Heatmap).
- **Phase E**: Time Machine / Judge Demo panel with scripted 3-minute demo replay.
- **Phase F**: Accessibility, Performance budgets, and verification test report updates.
