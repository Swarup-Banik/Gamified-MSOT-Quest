'use client';

import React, { useState } from 'react';
import { Bug, CheckCircle2, XCircle } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export interface SpotTheBugProps {
  question: {
    id: string;
    questionText: string;
    codeLines: string[]; // Array of strings, each being one code line
    bugLineIndex: number; // 0-indexed line with the bug
    bugFix?: string; // Proposed correction
    explanation?: string;
  };
  isSubmitted: boolean;
  onSubmitBugLine: (selectedLineIndex: number, isCorrect: boolean) => void;
  disabled?: boolean;
}

export function FormatSpotTheBug({
  question,
  isSubmitted,
  onSubmitBugLine,
  disabled = false,
}: SpotTheBugProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const handleLineClick = (idx: number) => {
    if (disabled || isSubmitted) return;
    soundManager.play('tap');
    setSelectedLine(idx);
  };

  const handleConfirm = () => {
    if (disabled || isSubmitted || selectedLine === null) return;
    const isCorrect = selectedLine === question.bugLineIndex;
    onSubmitBugLine(selectedLine, isCorrect);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-[#FF5E6C] font-semibold">
        <Bug className="w-4 h-4" />
        <span>Tap the line of code that contains the bug:</span>
      </div>

      {/* Code Lines Block */}
      <div className="bg-[#151233] border border-[#2D2466] rounded-xl overflow-hidden shadow-inner text-xs sm:text-sm font-mono">
        <div className="divide-y divide-[#231B4D]">
          {question.codeLines.map((line, idx) => {
            const isSelected = selectedLine === idx;
            const isBugLine = question.bugLineIndex === idx;
            const isSelectedCorrect = isSubmitted && isSelected && isBugLine;
            const isSelectedWrong = isSubmitted && isSelected && !isBugLine;
            const isMissedBug = isSubmitted && !isSelected && isBugLine;

            let rowBg = 'hover:bg-[#251F52]/60 cursor-pointer';
            let lineNumColor = 'text-slate-500';

            if (isSelected && !isSubmitted) {
              rowBg = 'bg-[#FFC83D]/15 border-l-4 border-l-[#FFC83D]';
              lineNumColor = 'text-[#FFC83D] font-bold';
            } else if (isSelectedCorrect) {
              rowBg = 'bg-[#3DDC97]/20 border-l-4 border-l-[#3DDC97]';
              lineNumColor = 'text-[#3DDC97] font-bold';
            } else if (isSelectedWrong) {
              rowBg = 'bg-[#FF5E6C]/20 border-l-4 border-l-[#FF5E6C]';
              lineNumColor = 'text-[#FF5E6C] font-bold';
            } else if (isMissedBug) {
              rowBg = 'bg-[#4CC9F0]/15 border-l-4 border-l-[#4CC9F0]';
              lineNumColor = 'text-[#4CC9F0] font-bold';
            }

            return (
              <div
                key={idx}
                onClick={() => handleLineClick(idx)}
                className={`flex items-center transition-colors py-2 px-3 gap-3 ${rowBg}`}
              >
                {/* Line number */}
                <span className={`w-6 text-right select-none ${lineNumColor}`}>
                  {idx + 1}
                </span>

                {/* Code text */}
                <span className="flex-1 text-slate-200 overflow-x-auto whitespace-pre font-mono">
                  {line || ' '}
                </span>

                {/* Status icon */}
                {isSubmitted && (
                  <div className="shrink-0">
                    {isSelectedCorrect && <CheckCircle2 className="w-4 h-4 text-[#3DDC97]" />}
                    {isSelectedWrong && <XCircle className="w-4 h-4 text-[#FF5E6C]" />}
                    {isMissedBug && (
                      <span className="text-[10px] bg-[#4CC9F0]/20 text-[#4CC9F0] px-1.5 py-0.5 rounded font-sans font-bold">
                        Actual Bug
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      {!isSubmitted && (
        <button
          onClick={handleConfirm}
          disabled={selectedLine === null || disabled}
          className="w-full py-3 rounded-xl bg-[#FFC83D] hover:bg-[#FFD466] disabled:opacity-40 disabled:pointer-events-none text-[#1B1740] font-display text-sm tracking-wide transition shadow-lg active:translate-y-0.5"
          style={{ borderBottom: '4px solid #D99818' }}
        >
          {selectedLine !== null ? `Catch bug on line ${selectedLine + 1}` : 'Select a line to inspect'}
        </button>
      )}

      {/* Explanation Banner */}
      {isSubmitted && (
        <div className="p-4 rounded-xl bg-[#2D2466] border border-[#4CC9F0]/30 text-xs text-slate-200 leading-relaxed space-y-2">
          {question.bugFix && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#3DDC97]">Suggested fix:</span>
              <code className="bg-[#151233] px-2 py-0.5 rounded text-indigo-300 font-mono">
                {question.bugFix}
              </code>
            </div>
          )}
          {question.explanation && <p>{question.explanation}</p>}
        </div>
      )}
    </div>
  );
}
