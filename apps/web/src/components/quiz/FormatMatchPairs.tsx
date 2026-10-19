'use client';

import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchPairsProps {
  question: {
    id: string;
    questionText: string;
    pairs: MatchPair[]; // The ground truth pairings
    explanation?: string;
  };
  isSubmitted: boolean;
  onSubmitPairs: (matches: Record<string, string>, isCorrect: boolean) => void;
  disabled?: boolean;
}

export function FormatMatchPairs({
  question,
  isSubmitted,
  onSubmitPairs,
  disabled = false,
}: MatchPairsProps) {
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);

  // Selected left item waiting for partner
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Map of left item -> paired right item
  const [matches, setMatches] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question.pairs) {
      // Left stays in order, Right gets shuffled
      const lefts = question.pairs.map(p => p.left);
      const rights = [...question.pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
      setLeftItems(lefts);
      setRightItems(rights);
      setMatches({});
      setSelectedLeft(null);
    }
  }, [question.id]);

  const pairColors = [
    'border-[#4CC9F0] text-[#4CC9F0] bg-[#4CC9F0]/10',
    'border-[#FFC83D] text-[#FFC83D] bg-[#FFC83D]/10',
    'border-[#B26CFF] text-[#B26CFF] bg-[#B26CFF]/10',
    'border-[#3DDC97] text-[#3DDC97] bg-[#3DDC97]/10',
    'border-[#FF8A3D] text-[#FF8A3D] bg-[#FF8A3D]/10',
  ];

  const getPairIndex = (left: string): number => {
    return leftItems.indexOf(left) % pairColors.length;
  };

  const handleLeftClick = (left: string) => {
    if (disabled || isSubmitted) return;
    soundManager.play('tap');

    // If already matched, clicking it unlinks it
    if (matches[left]) {
      const updated = { ...matches };
      delete updated[left];
      setMatches(updated);
      setSelectedLeft(null);
      return;
    }

    if (selectedLeft === left) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(left);
    }
  };

  const handleRightClick = (right: string) => {
    if (disabled || isSubmitted) return;

    // Check if this right item is already matched
    const alreadyMatchedLeft = Object.keys(matches).find(k => matches[k] === right);

    if (alreadyMatchedLeft) {
      soundManager.play('tap');
      const updated = { ...matches };
      delete updated[alreadyMatchedLeft];
      setMatches(updated);
      return;
    }

    if (selectedLeft) {
      soundManager.play('tap');
      setMatches(prev => ({ ...prev, [selectedLeft]: right }));
      setSelectedLeft(null);
    }
  };

  const handleReset = () => {
    if (disabled || isSubmitted) return;
    setMatches({});
    setSelectedLeft(null);
  };

  const handleVerify = () => {
    if (disabled || isSubmitted) return;

    // Check truth
    let allCorrect = true;
    for (const pair of question.pairs) {
      if (matches[pair.left] !== pair.right) {
        allCorrect = false;
        break;
      }
    }
    onSubmitPairs(matches, allCorrect);
  };

  const isAllMatched = leftItems.length > 0 && Object.keys(matches).length === leftItems.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Tap a card on the left, then tap its match on the right:</span>
        {!isSubmitted && Object.keys(matches).length > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset pairs</span>
          </button>
        )}
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2">
          {leftItems.map(left => {
            const isMatched = !!matches[left];
            const isSelected = selectedLeft === left;
            const pairIdx = getPairIndex(left);
            const colorClass = isMatched ? pairColors[pairIdx] : '';

            const isCorrectPair =
              isSubmitted &&
              matches[left] &&
              question.pairs.find(p => p.left === left)?.right === matches[left];

            return (
              <button
                key={left}
                onClick={() => handleLeftClick(left)}
                disabled={disabled || isSubmitted}
                style={{ borderBottomWidth: '3px' }}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#FFC83D] bg-[#FFC83D]/20 text-[#FFC83D] ring-2 ring-[#FFC83D]/50'
                    : isMatched
                    ? `${colorClass}`
                    : 'bg-[#2D2466] border-[#3D3280] text-slate-200 hover:bg-[#382D7F]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{left}</span>
                  {isMatched && <Link2 className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {rightItems.map(right => {
            const matchedLeft = Object.keys(matches).find(k => matches[k] === right);
            const isMatched = !!matchedLeft;
            const pairIdx = matchedLeft ? getPairIndex(matchedLeft) : 0;
            const colorClass = isMatched ? pairColors[pairIdx] : '';

            const isCorrectPair =
              isSubmitted &&
              matchedLeft &&
              question.pairs.find(p => p.left === matchedLeft)?.right === right;

            return (
              <button
                key={right}
                onClick={() => handleRightClick(right)}
                disabled={disabled || isSubmitted}
                style={{ borderBottomWidth: '3px' }}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                  isMatched
                    ? `${colorClass}`
                    : 'bg-[#2D2466] border-[#3D3280] text-slate-200 hover:bg-[#382D7F]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{right}</span>
                  {isSubmitted && isMatched && (
                    isCorrectPair ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3DDC97] shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#FF5E6C] shrink-0" />
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <button
          onClick={handleVerify}
          disabled={!isAllMatched || disabled}
          className="w-full py-3 rounded-xl bg-[#FFC83D] hover:bg-[#FFD466] disabled:opacity-40 disabled:pointer-events-none text-[#1B1740] font-display text-sm tracking-wide transition shadow-lg active:translate-y-0.5"
          style={{ borderBottom: '4px solid #D99818' }}
        >
          {isAllMatched ? 'Lock in paired concepts' : `Match all ${leftItems.length} pairs (${Object.keys(matches).length}/${leftItems.length})`}
        </button>
      )}

      {/* Explanation Banner */}
      {isSubmitted && question.explanation && (
        <div className="p-4 rounded-xl bg-[#2D2466] border border-[#4CC9F0]/30 text-xs text-slate-200 leading-relaxed">
          <p className="font-bold text-[#4CC9F0] mb-1">Concept associations:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
