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
  // Shape glyphs & palettes per option key
  const optionKeys = [
    { glyph: '▲', shape: 'Triangle', label: 'A', bg: 'bg-[#FF3D9A]', border: '#990B50', glow: 'shadow-glow-magenta' },
    { glyph: '●', shape: 'Circle', label: 'B', bg: 'bg-[#22E3FF]', border: '#088194', glow: 'shadow-glow-cyan' },
    { glyph: '■', shape: 'Square', label: 'C', bg: 'bg-[#FFD23F]', border: '#C47905', glow: 'shadow-glow-yellow' },
    { glyph: '◆', shape: 'Diamond', label: 'D', bg: 'bg-[#7CF36B]', border: '#4FA841', glow: 'shadow-glow-lime' },
  ];

  const handleClick = (index: number) => {
    if (disabled || isSubmitted) return;
    soundManager.play('tap');
    onSelect(index);
  };

  return (
    <div className="space-y-4">
      {/* Code Snippet if present */}
      {question.codeSnippet && (
        <div className="bg-[#15062C] border-2 border-white/15 rounded-2xl p-4 text-xs font-mono text-[#22E3FF] overflow-x-auto shadow-inner leading-relaxed">
          <pre>{question.codeSnippet}</pre>
        </div>
      )}

      {/* 4 Chunky 3D Arcade Option Keys */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {question.options.map((option, idx) => {
          const keyMeta = optionKeys[idx % optionKeys.length];
          const isSelected = selectedOption === idx;
          const isCorrect = isSubmitted && question.correctOptionIndex === idx;
          const isWrong = isSubmitted && isSelected && question.correctOptionIndex !== idx;

          let cardClasses = 'bg-[#24104F]/90 border-2 border-white/20 text-[#FFF8E7] hover:border-white/50';
          let borderBottomColor = '#15062C';
          let glowShadow = '';

          if (isCorrect) {
            cardClasses = 'bg-[#7CF36B]/25 border-2 border-[#7CF36B] text-[#7CF36B] font-bold';
            borderBottomColor = '#4FA841';
            glowShadow = 'shadow-glow-lime';
          } else if (isWrong) {
            cardClasses = 'bg-[#FF4D5E]/25 border-2 border-[#FF4D5E] text-[#FF4D5E] animate-wiggle';
            borderBottomColor = '#990B50';
            glowShadow = 'shadow-glow-coral';
          } else if (isSelected && !isSubmitted) {
            cardClasses = 'bg-[#FFD23F]/25 border-2 border-[#FFD23F] text-[#FFD23F]';
            borderBottomColor = '#C47905';
            glowShadow = 'shadow-glow-yellow';
          } else if (isSubmitted) {
            cardClasses = 'bg-[#1C0B40]/60 border border-white/10 text-slate-400 opacity-60';
          }

          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              disabled={disabled || isSubmitted}
              style={{
                borderBottomWidth: '5px',
                borderBottomColor: borderBottomColor,
              }}
              className={`w-full text-left p-4 rounded-2xl flex items-center justify-between gap-3 font-medium text-sm transition-all active:translate-y-1 active:border-b-2 cursor-pointer ${cardClasses} ${glowShadow}`}
            >
              <div className="flex items-center gap-3">
                {/* 3D Geometric Shape Key Emblem */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold text-[#24104F] shadow-md shrink-0 ${keyMeta.bg}`}
                  style={{ borderBottom: `3px solid ${keyMeta.border}` }}
                >
                  <span className="text-base" aria-hidden="true">{keyMeta.glyph}</span>
                </div>
                <span className="leading-snug">{option}</span>
              </div>

              {isSubmitted && (
                <div className="shrink-0">
                  {isCorrect && <CheckCircle2 className="w-6 h-6 text-[#7CF36B]" />}
                  {isWrong && <XCircle className="w-6 h-6 text-[#FF4D5E]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isSubmitted && question.explanation && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 ${
            selectedOption === question.correctOptionIndex
              ? 'bg-[#7CF36B]/15 border-[#7CF36B] text-[#7CF36B]'
              : 'bg-[#24104F] border-[#22E3FF]/50 text-[#FFF8E7]'
          }`}
        >
          <div className="flex items-center gap-2 font-display text-sm mb-1 text-[#22E3FF]">
            <HelpCircle className="w-4 h-4" />
            <span>Mastery explanation</span>
          </div>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
