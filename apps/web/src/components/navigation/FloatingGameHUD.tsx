'use client';

import React, { useState } from 'react';
import { Bell, Flame, Snowflake, Award, Zap, X, Shield, ChevronRight } from 'lucide-react';
import {
  IconFlameMedallion,
  IconSnowflakeMedallion,
  IconGemMedallion,
  IconXpMedallion,
} from '../ui/GameIcons';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { soundManager } from '../../lib/sound-manager';

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
    'LEVEL' | 'STREAK' | 'SHARDS' | 'NOTIFICATIONS' | null
  >(null);

  const levelProgress = profile?.levelProgressPercent ?? 68;
  const currentStreak = profile?.currentStreak ?? 7;
  const freezeCount = profile?.freezeCount ?? 2;
  const shards = profile?.spendableShards ?? 250;
  const lifetimeXp = profile?.lifetimeXp ?? 1420;
  const currentLevel = profile?.currentLevel ?? 3;

  const handleStatClick = (sheet: 'LEVEL' | 'STREAK' | 'SHARDS' | 'NOTIFICATIONS') => {
    soundManager.play('tap');
    setActiveSheet(sheet);
  };

  return (
    <>
      <header className="sticky top-3 z-40 max-w-5xl mx-auto px-3 sm:px-4">
        {/* Floating Glass Capsule HUD */}
        <div className="bg-[#24104F]/85 backdrop-blur-xl border-2 border-white/20 rounded-3xl px-3 sm:px-5 py-2 shadow-2xl flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. Avatar with Level Ring */}
          <div
            onClick={() => handleStatClick('LEVEL')}
            className="flex items-center gap-2 cursor-pointer group transition-transform hover:scale-105 active:scale-95"
          >
            <div className="relative">
              {/* Level Ring */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FFD23F] via-[#FF8A2B] to-[#FF3D9A] shadow-md">
                <div className="w-full h-full rounded-full bg-[#24104F] flex items-center justify-center overflow-hidden">
                  <CompanionAvatar species="fox" mood="happy" size={36} />
                </div>
              </div>
              {/* Level Badge Number */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFD23F] text-[#24104F] border-2 border-[#24104F] font-display text-[10px] font-bold flex items-center justify-center shadow">
                {currentLevel}
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="font-display text-sm text-[#FFF8E7] leading-none block">
                {user?.name?.split(' ')[0] || 'Scholar'}
              </span>
              <span className="text-[10px] text-[#22E3FF] font-bold">
                Level {currentLevel}
              </span>
            </div>
          </div>

          {/* 2. Thick Segmented XP Bar with Glossy Sweep */}
          <div
            onClick={() => handleStatClick('LEVEL')}
            className="flex-1 max-w-[190px] sm:max-w-xs cursor-pointer group"
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
          </div>

          {/* 3. Streak Flame Indicator */}
          <button
            onClick={() => handleStatClick('STREAK')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#FF8A2B]/40 transition active:scale-95 shadow-sm"
          >
            <IconFlameMedallion size={26} />
            <div className="text-left">
              <span className="font-display text-sm sm:text-base text-[#FFD23F] leading-none block">
                {currentStreak}
              </span>
              <span className="text-[9px] text-slate-300 hidden sm:block">days</span>
            </div>
          </button>

          {/* 4. Freeze Shield Snowflake */}
          <button
            onClick={() => handleStatClick('STREAK')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#22E3FF]/40 transition active:scale-95 shadow-sm"
          >
            <IconSnowflakeMedallion size={24} />
            <span className="font-display text-xs text-[#22E3FF]">
              {freezeCount}
            </span>
          </button>

          {/* 5. Shards Gem Medallion */}
          <button
            onClick={() => handleStatClick('SHARDS')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-[#5B2EE0]/30 hover:bg-[#5B2EE0]/50 border border-[#FF3D9A]/40 transition active:scale-95 shadow-sm"
          >
            <IconGemMedallion size={24} />
            <span className="font-display text-xs sm:text-sm text-[#FFF8E7]">
              {shards}
            </span>
          </button>

          {/* 6. Notifications Bell */}
          <button
            onClick={() => handleStatClick('NOTIFICATIONS')}
            className="relative p-2 rounded-2xl bg-[#5B2EE0]/40 hover:bg-[#5B2EE0]/70 border border-white/20 text-[#FFF8E7] transition active:scale-90"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3D9A] ring-2 ring-[#24104F] animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF3D9A]" />
          </button>
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
                  {activeSheet === 'LEVEL' && 'Level & Mastery Progression'}
                  {activeSheet === 'STREAK' && 'Streak & Shield Protection'}
                  {activeSheet === 'SHARDS' && 'Spendable Shards Vault'}
                  {activeSheet === 'NOTIFICATIONS' && 'Campus Realm Alerts'}
                </span>
              </h3>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content by Type */}
            {activeSheet === 'LEVEL' && (
              <div className="space-y-3 text-xs leading-relaxed text-[#FFF8E7]">
                <p>
                  You are currently <strong>Level {currentLevel}</strong> with{' '}
                  <strong className="text-[#FFD23F]">{lifetimeXp} Lifetime XP</strong>.
                </p>
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                  <span className="font-bold text-[#7CF36B]">Next Level Unlocks:</span>
                  <p className="text-slate-300">
                    • Celestial Golem Companion Evolution stage
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
                <button
                  onClick={() => {
                    setActiveSheet(null);
                    onNavigateTab('COLLECTION');
                  }}
                  className="w-full py-2.5 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
                >
                  Visit Shard Workshop
                </button>
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
                    Week 4 "Recursion & Backtracking" is ready to explore on your Syllabus Map.
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
