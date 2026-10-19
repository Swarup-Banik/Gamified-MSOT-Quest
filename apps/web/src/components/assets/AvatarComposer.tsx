'use client';

import React from 'react';

export interface AvatarComposerProps {
  cosmeticId?: string;
  assetKey?: string;
  avatarKey?: string;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export function AvatarComposer({
  cosmeticId = 'cosm_avatar_fox_starter',
  assetKey,
  avatarKey,
  rarity = 'COMMON',
  size = 64,
  className = '',
  showGlow = true,
}: AvatarComposerProps) {
  const key = avatarKey || assetKey || cosmeticId;

  // Rarity Visual Tweaks
  const rarityGlow = {
    COMMON: 'none',
    UNCOMMON: 'drop-shadow(0 0 6px rgba(124, 243, 107, 0.4))',
    RARE: 'drop-shadow(0 0 10px rgba(34, 227, 255, 0.6))',
    EPIC: 'drop-shadow(0 0 14px rgba(199, 125, 255, 0.75))',
    LEGENDARY: 'drop-shadow(0 0 18px rgba(255, 210, 63, 0.85)) drop-shadow(0 0 30px rgba(255, 138, 43, 0.5))',
  }[rarity];

  // Pick Character Archetype based on key
  const isFox = key.includes('fox') || key.includes('starter') || key === 'avatar_1';
  const isOwl = key.includes('owl') || key === 'avatar_2';
  const isCyber = key.includes('cyber') || key.includes('valkyrie') || key === 'avatar_3';
  const isScholar = key.includes('scholar') || key.includes('quantum') || key.includes('apprentice') || key === 'avatar_4';
  const isKnight = key.includes('crystal') || key.includes('knight') || key === 'avatar_5';
  const isArchmage = key.includes('recursion') || key.includes('archmage') || key === 'avatar_6';
  const isSovereign = key.includes('sovereign') || key.includes('celestial') || key === 'avatar_7';
  const isCoder = key.includes('code') || key.includes('artisan') || key === 'avatar_8';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: showGlow ? rarityGlow : 'none',
      }}
      role="img"
      aria-label={`Avatar: ${key}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="avatar-bg-sunset" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B2EE0" />
            <stop offset="100%" stopColor="#24104F" />
          </linearGradient>

          <linearGradient id="fox-orange" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA654" />
            <stop offset="100%" stopColor="#FF8A2B" />
          </linearGradient>

          <linearGradient id="cyber-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22E3FF" />
            <stop offset="100%" stopColor="#0B8EAF" />
          </linearGradient>

          <linearGradient id="gold-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="50%" stopColor="#FFD23F" />
            <stop offset="100%" stopColor="#FF8A2B" />
          </linearGradient>

          <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF3D9A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#24104F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Backdrop Circle */}
        <circle cx="50" cy="50" r="46" fill="url(#avatar-bg-sunset)" stroke="#3D2070" strokeWidth="2" />

        {/* Ambient Rarity Aura */}
        {rarity === 'LEGENDARY' && (
          <circle cx="50" cy="50" r="48" fill="none" stroke="url(#gold-shimmer)" strokeWidth="2" strokeDasharray="6 3" className="animate-spin" style={{ animationDuration: '20s' }} />
        )}
        {rarity === 'EPIC' && (
          <circle cx="50" cy="50" r="47" fill="none" stroke="#C77DFF" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
        )}

        {/* 2. Character Body & Robe */}
        <path d="M 24 88 Q 50 68 76 88 L 76 96 L 24 96 Z" fill="#24104F" stroke="#15062C" strokeWidth="2" />
        <path d="M 28 88 Q 50 72 72 88" fill={rarity === 'LEGENDARY' ? 'url(#gold-shimmer)' : '#FF8A2B'} opacity="0.8" stroke="#15062C" strokeWidth="1.5" />

        {/* Collar / Trim */}
        <polygon points="50,75 42,88 58,88" fill="#FFF8E7" stroke="#FFD23F" strokeWidth="1" />

        {/* 3. Character Head Shapes by Archetype */}
        {isFox && (
          <g>
            {/* Fox Ears */}
            <polygon points="28,40 36,16 48,34" fill="url(#fox-orange)" stroke="#24104F" strokeWidth="2" />
            <polygon points="32,36 38,22 44,34" fill="#FFF8E7" />
            <polygon points="72,40 64,16 52,34" fill="url(#fox-orange)" stroke="#24104F" strokeWidth="2" />
            <polygon points="68,36 62,22 56,34" fill="#FFF8E7" />

            {/* Fox Face */}
            <ellipse cx="50" cy="52" rx="22" ry="20" fill="url(#fox-orange)" stroke="#24104F" strokeWidth="2" />
            {/* White cheeks */}
            <path d="M 32 54 Q 50 68 68 54 Q 50 72 32 54 Z" fill="#FFF8E7" />
            {/* Nose */}
            <polygon points="48,60 52,60 50,63" fill="#24104F" />
            {/* Eyes */}
            <ellipse cx="42" cy="48" rx="3.5" ry="4.5" fill="#24104F" />
            <circle cx="43.5" cy="46.5" r="1.5" fill="#FFF8E7" />
            <ellipse cx="58" cy="48" rx="3.5" ry="4.5" fill="#24104F" />
            <circle cx="59.5" cy="46.5" r="1.5" fill="#FFF8E7" />
          </g>
        )}

        {isOwl && (
          <g>
            {/* Owl Feathers Head */}
            <path d="M 30 26 Q 50 18 70 26 Q 78 55 50 66 Q 22 55 30 26 Z" fill="#7C3AED" stroke="#24104F" strokeWidth="2" />
            {/* Ear Tufts */}
            <polygon points="30,30 24,14 38,24" fill="#A78BFA" stroke="#24104F" strokeWidth="1.5" />
            <polygon points="70,30 76,14 62,24" fill="#A78BFA" stroke="#24104F" strokeWidth="1.5" />
            {/* Spectacles / Eye Rings */}
            <circle cx="41" cy="46" r="10" fill="#EDE9FE" stroke="#FFD23F" strokeWidth="2.5" />
            <circle cx="59" cy="46" r="10" fill="#EDE9FE" stroke="#FFD23F" strokeWidth="2.5" />
            <line x1="51" y1="46" x2="49" y2="46" stroke="#FFD23F" strokeWidth="2.5" />
            <circle cx="41" cy="46" r="4" fill="#24104F" />
            <circle cx="42" cy="44.5" r="1.5" fill="#FFF8E7" />
            <circle cx="59" cy="46" r="4" fill="#24104F" />
            <circle cx="60" cy="44.5" r="1.5" fill="#FFF8E7" />
            {/* Small Beak */}
            <polygon points="48,53 52,53 50,60" fill="#FF8A2B" stroke="#24104F" strokeWidth="1" />
          </g>
        )}

        {isCyber && (
          <g>
            {/* Cyber Helmet */}
            <rect x="28" y="30" width="44" height="36" rx="14" fill="#1E1B4B" stroke="url(#cyber-cyan)" strokeWidth="2.5" />
            {/* Antennas */}
            <line x1="26" y1="40" x2="18" y2="30" stroke="#22E3FF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="30" r="2.5" fill="#FF3D9A" />
            <line x1="74" y1="40" x2="82" y2="30" stroke="#22E3FF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="82" cy="30" r="2.5" fill="#FF3D9A" />
            {/* Neon Visor */}
            <rect x="34" y="42" width="32" height="12" rx="6" fill="#22E3FF" opacity="0.9" />
            <line x1="38" y1="48" x2="62" y2="48" stroke="#FFF8E7" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {isScholar && (
          <g>
            {/* Scholar Head & Hood */}
            <path d="M 28 35 Q 50 20 72 35 Q 76 60 50 66 Q 24 60 28 35 Z" fill="#3B82F6" stroke="#24104F" strokeWidth="2" />
            <circle cx="50" cy="48" r="16" fill="#FED7AA" stroke="#24104F" strokeWidth="1.5" />
            {/* Hair */}
            <path d="M 34 42 Q 50 34 66 42 Q 62 30 50 28 Q 38 30 34 42 Z" fill="#1E293B" />
            {/* Glasses */}
            <rect x="38" y="44" width="10" height="7" rx="2" fill="none" stroke="#24104F" strokeWidth="1.5" />
            <rect x="52" y="44" width="10" height="7" rx="2" fill="none" stroke="#24104F" strokeWidth="1.5" />
            <line x1="48" y1="47" x2="52" y2="47" stroke="#24104F" strokeWidth="1.5" />
            {/* Smile */}
            <path d="M 46 56 Q 50 59 54 56" fill="none" stroke="#24104F" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {isKnight && (
          <g>
            {/* Crystal Helm */}
            <polygon points="50,18 72,32 68,62 50,72 32,62 28,32" fill="url(#cyber-cyan)" stroke="#24104F" strokeWidth="2" />
            {/* T-Visor Slit */}
            <line x1="40" y1="42" x2="60" y2="42" stroke="#FFF8E7" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="42" x2="50" y2="56" stroke="#FFF8E7" strokeWidth="3" strokeLinecap="round" />
            {/* Prismatic Plume */}
            <polygon points="50,18 45,8 55,8" fill="#FFD23F" stroke="#24104F" strokeWidth="1.5" />
          </g>
        )}

        {isArchmage && (
          <g>
            {/* Archmage Cowl */}
            <path d="M 22 45 Q 50 14 78 45 Q 74 68 50 70 Q 26 68 22 45 Z" fill="#4C1D95" stroke="#C77DFF" strokeWidth="2" />
            {/* Mystic Void Face */}
            <ellipse cx="50" cy="50" rx="16" ry="14" fill="#0F172A" />
            {/* Glowing Rune Eyes */}
            <ellipse cx="44" cy="49" rx="3" ry="5" fill="#C77DFF" />
            <ellipse cx="56" cy="49" rx="3" ry="5" fill="#C77DFF" />
            <circle cx="44" cy="49" r="1.5" fill="#FFF8E7" />
            <circle cx="56" cy="49" r="1.5" fill="#FFF8E7" />
          </g>
        )}

        {isSovereign && (
          <g>
            {/* Celestial Crown */}
            <polygon points="32,28 38,12 45,22 50,8 55,22 62,12 68,28" fill="url(#gold-shimmer)" stroke="#24104F" strokeWidth="2" />
            <circle cx="50" cy="18" r="3" fill="#FF3D9A" stroke="#FFF8E7" strokeWidth="1" />
            {/* Golden Face Mask */}
            <circle cx="50" cy="48" r="18" fill="#FFF8E7" stroke="url(#gold-shimmer)" strokeWidth="2" />
            {/* Closed meditative serene eyes */}
            <path d="M 40 47 Q 44 50 48 47" fill="none" stroke="#24104F" strokeWidth="2" strokeLinecap="round" />
            <path d="M 52 47 Q 56 50 60 47" fill="none" stroke="#24104F" strokeWidth="2" strokeLinecap="round" />
            {/* Third Eye Bindi / Diamond */}
            <polygon points="50,38 52,41 50,44 48,41" fill="#FF3D9A" />
          </g>
        )}

        {isCoder && (
          <g>
            {/* Coder Head with Cat Ears & Headset */}
            <circle cx="50" cy="50" r="18" fill="#FDE047" stroke="#24104F" strokeWidth="2" />
            {/* Headset Arc */}
            <path d="M 28 50 A 22 22 0 0 1 72 50" fill="none" stroke="#FF3D9A" strokeWidth="4" strokeLinecap="round" />
            <rect x="25" y="44" width="6" height="12" rx="3" fill="#24104F" />
            <rect x="69" y="44" width="6" height="12" rx="3" fill="#24104F" />
            {/* Eyes */}
            <circle cx="44" cy="48" r="3" fill="#24104F" />
            <circle cx="56" cy="48" r="3" fill="#24104F" />
            <circle cx="45" cy="47" r="1" fill="#FFF8E7" />
            <circle cx="57" cy="47" r="1" fill="#FFF8E7" />
            <path d="M 47 54 Q 50 57 53 54" fill="none" stroke="#24104F" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* 4. Particle Glints for Rare, Epic, Legendary */}
        {rarity === 'LEGENDARY' && (
          <g fill="#FFD23F">
            <polygon points="18,24 20,20 22,24 20,28" className="animate-ping" style={{ transformOrigin: '20px 24px', animationDuration: '3s' }} />
            <polygon points="80,24 82,20 84,24 82,28" className="animate-ping" style={{ transformOrigin: '82px 24px', animationDuration: '4s' }} />
            <polygon points="50,4 52,1 54,4 52,7" fill="#FFF8E7" />
          </g>
        )}
      </svg>
    </div>
  );
}
