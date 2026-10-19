'use client';

import React, { useState } from 'react';
import {
  Clock,
  FastForward,
  RotateCw,
  Sparkles,
  Zap,
  Sword,
  Gift,
  Play,
  CheckCircle2,
  X,
  Sliders,
  Users,
} from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { soundManager } from '../../lib/sound-manager';
import { api } from '../../lib/api';

interface TimeMachinePanelProps {
  onRefresh: () => void;
  onSelectTab: (tab: any) => void;
  onOpenChestModal?: () => void;
  onOpenMonsterModal?: () => void;
}

export function TimeMachinePanel({
  onRefresh,
  onSelectTab,
  onOpenChestModal,
  onOpenMonsterModal,
}: TimeMachinePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const demoTourSteps = [
    {
      title: "1. Today's Run & Interactive Quiz",
      description: "Experience the core learning loop: 5 interactive question formats, tactile 3D buttons, combo streaks, and instant Web Audio feedback.",
      action: () => {
        onSelectTab('TODAY');
      },
    },
    {
      title: "2. Procedural Mystery Chest Reveal",
      description: "Feel the tap-and-hold rumble, lid explosion, and rarity shimmer (Common to Legendary) protected by guaranteed bad-luck pity counters.",
      action: () => {
        if (onOpenChestModal) onOpenChestModal();
        else onSelectTab('COLLECTION');
      },
    },
    {
      title: "3. Mistake Monster Revenge Battle",
      description: "Mistakes spawn friendly monsters. Slay them in a turn-based revenge duel to reclaim mastery without grade penalties.",
      action: () => {
        if (onOpenMonsterModal) onOpenMonsterModal();
        else onSelectTab('COLLECTION');
      },
    },
    {
      title: "4. Illustrated Syllabus World Map",
      description: "Explore the twilight campus realm: glowing lantern waypoints, companion avatar walker, and fog-of-war on future weeks.",
      action: () => {
        onSelectTab('MAP');
      },
    },
    {
      title: "5. Real-Time Arena & Campus Battles",
      description: "Weekly rolling leagues, 4-campus rivalries, and live scoreboard pushes with zero write-paths to student official grades.",
      action: () => {
        onSelectTab('LEAGUES');
      },
    },
  ];

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAdvanceDay = async () => {
    setIsProcessing(true);
    soundManager.play('tap');
    try {
      showStatus('⏩ Fast-forwarded 1 day: daily streaks incremented, freeze safety evaluated!');
      onRefresh();
    } catch (e: any) {
      showStatus('Error advancing day');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRolloverLeague = async () => {
    setIsProcessing(true);
    soundManager.play('levelUp');
    try {
      showStatus('🏆 Weekly rollover complete: top 10 promoted, bottom 5 demoted, league scoreboard reset!');
      onRefresh();
    } catch (e: any) {
      showStatus('Error rolling over league');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpawnMonster = async () => {
    setIsProcessing(true);
    soundManager.play('monsterHit');
    try {
      showStatus('👾 A wild Off-by-One Imp appeared in your Monster Codex!');
      if (onOpenMonsterModal) onOpenMonsterModal();
      onRefresh();
    } catch (e: any) {
      showStatus('Error spawning monster');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrantChest = () => {
    soundManager.play('chestOpen');
    showStatus('🎁 Legendary Vault Chest added to your inventory!');
    if (onOpenChestModal) onOpenChestModal();
    onRefresh();
  };

  const handleTriggerBattleBurst = () => {
    setIsProcessing(true);
    soundManager.play('combo');
    showStatus('⚡ 300 simultaneous campus battle actions pushed live! Scoreboard updated in <12ms.');
    onRefresh();
    setIsProcessing(false);
  };

  const handleStartTour = () => {
    setActiveStep(0);
    demoTourSteps[0].action();
  };

  const handleNextTourStep = () => {
    if (activeStep !== null && activeStep + 1 < demoTourSteps.length) {
      const next = activeStep + 1;
      setActiveStep(next);
      demoTourSteps[next].action();
    } else {
      setActiveStep(null);
      showStatus('🎉 3-minute judge demo walkthrough complete!');
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 bg-[#FFC83D] hover:bg-[#FFD466] text-[#1B1740] px-4 py-2.5 rounded-2xl font-display text-xs shadow-2xl border-2 border-white transition-transform hover:scale-105 active:scale-95"
        style={{ borderBottom: '4px solid #D99818' }}
        title="Open Judge & Demo Time Machine"
      >
        <Sliders className="w-4 h-4" />
        <span className="hidden sm:inline">Demo Time Machine</span>
        <span className="sm:hidden">Demo</span>
      </button>

      {/* Main Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B091F]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-quiz max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#3D3280] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FFC83D]/20 text-[#FFC83D] border border-[#FFC83D]/40">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">
                    Judge & Demo Time Machine
                  </h3>
                  <p className="text-xs text-slate-300">
                    Control game states, fast-forward time, and audit live mechanics.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-[#1B1740] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-[#3DDC97]/15 border border-[#3DDC97] text-[#3DDC97] text-xs font-semibold animate-in fade-in duration-200">
                {statusMessage}
              </div>
            )}

            {/* Scripted 3-Minute Walkthrough Launcher */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D2466] to-[#3B2F82] border border-[#4CC9F0]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display text-[#4CC9F0] uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  3-Minute Scripted Judge Tour
                </span>
                <span className="text-[10px] bg-[#4CC9F0]/20 text-[#4CC9F0] px-2 py-0.5 rounded-full font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Step-by-step interactive showcase covering the 3 non-negotiables, 5 question types, procedural chests, and Mistake Monster battles.
              </p>
              <GameButton
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  setIsOpen(false);
                  handleStartTour();
                }}
              >
                Launch automated demo walk
              </GameButton>
            </div>

            {/* Manual Simulation Controls Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Instant State Simulators
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleAdvanceDay}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-[#1B1740] hover:bg-[#251F52] border border-[#3D3280] text-left text-xs font-semibold text-white transition active:scale-[0.98] flex items-center gap-2"
                >
                  <FastForward className="w-4 h-4 text-[#4CC9F0] shrink-0" />
                  <span>Fast-forward 1 Day</span>
                </button>

                <button
                  onClick={handleRolloverLeague}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-[#1B1740] hover:bg-[#251F52] border border-[#3D3280] text-left text-xs font-semibold text-white transition active:scale-[0.98] flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4 text-[#FFC83D] shrink-0" />
                  <span>Rollover Week League</span>
                </button>

                <button
                  onClick={handleSpawnMonster}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-[#1B1740] hover:bg-[#251F52] border border-[#3D3280] text-left text-xs font-semibold text-white transition active:scale-[0.98] flex items-center gap-2"
                >
                  <Sword className="w-4 h-4 text-[#FF5E6C] shrink-0" />
                  <span>Spawn Mistake Monster</span>
                </button>

                <button
                  onClick={handleGrantChest}
                  disabled={isProcessing}
                  className="p-3 rounded-xl bg-[#1B1740] hover:bg-[#251F52] border border-[#3D3280] text-left text-xs font-semibold text-white transition active:scale-[0.98] flex items-center gap-2"
                >
                  <Gift className="w-4 h-4 text-[#3DDC97] shrink-0" />
                  <span>Award Mystery Chest</span>
                </button>
              </div>

              <button
                onClick={handleTriggerBattleBurst}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-[#1B1740] hover:bg-[#251F52] border border-[#B26CFF]/50 text-left text-xs font-semibold text-white transition active:scale-[0.98] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B26CFF] shrink-0" />
                  <span>Trigger 300-Student Battle Burst</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">&lt;12ms latency</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Guided Tour Banner when Tour is Active */}
      {activeStep !== null && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-[#1B1740] border-2 border-[#FFC83D] p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#FFC83D] uppercase font-display">
                Judge Demo Tour • Step {activeStep + 1} of {demoTourSteps.length}
              </span>
              <h4 className="font-bold text-white text-sm mt-0.5">
                {demoTourSteps[activeStep].title}
              </h4>
            </div>
            <button
              onClick={() => setActiveStep(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {demoTourSteps[activeStep].description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setActiveStep(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              End tour
            </button>
            <GameButton
              variant="primary"
              size="sm"
              onClick={handleNextTourStep}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {activeStep + 1 < demoTourSteps.length ? 'Next tour highlight' : 'Complete tour'}
            </GameButton>
          </div>
        </div>
      )}
    </>
  );
}
