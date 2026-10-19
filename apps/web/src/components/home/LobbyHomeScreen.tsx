'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Flame,
  Snowflake,
  Trophy,
  Sword,
  Gift,
  Shield,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { CompanionHeroScene } from '../assets/CompanionHeroScene';
import { MonsterAvatar } from '../assets/MonsterAvatar';
import { ChestSVG } from '../assets/ChestSVG';
import { RarityBadge } from '../ui/RarityBadge';
import {
  IconFlameMedallion,
  IconTrophyMedallion,
  IconSwordMedallion,
  IconChestMedallion,
} from '../ui/GameIcons';
import { soundManager } from '../../lib/sound-manager';
import { api } from '../../lib/api';

interface LobbyHomeScreenProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
  onLaunchQuiz: () => void;
  onNavigateTab: (tab: any) => void;
  onFightMonster: (monster: any) => void;
  onOpenChest: (chest: any) => void;
}

export function LobbyHomeScreen({
  user,
  profile,
  onRefreshProfile,
  onLaunchQuiz,
  onNavigateTab,
  onFightMonster,
  onOpenChest,
}: LobbyHomeScreenProps) {
  const [monsters, setMonsters] = useState<any[]>([]);
  const [unopenedChests, setUnopenedChests] = useState<any[]>([]);
  const [pity, setPity] = useState<any>({ rarePity: 7, epicPity: 22 });
  const [leagueStanding, setLeagueStanding] = useState<any>({
    tier: 'Bronze',
    rank: 7,
    totalStudents: 20,
    topStudents: [
      { rank: 1, name: 'Ananya Roy', xp: 480, avatar: 'fox' },
      { rank: 2, name: 'Dev Sharma', xp: 440, avatar: 'owl' },
      { rank: 3, name: 'Rohan Verma', xp: 410, avatar: 'dragon' },
    ],
  });
  const [campusBattle, setCampusBattle] = useState<any>({
    teamA: 'Campus South (Section A)',
    teamB: 'Campus North (Section B)',
    scoreA: 18450,
    scoreB: 17920,
    timeRemaining: '2d 14h',
  });

  useEffect(() => {
    loadLobbyData();
  }, [user?.id]);

  const loadLobbyData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      // Load active monsters
      const monRes = await api.getActiveMonsters(studentId);
      if (monRes.monsters && monRes.monsters.length > 0) {
        setMonsters(monRes.monsters);
      } else {
        // Mock fallback active monsters
        setMonsters([
          {
            id: 'mon_1',
            name: 'Off-by-One Imp',
            family: 'OFF_BY_ONE',
            topic: 'Arrays & Slicing',
            rarity: 'COMMON',
            weakness: 'Strict inequality < instead of <=',
          },
          {
            id: 'mon_2',
            name: 'Null Demon',
            family: 'NULL_POINTER',
            topic: 'Linked Lists',
            rarity: 'ELITE',
            weakness: 'Optional chaining ?.',
          },
          {
            id: 'mon_3',
            name: 'Recursion Wraith',
            family: 'RECURSION_DEPTH',
            topic: 'Call Stacks',
            rarity: 'COMMON',
            weakness: 'Base case returns',
          },
        ]);
      }

      // Load chests & pity
      const chestRes = await api.getChests(studentId);
      setUnopenedChests(chestRes.chests || [{ id: 'vault_1', tier: 'GOLDEN', source: 'Weekly Quest Trail' }]);
      if (chestRes.pity) setPity(chestRes.pity);
    } catch (err) {
      console.error('Failed to load lobby data', err);
    }
  };

  const handleLaunch = () => {
    soundManager.play('tap');
    onLaunchQuiz();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ============================================================== */}
      {/* 1. HERO LOBBY SCENE: Today's Run Signboard + Large Companion   */}
      {/* ============================================================== */}
      <section className="relative w-full rounded-3xl p-5 sm:p-8 overflow-hidden panel-quest-board">
        {/* Ambient Sun Horizon Back-Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-[#FF8A2B]/20 via-[#FFD23F]/15 to-[#FF3D9A]/20 pointer-events-none blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Quest Signboard */}
          <div className="flex-1 max-w-xl space-y-4 text-left">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="medallion-frame w-7 h-7">
                <Sparkles className="w-4 h-4 text-[#24104F]" />
              </span>
              <span className="font-display text-xs text-[#FFD23F] tracking-wider uppercase">
                Daily Quest Portal
              </span>
              <span className="text-xs text-slate-300 font-sans">
                • 5 challenges, about 3 minutes
              </span>
            </div>

            {/* Big Headline */}
            <h1 className="font-display text-3xl sm:text-4xl text-white text-stroke-md leading-tight">
              Today's run: Arrays & Recursion
            </h1>

            <p className="text-xs sm:text-sm text-[#FFF8E7] leading-relaxed max-w-lg">
              Master partition boundaries and base cases. Every point maps to real verifiable knowledge — zero write paths to official academic grades.
            </p>

            {/* 3-Step Interactive Trail with Glowing Chest at End */}
            <div className="py-2 flex items-center gap-2 sm:gap-4">
              {/* Step 1: Micro-Quiz */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7CF36B] text-[#24104F] border-2 border-white font-display text-xs flex items-center justify-center font-bold shadow-md">
                  1
                </div>
                <span className="text-xs font-bold text-[#FFF8E7]">Quiz</span>
              </div>

              {/* Glowing trail connector */}
              <div className="h-1 flex-1 max-w-[40px] bg-gradient-to-r from-[#7CF36B] to-[#FFD23F] rounded-full shadow-glow-yellow" />

              {/* Step 2: Streak Check */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFD23F] text-[#24104F] border-2 border-white font-display text-xs flex items-center justify-center font-bold shadow-md">
                  2
                </div>
                <span className="text-xs font-bold text-[#FFF8E7]">Streak</span>
              </div>

              {/* Glowing trail connector */}
              <div className="h-1 flex-1 max-w-[40px] bg-gradient-to-r from-[#FFD23F] to-[#FF3D9A] rounded-full shadow-glow-orange" />

              {/* Step 3: Vault Chest Pulse */}
              <div
                onClick={() => {
                  if (unopenedChests.length > 0) onOpenChest(unopenedChests[0]);
                }}
                className="flex items-center gap-2 cursor-pointer group"
                title="Glowing Vault Chest waiting at the end of Today's Run!"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FFD23F] to-[#FF8A2B] border-2 border-white flex items-center justify-center shadow-glow-yellow animate-bounce">
                  <Gift className="w-5 h-5 text-[#24104F]" />
                </div>
                <span className="text-xs font-display text-[#FFD23F] group-hover:underline">
                  Vault
                </span>
              </div>
            </div>

            {/* Huge 3D Launch Button */}
            <div className="pt-2">
              <button
                onClick={handleLaunch}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-sunset-3d btn-3d-yellow text-base sm:text-lg font-display flex items-center justify-center gap-3 shadow-xl transition active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>Launch today's run</span>
              </button>
            </div>
          </div>

          {/* Right: Star of the Screen — Large Animated Companion */}
          <div className="shrink-0 w-full lg:w-auto flex justify-center">
            <CompanionHeroScene
              mood="happy"
              studentName={user?.name?.split(' ')[0] || 'Scholar'}
              streakCount={profile?.currentStreak || 7}
              onPet={() => {
                onRefreshProfile();
              }}
            />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. REAL-DATA GAME MODULES GRID (NO DEAD SPACE)                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Monsters Waiting (Turn-Based Revenge Arena) */}
        <div className="panel-battle p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <IconSwordMedallion size={26} />
                <h3 className="font-display text-sm text-[#FF4D5E]">
                  Monsters waiting ({monsters.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-300">Turn-based revenge</span>
            </div>

            <div className="space-y-2 mt-3">
              {monsters.slice(0, 3).map(m => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <MonsterAvatar family={m.family || 'OFF_BY_ONE'} tier={m.rarity || 'COMMON'} size={38} />
                    <div>
                      <h4 className="font-display text-xs text-white leading-tight">{m.name}</h4>
                      <span className="text-[10px] text-slate-400 block">{m.topic}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onFightMonster(m)}
                    className="px-3 py-1 rounded-xl btn-sunset-3d btn-3d-magenta text-xs font-bold"
                  >
                    Fight
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('CODEX')}
            className="w-full text-center text-xs text-[#FF4D5E] font-display hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <span>Open Monster Codex</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 2: Weekly League Podium & Rivals */}
        <div className="panel-league p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <IconTrophyMedallion size={26} />
                <h3 className="font-display text-sm text-[#7CF36B]">
                  League: Rank {leagueStanding.rank} of {leagueStanding.totalStudents}
                </h3>
              </div>
              <span className="text-[10px] text-[#7CF36B] font-bold">Top 10 Promote</span>
            </div>

            {/* Mini Podium Top 3 */}
            <div className="space-y-2 mt-3">
              {leagueStanding.topStudents.map((s: any) => (
                <div
                  key={s.rank}
                  className="p-2 rounded-xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-display text-[10px] ${
                        s.rank === 1
                          ? 'bg-[#FFD23F] text-[#24104F]'
                          : s.rank === 2
                          ? 'bg-slate-300 text-[#24104F]'
                          : 'bg-[#FF8A2B] text-[#24104F]'
                      }`}
                    >
                      {s.rank}
                    </span>
                    <span className="font-bold text-white">{s.name}</span>
                  </div>
                  <span className="font-mono text-[#FFD23F] font-bold">{s.xp} XP</span>
                </div>
              ))}

              {/* Sticky "You" Row */}
              <div className="p-2.5 rounded-xl bg-[#7CF36B]/20 border border-[#7CF36B] flex items-center justify-between text-xs font-bold text-[#7CF36B]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#7CF36B] text-[#24104F] flex items-center justify-center text-[10px]">
                    7
                  </span>
                  <span>You (Promotion Zone)</span>
                </div>
                <span>{profile?.lifetimeXp || 320} XP</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ARENA')}
            className="w-full text-center text-xs text-[#7CF36B] font-display hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <span>Enter Campus Arena</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 3: Live Campus Battle Ticker */}
        <div className="panel-quest-board p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3D9A] animate-ping" />
                <h3 className="font-display text-sm text-[#FFD23F]">
                  Live: Section A vs B
                </h3>
              </div>
              <span className="text-[10px] text-slate-300">{campusBattle.timeRemaining}</span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#22E3FF]">{campusBattle.teamA}</span>
                  <span className="text-white font-mono">{campusBattle.scoreA} XP</span>
                </div>
                <div className="w-full h-2.5 bg-[#15062C] rounded-full overflow-hidden border border-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-[#22E3FF] to-[#5B2EE0] rounded-full transition-all duration-500"
                    style={{ width: `${(campusBattle.scoreA / (campusBattle.scoreA + campusBattle.scoreB)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#FF3D9A]">{campusBattle.teamB}</span>
                  <span className="text-white font-mono">{campusBattle.scoreB} XP</span>
                </div>
                <div className="w-full h-2.5 bg-[#15062C] rounded-full overflow-hidden border border-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF3D9A] to-[#FF8A2B] rounded-full transition-all duration-500"
                    style={{ width: `${(campusBattle.scoreB / (campusBattle.scoreA + campusBattle.scoreB)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-[11px] text-slate-300">
                ⚡ Solving daily quizzes contributes directly to your campus score!
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ARENA')}
            className="w-full text-center text-xs text-[#FFD23F] font-display hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <span>View Battle Arena</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 4: Streak Week & Freeze Protection */}
        <div className="panel-reward-tray p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <IconFlameMedallion size={26} />
                <h3 className="font-display text-sm text-[#FF8A2B]">
                  Streak: {profile?.currentStreak || 7} Days
                </h3>
              </div>
              <span className="text-[10px] text-[#22E3FF] font-bold">
                {profile?.freezeCount || 2} Freezes Safe
              </span>
            </div>

            {/* 7-Day Dot Sequence */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between py-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">{day}</span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border ${
                        idx < 6
                          ? 'bg-[#FF8A2B] text-[#24104F] border-white shadow-md'
                          : 'bg-[#15062C] border-white/20 text-[#FF8A2B] animate-pulse ring-2 ring-[#FF8A2B]/40'
                      }`}
                    >
                      🔥
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                Complete today's run to lock day 7! Never penalized for missed days — freezes hold your rank safely.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ME')}
            className="w-full text-center text-xs text-[#FF8A2B] font-display hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <span>Streak Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 5: Chest Progress & Pity Meter */}
        <div className="panel-quest-board p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <IconChestMedallion size={26} />
                <h3 className="font-display text-sm text-[#FFD23F]">
                  Mystery Vaults ({unopenedChests.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#22E3FF] font-bold">Guaranteed Pity</span>
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <ChestSVG tier="GOLDEN" state="IDLE" size={54} />
                <div>
                  <h4 className="font-display text-xs text-white">Golden Vault Chest</h4>
                  <p className="text-[10px] text-slate-300">Tap-and-hold unboxing ready!</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>Rare Drop Guarantee</span>
                  <span className="font-mono text-[#22E3FF] font-bold">{pity.rarePity}/10 opens</span>
                </div>
                <div className="w-full h-2 bg-[#15062C] rounded-full overflow-hidden border border-white/15">
                  <div
                    className="h-full bg-[#22E3FF] rounded-full"
                    style={{ width: `${(pity.rarePity / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (unopenedChests.length > 0) onOpenChest(unopenedChests[0]);
              else onNavigateTab('CODEX');
            }}
            className="w-full py-2 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
          >
            Open Mystery Vault
          </button>
        </div>

        {/* Module 6: Next Boss: Mid-Term Archon */}
        <div className="panel-battle p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-[#FF3D9A]" />
                <h3 className="font-display text-sm text-[#FF3D9A]">
                  Next boss: Midterm Archon
                </h3>
              </div>
              <span className="text-[10px] text-slate-300">Week 6 Climax</span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="p-3 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center gap-3">
                <MonsterAvatar family="TIME_COMPLEXITY" tier="BOSS" size={44} isRoaring />
                <div>
                  <h4 className="font-display text-xs text-white">The Archon of Trees</h4>
                  <p className="text-[10px] text-slate-400">Timed raid reviewing Weeks 1–5</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300">
                Unlock by clearing the Week 4 & Week 5 topics on your Syllabus World Map.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('MAP')}
            className="w-full text-center text-xs text-[#FF3D9A] font-display hover:underline flex items-center justify-center gap-1 pt-1"
          >
            <span>Track on Syllabus Map</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
