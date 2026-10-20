'use client';

import React, { useState, useEffect } from 'react';
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
  Smartphone,
  KeyRound,
  Download,
  Trash2,
  LogOut,
  RefreshCw,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { AvatarComposer } from '../assets/AvatarComposer';
import { FrameGenerator } from '../assets/FrameGenerator';
import { BannerGenerator } from '../assets/BannerGenerator';
import { FlameGenerator } from '../assets/FlameGenerator';
import { TitleBadge } from '../assets/TitleBadge';
import { AssetAdapter } from '../assets/AssetAdapter';
import { RarityBadge } from '../ui/RarityBadge';
import { ConnectionsWizard } from './ConnectionsWizard';
import { soundManager } from '../../lib/sound-manager';
import { api, setAccessToken } from '../../lib/api';

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
  onLogout?: () => void;
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
  onLogout,
}: ProfileAndSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);

  // Sessions & Security state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaUri, setMfaUri] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.getSessions();
      setSessions(res.sessions || []);
    } catch {
      // Fallback
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    soundManager.play('tap');
    try {
      await api.revokeSession(sessionId);
      soundManager.play('correct');
      setActionMsg({ type: 'success', text: 'Session successfully revoked' });
      await loadSessions();
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Failed to revoke session' });
    }
  };

  const handleLogoutAll = async () => {
    soundManager.play('tap');
    try {
      await api.logoutAll();
      soundManager.play('correct');
      if (onLogout) onLogout();
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Failed to logout from all devices' });
    }
  };

  const handleStartMfaSetup = async () => {
    soundManager.play('tap');
    try {
      const res = await api.setupMfa();
      setMfaSecret(res.secret);
      setMfaUri(res.uri);
      setBackupCodes(res.backupCodes || []);
      setMfaModalOpen(true);
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Failed to initialize 2FA setup' });
    }
  };

  const handleConfirmMfa = async () => {
    soundManager.play('tap');
    try {
      const res = await api.enableMfa(mfaVerifyCode.trim());
      soundManager.play('correct');
      setBackupCodes(res.backupCodes || backupCodes);
      setActionMsg({ type: 'success', text: 'Two-Factor Authentication is now active!' });
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Invalid 6-digit code. Please try again.' });
    }
  };

  const handleExportData = async () => {
    soundManager.play('tap');
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `msot_quest_export_${user?.id || 'learner'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      soundManager.play('correct');
      setActionMsg({ type: 'success', text: 'Your learning records have been downloaded in JSON format.' });
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Failed to export data.' });
    }
  };

  const handleDeleteAccount = async () => {
    soundManager.play('tap');
    try {
      const res = await api.deleteAccount({ reason: 'Student self-service deletion request' });
      soundManager.play('correct');
      setShowDeleteConfirm(false);
      setActionMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 3000);
    } catch (err: any) {
      soundManager.play('wrong');
      setActionMsg({ type: 'error', text: err.message || 'Failed to schedule deletion.' });
    }
  };

  const handleSoundToggle = () => {
    const next = soundManager.toggleMute();
    setSoundEnabled(!next);
  };

  const handleHapticsToggle = () => {
    const next = soundManager.toggleHaptics();
    setHapticsEnabled(next);
  };

  const badges = [
    { name: '7-Day Streak Shield', rarity: 'EPIC', unlocked: true, desc: 'Protected streak for 7 consecutive days' },
    { name: 'Comeback Kid', rarity: 'RARE', unlocked: true, desc: '+250% weekly growth in Bronze League' },
    { name: 'Bug Exterminator', rarity: 'UNCOMMON', unlocked: true, desc: 'Purified 5 Mistake Monsters in revenge duels' },
    { name: 'Mid-Term Archon Slayer', rarity: 'LEGENDARY', unlocked: false, desc: 'Conquer the Course Boss in live raid' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Action Notification */}
      {actionMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
            actionMsg.type === 'success'
              ? 'bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B]'
              : 'bg-[#FF4D5E]/20 border border-[#FF4D5E] text-[#FF4D5E]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-white hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Player Header Card with Sunset Realm Banner */}
      {(() => {
        const equippedBanner = user?.equippedLoadout?.banner || profile?.equippedLoadout?.banner || 'banner_sunset_campus';
        const equippedAvatar = user?.equippedLoadout?.avatar || profile?.equippedLoadout?.avatar || 'avatar_fox_novice';
        const equippedFrame = user?.equippedLoadout?.frame || profile?.equippedLoadout?.frame || 'frame_rustic_wood';
        const equippedTitle = user?.equippedLoadout?.title || profile?.equippedLoadout?.title || 'title_junior_scholar';
        const equippedCompanion = user?.equippedLoadout?.companion || profile?.equippedLoadout?.companion || 'comp_kitsune_ember';
        const { species: compSpecies, stage: compStage } = AssetAdapter.mapCompanionSkin(equippedCompanion);

        return (
          <div className="panel-quest-board rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl">
            {/* Wide Responsive Landscape Banner */}
            <div className="relative w-full max-h-52 overflow-hidden">
              <BannerGenerator bannerKey={equippedBanner} aspectRatio="21/9" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24104F] via-transparent to-transparent opacity-80" />
            </div>

            {/* Overlapping Profile Info Bar */}
            <div className="p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-12 sm:-mt-14 relative z-10">
              <div className="flex items-end gap-4">
                {/* Framed Avatar */}
                <div className="relative">
                  <FrameGenerator frameKey={equippedFrame} size={96} className="filter drop-shadow-xl">
                    <AvatarComposer avatarKey={equippedAvatar} size={76} />
                  </FrameGenerator>
                  <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full bg-[#FFD23F] text-[#24104F] font-display text-xs font-black border-2 border-[#24104F] shadow-lg">
                    Lvl {profile?.currentLevel || 3}
                  </span>
                </div>

                {/* Study Companion Mascot */}
                <div className="hidden sm:block pb-2" title="Equipped Study Companion">
                  <CompanionAvatar
                    species={compSpecies}
                    evolutionStage={compStage}
                    mood="cheering"
                    size={64}
                  />
                </div>

                {/* Identity & Equipped Title */}
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl text-white">
                      {user?.isAnonymous ? user?.anonymousAlias || 'Swift Falcon 42' : user?.name || 'Aarav Sharma'}
                    </h2>
                    <TitleBadge titleKey={equippedTitle} size="sm" />
                  </div>
                  <p className="text-xs text-slate-300">
                    {user?.email} • {user?.campusId || 'Campus 1'} • Role: <strong className="text-[#FFD23F]">{user?.role || 'STUDENT'}</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold bg-[#FFD23F]/20 text-[#FFD23F] px-2.5 py-0.5 rounded-full border border-[#FFD23F]/40">
                      {user?.isAnonymous ? 'Anonymous Mode Active' : 'Public Profile'}
                    </span>
                    <span className="text-[11px] font-bold bg-[#7CF36B]/20 text-[#7CF36B] px-2.5 py-0.5 rounded-full border border-[#7CF36B]/40">
                      {user?.status === 'ACTIVE' ? 'Active Learner' : user?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 w-full sm:w-auto pb-1">
                <div className="p-3 rounded-2xl bg-[#15062C]/80 border border-white/10 text-center shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold block">Lifetime XP</span>
                  <span className="font-display text-lg text-[#FFD23F]">{profile?.lifetimeXp || 1420}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#15062C]/80 border border-white/10 text-center shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold block">Streak Days</span>
                  <span className="font-display text-lg text-[#FF8A2B]">{profile?.currentStreak || 7}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#15062C]/80 border border-white/10 text-center shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold block">Shards</span>
                  <span className="font-display text-lg text-[#FF3D9A]">💎 {profile?.spendableShards || 250}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  ? 'bg-gradient-to-b from-[#24104F] to-[#15062C] border-[#FFD23F]/40 shadow-md'
                  : 'bg-[#15062C]/40 border-white/5 opacity-50'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFD23F]/20 flex items-center justify-center text-[#FFD23F]">
                {b.unlocked ? <Award className="w-6 h-6" /> : <Shield className="w-6 h-6 text-slate-500" />}
              </div>
              <div>
                <span className="font-display text-xs text-white block">{b.name}</span>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{b.desc}</p>
              </div>
              <RarityBadge rarity={b.rarity as any} />
            </div>
          ))}
        </div>
      </div>

      {/* Verified Coding Practice Connections Wizard */}
      <ConnectionsWizard onXpAwarded={onRefreshProfile} />

      {/* Security, Active Sessions & Two-Factor Authentication */}
      <div className="panel-quest-board p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[#22E3FF] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>Security, Sessions & MFA</span>
          </h3>
          <button
            onClick={loadSessions}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
            title="Refresh Sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 2-Factor Authentication Section */}
        <div className="p-4 rounded-2xl bg-[#15062C] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-[#FFD23F]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Two-Factor Authentication (TOTP)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7CF36B]/20 text-[#7CF36B] font-bold border border-[#7CF36B]/40">
                  {user?.role === 'ADMIN' ? 'Mandatory for Admins' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Protect your account with Google Authenticator or any RFC 6238 compatible app.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartMfaSetup}
            className="px-4 py-2 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold shrink-0"
          >
            Configure 2FA
          </button>
        </div>

        {/* Active Sessions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Authorized Sessions ({sessions.length})
            </span>
            <button
              onClick={handleLogoutAll}
              className="text-xs text-[#FF4D5E] hover:underline font-semibold"
            >
              Log Out All Other Devices
            </button>
          </div>

          <div className="space-y-2">
            {sessions.map((s, idx) => (
              <div
                key={s.id || idx}
                className="p-3.5 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{s.userAgent || 'Web Browser'}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#22E3FF]/20 text-[#22E3FF] text-[10px] font-bold">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    IP: {s.ipAddress || '127.0.0.1'} • Created: {new Date(s.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                {idx !== 0 && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-3 py-1 rounded-xl bg-[#FF4D5E]/20 text-[#FF4D5E] hover:bg-[#FF4D5E]/30 font-bold text-[11px] border border-[#FF4D5E]/40"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Rights & DPDP Charter */}
      <div className="panel-quest-board p-6 space-y-4">
        <h3 className="font-display text-lg text-[#7CF36B] flex items-center gap-2">
          <Award className="w-5 h-5" />
          <span>DPDP Act Data Rights & Privacy Charter</span>
        </h3>
        <p className="text-xs text-slate-300">
          In full compliance with the Digital Personal Data Protection Act 2023, you retain absolute ownership over your learning activity records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportData}
            className="p-4 rounded-2xl bg-[#15062C] hover:bg-[#15062C]/80 border border-white/10 text-left space-y-1 transition"
          >
            <div className="flex items-center gap-2 text-[#22E3FF] font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>Download My Data (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Export all your XP ledger transactions, quiz answers, and cosmetic inventory.
            </p>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-4 rounded-2xl bg-[#15062C] hover:bg-[#15062C]/80 border border-[#FF4D5E]/30 text-left space-y-1 transition"
          >
            <div className="flex items-center gap-2 text-[#FF4D5E] font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Request Account Deletion</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Initiates a 30-day grace period with full anonymization of historical XP records.
            </p>
          </button>
        </div>
      </div>

      {/* Audio & Accessibility Controls */}
      <div className="panel-quest-board p-6 space-y-4">
        <h3 className="font-display text-lg text-white">Audio & Experience Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sound FX Toggle */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-[#FFD23F]" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              <div>
                <span className="font-bold text-sm text-white block">Sound Effects</span>
                <span className="text-xs text-slate-400">Level-up chimes and tactile taps</span>
              </div>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                soundEnabled ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'bg-white/10 text-slate-400'
              }`}
            >
              {soundEnabled ? 'Muted' : 'Unmuted'}
            </button>
          </div>

          {/* Dyslexia-Friendly Font Toggle */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#22E3FF]" />
              <div>
                <span className="font-bold text-sm text-white block">Dyslexic Font</span>
                <span className="text-xs text-slate-400">Enhanced character distinction</span>
              </div>
            </div>
            <button
              onClick={onToggleDyslexic}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                isDyslexic ? 'bg-[#22E3FF] text-[#24104F] font-bold shadow' : 'bg-white/10 text-slate-400'
              }`}
            >
              {isDyslexic ? 'Enabled' : 'Standard'}
            </button>
          </div>

          {/* Anonymous Leaderboard Mode */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.isAnonymous ? <EyeOff className="w-5 h-5 text-[#FF3D9A]" /> : <Eye className="w-5 h-5 text-slate-400" />}
              <div>
                <span className="font-bold text-sm text-white block">Anonymous Mode</span>
                <span className="text-xs text-slate-400">Mask real name on leaderboards</span>
              </div>
            </div>
            <button
              onClick={onToggleAnonymous}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                user?.isAnonymous ? 'bg-[#FF3D9A] text-white font-bold shadow' : 'bg-white/10 text-slate-400'
              }`}
            >
              {user?.isAnonymous ? 'Masked' : 'Public'}
            </button>
          </div>

          {/* Battery Saver Mode */}
          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="w-5 h-5 text-[#7CF36B]" />
              <div>
                <span className="font-bold text-sm text-white block">Battery Saver</span>
                <span className="text-xs text-slate-400">Pause background sky animation</span>
              </div>
            </div>
            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`px-3 py-1.5 rounded-xl font-display text-xs transition ${
                lowDataMode ? 'bg-[#7CF36B] text-[#24104F] font-bold shadow' : 'bg-white/10 text-slate-400'
              }`}
            >
              {lowDataMode ? 'Saver On' : 'Standard'}
            </button>
          </div>
        </div>

        {/* Pilot Feedback & Sign Out */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onOpenFeedback}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#FFF8E7] font-display text-xs flex items-center justify-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4 text-[#22E3FF]" />
            <span>Submit Feedback for Student Challenge Pilot 2026</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('tap');
              api.logout();
              setAccessToken(null);
              if (onLogout) onLogout();
            }}
            className="py-3 px-6 rounded-2xl bg-[#FF4D5E]/20 hover:bg-[#FF4D5E]/30 border border-[#FF4D5E]/40 text-[#FF4D5E] font-display text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* MFA Setup Modal */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#24104F] border-2 border-[#FFD23F] rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <h3 className="font-display text-xl text-white">Setup Two-Factor Authentication</h3>
            <p className="text-xs text-slate-300">
              Scan the setup URI in your authenticator app (Google Authenticator, Authy, 1Password) or copy the secret key below:
            </p>

            <div className="p-3 rounded-xl bg-[#15062C] font-mono text-center text-sm text-[#FFD23F] select-all border border-white/10">
              {mfaSecret}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Enter 6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={mfaVerifyCode}
                onChange={(e) => setMfaVerifyCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2 rounded-xl bg-[#15062C] border border-white/20 text-center font-mono text-lg text-white focus:outline-none focus:border-[#FFD23F]"
              />
            </div>

            {backupCodes.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-[#7CF36B] block">Emergency Backup Recovery Codes</span>
                <p className="text-[10px] text-slate-400">Save these 8 backup codes in a secure vault. Each can be used once.</p>
                <div className="grid grid-cols-2 gap-1 p-2 rounded-xl bg-[#15062C] font-mono text-[11px] text-slate-300">
                  {backupCodes.map((code) => (
                    <span key={code} className="text-center">{code}</span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                  }}
                  className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCodes ? 'Copied to Clipboard!' : 'Copy Backup Codes'}</span>
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setMfaModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleConfirmMfa}
                className="flex-1 py-2.5 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#24104F] border-2 border-[#FF4D5E] rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <h3 className="font-display text-xl text-[#FF4D5E] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Confirm Account Deletion</span>
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete your account?
            </p>
            <div className="p-3 rounded-xl bg-[#15062C] text-xs text-slate-300 space-y-1.5 border border-white/10">
              <p>• <strong>30-Day Grace Period:</strong> You can cancel this request within 30 days by signing in.</p>
              <p>• <strong>XP Ledger Anonymization:</strong> All historical learning points are scrubbed of personal identifiers.</p>
              <p>• <strong>Academic Record Independence:</strong> Official college attendance and marks remain untouched in the college database.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4D5E] hover:bg-[#FF4D5E]/80 text-white font-display text-xs font-bold"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
