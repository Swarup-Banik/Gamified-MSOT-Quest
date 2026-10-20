'use client';

import { useCallback, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { sound, PressableRole } from './sound-manager';
import { motionManager, SensoryMode } from './motion-manager';

export type CelebrationTier = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EPIC';

export type LegacyRewardType =
  | 'CORRECT_ANSWER'
  | 'WRONG_ANSWER'
  | 'COMBO_STEP'
  | 'LEVEL_UP'
  | 'CHEST_SHAKE'
  | 'CHEST_OPEN'
  | 'MONSTER_HIT'
  | 'MONSTER_DEFEAT'
  | 'STREAK_PRESERVED'
  | 'LEAGUE_PROMOTION'
  | 'CODING_PRACTICE_SOLVE';

export interface CelebrationPayload {
  tier: CelebrationTier;
  title?: string;
  subtitle?: string;
  xpAmount?: number;
  gemsAmount?: number;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  onComplete?: () => void;
}

export interface LegacyRewardOptions {
  type: LegacyRewardType;
  xpAmount?: number;
  comboCount?: number;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  originElement?: HTMLElement | null;
}

// Global active celebration state & queue (singleton pattern for concurrency)
let activeCelebration: CelebrationPayload | null = null;
const celebrationQueue: CelebrationPayload[] = [];
const subscribers = new Set<(c: CelebrationPayload | null) => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb(activeCelebration));
}

export function dismissCurrentCelebration() {
  if (activeCelebration) {
    if (activeCelebration.onComplete) {
      activeCelebration.onComplete();
    }
    activeCelebration = null;
    notifySubscribers();

    // Process next in queue if available
    if (celebrationQueue.length > 0) {
      const next = celebrationQueue.shift()!;
      playCelebration(next);
    }
  }
}

function playCelebration(payload: CelebrationPayload) {
  const sensoryMode = motionManager.getSensoryMode();
  const particleScale = motionManager.getParticleScale();

  if (sensoryMode === 'MINIMAL') {
    // Instant completion without particle cannon or delays
    sound.playPressTick('success');
    if (payload.onComplete) payload.onComplete();
    return;
  }

  // If a hero celebration is already active, enqueue this one
  if (activeCelebration && (payload.tier === 'LARGE' || payload.tier === 'EPIC')) {
    celebrationQueue.push(payload);
    return;
  }

  activeCelebration = payload;
  notifySubscribers();

  switch (payload.tier) {
    case 'MICRO': {
      sound.playPressTick('primary');
      setTimeout(() => dismissCurrentCelebration(), 120);
      break;
    }

    case 'SMALL': {
      sound.playCorrect();
      if (particleScale > 0) {
        confetti({
          particleCount: Math.round(25 * particleScale),
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#3DDC97', '#FFD23F', '#22E3FF'],
        });
      }
      setTimeout(() => dismissCurrentCelebration(), 800);
      break;
    }

    case 'MEDIUM': {
      sound.playCombo(3);
      if (particleScale > 0) {
        confetti({
          particleCount: Math.round(60 * particleScale),
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#FFD23F', '#FF5E6C', '#B26CFF', '#3DDC97'],
        });
      }
      setTimeout(() => dismissCurrentCelebration(), 1500);
      break;
    }

    case 'LARGE': {
      sound.playLevelUp();
      if (particleScale > 0 && motionManager.canFlash()) {
        // Dual confetti cannon from left and right
        confetti({
          particleCount: Math.round(60 * particleScale),
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD23F', '#B26CFF', '#22E3FF', '#3DDC97'],
        });
        confetti({
          particleCount: Math.round(60 * particleScale),
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD23F', '#B26CFF', '#22E3FF', '#3DDC97'],
        });
      }
      setTimeout(() => dismissCurrentCelebration(), 2500);
      break;
    }

    case 'EPIC': {
      sound.playChestOpen(payload.rarity || 'LEGENDARY');
      if (particleScale > 0 && motionManager.canFlash()) {
        // Stage 1 burst
        confetti({
          particleCount: Math.round(80 * particleScale),
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD23F', '#FFA500', '#FF4D5E', '#B26CFF'],
        });
        // Stage 2 burst after 300ms
        setTimeout(() => {
          if (activeCelebration?.tier === 'EPIC') {
            confetti({
              particleCount: Math.round(60 * particleScale),
              spread: 120,
              origin: { y: 0.4 },
              colors: ['#22E3FF', '#3DDC97', '#FFD23F'],
            });
          }
        }, 300);
      }
      setTimeout(() => dismissCurrentCelebration(), 3500);
      break;
    }
  }
}

export function useReward() {
  const [active, setActive] = useState<CelebrationPayload | null>(activeCelebration);

  useEffect(() => {
    subscribers.add(setActive);
    return () => {
      subscribers.delete(setActive);
    };
  }, []);

  // Global single-tap / escape key dismiss listener
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissCurrentCelebration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  const triggerCelebration = useCallback((payload: CelebrationPayload) => {
    playCelebration(payload);
  }, []);

  // Legacy API wrapper for backwards compatibility across existing components
  const triggerReward = useCallback(
    (options: LegacyRewardOptions) => {
      switch (options.type) {
        case 'CORRECT_ANSWER':
          playCelebration({ tier: 'SMALL', title: 'Correct!', xpAmount: options.xpAmount || 15 });
          break;
        case 'WRONG_ANSWER':
          sound.playGentleWrong();
          break;
        case 'COMBO_STEP':
          sound.playCombo(options.comboCount || 1);
          if ((options.comboCount || 1) >= 3) {
            playCelebration({ tier: 'SMALL', title: `${options.comboCount}x Combo!` });
          }
          break;
        case 'LEVEL_UP':
          playCelebration({ tier: 'LARGE', title: 'Level Up!', subtitle: 'New powers unlocked!' });
          break;
        case 'CHEST_SHAKE':
          sound.playChestShake();
          break;
        case 'CHEST_OPEN':
          playCelebration({
            tier: options.rarity === 'LEGENDARY' || options.rarity === 'EPIC' ? 'EPIC' : 'MEDIUM',
            title: 'Chest Unlocked!',
            rarity: options.rarity,
          });
          break;
        case 'MONSTER_HIT':
          sound.playMonsterHit();
          break;
        case 'MONSTER_DEFEAT':
          playCelebration({
            tier: 'MEDIUM',
            title: 'Monster Defeated!',
            subtitle: 'Topic mastery strengthened',
          });
          break;
        case 'STREAK_PRESERVED':
          playCelebration({ tier: 'SMALL', title: 'Streak Protected!' });
          break;
        case 'LEAGUE_PROMOTION':
          playCelebration({ tier: 'LARGE', title: 'Promoted to Higher League!' });
          break;
        case 'CODING_PRACTICE_SOLVE':
          playCelebration({
            tier: 'SMALL',
            title: 'Verified Solve Synced!',
            xpAmount: options.xpAmount || 20,
          });
          break;
      }
    },
    []
  );

  return {
    activeCelebration: active,
    dismissCelebration: dismissCurrentCelebration,
    triggerCelebration,
    triggerReward,
    triggerCorrect: () => triggerReward({ type: 'CORRECT_ANSWER' }),
    triggerGentleWrong: () => triggerReward({ type: 'WRONG_ANSWER' }),
    triggerCombo: (comboCount = 1) => triggerReward({ type: 'COMBO_STEP', comboCount }),
    triggerLevelUp: () => triggerReward({ type: 'LEVEL_UP' }),
    triggerChestOpen: (rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'COMMON') =>
      triggerReward({ type: 'CHEST_OPEN', rarity }),
    triggerMonsterHit: () => triggerReward({ type: 'MONSTER_HIT' }),
    triggerMonsterDefeat: () => triggerReward({ type: 'MONSTER_DEFEAT' }),
  };
}
