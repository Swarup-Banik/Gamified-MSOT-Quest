'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  Ghost,
  Swords,
  Shield,
  Users,
  Flame,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Skull,
} from 'lucide-react';
import { api } from '../lib/api';
import { playCorrectSound } from '../lib/sound';

interface LeaguesAndBattlesProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

export function LeaguesAndBattles({ user, profile, onRefreshProfile }: LeaguesAndBattlesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'LEAGUE' | 'IMPROVEMENT' | 'GHOST' | 'BATTLES'>('LEAGUE');
  const [standings, setStandings] = useState<any[]>([]);
  const [ghostData, setGhostData] = useState<any | null>(null);
  const [battles, setBattles] = useState<any[]>([]);
  const [isSubmittingBattle, setIsSubmittingBattle] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab, user?.id]);

  const loadData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      if (activeSubTab === 'LEAGUE') {
        const res = await api.getWeeklyLeague(studentId);
        setStandings(res.standings || []);
      } else if (activeSubTab === 'IMPROVEMENT') {
        const res = await api.getImprovementLeaderboard();
        setStandings(res.standings || []);
      } else if (activeSubTab === 'GHOST') {
        const res = await api.getGhostMode(studentId);
        setGhostData(res);
      } else if (activeSubTab === 'BATTLES') {
        const res = await api.getActiveBattles();
        setBattles(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load league data', err);
    }
  };

  const handleContributeBattle = async (eventId: string, teamId: string) => {
    setIsSubmittingBattle(true);
    try {
      const studentId = user?.id || 'student_1';
      const result = await api.submitBattlePoints(eventId, studentId, teamId, 25);
      playCorrectSound();
      alert(`⚔️ Victory Strike! Added +25 points to your team! Scoreboard updated in real-time.`);
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      alert(err.message || 'Battle submission failed');
    } finally {
      setIsSubmittingBattle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('LEAGUE')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'LEAGUE'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Weekly League (Gold Tier)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('IMPROVEMENT')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'IMPROVEMENT'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Improvement Ranking</span>
        </button>

        <button
          onClick={() => setActiveSubTab('GHOST')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'GHOST'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Ghost className="w-4 h-4" />
          <span>Ghost Mode (Personal Best)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BATTLES')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'BATTLES'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Team Battles & Raid Boss</span>
        </button>
      </div>

      {/* 1. Weekly League Standings */}
      {activeSubTab === 'LEAGUE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>20 students of similar mastery • Top 4 promoted, Bottom 4 relegated</span>
            <span className="text-indigo-400 font-semibold">Resets in 3 days</span>
          </div>

          <div className="quest-card overflow-hidden">
            <div className="divide-y divide-slate-800">
              {standings.map(entry => {
                const isPromo = entry.promotionStatus === 'PROMOTION_ZONE';
                const isReleg = entry.promotionStatus === 'RELEGATION_ZONE';

                return (
                  <div
                    key={entry.rank}
                    className={`p-3.5 flex items-center justify-between transition ${
                      isPromo
                        ? 'bg-emerald-950/20'
                        : isReleg
                        ? 'bg-rose-950/20'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-bold text-sm ${
                          entry.rank === 1
                            ? 'text-amber-400'
                            : entry.rank === 2
                            ? 'text-slate-300'
                            : entry.rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {entry.rank}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{entry.displayName}</span>
                          {entry.isAnonymous && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              ANON
                            </span>
                          )}
                          {entry.shieldActive && (
                            <span className="flex items-center gap-0.5 text-[10px] text-cyan-300">
                              <Shield className="w-3 h-3 text-cyan-400" /> Shield Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isPromo ? '🟢 Promotion Zone' : isReleg ? '🔴 Relegation Danger' : 'Safe'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-indigo-300">{entry.xp} XP</span>
                      <div className="text-[10px] text-emerald-400">+{entry.growthRatePercent}% vs last week</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Improvement Ranking View */}
      {activeSubTab === 'IMPROVEMENT' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
            💡 <strong>Fairness Principle in Action:</strong> Improvement Ranking sorts students by their personal
            growth percentage vs their own baseline. A student who was behind but put in effort can rank #1!
          </div>

          <div className="quest-card overflow-hidden">
            <div className="divide-y divide-slate-800">
              {standings.map(entry => (
                <div key={entry.rank} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-sm text-emerald-400">#{entry.rank}</span>
                    <div>
                      <span className="font-semibold text-sm text-white">{entry.displayName}</span>
                      <p className="text-[11px] text-slate-400">Total: {entry.xp} XP this week</p>
                    </div>
                  </div>
                  <span className="font-black text-base text-emerald-400">+{entry.growthRatePercent}% Growth</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Ghost Mode View */}
      {activeSubTab === 'GHOST' && ghostData && (
        <div className="quest-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Ghost className="w-5 h-5 text-purple-400" />
                <span>Race Against Your Past Self</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comparing your daily cumulative XP trajectory against your previous week.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Current Pace</span>
              <div className="font-bold text-sm text-emerald-400">+{ghostData.deltaAhead} XP Ahead of Ghost</div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const current = ghostData.currentWeekDailyXp[idx] || 0;
              const ghost = ghostData.ghostPreviousWeekDailyXp[idx] || 0;

              return (
                <div key={day} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{current} XP</div>
                    <div className="text-[10px] text-purple-300">Ghost: {ghost}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Team Battles & Raid Boss */}
      {activeSubTab === 'BATTLES' && (
        <div className="space-y-6">
          {battles.map(event => {
            const isRaid = event.type === 'RAID_BOSS';

            return (
              <div
                key={event.id}
                className="quest-card p-6 space-y-4 border border-rose-500/30 bg-gradient-to-br from-slate-900 to-slate-950"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                      {event.type}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                      {isRaid ? <Skull className="w-5 h-5 text-rose-400" /> : <Swords className="w-5 h-5 text-rose-400" />}
                      <span>{event.title}</span>
                    </h3>
                  </div>

                  <span className="text-xs text-slate-400">
                    Live Scoreboard • Sub-2s updates over WebSockets
                  </span>
                </div>

                {/* Raid Boss Shared HP Bar */}
                {isRaid && event.bossCurrentHp !== undefined && (
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-rose-400">The Distributed Monolith Boss HP</span>
                      <span className="text-slate-300">
                        {event.bossCurrentHp.toLocaleString()} / {event.bossMaxHp?.toLocaleString()} HP
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
                        style={{ width: `${(event.bossCurrentHp / (event.bossMaxHp || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Team Standings & Participation Floor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.teams?.map((team: any) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white">{team.name}</h4>
                        <span className="text-base font-black text-rose-400">{team.score} pts</span>
                      </div>

                      {/* Participation Floor Meter */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Participation Rate: {Math.round(team.participationRate * 100)}%</span>
                          <span>Floor Required: {Math.round(event.minParticipationRate * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              team.isQualifiedForBonus ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, team.participationRate * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] mt-1 font-medium">
                          {team.isQualifiedForBonus ? (
                            <span className="text-emerald-400">✓ Floor achieved! Bonus unlocked</span>
                          ) : (
                            <span className="text-amber-400">⚠️ Under participation floor (encourage peers!)</span>
                          )}
                        </div>
                      </div>

                      <button
                        disabled={isSubmittingBattle}
                        onClick={() => handleContributeBattle(event.id, team.id)}
                        className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Contribute 25 Battle Points</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
