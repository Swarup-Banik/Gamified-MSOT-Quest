'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Flame,
  Award,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { FormatMultipleChoice } from './FormatMultipleChoice';
import { FormatDragToOrder } from './FormatDragToOrder';
import { FormatMatchPairs } from './FormatMatchPairs';
import { FormatFillBlank } from './FormatFillBlank';
import { FormatSpotTheBug } from './FormatSpotTheBug';
import { ComboMeter } from '../ui/ComboMeter';
import { GameButton } from '../ui/GameButton';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { MonsterAvatar } from '../assets/MonsterAvatar';
import { useReward } from '../../lib/use-reward';
import { soundManager } from '../../lib/sound-manager';

export type QuestionFormatType =
  | 'MULTIPLE_CHOICE'
  | 'DRAG_TO_ORDER'
  | 'MATCH_PAIRS'
  | 'FILL_BLANK'
  | 'SPOT_THE_BUG';

export interface QuizQuestion {
  id: string;
  format?: QuestionFormatType;
  questionText: string;
  explanation?: string;
  hint?: string;
  // Multiple choice
  options?: string[];
  correctOptionIndex?: number;
  codeSnippet?: string;
  // Drag to order
  items?: string[];
  correctOrder?: string[];
  // Match pairs
  pairs?: { left: string; right: string }[];
  // Fill blank
  codeTemplate?: string;
  correctTokens?: string[];
  tokenBank?: string[];
  // Spot bug
  codeLines?: string[];
  bugLineIndex?: number;
  bugFix?: string;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete: (summary: {
    score: number;
    total: number;
    xpEarned: number;
    maxCombo: number;
    answers: any[];
  }) => void;
  onExit?: () => void;
  allowBlitz?: boolean;
}

export function QuizEngine({
  questions,
  onComplete,
  onExit,
  allowBlitz = false,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [floatingXp, setFloatingXp] = useState<number | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [monsterAppeared, setMonsterAppeared] = useState<string | null>(null);

  // Blitz mode timer
  const [blitzEnabled, setBlitzEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rewards hook
  const { triggerCorrect, triggerGentleWrong, triggerLevelUp, triggerCombo } = useReward();

  const currentQ = questions[currentIndex] || null;
  const questionFormat: QuestionFormatType = currentQ?.format || 'MULTIPLE_CHOICE';

  // Handle Blitz countdown
  useEffect(() => {
    if (!blitzEnabled || isAnswerSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(25);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, blitzEnabled, isAnswerSubmitted]);

  const handleTimeOut = () => {
    handleAnswerResult(false, { timedOut: true });
  };

  const handleAnswerResult = (isCorrect: boolean, metadata?: any) => {
    setIsAnswerSubmitted(true);
    setIsCurrentCorrect(isCorrect);

    let nextCombo = isCorrect ? combo + 1 : 0;
    setCombo(nextCombo);
    if (nextCombo > maxCombo) setMaxCombo(nextCombo);

    if (isCorrect) {
      const baseXp = 15;
      const multiplier = nextCombo >= 5 ? 2 : nextCombo >= 3 ? 1.5 : 1;
      const earned = Math.round(baseXp * multiplier);
      setTotalXp(prev => prev + earned);
      setFloatingXp(earned);
      setTimeout(() => setFloatingXp(null), 1200);

      if (nextCombo >= 3) {
        triggerCombo(nextCombo);
      } else {
        triggerCorrect();
      }
      setMonsterAppeared(null);
    } else {
      triggerGentleWrong();
      // Reveal a Mistake Monster hiding in this topic
      setMonsterAppeared(currentQ.questionText.slice(0, 30));
    }

    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQ.id,
        isCorrect,
        combo: nextCombo,
        metadata,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswerSubmitted(false);
      setIsCurrentCorrect(false);
    } else {
      // Quiz finished
      triggerLevelUp();
      const score = answers.filter(a => a.isCorrect).length + (isCurrentCorrect ? 1 : 0);
      onComplete({
        score,
        total: questions.length,
        xpEarned: totalXp,
        maxCombo,
        answers,
      });
    }
  };

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-slate-400">
        No quest questions available.
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top Quiz HUD: Progress, Combo, XP, Blitz Toggle */}
      <div className="bg-[#2D2466] border border-[#3D3280] rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3">
        {/* Progress Bar & Counter */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display text-[#FFC83D] tracking-wide">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="font-mono text-slate-300 font-bold">
              +{totalXp} XP
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#1B1740] rounded-full overflow-hidden p-0.5 border border-[#3D3280]/60">
            <div
              className="h-full bg-gradient-to-r from-[#FFC83D] to-[#FF8A3D] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Combo Meter Component */}
        <div className="shrink-0">
          <ComboMeter combo={combo} />
        </div>

        {/* Blitz Ring Timer Toggle (Optional) */}
        {allowBlitz && (
          <button
            onClick={() => setBlitzEnabled(!blitzEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
              blitzEnabled
                ? 'bg-[#FF5E6C]/20 border-[#FF5E6C] text-[#FF5E6C]'
                : 'bg-[#1B1740] border-[#3D3280] text-slate-400'
            }`}
            title="Toggle timed Blitz challenge"
          >
            <Clock className="w-3.5 h-3.5" />
            {blitzEnabled ? `${timeLeft}s` : 'Blitz'}
          </button>
        )}
      </div>

      {/* Main Question Card */}
      <div className="card-quiz p-5 sm:p-6 space-y-5 relative overflow-hidden">
        {/* Floating XP Reward Burst */}
        {floatingXp && (
          <div className="absolute top-6 right-6 z-20 animate-[floatUp_1s_ease-out_forwards] pointer-events-none">
            <div className="bg-[#FFC83D] text-[#1B1740] font-display text-base px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
              <Zap className="w-4 h-4 fill-current" />
              <span>+{floatingXp} XP!</span>
            </div>
          </div>
        )}

        {/* Question Heading */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4CC9F0] bg-[#4CC9F0]/10 px-2.5 py-0.5 rounded-full border border-[#4CC9F0]/30">
              {questionFormat.replace(/_/g, ' ')}
            </span>

            {/* Companion Idle Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <CompanionAvatar
                species="FOX"
                mood={isAnswerSubmitted ? (isCurrentCorrect ? 'CHEERING' : 'SURPRISED') : 'HAPPY'}
                size={28}
              />
              <span className="text-[11px]">Kitsune</span>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
            {currentQ.questionText}
          </h2>
        </div>

        {/* Format-Specific Interactive Body */}
        {questionFormat === 'MULTIPLE_CHOICE' && (
          <FormatMultipleChoice
            question={{
              id: currentQ.id,
              questionText: currentQ.questionText,
              codeSnippet: currentQ.codeSnippet,
              options: currentQ.options || [],
              correctOptionIndex: currentQ.correctOptionIndex || 0,
              explanation: currentQ.explanation,
              hint: currentQ.hint,
            }}
            selectedOption={answers[currentIndex]?.metadata?.selectedOption ?? null}
            isSubmitted={isAnswerSubmitted}
            onSelect={idx => handleAnswerResult(idx === currentQ.correctOptionIndex, { selectedOption: idx })}
          />
        )}

        {questionFormat === 'DRAG_TO_ORDER' && (
          <FormatDragToOrder
            question={{
              id: currentQ.id,
              questionText: currentQ.questionText,
              items: currentQ.items || [],
              correctOrder: currentQ.correctOrder || [],
              explanation: currentQ.explanation,
            }}
            isSubmitted={isAnswerSubmitted}
            onSubmitOrder={(ordered, isCorrect) => handleAnswerResult(isCorrect, { ordered })}
          />
        )}

        {questionFormat === 'MATCH_PAIRS' && (
          <FormatMatchPairs
            question={{
              id: currentQ.id,
              questionText: currentQ.questionText,
              pairs: currentQ.pairs || [],
              explanation: currentQ.explanation,
            }}
            isSubmitted={isAnswerSubmitted}
            onSubmitPairs={(matches, isCorrect) => handleAnswerResult(isCorrect, { matches })}
          />
        )}

        {questionFormat === 'FILL_BLANK' && (
          <FormatFillBlank
            question={{
              id: currentQ.id,
              questionText: currentQ.questionText,
              codeTemplate: currentQ.codeTemplate || '',
              correctTokens: currentQ.correctTokens || [],
              tokenBank: currentQ.tokenBank || [],
              explanation: currentQ.explanation,
            }}
            isSubmitted={isAnswerSubmitted}
            onSubmitTokens={(tokens, isCorrect) => handleAnswerResult(isCorrect, { tokens })}
          />
        )}

        {questionFormat === 'SPOT_THE_BUG' && (
          <FormatSpotTheBug
            question={{
              id: currentQ.id,
              questionText: currentQ.questionText,
              codeLines: currentQ.codeLines || [],
              bugLineIndex: currentQ.bugLineIndex || 0,
              bugFix: currentQ.bugFix,
              explanation: currentQ.explanation,
            }}
            isSubmitted={isAnswerSubmitted}
            onSubmitBugLine={(lineIdx, isCorrect) => handleAnswerResult(isCorrect, { lineIdx })}
          />
        )}

        {/* Mistake Monster Encounter Nudge (Gentle, never harsh) */}
        {isAnswerSubmitted && !isCurrentCorrect && (
          <div className="p-3.5 rounded-xl bg-[#FF5E6C]/10 border border-[#FF5E6C]/30 flex items-center gap-3 animate-in fade-in duration-300">
            <MonsterAvatar family="OFF_BY_ONE" tier="COMMON" size={44} isRoaring />
            <div className="text-xs">
              <span className="font-bold text-[#FF5E6C]">A Mistake Monster crept into this topic!</span>
              <p className="text-slate-300 mt-0.5">
                No penalty. You can challenge it to a turn-based revenge battle in your Monster Codex to reclaim mastery!
              </p>
            </div>
          </div>
        )}

        {/* Advance Next Button */}
        {isAnswerSubmitted && (
          <div className="pt-2">
            <GameButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNext}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              {currentIndex + 1 < questions.length ? 'Next challenge' : 'Complete quest & see loot'}
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
}
