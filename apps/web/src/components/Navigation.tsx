'use client';

import React from 'react';
import {
  Flame,
  Snowflake,
  Shield,
  Volume2,
  VolumeX,
  UserCheck,
  EyeOff,
  Eye,
  Award,
  Sparkles,
  MessageSquare,
  Sun,
  Moon,
  BookOpen,
  Palette,
} from 'lucide-react';
import { toggleSound, isSoundEnabled } from '../lib/sound';
import { soundManager } from '../lib/sound-manager';
import { CompanionAvatar } from './assets/CompanionAvatar';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  profile: any;
  onToggleAnonymous: () => void;
  onOpenFeedback: () => void;
  onSwitchRole: (role: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isDyslexic?: boolean;
  onToggleDyslexic?: () => void;
}

export function Navigation({
  currentTab,
  setCurrentTab,
  user,
  profile,
  onToggleAnonymous,
  onOpenFeedback,
  onSwitchRole,
  theme = 'dark',
  onToggleTheme,
  isDyslexic = false,
  onToggleDyslexic,
}: NavigationProps) {
  const [soundOn, setSoundOn] = React.useState(true);

  React.useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const levelProgress = profile?.levelProgressPercent ?? 65;
  const currentStreak = profile?.currentStreak ?? 7;
  const freezeCount = profile?.freezeCount ?? 2;
  const shards = profile?.spendableShards ?? 250;

  return (
    <header className="sticky top-0 z-40 bg-[#1B1740]/95 backdrop-blur-md border-b border-[#2D2466] shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Role Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('TODAY')}>
            <div className="relative">
              <CompanionAvatar species="FOX" mood="HAPPY" size={38} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FFC83D] border border-[#1B1740] flex items-center justify-center font-display text-[9px] text-[#1B1740]">
                {profile?.currentLevel || 1}
              </div>
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight text-white flex items-center gap-1.5">
                <span>MSOT Quest</span>
                <span className="text-[10px] bg-[#FFC83D]/20 text-[#FFC83D] px-1.5 py-0.5 rounded-md font-sans font-bold border border-[#FFC83D]/40">
                  Realm
                </span>
              </h1>
              <span className="text-[10px] text-slate-300 font-medium">Campus Challenge 2026</span>
            </div>
          </div>

          {/* Quick Role Switcher for Demo */}
          <div className="flex items-center bg-[#151233] rounded-xl p-0.5 border border-[#2D2466] text-xs">
            <button
              onClick={() => onSwitchRole('STUDENT')}
              className={`px-2 py-1 rounded-lg transition font-bold text-[11px] ${
                user?.role === 'STUDENT' ? 'bg-[#FFC83D] text-[#1B1740] shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => onSwitchRole('FACULTY')}
              className={`px-2 py-1 rounded-lg transition font-bold text-[11px] ${
                user?.role === 'FACULTY' ? 'bg-[#FFC83D] text-[#1B1740] shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => onSwitchRole('ADMIN')}
              className={`px-2 py-1 rounded-lg transition font-bold text-[11px] ${
                user?.role === 'ADMIN' ? 'bg-[#FFC83D] text-[#1B1740] shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Student Progress Pills (Streaks, Level, Shards, Controls) */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Streak & Freeze Indicator */}
          <div className="flex items-center gap-1.5 bg-[#2D2466] px-2.5 py-1.5 rounded-xl border border-[#FF5E6C]/30 text-xs shadow-sm">
            <Flame className="w-4 h-4 text-[#FF5E6C] animate-pulse" />
            <span className="font-display text-[#FF5E6C] text-sm">{currentStreak}</span>
            <span className="text-slate-400 text-[10px]">streak</span>
            <span className="h-3 w-[1px] bg-[#3D3280] mx-0.5" />
            <Snowflake className="w-3.5 h-3.5 text-[#4CC9F0]" />
            <span className="text-[#4CC9F0] font-bold text-[11px]">{freezeCount}</span>
          </div>

          {/* Level & XP Progress Bar */}
          <div className="flex items-center gap-2 bg-[#2D2466] px-3 py-1.5 rounded-xl border border-[#3D3280] text-xs shadow-sm min-w-[125px]">
            <Award className="w-4 h-4 text-[#FFC83D]" />
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="font-display text-white">Lvl {profile?.currentLevel || 1}</span>
                <span className="text-[#FFC83D] font-mono font-bold">{profile?.lifetimeXp || 0} XP</span>
              </div>
              <div className="w-full h-1.5 bg-[#1B1740] rounded-full overflow-hidden border border-[#3D3280]/60">
                <div
                  className="h-full bg-gradient-to-r from-[#FFC83D] to-[#FF8A3D] rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shards Currency */}
          <div className="flex items-center gap-1 bg-[#2D2466] px-2.5 py-1.5 rounded-xl border border-[#FFC83D]/30 text-xs">
            <span className="text-[#FFC83D] font-bold">💎 {shards}</span>
          </div>

          {/* Anonymous Mode Toggle */}
          <button
            onClick={onToggleAnonymous}
            title={user?.isAnonymous ? 'Anonymous mode ON (Identity protected)' : 'Anonymous mode OFF'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              user?.isAnonymous
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                : 'bg-[#2D2466] border-[#3D3280] text-slate-300 hover:text-white'
            }`}
          >
            {user?.isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline text-[11px]">
              {user?.isAnonymous ? user?.anonymousAlias || 'Anon' : 'Public'}
            </span>
          </button>

          {/* Storybook Showcase Toggle */}
          <button
            onClick={() => {
              soundManager.play('tap');
              setCurrentTab(currentTab === 'STORYBOOK' ? 'TODAY' : 'STORYBOOK');
            }}
            title="Design System Storybook"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              currentTab === 'STORYBOOK'
                ? 'bg-[#FFC83D] text-[#1B1740] border-[#FFC83D]'
                : 'bg-[#2D2466] border-[#3D3280] text-[#FFC83D] hover:bg-[#382D7F]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Design System</span>
          </button>

          {/* Dyslexia Mode Toggle */}
          {onToggleDyslexic && (
            <button
              onClick={() => {
                soundManager.play('tap');
                onToggleDyslexic();
              }}
              title={isDyslexic ? 'Dyslexia font ON' : 'Dyslexia font OFF'}
              className={`p-1.5 rounded-xl border text-xs transition ${
                isDyslexic
                  ? 'bg-[#4CC9F0]/20 border-[#4CC9F0] text-[#4CC9F0]'
                  : 'bg-[#2D2466] border-[#3D3280] text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          {/* Daybreak / Twilight Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={() => {
                soundManager.play('tap');
                onToggleTheme();
              }}
              title={theme === 'dark' ? 'Switch to Daybreak (Light) theme' : 'Switch to Twilight (Dark) theme'}
              className="p-1.5 rounded-xl bg-[#2D2466] border border-[#3D3280] text-slate-300 hover:text-white transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FFC83D]" /> : <Moon className="w-4 h-4 text-[#4CC9F0]" />}
            </button>
          )}

          {/* Audio Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            title={soundOn ? 'Sound effects ON' : 'Sound effects OFF'}
            className="p-1.5 rounded-xl bg-[#2D2466] border border-[#3D3280] text-slate-300 hover:text-white transition"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#3DDC97]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* In-App Pilot Feedback */}
          <button
            onClick={onOpenFeedback}
            title="Give Pilot Feedback"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#4CC9F0]/15 border border-[#4CC9F0]/30 text-[#4CC9F0] hover:bg-[#4CC9F0] hover:text-[#1B1740] transition text-xs font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Feedback</span>
          </button>
        </div>
      </div>
    </header>
  );
}
