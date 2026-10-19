'use client';

import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export interface MultipleChoiceProps {
  question: {
    id: string;
    questionText: string;
    codeSnippet?: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    hint?: string;
  };
  selectedOption: number | null;
  isSubmitted: boolean;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export function FormatMultipleChoice({
  question,
  selectedOption,
  isSubmitted,
  onSelect,
  disabled = false,
}: MultipleChoiceProps) {
  const letters = ['A', 'B', 'C', 'D', 'E'];

  const handleClick = (index: number) => {
    if (disabled || isSubmitted) return;
    soundManager.play('tap');
    onSelect(index);
  };

  return (
    <div className="space-y-4">
      {/* Code Snippet if present */}
      {question.codeSnippet && (
        <div className="bg-[#151233] border border-[#2D2466] rounded-xl p-3.5 text-xs font-mono text-indigo-200 overflow-x-auto shadow-inner">
          <pre>{question.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = isSubmitted && question.correctOptionIndex === idx;
          const isWrong = isSubmitted && isSelected && question.correctOptionIndex !== idx;

          let btnClass = 'bg-[#2D2466] border-[#3D3280] text-white hover:bg-[#382D7F]';
          let borderBottomColor = '#1F1849';

          if (isCorrect) {
            btnClass = 'bg-[#3DDC97]/20 border-[#3DDC97] text-[#3DDC97] shadow-lg shadow-[#3DDC97]/20';
            borderBottomColor = '#2BAE75';
          } else if (isWrong) {
            btnClass = 'bg-[#FF5E6C]/20 border-[#FF5E6C] text-[#FF5E6C] animate-[wiggle_0.3s_ease-in-out]';
            borderBottomColor = '#D43846';
          } else if (isSelected && !isSubmitted) {
            btnClass = 'bg-[#FFC83D]/20 border-[#FFC83D] text-[#FFC83D]';
            borderBottomColor = '#D99818';
          } else if (isSubmitted) {
            btnClass = 'bg-[#241D52] border-[#2F2669] text-slate-400 opacity-60';
          }

          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={disabled || isSubmitted}
              style={{
                borderBottomWidth: '4px',
                borderBottomColor: borderBottomColor,
              }}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 font-medium text-sm transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs border ${
                    isSelected || isCorrect
                      ? 'bg-[#FFC83D] text-[#1B1740] border-[#FFC83D] font-bold'
                      : 'bg-[#1B1740] text-slate-300 border-[#3D3280]'
                  }`}
                >
                  {letters[idx]}
                </span>
                <span className="leading-snug">{option}</span>
              </div>

              {isSubmitted && (
                <div>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#3DDC97] shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 text-[#FF5E6C] shrink-0" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isSubmitted && question.explanation && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 ${
            selectedOption === question.correctOptionIndex
              ? 'bg-[#3DDC97]/10 border-[#3DDC97]/40 text-[#3DDC97]'
              : 'bg-[#2D2466] border-[#4CC9F0]/40 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1 text-sm">
            <HelpCircle className="w-4 h-4 text-[#4CC9F0]" />
            <span>Mastery explanation</span>
          </div>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
