'use client';

import React from 'react';
import {
  Zap,
  Map as MapIcon,
  Trophy,
  Package,
  User,
} from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export type StudentGameTab = 'HOME' | 'MAP' | 'ARENA' | 'CODEX' | 'ME';

interface GameBottomMenuProps {
  activeTab: StudentGameTab;
  onSelectTab: (tab: StudentGameTab) => void;
}

export function GameBottomMenu({
  activeTab,
  onSelectTab,
}: GameBottomMenuProps) {
  const tabs = [
    {
      id: 'HOME' as const,
      label: 'Home',
      icon: Zap,
      activeColor: '#FFD23F',
      glowClass: 'shadow-glow-yellow',
    },
    {
      id: 'MAP' as const,
      label: 'Map',
      icon: MapIcon,
      activeColor: '#22E3FF',
      glowClass: 'shadow-glow-cyan',
    },
    {
      id: 'ARENA' as const,
      label: 'Arena',
      icon: Trophy,
      activeColor: '#FF3D9A',
      glowClass: 'shadow-glow-magenta',
    },
    {
      id: 'CODEX' as const,
      label: 'Codex',
      icon: Package,
      activeColor: '#7CF36B',
      glowClass: 'shadow-glow-lime',
    },
    {
      id: 'ME' as const,
      label: 'Me',
      icon: User,
      activeColor: '#FF8A2B',
      glowClass: 'shadow-glow-orange',
    },
  ];

  const handleTabClick = (tabId: StudentGameTab) => {
    soundManager.play('tap');
    onSelectTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none flex justify-center">
      {/* Floating Game Menu Dock */}
      <div className="pointer-events-auto bg-[#24104F]/90 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-1.5 shadow-2xl flex items-center justify-around gap-1 sm:gap-3 max-w-lg w-full">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 select-none ${
                isActive
                  ? '-translate-y-2'
                  : 'hover:bg-white/5 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Medallion Frame Icon */}
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? `border-2 border-white ${tab.glowClass} scale-110`
                    : 'bg-[#15062C] border border-white/15'
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(180deg, ${tab.activeColor} 0%, #24104F 100%)`
                    : undefined,
                }}
              >
                <IconComponent
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#FFF8E7] scale-110 drop-shadow' : 'text-slate-300'
                  }`}
                />
              </div>

              {/* Short Label */}
              <span
                className={`text-[11px] font-display mt-0.5 tracking-wide transition-colors ${
                  isActive ? 'text-[#FFD23F] font-bold' : 'text-slate-300'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
