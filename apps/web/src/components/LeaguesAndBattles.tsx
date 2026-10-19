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
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { soundManager } from '../lib/sound-manager';
import { CompanionAvatar } from './assets/CompanionAvatar';
import { AvatarComposer } from './assets/AvatarComposer';
import { FrameGenerator } from './assets/FrameGenerator';

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
    soundManager.play('tap');
    try {
      const studentId = user?.id || 'student_1';
      const result = await api.submitBattlePoints(eventId, studentId, teamId, 25);
      soundManager.play('correct');
      soundManager.play('leagueClimb');
      alert('Victory strike! Added +25 points to your campus team! Scoreboard updated in real-time.');
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      soundManager.play('gentleWrong');
      alert(err.message || 'Battle submission failed');
    } finally {
      setIsSubmittingBattle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Sub-Tabs Selector styled as chunky 3D stadium tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('LEAGUE');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-display transition active:scale-95 ${
            activeSubTab === 'LEAGUE'
              ? 'bg-[#FFD23F] text-[#24104F] shadow-glow-yellow'
              : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
          }`}
        >
          <Trophy className="w-4 h-4 fill-current" />
          <span>Weekly league (Bronze tier)</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('IMPROVEMENT');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-display transition active:scale-95 ${
            activeSubTab === 'IMPROVEMENT'
              ? 'bg-[#7CF36B] text-[#24104F] shadow-glow-lime'
              : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Improvement ranking</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('GHOST');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-display transition active:scale-95 ${
            activeSubTab === 'GHOST'
              ? 'bg-[#22E3FF] text-[#24104F] shadow-glow-cyan'
              : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
          }`}
        >
          <Ghost className="w-4 h-4" />
          <span>Ghost mode (personal best)</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('BATTLES');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-display transition active:scale-95 ${
            activeSubTab === 'BATTLES'
              ? 'bg-[#FF3D9A] text-white shadow-glow-magenta'
              : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Team battles & raid boss</span>
        </button>
      </div>

      {/* 1. Weekly League Standings */}
      {activeSubTab === 'LEAGUE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2 bg-[#24104F]/60 px-4 py-2.5 rounded-2xl border border-white/10">
            <span className="flex items-center gap-2 font-display">
              <Sparkles className="w-4 h-4 text-[#FFD23F]" />
              <span>Cohort of 20 peers • Top 4 promoted to Silver, bottom 4 soft-relegated</span>
            </span>
            <span className="text-[#FFD23F] font-bold">Resets Monday 00:00 UTC</span>
          </div>

          <div className="panel-league overflow-hidden">
            <div className="divide-y divide-white/10">
              {standings.map(entry => {
                const isPromo = entry.promotionStatus === 'PROMOTION_ZONE';
                const isReleg = entry.promotionStatus === 'RELEGATION_ZONE';
                const isCurrentUser = entry.userId === user?.id || entry.displayName?.includes(user?.name?.split(' ')[0] || '');

                return (
                  <div
                    key={entry.rank}
                    className={`p-4 flex items-center justify-between transition ${
                      isCurrentUser
                        ? 'bg-[#FFD23F]/20 border-l-4 border-l-[#FFD23F]'
                        : isPromo
                        ? 'bg-[#7CF36B]/10 hover:bg-[#7CF36B]/15'
                        : isReleg
                        ? 'bg-[#FF8A2B]/10 hover:bg-[#FF8A2B]/15'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Rank Medallion */}
                      <span
                        className={`w-8 h-8 rounded-full font-display text-sm font-bold flex items-center justify-center shadow-md ${
                          entry.rank === 1
                            ? 'bg-gradient-to-b from-[#FFD23F] to-[#FF8A2B] text-[#24104F] border border-white'
                            : entry.rank === 2
                            ? 'bg-gradient-to-b from-slate-200 to-slate-400 text-[#24104F] border border-white'
                            : entry.rank === 3
                            ? 'bg-gradient-to-b from-[#FF8A2B] to-[#994700] text-white border border-white/40'
                            : 'bg-[#15062C] text-slate-400 border border-white/10'
                        }`}
                      >
                        {entry.rank}
                      </span>

                      {/* Framed Avatar */}
                      <div className="relative shrink-0">
                        <FrameGenerator
                          frameKey={entry.equippedLoadout?.frame || 'frame_rustic_wood'}
                          size={38}
                        >
                          <AvatarComposer
                            avatarKey={entry.equippedLoadout?.avatar || entry.avatarId || 'avatar_fox_novice'}
                            size={30}
                          />
                        </FrameGenerator>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-display text-sm ${isCurrentUser ? 'text-[#FFD23F] font-bold' : 'text-white'}`}>
                            {entry.displayName}
                            {isCurrentUser && ' (You)'}
                          </span>
                          {entry.isAnonymous && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B2EE0]/40 text-[#22E3FF] border border-[#22E3FF]/30 font-bold">
                              Anon
                            </span>
                          )}
                          {entry.shieldActive && (
                            <span className="flex items-center gap-1 text-[10px] text-[#22E3FF] font-bold">
                              <Shield className="w-3.5 h-3.5 text-[#22E3FF] fill-current" /> Shielded
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold flex items-center gap-1">
                          {isPromo ? (
                            <span className="text-[#7CF36B]">▲ Promotion zone</span>
                          ) : isReleg ? (
                            <span className="text-[#FF8A2B]">▼ Relegation buffer</span>
                          ) : (
                            <span className="text-slate-400">Safe in Bronze</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-base text-[#FFD23F] block">{entry.xp} XP</span>
                      <div className="text-[11px] text-[#7CF36B] font-bold">+{entry.growthRatePercent}% this week</div>
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
          <div className="p-4 rounded-2xl bg-[#7CF36B]/15 border-2 border-[#7CF36B]/40 text-xs text-[#FFF8E7] flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#7CF36B] flex-shrink-0" />
            <div>
              <strong className="text-[#7CF36B] font-display text-sm block">Fairness principle in action</strong>
              Improvement ranking evaluates students against their own previous baseline. A student who started behind but works diligently can claim #1!
            </div>
          </div>

          <div className="panel-league overflow-hidden">
            <div className="divide-y divide-white/10">
              {standings.map(entry => (
                <div key={entry.rank} className="p-4 flex items-center justify-between hover:bg-white/5 transition">
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 h-8 rounded-full bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B] font-display text-sm font-bold flex items-center justify-center">
                      #{entry.rank}
                    </span>
                    <div>
                      <span className="font-display text-sm text-white">{entry.displayName}</span>
                      <p className="text-[11px] text-slate-300">Total: {entry.xp} XP recorded this week</p>
                    </div>
                  </div>
                  <span className="font-display text-base text-[#7CF36B]">+{entry.growthRatePercent}% growth</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Ghost Mode: Personal Best */}
      {activeSubTab === 'GHOST' && (
        <div className="space-y-4">
          <div className="panel-quest-board p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#22E3FF]/20 border border-[#22E3FF] text-[#22E3FF]">
                <Ghost className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg text-white">Ghost mode: Race your past self</h3>
                <p className="text-xs text-slate-300">
                  Compete directly with your performance from last week. No social pressure, pure self-mastery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Last week's ghost</span>
                <span className="font-display text-2xl text-slate-300 block">320 XP</span>
                <p className="text-xs text-slate-400">Completed 4 daily runs • 82% quiz accuracy</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#22E3FF]/10 border-2 border-[#22E3FF]/40 space-y-2">
                <span className="text-xs font-bold text-[#22E3FF] uppercase tracking-wider block">This week's pace</span>
                <span className="font-display text-2xl text-[#22E3FF] block">{profile?.weeklyXp || 380} XP</span>
                <p className="text-xs text-[#7CF36B] font-bold">▲ +60 XP ahead of your previous record!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Team Battles & Raid Boss */}
      {activeSubTab === 'BATTLES' && (
        <div className="space-y-6">
          {battles.map(battle => {
            const isBoss = battle.type === 'RAID_BOSS';

            return (
              <div key={battle.id} className="panel-battle p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#FF3D9A]/20 border border-[#FF3D9A] text-[#FF3D9A]">
                      {isBoss ? <Skull className="w-6 h-6" /> : <Swords className="w-6 h-6" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#FFD23F] uppercase tracking-wider">
                        {isBoss ? 'Live campus raid event' : 'Inter-section showdown'}
                      </span>
                      <h3 className="font-display text-xl text-white">{battle.title}</h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FF8A2B]/20 text-[#FF8A2B] border border-[#FF8A2B]/40 self-start sm:self-auto">
                    Ends in {battle.endsInHours || 48} hours
                  </span>
                </div>

                {isBoss ? (
                  /* Raid Boss HP Bar */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-display">
                      <span className="text-[#FF4D5E] flex items-center gap-1.5">
                        <Skull className="w-4 h-4" />
                        <span>Boss health</span>
                      </span>
                      <span className="text-white font-mono">
                        {battle.bossCurrentHp?.toLocaleString()} / {battle.bossMaxHp?.toLocaleString()} HP
                      </span>
                    </div>

                    <div className="w-full h-5 bg-[#15062C] rounded-full p-0.5 border border-white/20 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF4D5E] via-[#FF8A2B] to-[#FFD23F] rounded-full transition-all duration-500 shadow-glow-orange"
                        style={{
                          width: `${Math.max(5, (battle.bossCurrentHp / battle.bossMaxHp) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleContributeBattle(battle.id, 'all')}
                        disabled={isSubmittingBattle}
                        className="btn-sunset-3d btn-3d-magenta px-5 py-2.5 rounded-2xl text-xs font-display text-white flex items-center gap-2"
                      >
                        <Swords className="w-4 h-4" />
                        <span>{isSubmittingBattle ? 'Striking...' : 'Strike raid boss (+25 pts)'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Section vs Section Scoreboard */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {battle.teams?.map((team: any) => (
                        <div
                          key={team.teamId}
                          className="p-4 rounded-2xl bg-[#15062C]/80 border border-white/10 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <span className="font-display text-sm text-white block">{team.name}</span>
                            <span className="font-display text-2xl text-[#FFD23F] block mt-1">
                              {team.score?.toLocaleString()} pts
                            </span>
                          </div>

                          <button
                            onClick={() => handleContributeBattle(battle.id, team.teamId)}
                            disabled={isSubmittingBattle}
                            className="btn-sunset-3d btn-3d-yellow px-4 py-2 rounded-xl text-xs font-display text-[#24104F] flex items-center justify-center gap-1.5 w-full"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Contribute +25 pts</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
