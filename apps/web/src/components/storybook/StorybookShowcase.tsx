'use client';

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Volume2,
  Box,
  Layers,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Eye,
  Sliders,
} from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { GameCard } from '../ui/GameCard';
import { RarityBadge, ItemRarity } from '../ui/RarityBadge';
import { ComboMeter } from '../ui/ComboMeter';
import { CompanionAvatar, CompanionMood, CompanionSpecies } from '../assets/CompanionAvatar';
import { MonsterAvatar, MonsterFamily, MonsterTier } from '../assets/MonsterAvatar';
import { ChestSVG, ChestTier, ChestState } from '../assets/ChestSVG';
import { FormatMultipleChoice } from '../quiz/FormatMultipleChoice';
import { FormatDragToOrder } from '../quiz/FormatDragToOrder';
import { FormatMatchPairs } from '../quiz/FormatMatchPairs';
import { FormatFillBlank } from '../quiz/FormatFillBlank';
import { FormatSpotTheBug } from '../quiz/FormatSpotTheBug';
import { soundManager } from '../../lib/sound-manager';

export function StorybookShowcase() {
  const [activeSection, setActiveSection] = useState<
    'TOKENS' | 'BUTTONS' | 'CARDS' | 'RARITY' | 'SOUNDS' | 'AVATARS' | 'QUIZ'
  >('TOKENS');

  // Interactive Avatar Controls
  const [companionSpecies, setCompanionSpecies] = useState<CompanionSpecies>('FOX');
  const [companionMood, setCompanionMood] = useState<CompanionMood>('HAPPY');
  const [monsterFamily, setMonsterFamily] = useState<MonsterFamily>('OFF_BY_ONE');
  const [monsterTier, setMonsterTier] = useState<MonsterTier>('COMMON');
  const [chestTier, setChestTier] = useState<ChestTier>('GOLDEN');
  const [chestState, setChestState] = useState<ChestState>('IDLE');

  // Interactive Quiz Showcase state
  const [quizType, setQuizType] = useState<
    'MC' | 'DRAG' | 'MATCH' | 'FILL' | 'BUG'
  >('MC');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const tokens = [
    { name: 'Twilight Ink', hex: '#1B1740', role: 'App background & base layer' },
    { name: 'Dusk Plum', hex: '#2D2466', role: 'Panels, cards & HUD surfaces' },
    { name: 'Lantern Gold', hex: '#FFC83D', role: 'XP points, primary buttons & rewards' },
    { name: 'Mint Spark', hex: '#3DDC97', role: 'Correct answers, success & safe streaks' },
    { name: 'Coral Imp', hex: '#FF5E6C', role: 'Monsters, errors & gentle review nudges' },
    { name: 'Sky Pop', hex: '#4CC9F0', role: 'Info, links, shields & freeze protection' },
  ];

  const soundList = [
    { id: 'tap', name: 'Tactile Tap' },
    { id: 'correct', name: 'Mint Correct Burst' },
    { id: 'gentleWrong', name: 'Gentle Wobble' },
    { id: 'combo', name: 'Rising Combo Multiplier' },
    { id: 'levelUp', name: 'Level-Up Fanfare' },
    { id: 'chestShake', name: 'Vault Shaking Rumble' },
    { id: 'chestOpen', name: 'Lid Explosion & Reveal' },
    { id: 'monsterHit', name: 'Battle Strike' },
    { id: 'monsterDefeat', name: 'Monster Purified' },
    { id: 'leagueClimb', name: 'League Rank Ascend' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Section Switcher */}
      <div className="bg-[#2D2466] border border-[#3D3280] p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-display text-[#FFC83D] tracking-wider uppercase">
            Phase 0 Design System
          </span>
          <h2 className="text-xl font-display text-white mt-0.5">
            Campus Realm Storybook & Component Showcase
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Tactile 3D design tokens, procedural SVGs, Web Audio sound effects, and 5 interactive quiz engines.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-[#1B1740] p-1.5 rounded-xl border border-[#3D3280] text-xs">
          {(
            [
              ['TOKENS', 'Tokens'],
              ['BUTTONS', '3D Buttons'],
              ['CARDS', 'Cards'],
              ['RARITY', 'Rarity'],
              ['SOUNDS', 'Sound Board'],
              ['AVATARS', 'Avatars & Chests'],
              ['QUIZ', '5 Quiz Formats'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                soundManager.play('tap');
                setActiveSection(key as any);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSection === key
                  ? 'bg-[#FFC83D] text-[#1B1740] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: DESIGN TOKENS */}
      {activeSection === 'TOKENS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map(token => (
              <div
                key={token.name}
                className="p-4 rounded-2xl border border-[#3D3280] bg-[#2D2466] flex items-center gap-4 shadow-lg"
              >
                <div
                  className="w-14 h-14 rounded-xl shadow-md border-2 border-white/20 shrink-0"
                  style={{ backgroundColor: token.hex }}
                />
                <div>
                  <h4 className="font-display text-sm text-white">{token.name}</h4>
                  <p className="font-mono text-xs text-[#FFC83D]">{token.hex}</p>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {token.role}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Typography Spec */}
          <div className="p-6 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-4 shadow-lg">
            <h3 className="font-display text-base text-white">Typography Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-[#1B1740] border border-[#3D3280] space-y-2">
                <span className="font-bold text-[#FFC83D] uppercase tracking-wider text-[10px]">
                  Display & HUD: Lilita One
                </span>
                <p className="font-display text-2xl text-white">
                  Level 14 • 1,420 XP • 7 Day Streak
                </p>
                <p className="text-slate-400">
                  Used for level rings, point counters, modal banners, and major achievement popups.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1B1740] border border-[#3D3280] space-y-2">
                <span className="font-bold text-[#4CC9F0] uppercase tracking-wider text-[10px]">
                  Body & Explanations: Nunito Sans & OpenDyslexic
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Sentence case throughout. No shouting all-caps. Clear, kind explanations for wrong answers without buzzers or anxiety-inducing timers.
                </p>
                <p className="text-slate-400">
                  Toggleable dyslexia-friendly font mode available across the entire app.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: 3D BUTTONS */}
      {activeSection === 'BUTTONS' && (
        <div className="p-6 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="font-display text-lg text-white">
              Tactile 3D Buttons (Thick Bottom Edge + Press Down Depth)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Every button responds with physical press translation, synthesized audio click, and haptic pulse.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <GameButton variant="primary" size="lg">
              Primary Button (Lantern Gold)
            </GameButton>
            <GameButton variant="secondary" size="lg">
              Secondary Button (Dusk Plum)
            </GameButton>
            <GameButton variant="danger" size="lg">
              Danger Button (Coral Imp)
            </GameButton>
            <GameButton variant="ghost" size="lg">
              Ghost Button
            </GameButton>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-3 border-t border-[#3D3280]">
            <span className="text-xs text-slate-400">Sizes:</span>
            <GameButton variant="primary" size="sm">Small</GameButton>
            <GameButton variant="primary" size="md">Medium</GameButton>
            <GameButton variant="primary" size="lg">Large</GameButton>
          </div>
        </div>
      )}

      {/* SECTION: CARDS */}
      {activeSection === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <GameCard purpose="quiz">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4CC9F0]">
              card-quiz
            </span>
            <h4 className="text-base font-bold text-white mt-1">Quiz Interaction Card</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Rounded 2xl, subtle indigo border glow, designed for focused reading and high-contrast code snippets.
            </p>
          </GameCard>

          <GameCard purpose="reward">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC83D]">
              card-reward
            </span>
            <h4 className="text-base font-bold text-white mt-1">Reward & Loot Card</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Rounded 3xl with amber trim and radial shine for chest unboxing and trophy achievements.
            </p>
          </GameCard>

          <GameCard purpose="battle">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5E6C]">
              card-battle
            </span>
            <h4 className="text-base font-bold text-white mt-1">Revenge Battle Card</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Beveled top corners and coral border for turn-based Monster encounters.
            </p>
          </GameCard>

          <GameCard purpose="monster">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26CFF]">
              card-monster
            </span>
            <h4 className="text-base font-bold text-white mt-1">Monster Codex Card</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Thick 3D border with stamp indicator for cataloging conquered conceptual bugs.
            </p>
          </GameCard>
        </div>
      )}

      {/* SECTION: RARITY BADGES */}
      {activeSection === 'RARITY' && (
        <div className="p-6 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="font-display text-lg text-white">
              Accessible Rarity Tiers (Color + Geometric Symbol)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Guarantees colour-blind players can distinguish tiers immediately via dedicated geometric markers.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <RarityBadge rarity="COMMON" showIcon />
            <RarityBadge rarity="UNCOMMON" showIcon />
            <RarityBadge rarity="RARE" showIcon />
            <RarityBadge rarity="EPIC" showIcon />
            <RarityBadge rarity="LEGENDARY" showIcon />
          </div>

          <div className="p-4 rounded-xl bg-[#1B1740] border border-[#3D3280] text-xs text-slate-300 space-y-1">
            <p><strong>Common (● Circle):</strong> Standard study notes, basic cosmetic badges.</p>
            <p><strong>Uncommon (◆ Diamond):</strong> Weekly quest completion banners.</p>
            <p><strong>Rare (▲ Triangle):</strong> Campus challenge podium crests.</p>
            <p><strong>Epic (⬡ Hexagon):</strong> Full semester streak preservation cloaks.</p>
            <p><strong>Legendary (★ Star):</strong> Shimmering animated gold-to-amber aura with particle glints.</p>
          </div>
        </div>
      )}

      {/* SECTION: SOUND BOARD */}
      {activeSection === 'SOUNDS' && (
        <div className="p-6 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-[#FFC83D]" />
                Web Audio Synthesizer Sound Board
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Zero audio files or CDN latency. Every chime and rumble is procedurally synthesized via browser Web Audio oscillators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {soundList.map(sound => (
              <button
                key={sound.id}
                onClick={() => soundManager.play(sound.id as any)}
                style={{ borderBottom: '3px solid #1F1849' }}
                className="p-3.5 rounded-xl bg-[#1B1740] hover:bg-[#382D7F] border border-[#3D3280] text-left text-xs font-semibold text-white transition active:translate-y-0.5"
              >
                <div className="text-[10px] text-[#FFC83D] font-mono mb-1">
                  SFX: {sound.id}
                </div>
                <span>{sound.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: AVATARS & CHESTS */}
      {activeSection === 'AVATARS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Companions */}
          <div className="p-5 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-4">
            <h4 className="font-display text-sm text-white">Parametric Companion</h4>
            <div className="flex justify-center py-4 bg-[#1B1740] rounded-xl border border-[#3D3280]">
              <CompanionAvatar
                species={companionSpecies}
                mood={companionMood}
                size={96}
              />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-1 flex-wrap">
                {(['FOX', 'OWL', 'DRAGON', 'GOLEM'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setCompanionSpecies(s)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      companionSpecies === s ? 'bg-[#FFC83D] text-[#1B1740]' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['HAPPY', 'CHEERING', 'FOCUSED', 'SURPRISED', 'SLEEPING'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCompanionMood(m)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      companionMood === m ? 'bg-[#4CC9F0] text-[#1B1740]' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mistake Monsters */}
          <div className="p-5 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-4">
            <h4 className="font-display text-sm text-white">Mistake Monsters</h4>
            <div className="flex justify-center py-4 bg-[#1B1740] rounded-xl border border-[#3D3280]">
              <MonsterAvatar
                family={monsterFamily}
                tier={monsterTier}
                size={96}
                isRoaring
              />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-1 flex-wrap">
                {(['OFF_BY_ONE', 'NULL_POINTER', 'RECURSION_DEPTH', 'TIME_COMPLEXITY'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMonsterFamily(f)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      monsterFamily === f ? 'bg-[#FF5E6C] text-white' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {f.split('_')[0]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['COMMON', 'ELITE', 'BOSS'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMonsterTier(t)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      monsterTier === t ? 'bg-[#FFC83D] text-[#1B1740]' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Procedural 3D Chests */}
          <div className="p-5 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-4">
            <h4 className="font-display text-sm text-white">Procedural Vault Chests</h4>
            <div className="flex justify-center py-4 bg-[#1B1740] rounded-xl border border-[#3D3280]">
              <ChestSVG tier={chestTier} state={chestState} size={110} />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-1 flex-wrap">
                {(['WOODEN', 'SILVER', 'GOLDEN', 'LEGENDARY'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setChestTier(t)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      chestTier === t ? 'bg-[#FFC83D] text-[#1B1740]' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['IDLE', 'SHAKING', 'OPEN'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setChestState(st)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      chestState === st ? 'bg-[#3DDC97] text-[#1B1740]' : 'bg-[#1B1740] text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: 5 QUIZ FORMATS */}
      {activeSection === 'QUIZ' && (
        <div className="p-6 rounded-2xl bg-[#2D2466] border border-[#3D3280] space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3D3280] pb-4">
            <div>
              <h3 className="font-display text-lg text-white">
                5 Interactive Learning Engines
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Test each format live with real input validation and audio feedback.
              </p>
            </div>

            <div className="flex flex-wrap gap-1 bg-[#1B1740] p-1 rounded-xl border border-[#3D3280] text-xs">
              {(
                [
                  ['MC', 'Multiple Choice'],
                  ['DRAG', 'Drag to Order'],
                  ['MATCH', 'Match Pairs'],
                  ['FILL', 'Fill Blank'],
                  ['BUG', 'Spot the Bug'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    soundManager.play('tap');
                    setQuizType(key);
                    setDemoSubmitted(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    quizType === key
                      ? 'bg-[#FFC83D] text-[#1B1740]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Renderer */}
          <div className="max-w-xl mx-auto py-2">
            {quizType === 'MC' && (
              <FormatMultipleChoice
                question={{
                  id: 'demo_mc',
                  questionText: 'What is the amortized time complexity of inserting into a dynamic array (vector)?',
                  options: ['O(1)', 'O(log N)', 'O(N)', 'O(N²)'],
                  correctOptionIndex: 0,
                  explanation: 'Because doubling capacity occurs geometrically, the average cost per insertion remains constant O(1).',
                }}
                selectedOption={demoSubmitted ? 0 : null}
                isSubmitted={demoSubmitted}
                onSelect={() => {
                  soundManager.play('correct');
                  setDemoSubmitted(true);
                }}
              />
            )}

            {quizType === 'DRAG' && (
              <FormatDragToOrder
                question={{
                  id: 'demo_drag',
                  questionText: 'Arrange binary search steps in chronological order:',
                  items: [
                    'Compare mid value with target',
                    'Initialize low=0, high=len-1',
                    'Recalculate mid = low + (high - low) / 2',
                    'Adjust low or high pointer',
                  ],
                  correctOrder: [
                    'Initialize low=0, high=len-1',
                    'Recalculate mid = low + (high - low) / 2',
                    'Compare mid value with target',
                    'Adjust low or high pointer',
                  ],
                  explanation: 'Pointers must be initialized first, mid calculated, value evaluated, then search interval halved.',
                }}
                isSubmitted={demoSubmitted}
                onSubmitOrder={(_, isCorrect) => {
                  if (isCorrect) soundManager.play('correct');
                  else soundManager.play('gentleWrong');
                  setDemoSubmitted(true);
                }}
              />
            )}

            {quizType === 'MATCH' && (
              <FormatMatchPairs
                question={{
                  id: 'demo_match',
                  questionText: 'Match each data structure with its optimal lookup complexity:',
                  pairs: [
                    { left: 'Hash Map', right: 'O(1) average' },
                    { left: 'Binary Search Tree', right: 'O(log N)' },
                    { left: 'Linked List', right: 'O(N) sequential' },
                  ],
                  explanation: 'Hash maps hash directly to buckets, balanced BSTs halve candidates, and linked lists require traversal.',
                }}
                isSubmitted={demoSubmitted}
                onSubmitPairs={(_, isCorrect) => {
                  if (isCorrect) soundManager.play('correct');
                  else soundManager.play('gentleWrong');
                  setDemoSubmitted(true);
                }}
              />
            )}

            {quizType === 'FILL' && (
              <FormatFillBlank
                question={{
                  id: 'demo_fill',
                  questionText: 'Fill in the recursion base case to prevent a stack overflow:',
                  codeTemplate: 'function factorial(n) {\n  if (n <= {{BLANK_0}}) return {{BLANK_1}};\n  return n * factorial(n - 1);\n}',
                  correctTokens: ['1', '1'],
                  tokenBank: ['1', '0', '1', 'n', '2'],
                  explanation: 'When n <= 1, factorial is 1. Without this base case, the function calls itself infinitely.',
                }}
                isSubmitted={demoSubmitted}
                onSubmitTokens={(_, isCorrect) => {
                  if (isCorrect) soundManager.play('correct');
                  else soundManager.play('gentleWrong');
                  setDemoSubmitted(true);
                }}
              />
            )}

            {quizType === 'BUG' && (
              <FormatSpotTheBug
                question={{
                  id: 'demo_bug',
                  questionText: 'Tap the line containing the off-by-one bug:',
                  codeLines: [
                    'function printArray(arr) {',
                    '  for (let i = 0; i <= arr.length; i++) {',
                    '    console.log(arr[i]);',
                    '  }',
                    '}',
                  ],
                  bugLineIndex: 1,
                  bugFix: 'i < arr.length',
                  explanation: 'Line 2 uses <= instead of <. Since arrays are 0-indexed, accessing arr[arr.length] yields undefined!',
                }}
                isSubmitted={demoSubmitted}
                onSubmitBugLine={(_, isCorrect) => {
                  if (isCorrect) soundManager.play('correct');
                  else soundManager.play('gentleWrong');
                  setDemoSubmitted(true);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
