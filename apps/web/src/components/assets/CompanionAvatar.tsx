'use client';

import React from 'react';
import { CompanionRenderProps, AssetAdapter } from './AssetAdapter';

export type CompanionSpecies =
  | 'fox'
  | 'owl'
  | 'dragon'
  | 'golem'
  | 'FOX'
  | 'OWL'
  | 'DRAGON'
  | 'GOLEM';

export type CompanionMood =
  | 'idle'
  | 'happy'
  | 'cheering'
  | 'studying'
  | 'sleeping'
  | 'focused'
  | 'surprised'
  | 'IDLE'
  | 'HAPPY'
  | 'CHEERING'
  | 'STUDYING'
  | 'SLEEPING'
  | 'FOCUSED'
  | 'SURPRISED';

export interface ExtendedCompanionProps {
  species?: CompanionSpecies | string;
  evolutionStage?: number;
  mood?: CompanionMood | string;
  size?: number;
  className?: string;
}

export function CompanionAvatar({
  species = 'fox',
  evolutionStage = 1,
  mood = 'idle',
  size = 120,
  className = '',
}: ExtendedCompanionProps) {
  const normSpecies = (species.toLowerCase() as 'fox' | 'owl' | 'dragon' | 'golem') || 'fox';
  const normMood = mood.toLowerCase();

  const altText = AssetAdapter.getCompanionLabel(normSpecies, evolutionStage);

  // Dynamic colors by species
  const palette = {
    fox: { primary: '#FF8A3D', secondary: '#FFC83D', belly: '#FFF5E0', eyes: '#2D2466' },
    owl: { primary: '#8B5CF6', secondary: '#A78BFA', belly: '#EDE9FE', eyes: '#FFC83D' },
    dragon: { primary: '#3DDC97', secondary: '#2BB87D', belly: '#D1FAE5', eyes: '#FF5E6C' },
    golem: { primary: '#4CC9F0', secondary: '#258FAE', belly: '#E0F2FE', eyes: '#FFC83D' },
  }[normSpecies] || { primary: '#FF8A3D', secondary: '#FFC83D', belly: '#FFF5E0', eyes: '#2D2466' };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={altText}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`w-full h-full transition-transform duration-300 ${
          normMood === 'happy' || normMood === 'cheering' ? 'animate-bounce' : 'hover:scale-105'
        }`}
      >
        <defs>
          <radialGradient id={`glow-${normSpecies}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Aura for Stage 2 & 3 */}
        {evolutionStage >= 2 && (
          <circle cx="50" cy="50" r="46" fill={`url(#glow-${normSpecies})`} className="animate-pulse" />
        )}

        {/* Celestial Wings/Horns for Stage 3 */}
        {evolutionStage === 3 && (
          <g fill={palette.secondary} opacity="0.9">
            <path d="M 20 40 Q 5 25 10 10 Q 30 20 28 35 Z" />
            <path d="M 80 40 Q 95 25 90 10 Q 70 20 72 35 Z" />
            {/* Crown */}
            <polygon points="42,18 50,10 58,18 55,22 45,22" fill="#FFC83D" stroke="#D49F13" strokeWidth="1" />
          </g>
        )}

        {/* Body Base */}
        <ellipse cx="50" cy="62" rx="28" ry="24" fill={palette.primary} stroke="#1B1740" strokeWidth="3" />

        {/* Soft Belly */}
        <ellipse cx="50" cy="68" rx="16" ry="14" fill={palette.belly} />

        {/* Head */}
        <circle cx="50" cy="42" r="22" fill={palette.primary} stroke="#1B1740" strokeWidth="3" />

        {/* Cute Ears (Fox: Pointy, Owl: Feather Tuft, Dragon: Horns, Golem: Crest) */}
        {normSpecies === 'fox' && (
          <g fill={palette.secondary}>
            <polygon points="32,24 22,8 40,20" stroke="#1B1740" strokeWidth="2.5" />
            <polygon points="68,24 78,8 60,20" stroke="#1B1740" strokeWidth="2.5" />
          </g>
        )}
        {normSpecies === 'dragon' && (
          <g fill={palette.secondary}>
            <path d="M 32 26 C 26 12 18 10 24 6 C 30 14 36 20 38 24 Z" stroke="#1B1740" strokeWidth="2" />
            <path d="M 68 26 C 74 12 82 10 76 6 C 70 14 64 20 62 24 Z" stroke="#1B1740" strokeWidth="2" />
          </g>
        )}
        {(normSpecies === 'owl' || normSpecies === 'golem') && (
          <g fill={palette.secondary}>
            <circle cx="34" cy="22" r="7" stroke="#1B1740" strokeWidth="2" />
            <circle cx="66" cy="22" r="7" stroke="#1B1740" strokeWidth="2" />
          </g>
        )}

        {/* Big Expressive Eyes */}
        <circle cx="42" cy="42" r="6" fill="#FFFFFF" stroke="#1B1740" strokeWidth="2" />
        <circle cx="58" cy="42" r="6" fill="#FFFFFF" stroke="#1B1740" strokeWidth="2" />

        <circle cx="43" cy="42" r="3.5" fill={palette.eyes} />
        <circle cx="57" cy="42" r="3.5" fill={palette.eyes} />

        {/* Eye Sparkles */}
        <circle cx="44.5" cy="40.5" r="1.5" fill="#FFFFFF" />
        <circle cx="58.5" cy="40.5" r="1.5" fill="#FFFFFF" />

        {/* Cheeks blush */}
        <circle cx="35" cy="48" r="3" fill="#FF5E6C" opacity="0.6" />
        <circle cx="65" cy="48" r="3" fill="#FF5E6C" opacity="0.6" />

        {/* Mouth Expression */}
        {normMood === 'cheering' || normMood === 'happy' ? (
          <path d="M 46 48 Q 50 54 54 48" stroke="#1B1740" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : normMood === 'sleeping' ? (
          <path d="M 45 49 L 55 49" stroke="#1B1740" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M 47 48 Q 50 51 53 48" stroke="#1B1740" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
