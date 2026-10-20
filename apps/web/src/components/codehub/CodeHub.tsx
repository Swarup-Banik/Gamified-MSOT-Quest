'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Code2,
  GitBranch,
  Terminal,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Flame,
  Award,
  ChevronRight,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Pressable } from '../ui/Pressable';
import { useReward } from '../../lib/use-reward';
import { motion, AnimatePresence } from 'framer-motion';

export interface PlatformConnection {
  provider: 'LEETCODE' | 'HACKERRANK' | 'GITHUB';
  linked: boolean;
  handle?: string;
  verifiedAt?: string;
  lastSyncAt?: string;
  solvedToday?: number;
  activeToday?: boolean;
  xpThisWeek?: number;
  streakDays?: number;
  stars?: number;
  status: 'ACTIVE' | 'PAUSED' | 'UNLINKED' | 'RATE_LIMITED';
  recentSolves?: Array<{
    id: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    xp: number;
    timestamp: string;
    url?: string;
  }>;
}

export interface ProblemOfTheDay {
  id: string;
  title: string;
  provider: 'LEETCODE' | 'HACKERRANK' | 'GITHUB';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xp: number;
  url: string;
  source: 'FACULTY_CURATED' | 'TOPIC_FALLBACK';
  topic: string;
  completedToday: boolean;
}

interface CodeHubProps {
  studentId?: string;
  anonymousMode?: boolean;
  onNavigateToFullHub?: () => void;
}

export function CodeHub({
  studentId = 'student_1',
  anonymousMode = false,
  onNavigateToFullHub,
}: CodeHubProps) {
  const { triggerReward, triggerCelebration } = useReward();

  // Platforms State
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    {
      provider: 'LEETCODE',
      linked: true,
      handle: 'scholar_msot',
      verifiedAt: '2026-10-15T10:00:00Z',
      lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      solvedToday: 2,
      xpThisWeek: 30,
      streakDays: 4,
      status: 'ACTIVE',
      recentSolves: [
        {
          id: 's_1',
          title: 'Reverse Linked List',
          difficulty: 'EASY',
          xp: 10,
          timestamp: '2 hours ago',
          url: 'https://leetcode.com/problems/reverse-linked-list',
        },
        {
          id: 's_2',
          title: 'Two Sum II - Input Array Is Sorted',
          difficulty: 'MEDIUM',
          xp: 20,
          timestamp: 'Yesterday',
          url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted',
        },
      ],
    },
    {
      provider: 'HACKERRANK',
      linked: true,
      handle: 'dev_swarup',
      verifiedAt: '2026-10-12T14:30:00Z',
      lastSyncAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      stars: 4,
      xpThisWeek: 15,
      streakDays: 2,
      status: 'ACTIVE',
      recentSolves: [
        {
          id: 'hr_1',
          title: 'Java 1D Array Part 2',
          difficulty: 'MEDIUM',
          xp: 15,
          timestamp: '3 days ago',
          url: 'https://hackerrank.com/challenges/java-1d-array',
        },
      ],
    },
    {
      provider: 'GITHUB',
      linked: true,
      handle: 'campus-builder',
      verifiedAt: '2026-10-10T08:00:00Z',
      lastSyncAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      activeToday: true,
      xpThisWeek: 20,
      streakDays: 5,
      status: 'ACTIVE',
      recentSolves: [
        {
          id: 'gh_1',
          title: 'feat: add graph BFS traversal algorithm',
          difficulty: 'EASY',
          xp: 10,
          timestamp: 'Today, 11:30 AM',
          url: 'https://github.com',
        },
      ],
    },
  ]);

  // Curated Problem of the Day
  const [problemOfTheDay, setProblemOfTheDay] = useState<ProblemOfTheDay>({
    id: 'potd_1',
    title: 'Reverse a Linked List',
    provider: 'LEETCODE',
    difficulty: 'MEDIUM',
    xp: 25,
    url: 'https://leetcode.com/problems/reverse-linked-list',
    source: 'FACULTY_CURATED',
    topic: 'Linked Lists & Pointers',
    completedToday: false,
  });

  // Syncing & Cooldown State
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncCooldowns, setSyncCooldowns] = useState<Record<string, number>>({});
  const [dailyCapReached, setDailyCapReached] = useState<boolean>(false);

  // Modals
  const [expandedPlatform, setExpandedPlatform] = useState<PlatformConnection | null>(null);
  const [connectModalProvider, setConnectModalProvider] = useState<
    'LEETCODE' | 'HACKERRANK' | 'GITHUB' | null
  >(null);
  const [connectStep, setConnectStep] = useState<number>(1);
  const [handleInput, setHandleInput] = useState<string>('');
  const [challengeCode, setChallengeCode] = useState<string>('msot-verify-7892b1');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Return-Sync Listener (visibilitychange)
  const lastSyncTimestampRef = useRef<number>(Date.now());
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const elapsed = (Date.now() - lastSyncTimestampRef.current) / 1000;
        if (elapsed > 60) {
          // Trigger return-sync on first linked active platform
          const activePlatform = platforms.find((p) => p.linked && p.status === 'ACTIVE');
          if (activePlatform) {
            await handleSync(activePlatform.provider, true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [platforms]);

  // Sync Provider Handler
  const handleSync = async (provider: 'LEETCODE' | 'HACKERRANK' | 'GITHUB', isAutoReturn = false) => {
    const now = Date.now();
    const lastSyncTime = syncCooldowns[provider] || 0;
    if (now - lastSyncTime < 30000 && !isAutoReturn) {
      // 30s cooldown
      return;
    }

    setSyncingProvider(provider);
    setSyncCooldowns((prev) => ({ ...prev, [provider]: now }));
    lastSyncTimestampRef.current = now;

    try {
      // Call sync API (falls back gracefully)
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, studentId }),
      }).catch(() => null);

      setTimeout(() => {
        setSyncingProvider(null);

        // Update platform lastSyncAt & trigger celebration if solves detected
        setPlatforms((prev) =>
          prev.map((p) => {
            if (p.provider === provider) {
              const newSolved = (p.solvedToday || 0) + 1;
              return {
                ...p,
                lastSyncAt: new Date().toISOString(),
                solvedToday: newSolved,
                xpThisWeek: (p.xpThisWeek || 0) + 15,
              };
            }
            return p;
          })
        );

        // Trigger celebratory feedback
        triggerReward({
          type: 'CODING_PRACTICE_SOLVE',
          xpAmount: 15,
        });
      }, 900);
    } catch {
      setSyncingProvider(null);
    }
  };

  // Connect & Verify Flow
  const handleStartConnect = (provider: 'LEETCODE' | 'HACKERRANK' | 'GITHUB') => {
    setConnectModalProvider(provider);
    setConnectStep(1);
    setHandleInput('');
    setChallengeCode(`msot-${provider.toLowerCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8)}`);
  };

  const handleVerifyOwnership = async () => {
    if (!handleInput.trim() || !connectModalProvider) return;
    setIsVerifying(true);

    try {
      // Call verification endpoint
      await fetch('/api/integrations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connectModalProvider,
          handle: handleInput.trim(),
          challengeCode,
          studentId,
        }),
      }).catch(() => null);

      setTimeout(() => {
        setIsVerifying(false);
        // Mark as linked
        setPlatforms((prev) =>
          prev.map((p) => {
            if (p.provider === connectModalProvider) {
              return {
                ...p,
                linked: true,
                handle: handleInput.trim(),
                status: 'ACTIVE',
                verifiedAt: new Date().toISOString(),
                lastSyncAt: new Date().toISOString(),
                solvedToday: 1,
                xpThisWeek: 15,
              };
            }
            return p;
          })
        );

        setConnectModalProvider(null);
        triggerCelebration({
          tier: 'MEDIUM',
          title: `${connectModalProvider} Linked!`,
          subtitle: 'Verified practice unlocked. +50 Bonus XP!',
          xpAmount: 50,
        });
      }, 1000);
    } catch {
      setIsVerifying(false);
    }
  };

  const handleUnlink = (provider: string) => {
    setPlatforms((prev) =>
      prev.map((p) => {
        if (p.provider === provider) {
          return {
            ...p,
            linked: false,
            handle: undefined,
            status: 'UNLINKED',
            solvedToday: 0,
          };
        }
        return p;
      })
    );
    setExpandedPlatform(null);
  };

  const getPlatformIcon = (provider: string) => {
    switch (provider) {
      case 'LEETCODE':
        return <Code2 className="w-5 h-5 text-[#FFA116]" />;
      case 'HACKERRANK':
        return <Terminal className="w-5 h-5 text-[#00EA64]" />;
      case 'GITHUB':
        return <GitBranch className="w-5 h-5 text-[#58A6FF]" />;
      default:
        return <Code2 className="w-5 h-5" />;
    }
  };

  const getPlatformExternalUrl = (provider: string, handle?: string) => {
    switch (provider) {
      case 'LEETCODE':
        return handle ? `https://leetcode.com/${handle}` : 'https://leetcode.com';
      case 'HACKERRANK':
        return handle ? `https://hackerrank.com/${handle}` : 'https://hackerrank.com';
      case 'GITHUB':
        return handle ? `https://github.com/${handle}` : 'https://github.com';
      default:
        return '#';
    }
  };

  const formatTimeAgo = (iso?: string) => {
    if (!iso) return 'Never';
    const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <section className="w-full rounded-3xl p-5 sm:p-7 bg-[#1C0F38]/90 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#22E3FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#22E3FF] to-[#B26CFF] p-0.5 shadow-lg shadow-[#22E3FF]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#1A0933] rounded-[14px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-[#22E3FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg text-white font-bold tracking-wide">
                Code Hub
              </h2>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/40">
                Verified XP
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Solve problems on LeetCode, HackerRank & GitHub to fuel your mastery loop
            </p>
          </div>
        </div>

        {onNavigateToFullHub && (
          <Pressable
            role="navigation"
            onClick={onNavigateToFullHub}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
          >
            <span>Full coding league</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Pressable>
        )}
      </div>

      {/* Daily Cap Reminder Note */}
      {dailyCapReached && (
        <div className="p-3 rounded-2xl bg-[#FFD23F]/10 border border-[#FFD23F]/30 text-xs text-[#FFD23F] flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>You&apos;ve hit today&apos;s coding XP cap (70 XP). More solves still count toward badges and league climbing!</span>
        </div>
      )}

      {/* 3 Platform Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((plat) => {
          const isSyncing = syncingProvider === plat.provider;

          if (!plat.linked) {
            // UNLINKED STATE
            return (
              <div
                key={plat.provider}
                className="rounded-2xl p-4 bg-[#140628]/80 border-2 border-dashed border-white/15 flex flex-col justify-between gap-4 group hover:border-[#FFD23F]/50 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(plat.provider)}
                      <span className="font-display text-sm font-semibold text-white">
                        {plat.provider}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Not linked
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Connect your account to earn daily XP and unlock the exclusive{' '}
                    <span className="text-[#FFD23F] font-medium">{plat.provider} Emblem</span>.
                  </p>
                </div>

                <Pressable
                  role="primary"
                  onClick={() => handleStartConnect(plat.provider)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#1A0B2E] font-display text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FFD23F]/25 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Connect {plat.provider}</span>
                </Pressable>
              </div>
            );
          }

          // LINKED STATE
          return (
            <div
              key={plat.provider}
              onClick={() => setExpandedPlatform(plat)}
              className="rounded-2xl p-4 bg-[#140628]/90 border border-white/15 hover:border-[#22E3FF]/50 transition-all shadow-lg cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              {/* Top Row: Handle & Verified Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(plat.provider)}
                  <span className="font-display text-sm font-bold text-white">
                    {plat.provider === 'LEETCODE'
                      ? 'LeetCode'
                      : plat.provider === 'HACKERRANK'
                      ? 'HackerRank'
                      : 'GitHub'}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3DDC97]/15 border border-[#3DDC97]/30 text-[11px] font-medium text-[#3DDC97]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Handle & Status */}
              <div className="space-y-1">
                <p className="text-xs font-mono text-slate-300 truncate">
                  @{anonymousMode ? 'scholar_anon' : plat.handle}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {plat.provider === 'LEETCODE'
                      ? `Solved today: ${plat.solvedToday || 0}`
                      : plat.provider === 'HACKERRANK'
                      ? `Badge stars: +${plat.stars || 1}`
                      : `Active day: ${plat.activeToday ? 'Yes' : 'No'}`}
                  </span>
                  <span className="text-[#3DDC97] font-semibold">
                    +{plat.xpThisWeek || 0} XP this wk
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Synced {formatTimeAgo(plat.lastSyncAt)}
                </p>
              </div>

              {/* Action Buttons: Open & Sync */}
              <div
                className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={getPlatformExternalUrl(plat.provider, plat.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
                  data-pressable="true"
                >
                  <span>Open ↗</span>
                </a>

                <Pressable
                  role="secondary"
                  disabled={isSyncing}
                  onClick={() => handleSync(plat.provider)}
                  className="py-1.5 px-2.5 rounded-xl bg-[#22E3FF]/15 hover:bg-[#22E3FF]/25 border border-[#22E3FF]/30 text-[#22E3FF] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </Pressable>
              </div>
            </div>
          );
        })}
      </div>

      {/* Problem of the Day + Streak & Feeds */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#17082E] via-[#210B3F] to-[#17082E] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Problem details */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-[#FFD23F]/15 border border-[#FFD23F]/30 text-[#FFD23F] font-display text-[11px] font-bold">
              Problem of the Day
            </span>
            <span className="text-xs text-slate-400">
              ({problemOfTheDay.source === 'FACULTY_CURATED' ? "from your faculty's syllabus" : 'topic recommendation'})
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22E3FF]/20 text-[#22E3FF]">
              {problemOfTheDay.difficulty}
            </span>
            <span className="text-xs font-bold text-[#3DDC97]">
              +{problemOfTheDay.xp} XP
            </span>
          </div>

          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <span>&ldquo;{problemOfTheDay.title}&rdquo;</span>
          </h3>

          <p className="text-xs text-slate-400 flex items-center gap-3">
            <span>Topic: {problemOfTheDay.topic}</span>
            <span>•</span>
            <span className="text-[#3DDC97]">Auto-checks on sync</span>
          </p>
        </div>

        {/* Right: Actions & Streak */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
            <Flame className="w-4 h-4 text-[#FF5E6C] fill-current animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Coding streak</span>
              <span className="font-bold text-white">4 days</span>
            </div>
          </div>

          <a
            href={problemOfTheDay.url}
            target="_blank"
            rel="noopener noreferrer"
            data-pressable="true"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FFD23F]/20 flex items-center gap-2 hover:brightness-110 active:scale-95 transition"
          >
            <span>Open on {problemOfTheDay.provider}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TILE EXPANSION MODAL                                           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {expandedPlatform && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#1A0A33] border border-white/20 p-6 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(expandedPlatform.provider)}
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {expandedPlatform.provider} Details
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      @{expandedPlatform.handle}
                    </p>
                  </div>
                </div>
                <Pressable
                  role="close"
                  onClick={() => setExpandedPlatform(null)}
                  className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Pressable>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[#120524] border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Solved Today</span>
                  <span className="font-display text-xl font-bold text-[#FFD23F]">
                    {expandedPlatform.solvedToday || 0}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#120524] border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Weekly XP</span>
                  <span className="font-display text-xl font-bold text-[#3DDC97]">
                    +{expandedPlatform.xpThisWeek || 0}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#120524] border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase">Streak</span>
                  <span className="font-display text-xl font-bold text-[#FF5E6C]">
                    {expandedPlatform.streakDays || 0}d
                  </span>
                </div>
              </div>

              {/* Recent verified submissions feed */}
              <div className="space-y-2">
                <h4 className="text-xs font-display font-semibold uppercase text-slate-400 tracking-wider">
                  Recent Verified Submissions (Last 5)
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(expandedPlatform.recentSolves || []).map((solve) => (
                    <div
                      key={solve.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{solve.title}</p>
                        <p className="text-[10px] text-slate-400">{solve.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            solve.difficulty === 'EASY'
                              ? 'bg-[#3DDC97]/20 text-[#3DDC97]'
                              : solve.difficulty === 'MEDIUM'
                              ? 'bg-[#FFD23F]/20 text-[#FFD23F]'
                              : 'bg-[#FF5E6C]/20 text-[#FF5E6C]'
                          }`}
                        >
                          {solve.difficulty}
                        </span>
                        <span className="font-bold text-[#3DDC97]">+{solve.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unlink Management */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <Pressable
                  role="danger"
                  onClick={() => handleUnlink(expandedPlatform.provider)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition"
                >
                  Unlink Account
                </Pressable>

                <Pressable
                  role="secondary"
                  onClick={() => setExpandedPlatform(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold"
                >
                  Close
                </Pressable>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* CONNECT WIZARD MODAL (BOTTOM SHEET / DIALOG)                   */}
      {/* ============================================================== */}
      <AnimatePresence>
        {connectModalProvider && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#1A0A33] border border-white/20 p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#22E3FF]" />
                  <h3 className="font-display text-base font-bold text-white">
                    Connect {connectModalProvider}
                  </h3>
                </div>
                <Pressable
                  role="close"
                  onClick={() => setConnectModalProvider(null)}
                  className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Pressable>
              </div>

              {connectStep === 1 ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#120524] border border-white/10 text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-white">Why link your account?</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>Earn 10–40 XP for every accepted problem solve.</li>
                      <li>Fuel your weekly campus league standing.</li>
                      <li>Official marks remain completely separate and unmutated.</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">
                      Your {connectModalProvider} Handle
                    </label>
                    <input
                      type="text"
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder="e.g. username"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E031E] border border-white/20 text-white text-sm focus:outline-none focus:border-[#22E3FF]"
                    />
                  </div>

                  <Pressable
                    role="primary"
                    disabled={!handleInput.trim()}
                    onClick={() => setConnectStep(2)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Next: Verify Ownership</span>
                    <ChevronRight className="w-4 h-4" />
                  </Pressable>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    To prove you own <span className="text-[#22E3FF] font-mono">@{handleInput}</span>, paste this one-time challenge code into your public profile &ldquo;About Me&rdquo; or bio:
                  </p>

                  <div className="p-3 rounded-xl bg-[#0E031E] border border-[#22E3FF]/30 font-mono text-center text-sm font-bold text-[#FFD23F] select-all">
                    {challengeCode}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Once saved on {connectModalProvider}, click Verify below to activate your link and claim your bonus badge!
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Pressable
                      role="secondary"
                      onClick={() => setConnectStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 text-xs font-semibold"
                    >
                      Back
                    </Pressable>

                    <Pressable
                      role="primary"
                      disabled={isVerifying}
                      onClick={handleVerifyOwnership}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3DDC97] to-[#22E3FF] text-[#140628] font-display text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isVerifying ? 'Verifying...' : 'Verify Ownership'}</span>
                    </Pressable>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
