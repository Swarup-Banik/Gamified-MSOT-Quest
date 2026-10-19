'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export interface FillBlankProps {
  question: {
    id: string;
    questionText: string;
    codeTemplate: string; // Text containing {{BLANK_0}}, {{BLANK_1}}, etc.
    correctTokens: string[]; // Correct values in order
    tokenBank: string[]; // Set of candidate tokens to tap
    explanation?: string;
  };
  isSubmitted: boolean;
  onSubmitTokens: (userTokens: (string | null)[], isCorrect: boolean) => void;
  disabled?: boolean;
}

export function FormatFillBlank({
  question,
  isSubmitted,
  onSubmitTokens,
  disabled = false,
}: FillBlankProps) {
  const blankCount = question.correctTokens ? question.correctTokens.length : 1;
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>(
    Array(blankCount).fill(null)
  );
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  useEffect(() => {
    setFilledSlots(Array(blankCount).fill(null));
    if (question.tokenBank) {
      setAvailableTokens([...question.tokenBank]);
    }
  }, [question.id]);

  const handlePickToken = (token: string, tokenIndex: number) => {
    if (disabled || isSubmitted) return;
    // Find first empty slot
    const firstEmptyIndex = filledSlots.findIndex(s => s === null);
    if (firstEmptyIndex === -1) return; // All slots full

    soundManager.play('tap');

    const nextSlots = [...filledSlots];
    nextSlots[firstEmptyIndex] = token;
    setFilledSlots(nextSlots);

    const nextAvailable = [...availableTokens];
    nextAvailable.splice(tokenIndex, 1);
    setAvailableTokens(nextAvailable);
  };

  const handleRemoveSlot = (slotIndex: number) => {
    if (disabled || isSubmitted) return;
    const token = filledSlots[slotIndex];
    if (!token) return;

    soundManager.play('tap');

    const nextSlots = [...filledSlots];
    nextSlots[slotIndex] = null;
    setFilledSlots(nextSlots);

    setAvailableTokens(prev => [...prev, token]);
  };

  const handleReset = () => {
    if (disabled || isSubmitted) return;
    setFilledSlots(Array(blankCount).fill(null));
    setAvailableTokens([...question.tokenBank]);
  };

  const handleConfirm = () => {
    if (disabled || isSubmitted) return;
    const isCorrect =
      filledSlots.every(
        (token, idx) => token === question.correctTokens[idx]
      );
    onSubmitTokens(filledSlots, isCorrect);
  };

  const isComplete = filledSlots.every(s => s !== null);

  // Render the template with interactive slots
  const renderTemplateParts = () => {
    const parts = question.codeTemplate.split(/\{\{BLANK_(\d+)\}\}/g);
    // parts alternating between text and blank indices
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Normal text chunk
        elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
      } else {
        // Blank index
        const blankIdx = parseInt(parts[i], 10);
        const token = filledSlots[blankIdx];
        const isSlotCorrect =
          isSubmitted && token === question.correctTokens[blankIdx];
        const isSlotWrong = isSubmitted && !isSlotCorrect;

        let slotClass =
          'border-[#3D3280] bg-[#1B1740] text-slate-400 border-dashed';
        if (token) {
          slotClass = 'border-[#FFC83D] bg-[#FFC83D]/20 text-[#FFC83D] font-bold border-solid';
        }
        if (isSlotCorrect) {
          slotClass = 'border-[#3DDC97] bg-[#3DDC97]/20 text-[#3DDC97] font-bold border-solid';
        } else if (isSlotWrong) {
          slotClass = 'border-[#FF5E6C] bg-[#FF5E6C]/20 text-[#FF5E6C] font-bold border-solid';
        }

        elements.push(
          <button
            key={`blank-${blankIdx}`}
            type="button"
            onClick={() => handleRemoveSlot(blankIdx)}
            disabled={disabled || isSubmitted}
            className={`inline-flex items-center gap-1 mx-1 px-3 py-1 rounded-lg border text-xs sm:text-sm transition-all active:scale-95 ${slotClass}`}
          >
            <span>{token || '____'}</span>
            {isSubmitted && (
              isSlotCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3DDC97]" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-[#FF5E6C]" />
              )
            )}
          </button>
        );
      }
    }
    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Code Display Area */}
      <div className="bg-[#151233] border border-[#2D2466] rounded-xl p-4 font-mono text-xs sm:text-sm text-indigo-100 leading-relaxed overflow-x-auto shadow-inner">
        <pre className="whitespace-pre-wrap">{renderTemplateParts()}</pre>
      </div>

      {/* Token Bank */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Tap a token chip to fill the next slot:</span>
          {!isSubmitted && filledSlots.some(s => s !== null) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear slots</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTokens.map((token, idx) => (
            <button
              key={`${token}-${idx}`}
              onClick={() => handlePickToken(token, idx)}
              disabled={disabled || isSubmitted || isComplete}
              style={{ borderBottomWidth: '3px', borderBottomColor: '#1F1849' }}
              className="px-3.5 py-2 rounded-xl bg-[#2D2466] hover:bg-[#382D7F] border border-[#3D3280] text-white text-xs sm:text-sm font-mono font-semibold transition active:translate-y-0.5"
            >
              {token}
            </button>
          ))}
          {availableTokens.length === 0 && !isSubmitted && (
            <span className="text-xs text-slate-500 italic">All tokens slotted! Ready to check.</span>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      {!isSubmitted && (
        <button
          onClick={handleConfirm}
          disabled={!isComplete || disabled}
          className="w-full py-3 rounded-xl bg-[#FFC83D] hover:bg-[#FFD466] disabled:opacity-40 disabled:pointer-events-none text-[#1B1740] font-display text-sm tracking-wide transition shadow-lg active:translate-y-0.5"
          style={{ borderBottom: '4px solid #D99818' }}
        >
          {isComplete ? 'Confirm completed code' : `Fill remaining blank (${filledSlots.filter(s => s !== null).length}/${blankCount})`}
        </button>
      )}

      {/* Explanation Banner */}
      {isSubmitted && question.explanation && (
        <div className="p-4 rounded-xl bg-[#2D2466] border border-[#4CC9F0]/30 text-xs text-slate-200 leading-relaxed">
          <p className="font-bold text-[#4CC9F0] mb-1">Syntax & logic rationale:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
