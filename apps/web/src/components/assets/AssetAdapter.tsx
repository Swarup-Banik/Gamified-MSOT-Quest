'use client';

import React from 'react';
import { CosmeticSlot, CosmeticRarity } from '@msot/shared';
import { AvatarComposer } from './AvatarComposer';
import { BannerGenerator } from './BannerGenerator';
import { FrameGenerator } from './FrameGenerator';
import { FlameGenerator } from './FlameGenerator';
import { TitleBadge } from './TitleBadge';
import { CompanionAvatar } from './CompanionAvatar';

export interface CompanionRenderProps {
  species?: 'fox' | 'owl' | 'dragon' | 'golem';
  evolutionStage?: 1 | 2 | 3;
  mood?: 'idle' | 'happy' | 'cheering' | 'focused';
  size?: number;
  className?: string;
}

export interface MonsterRenderProps {
  topicKey?: string;
  rarity?: 'COMMON' | 'ELITE' | 'BOSS';
  size?: number;
  isHit?: boolean;
  className?: string;
}

export interface ChestRenderProps {
  tier?: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY';
  size?: number;
  isOpen?: boolean;
  isShaking?: boolean;
  className?: string;
}

export class AssetAdapter {
  static getCompanionLabel(species: string = 'fox', stage: number = 1): string {
    return `Level ${stage} ${species.charAt(0).toUpperCase() + species.slice(1)} Study Companion`;
  }

  static getMonsterLabel(topic: string = 'recursion', rarity: string = 'COMMON'): string {
    return `${rarity} Mistake Monster for ${topic}`;
  }

  static getChestLabel(tier: string = 'WOODEN'): string {
    return `${tier} Mystery Reward Chest`;
  }

  /**
   * Resolve species and evolution stage from companion cosmetic asset key
   */
  static mapCompanionSkin(assetKey: string = ''): { species: 'fox' | 'owl' | 'dragon' | 'golem'; stage: number } {
    const k = assetKey.toLowerCase();
    if (k.includes('celestial_dragon') || k.includes('dragon')) {
      return { species: 'dragon', stage: 3 };
    }
    if (k.includes('aurora_fox') || k.includes('spirit')) {
      return { species: 'fox', stage: 3 };
    }
    if (k.includes('astronomer_owl') || k.includes('owl')) {
      return { species: 'owl', stage: 2 };
    }
    if (k.includes('pebble_golem') || k.includes('golem')) {
      return { species: 'golem', stage: 2 };
    }
    if (k.includes('mecha_hound') || k.includes('void_panther')) {
      return { species: 'dragon', stage: 2 };
    }
    return { species: 'fox', stage: 1 };
  }
}

export interface CosmeticPreviewProps {
  slot: CosmeticSlot;
  assetKey: string;
  rarity?: CosmeticRarity | string;
  name?: string;
  size?: number;
  className?: string;
  silhouette?: boolean; // Render locked silhouette with mystery styling
}

export function CosmeticPreview({
  slot,
  assetKey,
  rarity = 'COMMON',
  name,
  size = 80,
  className = '',
  silhouette = false,
}: CosmeticPreviewProps) {
  // Silhouette styling wrapper for uncollected / locked items
  const wrapSilhouette = (children: React.ReactNode) => {
    if (!silhouette) return <>{children}</>;
    return (
      <div className="relative w-full h-full flex items-center justify-center filter brightness-[0.2] contrast-[1.4] opacity-50 select-none">
        {children}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl opacity-90 drop-shadow">🔒</span>
        </div>
      </div>
    );
  };

  const normRarity = (rarity?.toUpperCase() as CosmeticRarity) || 'COMMON';

  switch (slot) {
    case 'AVATAR_SKIN':
      return wrapSilhouette(
        <AvatarComposer
          avatarKey={assetKey}
          rarity={normRarity}
          size={size}
          className={className}
        />
      );

    case 'COMPANION_SKIN': {
      const { species, stage } = AssetAdapter.mapCompanionSkin(assetKey);
      return wrapSilhouette(
        <CompanionAvatar
          species={species}
          evolutionStage={stage}
          size={size}
          className={className}
        />
      );
    }

    case 'PROFILE_BANNER':
      return wrapSilhouette(
        <BannerGenerator
          bannerKey={assetKey}
          aspectRatio="16/9"
          className={`w-full max-w-[180px] ${className}`}
        />
      );

    case 'FRAME':
      return wrapSilhouette(
        <FrameGenerator frameKey={assetKey} size={size} className={className}>
          <div className="w-full h-full bg-twilight-900 rounded-full flex items-center justify-center text-xs opacity-60">
            👤
          </div>
        </FrameGenerator>
      );

    case 'TITLE':
      return wrapSilhouette(
        <TitleBadge
          titleKey={assetKey}
          name={name}
          rarity={rarity}
          size="sm"
          className={className}
        />
      );

    case 'STREAK_FLAME':
      return wrapSilhouette(
        <FlameGenerator
          flameKey={assetKey}
          size={size * 0.75}
          className={className}
        />
      );

    case 'LEVELUP_EFFECT':
      return wrapSilhouette(
        <div
          className={`relative inline-flex items-center justify-center bg-twilight-950/70 rounded-xl border border-amber-400/30 p-2 overflow-hidden ${className}`}
          style={{ width: size, height: size }}
        >
          <div className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>✨</div>
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 via-transparent to-purple-400/20" />
        </div>
      );

    default:
      return (
        <div
          className={`inline-flex items-center justify-center bg-twilight-900 rounded-lg border border-twilight-700 ${className}`}
          style={{ width: size, height: size }}
        >
          <span className="text-xl">🎁</span>
        </div>
      );
  }
}
