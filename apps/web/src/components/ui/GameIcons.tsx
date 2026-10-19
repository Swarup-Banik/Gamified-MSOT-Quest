'use client';

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// 1. XP Star Medallion (Sun Yellow + Warm White)
export function IconXpMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.75} height={size * 0.75} fill="none">
        <polygon
          points="16,3 19.5,11.5 28.5,12 21.5,18 24,27 16,22 8,27 10.5,18 3.5,12 12.5,11.5"
          fill="#FFF8E7"
          stroke="#24104F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="3" fill="#FFD23F" />
      </svg>
    </div>
  );
}

// 2. Streak Flame Medallion (Sunset Orange + Sun Yellow)
export function IconFlameMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #FFB15E 0%, #FF8A2B 50%, #C96008 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72} fill="none">
        <path
          d="M 16 3 C 18 8 25 12 25 20 C 25 25 21 28 16 28 C 11 28 7 25 7 20 C 7 14 12 11 14 7 C 15 11 18 13 18 16 C 18 18 17 19 16 20 C 18 20 20 18 20 15 C 20 10 17 7 16 3 Z"
          fill="#FFD23F"
          stroke="#24104F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 16 15 C 17 18 19 19 19 22 C 19 24 17.5 25.5 16 25.5 C 14.5 25.5 13 24 13 22 C 13 19 15 17 16 15 Z"
          fill="#FFF8E7"
        />
      </svg>
    </div>
  );
}

// 3. Freeze Snowflake Medallion (Electric Cyan)
export function IconSnowflakeMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #8AFAFF 0%, #22E3FF 50%, #0FA2B8 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.7} height={size * 0.7} fill="none">
        <line x1="16" y1="5" x2="16" y2="27" stroke="#24104F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="16" x2="27" y2="16" stroke="#24104F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="8" x2="24" y2="24" stroke="#24104F" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="8" x2="8" y2="24" stroke="#24104F" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.5" fill="#FFF8E7" stroke="#24104F" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// 4. Shard Gem Medallion (Hot Magenta + Sun Yellow)
export function IconGemMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #FFA1D1 0%, #FF3D9A 50%, #990B50 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.7} height={size * 0.7} fill="none">
        <polygon
          points="9,7 23,7 29,14 16,27 3,14"
          fill="#FFF8E7"
          stroke="#24104F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon points="9,7 23,7 20,14 12,14" fill="#FFD23F" />
        <polygon points="12,14 20,14 16,27" fill="#FF3D9A" opacity="0.8" />
      </svg>
    </div>
  );
}

// 5. Mystery Vault Chest Medallion
export function IconChestMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #FFE873 0%, #FFD23F 45%, #C47905 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72} fill="none">
        {/* Chest body */}
        <rect x="5" y="13" width="22" height="13" rx="3" fill="#24104F" stroke="#24104F" strokeWidth="1.5" />
        {/* Chest lid */}
        <path d="M 4 13 C 4 9 9 6 16 6 C 23 6 28 9 28 13 Z" fill="#FF8A2B" stroke="#24104F" strokeWidth="2" />
        {/* Metal band */}
        <rect x="13" y="6" width="6" height="20" fill="#FFD23F" stroke="#24104F" strokeWidth="1.5" />
        {/* Lock keyhole */}
        <circle cx="16" cy="16" r="2" fill="#FFF8E7" />
      </svg>
    </div>
  );
}

// 6. Battle Swords Medallion (Arena)
export function IconSwordMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #FF6BB4 0%, #FF3D9A 50%, #B81464 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72} fill="none">
        <path d="M 7 7 L 18 18 L 16 20 L 5 9 Z" fill="#FFF8E7" stroke="#24104F" strokeWidth="1.5" />
        <path d="M 25 7 L 14 18 L 16 20 L 27 9 Z" fill="#FFF8E7" stroke="#24104F" strokeWidth="1.5" />
        <circle cx="16" cy="19" r="2" fill="#FFD23F" stroke="#24104F" strokeWidth="1" />
        <line x1="5" y1="27" x2="14" y2="18" stroke="#FFD23F" strokeWidth="2" strokeLinecap="round" />
        <line x1="27" y1="27" x2="18" y2="18" stroke="#FFD23F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// 7. Trophy Medallion
export function IconTrophyMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #FFE873 0%, #FFD23F 45%, #C47905 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.75} height={size * 0.75} fill="none">
        <path
          d="M 8 7 H 24 V 14 C 24 19 20 22 16 22 C 12 22 8 19 8 14 Z"
          fill="#FFF8E7"
          stroke="#24104F"
          strokeWidth="2"
        />
        <path d="M 8 9 H 4 C 4 13 6 15 8 15 Z" fill="#FF8A2B" stroke="#24104F" strokeWidth="1.5" />
        <path d="M 24 9 H 28 C 28 13 26 15 24 15 Z" fill="#FF8A2B" stroke="#24104F" strokeWidth="1.5" />
        <rect x="14" y="22" width="4" height="4" fill="#24104F" />
        <rect x="10" y="25" width="12" height="3" rx="1.5" fill="#24104F" />
      </svg>
    </div>
  );
}

// 8. Codex Book Medallion
export function IconBookMedallion({ size = 32, className = '' }: IconProps) {
  return (
    <div
      className={`medallion-frame inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg, #A886FF 0%, #5B2EE0 50%, #2B0E8A 100%)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72} fill="none">
        <path
          d="M 6 8 C 10 7 14 8 16 10 C 18 8 22 7 26 8 V 24 C 22 23 18 24 16 26 C 14 24 10 23 6 24 Z"
          fill="#FFF8E7"
          stroke="#24104F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line x1="16" y1="10" x2="16" y2="26" stroke="#5B2EE0" strokeWidth="2" strokeLinecap="round" />
        <polygon points="16,11 18,14 16,17 14,14" fill="#FFD23F" />
      </svg>
    </div>
  );
}
