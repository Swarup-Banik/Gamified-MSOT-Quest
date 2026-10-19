'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sound } from './sound-manager';

export type RewardType =
  | 'CORRECT_ANSWER'
  | 'WRONG_ANSWER'
  | 'COMBO_STEP'
  | 'LEVEL_UP'
  | 'CHEST_SHAKE'
  | 'CHEST_OPEN'
  | 'MONSTER_HIT'
  | 'MONSTER_DEFEAT'
  | 'STREAK_PRESERVED'
  | 'LEAGUE_PROMOTION';

export interface RewardOptions {
  type: RewardType;
  xpAmount?: number;
  comboCount?: number;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  originElement?: HTMLElement | null;
}

export function useReward() {
  const triggerReward = useCallback((options: RewardOptions) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    switch (options.type) {
      case 'CORRECT_ANSWER':
        sound.playCorrect();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#3DDC97', '#FFC83D', '#4CC9F0'],
          });
        }
        break;

      case 'WRONG_ANSWER':
        sound.playGentleWrong();
        break;

      case 'COMBO_STEP':
        sound.playCombo(options.comboCount || 1);
        if (!prefersReducedMotion && (options.comboCount || 1) >= 3) {
          confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.75 },
            colors: ['#FFC83D', '#FF8A3D'],
          });
        }
        break;

      case 'LEVEL_UP':
        sound.playLevelUp();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#FFC83D', '#B26CFF', '#4CC9F0', '#3DDC97'],
          });
        }
        break;

      case 'CHEST_SHAKE':
        sound.playChestShake();
        break;

      case 'CHEST_OPEN':
        sound.playChestOpen(options.rarity || 'COMMON');
        if (!prefersReducedMotion) {
          const colors =
            options.rarity === 'LEGENDARY'
              ? ['#FFC83D', '#FF8A3D', '#FFE680']
              : options.rarity === 'EPIC'
              ? ['#B26CFF', '#E0A8FF', '#4CC9F0']
              : ['#3DDC97', '#4CC9F0', '#FFC83D'];

          confetti({
            particleCount: options.rarity === 'LEGENDARY' ? 140 : 80,
            spread: 80,
            origin: { y: 0.6 },
            colors,
          });
        }
        break;

      case 'MONSTER_HIT':
        sound.playMonsterHit();
        break;

      case 'MONSTER_DEFEAT':
        sound.playMonsterDefeat();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 50,
            spread: 65,
            origin: { y: 0.65 },
            colors: ['#FF5E6C', '#FFC83D', '#B26CFF'],
          });
        }
        break;

      case 'STREAK_PRESERVED':
        sound.playCorrect();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 30,
            spread: 45,
            origin: { y: 0.7 },
            colors: ['#4CC9F0', '#3DDC97'],
          });
        }
        break;

      case 'LEAGUE_PROMOTION':
        sound.playLevelUp();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#FFC83D', '#3DDC97'],
          });
        }
        break;
    }
  }, []);

  const triggerCorrect = useCallback(() => {
    triggerReward({ type: 'CORRECT_ANSWER' });
  }, [triggerReward]);

  const triggerGentleWrong = useCallback(() => {
    triggerReward({ type: 'WRONG_ANSWER' });
  }, [triggerReward]);

  const triggerCombo = useCallback((comboCount: number = 1) => {
    triggerReward({ type: 'COMBO_STEP', comboCount });
  }, [triggerReward]);

  const triggerLevelUp = useCallback(() => {
    triggerReward({ type: 'LEVEL_UP' });
  }, [triggerReward]);

  const triggerChestOpen = useCallback((rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'COMMON') => {
    triggerReward({ type: 'CHEST_OPEN', rarity });
  }, [triggerReward]);

  const triggerMonsterHit = useCallback(() => {
    triggerReward({ type: 'MONSTER_HIT' });
  }, [triggerReward]);

  const triggerMonsterDefeat = useCallback(() => {
    triggerReward({ type: 'MONSTER_DEFEAT' });
  }, [triggerReward]);

  return {
    triggerReward,
    triggerCorrect,
    triggerGentleWrong,
    triggerCombo,
    triggerLevelUp,
    triggerChestOpen,
    triggerMonsterHit,
    triggerMonsterDefeat,
  };
}
