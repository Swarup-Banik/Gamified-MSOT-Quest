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
} from 'lucide-react';
import { toggleSound, isSoundEnabled } from '../lib/sound';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  profile: any;
  onToggleAnonymous: () => void;
  onOpenFeedback: () => void;
  onSwitchRole: (role: string) => void;
}

export function Navigation({
  currentTab,
  setCurrentTab,
  user,
  profile,
  onToggleAnonymous,
  onOpenFeedback,
  onSwitchRole,
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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Role Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                MSOT Quest
              </h1>
              <span className="text-[10px] text-slate-400 font-medium">Campus Challenge 2026</span>
            </div>
          </div>

          {/* Quick Role Switcher for Demo */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => onSwitchRole('STUDENT')}
              className={`px-2 py-1 rounded-md transition font-medium ${
                user?.role === 'STUDENT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => onSwitchRole('FACULTY')}
              className={`px-2 py-1 rounded-md transition font-medium ${
                user?.role === 'FACULTY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => onSwitchRole('ADMIN')}
              className={`px-2 py-1 rounded-md transition font-medium ${
                user?.role === 'ADMIN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Student Progress Pills (Streaks, Level, Shards, Controls) */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Streak & Freeze Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-rose-500/20 text-xs shadow-sm">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="font-bold text-rose-400">{currentStreak}</span>
            <span className="text-slate-500">days</span>
            <span className="h-3 w-[1px] bg-slate-700 mx-0.5" />
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">{freezeCount}</span>
          </div>

          {/* Level & XP Progress Bar */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-indigo-500/20 text-xs shadow-sm min-w-[130px]">
            <Award className="w-4 h-4 text-indigo-400" />
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="font-bold text-white">Lvl {profile?.currentLevel || 1}</span>
                <span className="text-indigo-300">{profile?.lifetimeXp || 0} XP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shards Currency */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-xs">
            <span className="text-amber-400 font-bold">💎 {shards}</span>
          </div>

          {/* Anonymous Mode Toggle */}
          <button
            onClick={onToggleAnonymous}
            title={user?.isAnonymous ? 'Anonymous mode ON (Identity protected)' : 'Anonymous mode OFF'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              user?.isAnonymous
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {user?.isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {user?.isAnonymous ? user?.anonymousAlias || 'Anon' : 'Public'}
            </span>
          </button>

          {/* Audio Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            title={soundOn ? 'Sound effects ON' : 'Sound effects OFF'}
            className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* In-App Pilot Feedback */}
          <button
            onClick={onOpenFeedback}
            title="Give Pilot Feedback"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-xs font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Feedback</span>
          </button>
        </div>
      </div>
    </header>
  );
}
