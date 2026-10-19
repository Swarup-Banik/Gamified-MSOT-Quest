'use client';

import React, { useState } from 'react';
import {
  Sliders,
  X,
  FastForward,
  RotateCw,
  Sword,
  Gift,
  Palette,
  GraduationCap,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

interface GameMasterDrawerProps {
  currentRole: string;
  onSwitchRole: (role: string) => void;
  onOpenStorybook: () => void;
  onAdvanceDay: () => void;
  onRolloverWeek: () => void;
  onSpawnMonster: () => void;
  onAwardChest: () => void;
  onTriggerBurst: () => void;
  onStartDemoTour: () => void;
}

export function GameMasterDrawer({
  currentRole,
  onSwitchRole,
  onOpenStorybook,
  onAdvanceDay,
  onRolloverWeek,
  onSpawnMonster,
  onAwardChest,
  onTriggerBurst,
  onStartDemoTour,
}: GameMasterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <>
      {/* Discreet Developer / Judge Toggle in Bottom Right */}
      <div className="fixed bottom-20 right-4 sm:bottom-4 sm:right-4 z-40">
        <button
          onClick={() => {
            soundManager.play('tap');
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15062C]/80 hover:bg-[#24104F] border border-white/20 text-[#FFF8E7] text-[11px] font-display backdrop-blur-md shadow-lg transition active:scale-95"
          title="Open Judge & Game Master Controls"
        >
          <Sliders className="w-3.5 h-3.5 text-[#FFD23F]" />
          <span>GM Drawer</span>
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#15062C]/80 backdrop-blur-sm flex items-end sm:items-center justify-end p-0 sm:p-4">
          <div className="bg-[#24104F] border-2 border-[#FFD23F]/50 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#FFD23F]" />
                <h3 className="font-display text-base text-white">
                  Judge & Game Master Drawer
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B] text-xs font-bold">
                {statusMessage}
              </div>
            )}

            {/* Role Switcher (Hidden from normal student view, only in GM drawer) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Simulate User Role
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['STUDENT', 'FACULTY', 'ADMIN'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      soundManager.play('tap');
                      onSwitchRole(role);
                      showStatus(`Switched view to ${role}`);
                    }}
                    className={`py-2 rounded-xl text-xs font-display transition ${
                      currentRole === role
                        ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Minute Scripted Demo Tour */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#5B2EE0]/40 to-[#FF3D9A]/20 border border-white/20 space-y-2">
              <span className="text-xs font-display text-[#FFD23F]">
                3-Minute Scripted Evaluation Walk
              </span>
              <p className="text-[11px] text-slate-300">
                Step-by-step showcase covering XP ledger immutability, 5 interactive question formats, and procedural chests.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onStartDemoTour();
                }}
                className="w-full py-2 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
              >
                Launch Automated Tour
              </button>
            </div>

            {/* Simulation Triggers Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Time Machine Simulators
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    onAdvanceDay();
                    showStatus('Fast-forwarded 1 day');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                >
                  <FastForward className="w-4 h-4 text-[#22E3FF]" />
                  <span>+1 Day Streak</span>
                </button>

                <button
                  onClick={() => {
                    onRolloverWeek();
                    showStatus('Rolled over weekly league');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4 text-[#FFD23F]" />
                  <span>Rollover Week</span>
                </button>

                <button
                  onClick={() => {
                    onSpawnMonster();
                    showStatus('Spawned Mistake Monster');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                >
                  <Sword className="w-4 h-4 text-[#FF4D5E]" />
                  <span>Spawn Monster</span>
                </button>

                <button
                  onClick={() => {
                    onAwardChest();
                    showStatus('Awarded Legendary Vault');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                >
                  <Gift className="w-4 h-4 text-[#7CF36B]" />
                  <span>Award Vault</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onTriggerBurst();
                  showStatus('Pushed 300 simultaneous campus battle actions');
                }}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#FF3D9A]/50 text-left text-xs font-semibold text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF3D9A]" />
                  <span>Trigger 300-Student Battle Burst</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">&lt;12ms latency</span>
              </button>
            </div>

            {/* Design System Storybook Link */}
            <div className="pt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenStorybook();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-display text-[#22E3FF] flex items-center justify-center gap-2 transition"
              >
                <Palette className="w-4 h-4" />
                <span>Open Design System Storybook</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
