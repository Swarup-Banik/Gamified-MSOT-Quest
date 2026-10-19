'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  X,
  FastForward,
  Shield,
  Award,
  Layers,
} from 'lucide-react';
import { ChestSVG, ChestTier, ChestState } from '../assets/ChestSVG';
import { RarityBadge, ItemRarity } from '../ui/RarityBadge';
import { GameButton } from '../ui/GameButton';
import { soundManager } from '../../lib/sound-manager';
import { useReward } from '../../lib/use-reward';

export interface MysteryChestOpeningProps {
  isOpen: boolean;
  chest: {
    id: string;
    tier: ChestTier;
    source?: string;
  } | null;
  pity?: {
    rarePity: number; // e.g. 7/10
    epicPity: number; // e.g. 23/30
  };
  onOpen: (chestId: string) => Promise<any>;
  onClose: () => void;
}

export function MysteryChestOpening({
  isOpen,
  chest,
  pity = { rarePity: 7, epicPity: 22 },
  onOpen,
  onClose,
}: MysteryChestOpeningProps) {
  const [stage, setStage] = useState<'READY' | 'SHAKING' | 'EXPLODING' | 'REVEALED'>('READY');
  const [shakeProgress, setShakeProgress] = useState(0);
  const [lootResult, setLootResult] = useState<any | null>(null);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { triggerLevelUp } = useReward();

  useEffect(() => {
    if (isOpen) {
      setStage('READY');
      setShakeProgress(0);
      setLootResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !chest) return null;

  const startHold = () => {
    if (stage !== 'READY') return;
    setStage('SHAKING');
    soundManager.play('chestShake');

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 4;
      setShakeProgress(progress);

      if (progress % 20 === 0) {
        soundManager.play('chestShake');
        if (navigator.vibrate) {
          navigator.vibrate(25);
        }
      }

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        executeLidExplosion();
      }
    }, 40);
  };

  const cancelHold = () => {
    if (stage === 'SHAKING') {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setStage('READY');
      setShakeProgress(0);
    }
  };

  const executeLidExplosion = async () => {
    setStage('EXPLODING');
    soundManager.play('chestOpen');
    if (navigator.vibrate) {
      navigator.vibrate([40, 20, 60]);
    }

    try {
      const res = await onOpen(chest.id);
      setLootResult(res);
      setTimeout(() => {
        setStage('REVEALED');
        triggerLevelUp();
      }, 500);
    } catch (err) {
      console.error('Chest open failed', err);
      setStage('READY');
    }
  };

  const handleQuickOpen = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    executeLidExplosion();
  };

  const chestState: ChestState =
    stage === 'SHAKING' ? 'SHAKING' : stage === 'EXPLODING' || stage === 'REVEALED' ? 'OPEN' : 'IDLE';

  const rewardRarity: ItemRarity = lootResult?.cosmetic?.rarity || 'RARE';

  return (
    <div className="fixed inset-0 z-50 bg-[#0B091F]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-reward max-w-md w-full p-6 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-[#1B1740] text-slate-400 hover:text-white transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold text-[#FFC83D] uppercase tracking-wider font-display">
            {chest.tier} Mystery Vault
          </span>
          <h3 className="text-2xl font-display text-white">
            {stage === 'REVEALED' ? 'Vault Unlocked!' : 'Tap & Hold to Open'}
          </h3>
        </div>

        {/* Interactive Chest Stage */}
        <div className="py-6 flex flex-col items-center justify-center relative">
          {/* Pulsing Light Aura on Reveal */}
          {stage === 'REVEALED' && (
            <div className="absolute inset-0 bg-gradient-radial from-[#FFC83D]/25 via-transparent to-transparent animate-pulse pointer-events-none" />
          )}

          {/* Procedural 3D SVG Chest */}
          <div
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            className={`cursor-pointer transition-transform ${
              stage === 'SHAKING' ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            <ChestSVG tier={chest.tier} state={chestState} size={160} />
          </div>

          {/* Shake Charge Progress Bar */}
          {stage === 'SHAKING' && (
            <div className="w-48 mt-4 space-y-1">
              <div className="w-full h-2 bg-[#1B1740] rounded-full overflow-hidden border border-[#3D3280]">
                <div
                  className="h-full bg-gradient-to-r from-[#FFC83D] to-[#FF8A3D] rounded-full transition-all duration-75"
                  style={{ width: `${shakeProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-center text-[#FFC83D] font-bold animate-pulse">
                Rumbling... {shakeProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Revealed Loot Card */}
        {stage === 'REVEALED' && lootResult && (
          <div className="p-4 rounded-2xl bg-[#1B1740] border-2 border-[#FFC83D] space-y-3 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="flex items-center justify-between">
              <RarityBadge rarity={rewardRarity} />
              <span className="text-xs text-slate-400">Vault Item</span>
            </div>

            <div className="text-center py-2 space-y-1">
              <h4 className="font-display text-lg text-white">
                {lootResult.cosmetic?.name || 'Lantern Scholar Banner'}
              </h4>
              <p className="text-xs text-slate-300">
                {lootResult.cosmetic?.description || 'A shimmering animated aura awarded for study milestone excellence.'}
              </p>
            </div>

            {/* Currency Granted */}
            <div className="flex items-center justify-around bg-[#2D2466] p-2.5 rounded-xl border border-[#3D3280] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#FFC83D]">
                <Zap className="w-4 h-4 fill-current" />
                <span>+{lootResult.xpGranted || 45} XP</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[#4CC9F0]">
                <span>💎 +{lootResult.shardsGranted || 20} Shards</span>
              </div>
            </div>
          </div>
        )}

        {/* Pity Counter Bar */}
        <div className="bg-[#1B1740] p-3 rounded-xl border border-[#3D3280] space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#4CC9F0]" />
              Guaranteed Rare Pity:
            </span>
            <span className="font-mono text-slate-200 font-bold">{pity.rarePity}/10 opens</span>
          </div>
          <div className="w-full h-1.5 bg-[#2D2466] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4CC9F0] rounded-full"
              style={{ width: `${(pity.rarePity / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="space-y-2">
          {stage !== 'REVEALED' ? (
            <div className="flex items-center gap-2">
              <GameButton
                variant="primary"
                size="md"
                fullWidth
                onClick={handleQuickOpen}
                icon={<FastForward className="w-4 h-4" />}
              >
                Quick open (skip hold)
              </GameButton>
            </div>
          ) : (
            <GameButton
              variant="secondary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Collect & close
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
}
