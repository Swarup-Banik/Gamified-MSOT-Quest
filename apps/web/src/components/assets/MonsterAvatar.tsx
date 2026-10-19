'use client';

import React from 'react';

export type MonsterFamily =
  | 'OFF_BY_ONE'
  | 'NULL_POINTER'
  | 'RECURSION_DEPTH'
  | 'TIME_COMPLEXITY'
  | 'STACK_OVERFLOW'
  | 'TYPE_MISMATCH';

export type MonsterTier = 'COMMON' | 'ELITE' | 'BOSS';

export interface MonsterAvatarProps {
  family?: MonsterFamily | string;
  tier?: MonsterTier | string;
  topicKey?: string;
  rarity?: MonsterTier | string;
  size?: number;
  isHit?: boolean;
  isRoaring?: boolean;
  className?: string;
}

export function MonsterAvatar({
  family = 'OFF_BY_ONE',
  tier = 'COMMON',
  topicKey,
  rarity,
  size = 120,
  isHit = false,
  isRoaring = false,
  className = '',
}: MonsterAvatarProps) {
  // Normalize family & tier
  const activeTier: MonsterTier = (rarity as MonsterTier) || (tier as MonsterTier) || 'COMMON';

  const colors = {
    COMMON: { body: '#FF5E6C', eye: '#FFC83D', accents: '#9C1B28' },
    ELITE: { body: '#B26CFF', eye: '#3DDC97', accents: '#6419AB' },
    BOSS: { body: '#2D2466', eye: '#FF5E6C', accents: '#FFC83D' },
  }[activeTier] || { body: '#FF5E6C', eye: '#FFC83D', accents: '#9C1B28' };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none transition-transform ${
        isHit ? 'animate-wiggle scale-95 opacity-80' : ''
      } ${isRoaring ? 'animate-bounce' : ''} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mistake Monster ${family} tier ${activeTier}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="w-full h-full overflow-visible">
        {/* Elite / Boss Spikes & Horns */}
        {activeTier !== 'COMMON' && (
          <g fill={colors.accents}>
            <polygon points="25,25 35,5 45,28" stroke="#1B1740" strokeWidth="2" />
            <polygon points="75,25 65,5 55,28" stroke="#1B1740" strokeWidth="2" />
            {activeTier === 'BOSS' && (
              <polygon points="40,20 50,0 60,20" stroke="#FFC83D" strokeWidth="2" fill="#FFC83D" />
            )}
          </g>
        )}

        {/* Monster Body Blob */}
        <path
          d="M 50 15 C 75 15 88 32 88 55 C 88 78 72 88 50 88 C 28 88 12 78 12 55 C 12 32 25 15 50 15 Z"
          fill={colors.body}
          stroke="#1B1740"
          strokeWidth="3"
        />

        {/* Horns for Common */}
        {activeTier === 'COMMON' && (
          <g fill={colors.accents}>
            <polygon points="32,22 38,10 44,24" stroke="#1B1740" strokeWidth="1.5" />
            <polygon points="68,22 62,10 56,24" stroke="#1B1740" strokeWidth="1.5" />
          </g>
        )}

        {/* Mischievous Big Eyes */}
        <circle cx="36" cy="48" r="11" fill="#FFFFFF" stroke="#1B1740" strokeWidth="2" />
        <circle cx="64" cy="48" r="11" fill="#FFFFFF" stroke="#1B1740" strokeWidth="2" />

        <circle cx="38" cy="49" r="6" fill={colors.eye} />
        <circle cx="62" cy="49" r="6" fill={colors.eye} />

        <circle cx="40" cy="47" r="2" fill="#FFFFFF" />
        <circle cx="64" cy="47" r="2" fill="#FFFFFF" />

        {/* Smirk / Roar Mouth with Cute Fang */}
        {isRoaring ? (
          <path d="M 36 66 Q 50 82 64 66 Z" stroke="#1B1740" strokeWidth="2.5" fill="#1B1740" />
        ) : (
          <path d="M 38 68 Q 50 78 62 68" stroke="#1B1740" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        <polygon points="48,68 52,68 50,73" fill="#FFFFFF" />

        {/* Topic Badge Sigil */}
        <circle cx="50" cy="80" r="4" fill={colors.accents} opacity="0.8" />
      </svg>
    </div>
  );
}
