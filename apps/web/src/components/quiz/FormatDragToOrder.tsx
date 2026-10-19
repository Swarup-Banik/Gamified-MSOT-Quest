'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, GripVertical, CheckCircle2, XCircle } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

export interface DragToOrderProps {
  question: {
    id: string;
    questionText: string;
    items: string[]; // Items initially scrambled
    correctOrder: string[]; // Target correct order
    explanation?: string;
  };
  isSubmitted: boolean;
  onSubmitOrder: (orderedItems: string[], isCorrect: boolean) => void;
  disabled?: boolean;
}

export function FormatDragToOrder({
  question,
  isSubmitted,
  onSubmitOrder,
  disabled = false,
}: DragToOrderProps) {
  // Start with shuffled items or provided items
  const [currentList, setCurrentList] = useState<string[]>([]);

  useEffect(() => {
    // If not already shuffled or set, initialize
    if (question.items && question.items.length > 0) {
      setCurrentList([...question.items]);
    }
  }, [question.id]);

  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    if (disabled || isSubmitted) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    soundManager.play('tap');
    const updated = [...currentList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setCurrentList(updated);
  };

  const handleConfirm = () => {
    if (disabled || isSubmitted) return;
    const isCorrect = currentList.every(
      (item, idx) => item === question.correctOrder[idx]
    );
    onSubmitOrder(currentList, isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#4CC9F0] font-medium flex items-center gap-1.5">
        <GripVertical className="w-3.5 h-3.5" />
        Arrange the steps in the correct order:
      </p>

      {/* Ordered List Cards */}
      <div className="space-y-2">
        {currentList.map((item, index) => {
          const isSlotCorrect = isSubmitted && item === question.correctOrder[index];
          const isSlotWrong = isSubmitted && !isSlotCorrect;

          let cardStyle = 'bg-[#2D2466] border-[#3D3280] text-white';
          if (isSlotCorrect) {
            cardStyle = 'bg-[#3DDC97]/20 border-[#3DDC97] text-[#3DDC97]';
          } else if (isSlotWrong) {
            cardStyle = 'bg-[#FF5E6C]/20 border-[#FF5E6C] text-[#FF5E6C]';
          }

          return (
            <div
              key={`${item}-${index}`}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${cardStyle}`}
              style={{ borderBottomWidth: '3px' }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#1B1740] text-slate-300 font-display text-xs flex items-center justify-center border border-[#3D3280]">
                  {index + 1}
                </span>
                <span className="text-sm font-mono leading-snug">{item}</span>
              </div>

              {/* Controls or feedback */}
              {!isSubmitted ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(index, 'UP')}
                    disabled={index === 0 || disabled}
                    className="p-1.5 rounded-lg bg-[#1B1740] hover:bg-[#3D3280] disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition active:scale-95"
                    title="Move up"
                    aria-label={`Move step ${index + 1} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'DOWN')}
                    disabled={index === currentList.length - 1 || disabled}
                    className="p-1.5 rounded-lg bg-[#1B1740] hover:bg-[#3D3280] disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition active:scale-95"
                    title="Move down"
                    aria-label={`Move step ${index + 1} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  {isSlotCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-[#3DDC97]" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#FF5E6C]" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      {!isSubmitted && (
        <button
          onClick={handleConfirm}
          disabled={disabled}
          className="w-full py-3 rounded-xl bg-[#FFC83D] hover:bg-[#FFD466] text-[#1B1740] font-display text-sm tracking-wide transition shadow-lg active:translate-y-0.5 active:border-b-2"
          style={{ borderBottom: '4px solid #D99818' }}
        >
          Confirm step order
        </button>
      )}

      {/* Explanation Banner */}
      {isSubmitted && question.explanation && (
        <div className="p-4 rounded-xl bg-[#2D2466] border border-[#4CC9F0]/30 text-xs text-slate-200 leading-relaxed">
          <p className="font-bold text-[#4CC9F0] mb-1">Order walkthrough:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
