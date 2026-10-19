'use client';

import React from 'react';

export type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ItemRarity = RarityTier;

export interface RarityBadgeProps {
  rarity: RarityTier | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
}

export function RarityBadge({
  rarity = 'COMMON',
  size = 'md',
  showLabel = true,
  showIcon = true,
}: RarityBadgeProps) {
  const normRarity = (rarity.toUpperCase() as RarityTier) || 'COMMON';

  const configs: Record<
    RarityTier,
    { label: string; glyph: string; color: string; border: string; bg: string; isLegendary?: boolean }
  > = {
    COMMON: {
      label: 'Common',
      glyph: '●', // Circle
      color: 'text-slate-300',
      border: 'border-slate-500/40',
      bg: 'bg-slate-800/80',
    },
    UNCOMMON: {
      label: 'Uncommon',
      glyph: '◆', // Diamond
      color: 'text-[#3DDC97]',
      border: 'border-[#3DDC97]/40',
      bg: 'bg-[#3DDC97]/15',
    },
    RARE: {
      label: 'Rare',
      glyph: '▲', // Triangle
      color: 'text-[#4CC9F0]',
      border: 'border-[#4CC9F0]/40',
      bg: 'bg-[#4CC9F0]/15',
    },
    EPIC: {
      label: 'Epic',
      glyph: '⬡', // Hexagon
      color: 'text-[#B26CFF]',
      border: 'border-[#B26CFF]/50',
      bg: 'bg-[#B26CFF]/15',
    },
    LEGENDARY: {
      label: 'Legendary',
      glyph: '★', // Crown/Star
      color: 'text-[#1B1740] font-black',
      border: 'border-[#FFC83D]',
      bg: 'bg-gradient-to-r from-[#FFC83D] to-[#FF8A3D] shadow-lg shadow-[#FFC83D]/30',
      isLegendary: true,
    },
  };

  const cfg = configs[normRarity] || configs.COMMON;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-md font-bold',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 rounded-xl font-black',
  };

  return (
    <span
      className={`inline-flex items-center border select-none ${sizeClasses[size]} ${cfg.color} ${cfg.border} ${cfg.bg}`}
      role="status"
      aria-label={`Rarity tier: ${cfg.label}`}
    >
      {showIcon && <span className="text-xs" aria-hidden="true">{cfg.glyph}</span>}
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}
