'use client';

import React from 'react';

export interface FlameGeneratorProps {
  flameKey?: string;
  size?: number;
  streakCount?: number;
  className?: string;
  animate?: boolean;
}

export function FlameGenerator({
  flameKey = 'flame_warm_lantern',
  size = 40,
  streakCount,
  className = '',
  animate = true,
}: FlameGeneratorProps) {
  const key = (flameKey || 'flame_warm_lantern').toLowerCase().replace(/['"]/g, '');

  // Flame color schemes
  const config = {
    flame_warm_lantern: {
      outer: '#FF8A3D',
      inner: '#FFC83D',
      core: '#FFFBEB',
      glow: '#FF8A3D',
    },
    flame_courtyard_hearth: {
      outer: '#DC2626',
      inner: '#F97316',
      core: '#FEF08A',
      glow: '#EF4444',
    },
    flame_verdant_wisp: {
      outer: '#059669',
      inner: '#3DDC97',
      core: '#D1FAE5',
      glow: '#3DDC97',
    },
    flame_supernova_blue: {
      outer: '#2563EB',
      inner: '#4CC9F0',
      core: '#E0F2FE',
      glow: '#38BDF8',
    },
    flame_amethyst_blaze: {
      outer: '#7C3AED',
      inner: '#B26CFF',
      core: '#F5F3FF',
      glow: '#C084FC',
    },
    flame_plasma_storm: {
      outer: '#DB2777',
      inner: '#4CC9F0',
      core: '#FFFFFF',
      glow: '#F472B6',
    },
    flame_phoenix_sunburst: {
      outer: '#B45309',
      inner: '#FFC83D',
      core: '#FFFBEB',
      glow: '#F59E0B',
    },
  }[key] || {
    outer: '#FF8A3D',
    inner: '#FFC83D',
    core: '#FFFBEB',
    glow: '#FF8A3D',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Streak Flame: ${flameKey}`}
    >
      <svg
        viewBox="0 0 100 120"
        width={size}
        height={(size * 1.2)}
        className={`w-full h-full overflow-visible ${animate ? 'hover:scale-110 transition-transform' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`flame-glow-${key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <radialGradient id={`flame-grad-${key}`} cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor={config.core} />
            <stop offset="40%" stopColor={config.inner} />
            <stop offset="100%" stopColor={config.outer} />
          </radialGradient>
        </defs>

        {/* Ambient Halo */}
        <circle
          cx="50"
          cy="70"
          r="40"
          fill={config.glow}
          opacity="0.25"
          filter={`url(#flame-glow-${key})`}
          className={animate ? 'animate-pulse' : ''}
        />

        {/* Outer Flame Tongue */}
        <path
          d="M 50 5 Q 75 40 78 70 Q 80 100 50 110 Q 20 100 22 70 Q 25 40 50 5 Z"
          fill={config.outer}
          filter={`url(#flame-glow-${key})`}
        />

        {/* Secondary Flickering Tongue */}
        <path
          d="M 50 15 Q 70 45 70 75 Q 70 100 50 105 Q 30 100 30 75 Q 30 45 50 15 Z"
          fill={`url(#flame-grad-${key})`}
        />

        {/* Inner Core Hot Tongue */}
        <path
          d="M 50 35 Q 62 55 60 78 Q 58 95 50 98 Q 42 95 40 78 Q 38 55 50 35 Z"
          fill={config.core}
        />

        {/* Sparks Floating Up */}
        {animate && (
          <>
            <circle cx="42" cy="18" r="2.5" fill={config.inner} opacity="0.8" />
            <circle cx="58" cy="10" r="2" fill={config.core} opacity="0.9" />
            <circle cx="35" cy="30" r="1.5" fill={config.glow} opacity="0.7" />
          </>
        )}

        {/* Legendary Corona Star for Phoenix Sunburst */}
        {key === 'flame_phoenix_sunburst' && (
          <g transform="translate(50, 4) scale(0.6)">
            <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="#FFE066" filter={`url(#flame-glow-${key})`} />
          </g>
        )}
      </svg>

      {/* Optional Streak Counter Badge Overlay */}
      {typeof streakCount === 'number' && (
        <span className="absolute -bottom-1 font-black text-[10px] bg-twilight-950/90 text-amber-300 border border-amber-400/40 rounded-full px-1.5 py-0.2 shadow-sm">
          {streakCount}d
        </span>
      )}
    </div>
  );
}
