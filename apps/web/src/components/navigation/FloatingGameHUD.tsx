'use client';

import React, { useState } from 'react';
import { Bell, Flame, Snowflake, Award, Zap, X, Shield, ChevronRight, Code2, Sparkles, TrendingUp } from 'lucide-react';
import {
  IconFlameMedallion,
  IconSnowflakeMedallion,
  IconGemMedallion,
  IconXpMedallion,
} from '../ui/GameIcons';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { AvatarComposer } from '../assets/AvatarComposer';
import { FrameGenerator } from '../assets/FrameGenerator';
import { FlameGenerator } from '../assets/FlameGenerator';
import { soundManager } from '../../lib/sound-manager';
import { Pressable } from '../ui/Pressable';

export function getLevelBand(level: number) {
  if (level >= 50) return { title: 'Legend', emblem: '👑', color: '#FFD23F', bg: 'bg-[#FFD23F]/20', border: 'border-[#FFD23F]/40' };
  if (level >= 35) return { title: 'Master', emblem: '🔮', color: '#FF4D5E', bg: 'bg-[#FF4D5E]/20', border: 'border-[#FF4D5E]/40' };
  if (level >= 20) return { title: 'Specialist', emblem: '💎', color: '#3DDC97', bg: 'bg-[#3DDC97]/20', border: 'border-[#3DDC97]/40' };
  if (level >= 10) return { title: 'Adept', emblem: '⚡', color: '#B26CFF', bg: 'bg-[#B26CFF]/20', border: 'border-[#B26CFF]/40' };
  if (level >= 5) return { title: 'Apprentice', emblem: '🛡️', color: '#22E3FF', bg: 'bg-[#22E3FF]/20', border: 'border-[#22E3FF]/40' };
  return { title: 'Fresh Spark', emblem: '✨', color: '#FFD23F', bg: 'bg-[#FFD23F]/20', border: 'border-[#FFD23F]/40' };
}

interface FloatingGameHUDProps {
  user: any;
  profile: any;
  onNavigateTab: (tab: any) => void;
}

export function FloatingGameHUD({
  user,
  profile,
  onNavigateTab,
}: FloatingGameHUDProps) {
  const [activeSheet, setActiveSheet] = useState<
    'LEVEL' | 'STREAK' | 'SHARDS' | 'NOTIFICATIONS' | 'CODE' | null
  >(null);

  const levelProgress = profile?.levelProgressPercent ?? 68;
  const currentStreak = profile?.currentStreak ?? 7;
  const freezeCount = profile?.freezeCount ?? 2;
  const shards = profile?.spendableShards ?? 250;
  const lifetimeXp = profile?.lifetimeXp ?? 1420;
  const currentLevel = profile?.currentLevel ?? 3;

  const band = getLevelBand(currentLevel);

  const equippedAvatar = user?.equippedLoadout?.avatar || profile?.equippedLoadout?.avatar || 'avatar_fox_novice';
  const equippedFrame = user?.equippedLoadout?.frame || profile?.equippedLoadout?.frame || 'frame_rustic_wood';
  const equippedFlame = user?.equippedLoadout?.streakFlame || profile?.equippedLoadout?.streakFlame || 'flame_warm_lantern';

  const handleStatClick = (sheet: 'LEVEL' | 'STREAK' | 'SHARDS' | 'NOTIFICATIONS' | 'CODE') => {
    setActiveSheet(sheet);
  };

  return (
    <>
      <header className="sticky top-3 z-40 max-w-5xl mx-auto px-3 sm:px-4">
        {/* Floating Glass Capsule HUD */}
        <div className="bg-[#24104F]/85 backdrop-blur-xl border-2 border-white/20 rounded-3xl px-3 sm:px-5 py-2 shadow-2xl flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. Avatar with Level Ring & Title Band */}
          <Pressable
            role="navigation"
            onClick={() => handleStatClick('LEVEL')}
            className="flex items-center gap-2 cursor-pointer group rounded-2xl p-1"
          >
            <div className="relative">
              <FrameGenerator frameKey={equippedFrame} size={46}>
                <AvatarComposer avatarKey={equippedAvatar} size={36} />
              </FrameGenerator>
              {/* Level Badge Number */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFD23F] text-[#24104F] border-2 border-[#24104F] font-display text-[10px] font-bold flex items-center justify-center shadow">
                {currentLevel}
              </span>
            </div>

            <div className="hidden sm:block text-left">
              <span className="font-display text-xs text-[#FFF8E7] leading-none block font-semibold truncate max-w-[90px]">
                {user?.name?.split(' ')[0] || 'Scholar'}
              </span>
              <span className="text-[10px] text-[#22E3FF] font-semibold flex items-center gap-1">
                <span>{band.emblem}</span>
                <span>{band.title}</span>
              </span>
            </div>
          </Pressable>

          {/* 2. Thick Segmented XP Bar with Glossy Sweep */}
          <Pressable
            role="navigation"
            onClick={() => handleStatClick('LEVEL')}
            className="flex-1 max-w-[170px] sm:max-w-xs cursor-pointer group rounded-xl p-1"
          >
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-display mb-1">
              <span className="text-[#FFD23F] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{lifetimeXp} XP</span>
              </span>
              <span className="text-slate-300 font-sans text-[10px]">
                {levelProgress}%
              </span>
            </div>

            <div className="w-full h-3 sm:h-3.5 bg-[#15062C] rounded-full p-0.5 border border-white/20 shadow-inner overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFD23F] via-[#FF8A2B] to-[#FF3D9A] rounded-full progress-gloss-sweep transition-all duration-500 shadow-glow-yellow"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </Pressable>

          {/* 3. Code Shortcut Chip */}
          <Pressable
            role="navigation"
            onClick={() => onNavigateTab('arena')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#22E3FF]/15 hover:bg-[#22E3FF]/25 border border-[#22E3FF]/40 text-[#22E3FF] transition"
            title="Code Hub: LeetCode, HackerRank, GitHub"
          >
            <Code2 className="w-4 h-4" />
            <span className="text-xs font-display font-bold">Code</span>
          </Pressable>

          {/* 4. Streak Flame Indicator */}
          <Pressable
            role="secondary"
            onClick={() => handleStatClick('STREAK')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#FF8A2B]/40 shadow-sm"
          >
            <FlameGenerator flameKey={equippedFlame} size={24} animate={false} />
            <div className="text-left">
              <span className="font-display text-sm sm:text-base text-[#FFD23F] leading-none block">
                {currentStreak}
              </span>
              <span className="text-[9px] text-slate-300 hidden sm:block">days</span>
            </div>
          </Pressable>

          {/* 5. Freeze Shield Snowflake */}
          <Pressable
            role="secondary"
            onClick={() => handleStatClick('STREAK')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#22E3FF]/40 shadow-sm"
          >
            <IconSnowflakeMedallion size={24} />
            <span className="font-display text-xs text-[#22E3FF]">
              {freezeCount}
            </span>
          </Pressable>

          {/* 6. Shards Gem Medallion */}
          <Pressable
            role="secondary"
            onClick={() => handleStatClick('SHARDS')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#FF3D9A]/40 shadow-sm"
          >
            <IconGemMedallion size={24} />
            <span className="font-display text-xs sm:text-sm text-[#FFF8E7]">
              {shards}
            </span>
          </Pressable>

          {/* 7. Notifications Bell */}
          <Pressable
            role="secondary"
            onClick={() => handleStatClick('NOTIFICATIONS')}
            className="relative p-2 rounded-2xl bg-[#5B2EE0]/40 hover:bg-[#5B2EE0]/70 border border-white/20 text-[#FFF8E7]"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3D9A] ring-2 ring-[#24104F] animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3D9A]" />
          </Pressable>
        </div>
      </header>

      {/* Detail Bottom Sheet Modal for Clicked Stat */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 bg-[#15062C]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="panel-quest-board max-w-md w-full p-6 space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg text-[#FFD23F] flex items-center gap-2">
                {activeSheet === 'LEVEL' && <IconXpMedallion size={28} />}
                {activeSheet === 'STREAK' && <IconFlameMedallion size={28} />}
                {activeSheet === 'SHARDS' && <IconGemMedallion size={28} />}
                {activeSheet === 'NOTIFICATIONS' && <Bell className="w-5 h-5 text-[#22E3FF]" />}
                <span>
                  {activeSheet === 'LEVEL' && `${band.title} Progression`}
                  {activeSheet === 'STREAK' && 'Streak & Shield Protection'}
                  {activeSheet === 'SHARDS' && 'Spendable Shards Vault'}
                  {activeSheet === 'NOTIFICATIONS' && 'Campus Realm Alerts'}
                </span>
              </h3>
              <Pressable
                role="close"
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Pressable>
            </div>

            {/* Sheet Content by Type */}
            {activeSheet === 'LEVEL' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#FFF8E7]">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#120524] border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{band.emblem}</span>
                    <div>
                      <p className="font-display text-sm font-bold text-white">{band.title}</p>
                      <p className="text-[11px] text-slate-300">Level {currentLevel} • {lifetimeXp} Total XP</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${band.bg} ${band.border} border`}>
                    Band {currentLevel < 5 ? 'I' : currentLevel < 10 ? 'II' : currentLevel < 20 ? 'III' : currentLevel < 35 ? 'IV' : currentLevel < 50 ? 'V' : 'VI'}
                  </span>
                </div>

                {/* 7-Day XP Breakdown by Source */}
                <div className="p-3 rounded-2xl bg-[#120524] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Last 7 Days XP Breakdown:</span>
                    <span className="text-[#3DDC97] font-bold">+245 XP</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between"><span>• Daily Quizzes:</span><span className="font-semibold text-white">90 XP</span></div>
                    <div className="flex justify-between"><span>• Verified Coding Practice:</span><span className="font-semibold text-white">65 XP</span></div>
                    <div className="flex justify-between"><span>• Class Attendance:</span><span className="font-semibold text-white">50 XP</span></div>
                    <div className="flex justify-between"><span>• Bi-weekly Assessments:</span><span className="font-semibold text-white">40 XP</span></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                  <span className="font-bold text-[#7CF36B]">Next Level ({currentLevel + 1}) Unlocks:</span>
                  <p className="text-slate-300 text-[11px]">
                    • Celestial Companion Evolution stage
                    <br />
                    • +50 Shard crafting voucher
                    <br />
                    • Silver League contender badge
                  </p>
                </div>
              </div>
            )}

            {activeSheet === 'STREAK' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#FFF8E7]">
                <p>
                  You have logged in and completed daily learning for{' '}
                  <strong className="text-[#FF8A2B]">{currentStreak} consecutive days</strong>!
                </p>
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#22E3FF] font-bold">
                    <Shield className="w-4 h-4" />
                    <span>{freezeCount} Streak Freezes Active</span>
                  </div>
                  <p className="text-slate-300">
                    If you miss a day due to sick leave or exam prep, a Freeze shield automatically prevents your streak from resetting. Zero guilt, zero stress.
                  </p>
                </div>
              </div>
            )}

            {activeSheet === 'SHARDS' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#FFF8E7]">
                <p>
                  You hold <strong className="text-[#FF3D9A]">{shards} Shards</strong> in your inventory.
                </p>
                <p className="text-slate-300">
                  Duplicate rewards from Mystery Vaults automatically convert into Shards. Use them in your Codex Workshop to craft the exact banners, auras, or titles you desire!
                </p>
                <Pressable
                  role="primary"
                  onClick={() => {
                    setActiveSheet(null);
                    onNavigateTab('COLLECTION');
                  }}
                  className="w-full py-2.5 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold flex items-center justify-center"
                >
                  Visit Shard Workshop
                </Pressable>
              </div>
            )}

            {activeSheet === 'NOTIFICATIONS' && (
              <div className="space-y-2 text-xs text-[#FFF8E7]">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-[#FFD23F]">Weekly League Update:</span>
                  <p className="text-slate-300 mt-0.5">
                    You moved up to Rank #7 in the Bronze League! Top 10 promote on Sunday midnight.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-[#7CF36B]">New Topic Unlocked:</span>
                  <p className="text-slate-300 mt-0.5">
                    Week 4 &ldquo;Recursion &amp; Backtracking&rdquo; is ready to explore on your Syllabus Map.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
