'use client';

import React, { useState } from 'react';
import {
  Sword,
  Shield,
  Heart,
  Sparkles,
  Trophy,
  X,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { MonsterAvatar, MonsterFamily, MonsterTier } from '../assets/MonsterAvatar';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { GameButton } from '../ui/GameButton';
import { useReward } from '../../lib/use-reward';
import { soundManager } from '../../lib/sound-manager';

export interface MonsterBattleProps {
  monster: {
    id: string;
    name: string;
    family: MonsterFamily;
    tier: MonsterTier;
    description: string;
    weakness: string;
    maxHp?: number;
    question: {
      questionText: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    };
    xpReward?: number;
    shardsReward?: number;
  };
  onDefeated: (reward: { xp: number; shards: number }) => void;
  onClose: () => void;
}

export function MistakeMonsterBattle({
  monster,
  onDefeated,
  onClose,
}: MonsterBattleProps) {
  const maxHp = monster.maxHp || 100;
  const [currentHp, setCurrentHp] = useState(maxHp);
  const [isHit, setIsHit] = useState(false);
  const [damagePopup, setDamagePopup] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);

  const { triggerCorrect, triggerGentleWrong } = useReward();

  const handleSelectAnswer = (index: number) => {
    if (isAnswered || isDefeated) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === monster.question.correctOptionIndex;

    if (isCorrect) {
      // Strike the monster!
      soundManager.play('monsterHit');
      setIsHit(true);
      setDamagePopup(maxHp);
      setCurrentHp(0);

      setTimeout(() => {
        setIsHit(false);
        setIsDefeated(true);
        soundManager.play('monsterDefeat');
        triggerCorrect();
      }, 700);
    } else {
      // Gentle wrong nudge
      triggerGentleWrong();
      // Monster survives with slight damage
      soundManager.play('monsterHit');
      setIsHit(true);
      setDamagePopup(25);
      setCurrentHp(prev => Math.max(25, prev - 25));
      setTimeout(() => {
        setIsHit(false);
      }, 500);
    }
  };

  const handleClaimVictory = () => {
    onDefeated({
      xp: monster.xpReward || 50,
      shards: monster.shardsReward || 30,
    });
  };

  const hpPercent = Math.max(0, (currentHp / maxHp) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B091F]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-battle max-w-lg w-full p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#3D3280] pb-3">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-[#FF5E6C]" />
            <span className="font-display text-sm tracking-wide text-[#FF5E6C]">
              Mistake Monster Revenge Arena
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#1B1740] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Combat Stage (Monster vs Companion) */}
        <div className="relative py-6 px-4 bg-[#1B1740] rounded-2xl border border-[#3D3280] flex items-center justify-around overflow-hidden shadow-inner">
          {/* Ambient battle ring */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FF5E6C]/10 to-transparent pointer-events-none" />

          {/* Student Companion */}
          <div className="flex flex-col items-center gap-2 z-10">
            <CompanionAvatar
              species="FOX"
              mood={isDefeated ? 'CHEERING' : isHit ? 'HAPPY' : 'FOCUSED'}
              size={64}
            />
            <span className="text-[11px] font-bold text-slate-300">
              Your Companion
            </span>
          </div>

          {/* VS Clash Rune */}
          <div className="z-10 flex flex-col items-center">
            <span className="font-display text-xl text-[#FFC83D] italic">VS</span>
          </div>

          {/* Monster Avatar with HP bar */}
          <div className="flex flex-col items-center gap-2 z-10 relative">
            {/* Damage Number Popup */}
            {damagePopup && (
              <div className="absolute -top-6 text-xl font-display text-[#FF5E6C] font-bold animate-[floatUp_0.8s_ease-out_forwards] pointer-events-none drop-shadow-lg">
                -{damagePopup} HP!
              </div>
            )}

            {/* Monster Avatar */}
            <div
              className={`transition-all duration-200 ${
                isHit ? 'animate-[wiggle_0.2s_ease-in-out_infinite] brightness-150 saturate-200' : ''
              } ${isDefeated ? 'opacity-30 scale-90' : ''}`}
            >
              <MonsterAvatar
                family={monster.family}
                tier={monster.tier}
                size={84}
                isRoaring={!isDefeated && currentHp === maxHp}
              />
            </div>

            {/* Monster Health Bar */}
            <div className="w-28 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>HP</span>
                <span>{currentHp}/{maxHp}</span>
              </div>
              <div className="w-full h-2 bg-[#0B091F] rounded-full overflow-hidden border border-[#3D3280]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    hpPercent > 50
                      ? 'bg-[#3DDC97]'
                      : hpPercent > 25
                      ? 'bg-[#FFC83D]'
                      : 'bg-[#FF5E6C]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-white text-center">
              {monster.name}
            </span>
          </div>
        </div>

        {/* Monster Weakness Hint */}
        <div className="text-xs bg-[#241D52] p-2.5 rounded-xl border border-[#3D3280] text-slate-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#4CC9F0] shrink-0" />
          <span>
            <strong className="text-[#4CC9F0]">Weakness:</strong> {monster.weakness}
          </span>
        </div>

        {/* Combat Phase or Victory */}
        {!isDefeated ? (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white leading-snug">
              {monster.question.questionText}
            </h4>

            {/* Options */}
            <div className="space-y-2">
              {monster.question.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === monster.question.correctOptionIndex;

                let optClass = 'bg-[#1B1740] border-[#3D3280] text-slate-200 hover:bg-[#251F52]';
                if (isAnswered) {
                  if (isCorrect) {
                    optClass = 'bg-[#3DDC97]/20 border-[#3DDC97] text-[#3DDC97] font-bold';
                  } else if (isSelected) {
                    optClass = 'bg-[#FF5E6C]/20 border-[#FF5E6C] text-[#FF5E6C]';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition active:scale-[0.99] ${optClass}`}
                    style={{ borderBottomWidth: '3px' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#0B091F] text-slate-400 text-xs flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Post-answer explanation */}
            {isAnswered && !isDefeated && (
              <div className="p-3 rounded-xl bg-[#2D2466] border border-[#3D3280] text-xs text-slate-300">
                <p className="font-bold text-[#FF5E6C] mb-0.5">Gentle review:</p>
                <p>{monster.question.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          /* Victory Screen */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFC83D]/20 border border-[#FFC83D] flex items-center justify-center text-[#FFC83D] shadow-lg shadow-[#FFC83D]/30">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl text-white">
                Monster Purified!
              </h3>
              <p className="text-xs text-slate-300">
                You conquered the concept! Its trophy is now logged in your Monster Codex.
              </p>
            </div>

            {/* Loot Rewards Box */}
            <div className="inline-flex items-center gap-4 bg-[#1B1740] border border-[#3D3280] px-5 py-2.5 rounded-2xl shadow-inner">
              <div className="flex items-center gap-1.5 font-display text-sm text-[#FFC83D]">
                <Zap className="w-4 h-4 fill-current" />
                <span>+{monster.xpReward || 50} XP</span>
              </div>
              <span className="h-4 w-[1px] bg-slate-700" />
              <div className="flex items-center gap-1.5 font-display text-sm text-[#4CC9F0]">
                <span>💎 +{monster.shardsReward || 30} Shards</span>
              </div>
            </div>

            <div>
              <GameButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleClaimVictory}
                icon={<Sparkles className="w-5 h-5" />}
              >
                Claim rewards & return
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
