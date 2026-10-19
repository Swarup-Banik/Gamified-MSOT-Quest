'use client';

import React from 'react';

export type ChestTier = 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY';
export type ChestState = 'IDLE' | 'SHAKING' | 'OPEN';

interface ChestSVGProps {
  tier?: ChestTier;
  state?: ChestState;
  size?: number;
  className?: string;
}

export function ChestSVG({
  tier = 'GOLDEN',
  state = 'IDLE',
  size = 120,
  className = '',
}: ChestSVGProps) {
  // Palettes per tier
  const tierThemes = {
    WOODEN: {
      base: '#6B4226',
      baseDark: '#4A2A13',
      trim: '#9C6634',
      metal: '#8A8D91',
      metalDark: '#5E6064',
      gem: '#D97706',
      glow: '#F59E0B',
    },
    SILVER: {
      base: '#4B5563',
      baseDark: '#374151',
      trim: '#9CA3AF',
      metal: '#E5E7EB',
      metalDark: '#9CA3AF',
      gem: '#4CC9F0',
      glow: '#38BDF8',
    },
    GOLDEN: {
      base: '#92400E',
      baseDark: '#78350F',
      trim: '#D97706',
      metal: '#F59E0B',
      metalDark: '#B45309',
      gem: '#FFC83D',
      glow: '#FDE047',
    },
    LEGENDARY: {
      base: '#581C87',
      baseDark: '#3B0764',
      trim: '#9333EA',
      metal: '#FFC83D',
      metalDark: '#C2410C',
      gem: '#EC4899',
      glow: '#F43F5E',
    },
  };

  const theme = tierThemes[tier] || tierThemes.GOLDEN;

  const isShaking = state === 'SHAKING';
  const isOpen = state === 'OPEN';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isShaking ? 'animate-[wiggle_0.2s_ease-in-out_infinite]' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <filter id={`chest-glow-${tier}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={theme.glow} floodOpacity="0.6" />
          </filter>
          <linearGradient id={`chest-lid-grad-${tier}`} x1="80" y1="20" x2="80" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor={theme.trim} />
            <stop offset="1" stopColor={theme.base} />
          </linearGradient>
          <linearGradient id={`chest-body-grad-${tier}`} x1="80" y1="65" x2="80" y2="135" gradientUnits="userSpaceOnUse">
            <stop stopColor={theme.base} />
            <stop offset="1" stopColor={theme.baseDark} />
          </linearGradient>
          <radialGradient id={`chest-beam-${tier}`} cx="50%" cy="50%" r="50%">
            <stop stopColor={theme.glow} stopOpacity="0.8" />
            <stop offset="70%" stopColor={theme.metal} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.metal} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        {(isOpen || tier === 'LEGENDARY') && (
          <circle
            cx="80"
            cy="80"
            r="65"
            fill={`url(#chest-beam-${tier})`}
            className={isOpen ? 'animate-pulse' : ''}
          />
        )}

        {/* Shadow under chest */}
        <ellipse cx="80" cy="142" rx="55" ry="12" fill="#000000" opacity="0.45" />

        {/* Chest Lower Box / Body */}
        <g filter={`url(#chest-glow-${tier})`}>
          {/* Main Body */}
          <rect
            x="24"
            y="72"
            width="112"
            height="62"
            rx="10"
            fill={`url(#chest-body-grad-${tier})`}
            stroke="#1B1740"
            strokeWidth="4"
          />

          {/* Metal Corner Straps */}
          <path
            d="M24 82 H40 V130 H24 V82 Z"
            fill={theme.metalDark}
            stroke="#1B1740"
            strokeWidth="3"
          />
          <path
            d="M120 82 H136 V130 H120 V82 Z"
            fill={theme.metalDark}
            stroke="#1B1740"
            strokeWidth="3"
          />

          {/* Center Metal Band on Body */}
          <rect
            x="70"
            y="72"
            width="20"
            height="62"
            fill={theme.metal}
            stroke="#1B1740"
            strokeWidth="3"
          />

          {/* Golden Studs/Rivets */}
          <circle cx="32" cy="88" r="2.5" fill="#FFF" opacity="0.8" />
          <circle cx="32" cy="122" r="2.5" fill="#FFF" opacity="0.8" />
          <circle cx="128" cy="88" r="2.5" fill="#FFF" opacity="0.8" />
          <circle cx="128" cy="122" r="2.5" fill="#FFF" opacity="0.8" />

          {/* Chest Lock / Keyhole Core */}
          <rect
            x="72"
            y="78"
            width="16"
            height="22"
            rx="4"
            fill={theme.metalDark}
            stroke="#1B1740"
            strokeWidth="3"
          />
          <circle cx="80" cy="86" r="3" fill="#1B1740" />
          <path d="M78 86 L82 86 L81 94 L79 94 Z" fill="#1B1740" />

          {/* Embedded Gem */}
          <polygon
            points="80,105 87,113 80,121 73,113"
            fill={theme.gem}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            className={isOpen ? 'animate-ping' : ''}
          />
        </g>

        {/* Chest Lid (Rotates or translates up if OPEN) */}
        <g
          className="transition-transform duration-500 ease-out origin-[80px_70px]"
          style={{
            transform: isOpen ? 'translateY(-24px) scale(1.05)' : 'translateY(0)',
          }}
        >
          {/* Lid Dome */}
          <path
            d="M20 68 C20 40 46 26 80 26 C114 26 140 40 140 68 L140 74 L20 74 Z"
            fill={`url(#chest-lid-grad-${tier})`}
            stroke="#1B1740"
            strokeWidth="4"
          />

          {/* Lid Left Band */}
          <path
            d="M26 68 C26 44 42 32 46 32 L40 74 L26 74 Z"
            fill={theme.metalDark}
            stroke="#1B1740"
            strokeWidth="2.5"
          />

          {/* Lid Right Band */}
          <path
            d="M134 68 C134 44 118 32 114 32 L120 74 L134 74 Z"
            fill={theme.metalDark}
            stroke="#1B1740"
            strokeWidth="2.5"
          />

          {/* Lid Center Band */}
          <path
            d="M70 26 C73 26 77 26 80 26 C83 26 87 26 90 26 L90 74 L70 74 Z"
            fill={theme.metal}
            stroke="#1B1740"
            strokeWidth="3"
          />

          {/* Lid Lip / Bevel */}
          <rect
            x="18"
            y="68"
            width="124"
            height="8"
            rx="3"
            fill={theme.metal}
            stroke="#1B1740"
            strokeWidth="3"
          />

          {/* Crest / Emblem on Lid */}
          <circle
            cx="80"
            cy="48"
            r="8"
            fill={theme.gem}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path
            d="M80 43 L82 47 L86 48 L83 51 L84 55 L80 53 L76 55 L77 51 L74 48 L78 47 Z"
            fill="#FFFFFF"
          />
        </g>

        {/* Light Beams Erupting if OPEN */}
        {isOpen && (
          <g className="animate-pulse">
            <line x1="80" y1="65" x2="40" y2="10" stroke={theme.glow} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <line x1="80" y1="65" x2="80" y2="0" stroke="#FFF" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
            <line x1="80" y1="65" x2="120" y2="10" stroke={theme.glow} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <circle cx="80" cy="55" r="16" fill="#FFF" opacity="0.9" />
          </g>
        )}
      </svg>
    </div>
  );
}
