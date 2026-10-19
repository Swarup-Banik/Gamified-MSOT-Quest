'use client';

import React, { useState } from 'react';
import {
  User,
  Trophy,
  Flame,
  Award,
  Volume2,
  VolumeX,
  Vibrate,
  Sun,
  Moon,
  BookOpen,
  Eye,
  EyeOff,
  Battery,
  MessageSquare,
  Shield,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { RarityBadge } from '../ui/RarityBadge';
import { soundManager } from '../../lib/sound-manager';

interface ProfileAndSettingsProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isDyslexic: boolean;
  onToggleDyslexic: () => void;
  onOpenFeedback: () => void;
  onToggleAnonymous: () => void;
}

export function ProfileAndSettings({
  user,
  profile,
  onRefreshProfile,
  theme,
  onToggleTheme,
  isDyslexic,
  onToggleDyslexic,
  onOpenFeedback,
  onToggleAnonymous,
}: ProfileAndSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);

  const handleSoundToggle = () => {
    const next = soundManager.toggleMute();
    setSoundEnabled(!next);
  };

  const handleHapticsToggle = () => {
    const next = soundManager.toggleHaptics();
    setHapticsEnabled(next);
  };

  // Mocked trophies / badges
  const badges = [
    { name: '7-Day Streak Shield', rarity: 'EPIC', unlocked: true, desc: 'Protected streak for 7 consecutive days' },
    { name: 'Comeback Kid', rarity: 'RARE', unlocked: true, desc: '+250% weekly growth in Bronze League' },
    { name: 'Bug Exterminator', rarity: 'UNCOMMON', unlocked: true, desc: 'Purified 5 Mistake Monsters in revenge duels' },
    { name: 'Mid-Term Archon Slayer', rarity: 'LEGENDARY', unlocked: false, desc: 'Conquer the Course Boss in live raid' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Player Header Card */}
      <div className="panel-quest-board p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FFD23F] via-[#FF8A2B] to-[#FF3D9A] shadow-lg">
              <div className="w-full h-full rounded-full bg-[#24104F] flex items-center justify-center overflow-hidden">
                <CompanionAvatar species="fox" mood="happy" size={70} />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-[#FFD23F] text-[#24104F] font-display text-xs font-bold border border-[#24104F] shadow">
              Lvl {profile?.currentLevel || 3}
            </span>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white">
              {user?.isAnonymous ? user?.anonymousAlias || 'Swift Falcon 42' : user?.name || 'Aarav Sharma'}
            </h2>
            <p className="text-xs text-slate-300">
              Campus 1 (South) • Batch 2025 • CS201 Data Structures
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold bg-[#FFD23F]/20 text-[#FFD23F] px-2.5 py-0.5 rounded-full border border-[#FFD23F]/40">
                {user?.isAnonymous ? 'Anonymous Mode Active' : 'Public Profile'}
              </span>
              <span className="text-[11px] font-bold bg-[#7CF36B]/20 text-[#7CF36B] px-2.5 py-0.5 rounded-full border border-[#7CF36B]/40">
                Bronze League Contender
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="p-3 rounded-2xl bg-[#15062C]/70 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Lifetime XP</span>
            <span className="font-display text-lg text-[#FFD23F]">{profile?.lifetimeXp || 1420}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#15062C]/70 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Streak Days</span>
            <span className="font-display text-lg text-[#FF8A2B]">{profile?.currentStreak || 7}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#15062C]/70 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Shards</span>
            <span className="font-display text-lg text-[#FF3D9A]">💎 {profile?.spendableShards || 250}</span>
          </div>
        </div>
      </div>

      {/* Trophy Case & Badges Shelf */}
      <div className="panel-reward-tray p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[#FFD23F] flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span>Mastery Trophy Shelf</span>
          </h3>
          <span className="text-xs text-slate-300">
            3 of 4 Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map(b => (
            <div
              key={b.name}
              className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                b.unlocked
                  ? 'bg-[#15062C]/80 border-white/20 shadow-lg'
                  : 'bg-[#15062C]/40 border-white/5 opacity-50'
              }`}
            >
              <div className="flex justify-center">
                <RarityBadge rarity={b.rarity} size="sm" />
              </div>
              <h4 className="font-display text-sm text-white mt-1">{b.name}</h4>
              <p className="text-[11px] text-slate-300 leading-snug">{b.desc}</p>
              {b.unlocked ? (
                <span className="text-[10px] text-[#7CF36B] font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Earned
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">Locked</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Player Settings Panel (All settings moved here from header) */}
      <div className="panel-league p-6 space-y-5">
        <h3 className="font-display text-lg text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#22E3FF]" />
          <span>Player Preferences & Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audio Sound Effects */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[#7CF36B]" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <span className="font-bold text-sm text-white block">Synthesizer Sounds</span>
                <span className="text-xs text-slate-400">Web Audio chimes and cues</span>
              </div>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                soundEnabled
                  ? 'bg-[#7CF36B] text-[#24104F] font-bold shadow'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Haptic Vibration */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-[#FFD23F]" />
              <div>
                <span className="font-bold text-sm text-white block">Haptic Feedback</span>
                <span className="text-xs text-slate-400">Tactile vibrations on tap & hit</span>
              </div>
            </div>
            <button
              onClick={handleHapticsToggle}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                hapticsEnabled
                  ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {hapticsEnabled ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[#5B2EE0]" />
              ) : (
                <Sun className="w-5 h-5 text-[#FF8A2B]" />
              )}
              <div>
                <span className="font-bold text-sm text-white block">Atmosphere Theme</span>
                <span className="text-xs text-slate-400">Sunset Twilight vs Daybreak</span>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8E7] font-display text-xs transition"
            >
              {theme === 'dark' ? 'Sunset Twilight' : 'Daybreak Light'}
            </button>
          </div>

          {/* Dyslexia-Friendly Font */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#22E3FF]" />
              <div>
                <span className="font-bold text-sm text-white block">Dyslexia Font Mode</span>
                <span className="text-xs text-slate-400">OpenDyslexic typography</span>
              </div>
            </div>
            <button
              onClick={onToggleDyslexic}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                isDyslexic
                  ? 'bg-[#22E3FF] text-[#24104F] font-bold shadow'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {isDyslexic ? 'Enabled' : 'Standard'}
            </button>
          </div>

          {/* Anonymous Leaderboard Mode */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.isAnonymous ? (
                <EyeOff className="w-5 h-5 text-[#FF3D9A]" />
              ) : (
                <Eye className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <span className="font-bold text-sm text-white block">Anonymous Mode</span>
                <span className="text-xs text-slate-400">Mask real name on leaderboards</span>
              </div>
            </div>
            <button
              onClick={onToggleAnonymous}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                user?.isAnonymous
                  ? 'bg-[#FF3D9A] text-white font-bold shadow'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {user?.isAnonymous ? 'Masked' : 'Public'}
            </button>
          </div>

          {/* Battery Saver / Low Data Mode */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="w-5 h-5 text-[#7CF36B]" />
              <div>
                <span className="font-bold text-sm text-white block">Battery Saver Mode</span>
                <span className="text-xs text-slate-400">Pause background sky parallax</span>
              </div>
            </div>
            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                lowDataMode
                  ? 'bg-[#7CF36B] text-[#24104F] font-bold shadow'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              {lowDataMode ? 'Saver On' : 'Standard'}
            </button>
          </div>
        </div>

        {/* Pilot Feedback Survey Button */}
        <div className="pt-2">
          <button
            onClick={onOpenFeedback}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FFF8E7] font-display text-xs flex items-center justify-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4 text-[#22E3FF]" />
            <span>Submit Feedback for Student Challenge Pilot 2026</span>
          </button>
        </div>
      </div>
    </div>
  );
}
