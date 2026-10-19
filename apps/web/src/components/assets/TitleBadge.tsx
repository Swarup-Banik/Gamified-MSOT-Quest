'use client';

import React from 'react';

export type CosmeticRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface TitleBadgeProps {
  titleKey?: string;
  name?: string;
  rarity?: CosmeticRarity | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TitleBadge({
  titleKey,
  name,
  rarity = 'COMMON',
  className = '',
  size = 'md',
}: TitleBadgeProps) {
  // Map titleKey to standard name if not provided
  const titleDisplay = name || {
    title_junior_scholar: 'Junior Scholar',
    title_night_owl: 'Night Owl',
    title_syntax_scout: 'Syntax Scout',
    title_bug_annihilator: 'Bug Annihilator',
    title_flame_keeper: 'Flame Keeper',
    title_peer_champion: 'Peer Champion',
    title_recursion_slayer: 'Recursion Slayer',
    title_algorithm_virtuoso: 'Algorithm Virtuoso',
    title_grandmaster: 'Grandmaster Scholar',
  }[titleKey || ''] || titleKey || 'Novice Adventurer';

  const normRarity = (rarity?.toUpperCase() as CosmeticRarity) || 'COMMON';

  // Rarity styling & colorblind-friendly geometric icon badges
  const rarityConfig = {
    COMMON: {
      border: 'border-slate-500/50',
      bg: 'bg-slate-900/80',
      text: 'text-slate-200',
      symbol: '●', // Circle
      symbolLabel: 'Common',
    },
    UNCOMMON: {
      border: 'border-emerald-500/60',
      bg: 'bg-emerald-950/70',
      text: 'text-emerald-300',
      symbol: '◆', // Diamond
      symbolLabel: 'Uncommon',
    },
    RARE: {
      border: 'border-sky-500/60',
      bg: 'bg-sky-950/70',
      text: 'text-sky-300',
      symbol: '⬢', // Hexagon
      symbolLabel: 'Rare',
    },
    EPIC: {
      border: 'border-purple-500/70',
      bg: 'bg-purple-950/70',
      text: 'text-purple-300',
      symbol: '★', // Star
      symbolLabel: 'Epic',
    },
    LEGENDARY: {
      border: 'border-amber-400',
      bg: 'bg-gradient-to-r from-amber-950/80 to-purple-950/80',
      text: 'text-amber-300 font-black tracking-wide',
      symbol: '👑', // Crown
      symbolLabel: 'Legendary',
    },
  }[normRarity] || {
    border: 'border-slate-500/50',
    bg: 'bg-slate-900/80',
    text: 'text-slate-200',
    symbol: '●',
    symbolLabel: 'Common',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-3 py-1 gap-1.5',
    lg: 'text-sm md:text-base px-4 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm backdrop-blur-sm select-none transition-all ${rarityConfig.bg} ${rarityConfig.border} ${rarityConfig.text} ${sizeClasses} ${className}`}
      title={`${titleDisplay} (${rarityConfig.symbolLabel})`}
      role="status"
    >
      <span
        aria-hidden="true"
        className="text-[10px] opacity-80"
        title={rarityConfig.symbolLabel}
      >
        {rarityConfig.symbol}
      </span>
      <span>{titleDisplay}</span>
    </span>
  );
}
