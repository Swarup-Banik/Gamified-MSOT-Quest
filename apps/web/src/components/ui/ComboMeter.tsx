'use client';

import React from 'react';
import { Flame } from 'lucide-react';

export interface ComboMeterProps {
  comboCount?: number;
  combo?: number;
}

export function ComboMeter({ comboCount, combo }: ComboMeterProps) {
  const activeCount = comboCount ?? combo ?? 0;
  if (activeCount <= 1) return null;

  const multiplier = Math.min(5, activeCount);
  const isMax = activeCount >= 5;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg transition-transform animate-bounce ${
        isMax
          ? 'bg-gradient-to-r from-realm-gold to-realm-coral border-white text-realm-twilight font-black'
          : 'bg-realm-plum border-realm-gold/40 text-realm-gold font-bold'
      }`}
      aria-label={`Combo streak multiplier: ${multiplier}x`}
    >
      <Flame className={`w-4 h-4 ${isMax ? 'text-realm-twilight' : 'text-realm-gold'} animate-pulse`} />
      <span className="font-display text-sm tracking-wide">
        {multiplier}× COMBO {isMax ? 'MAX!' : 'STREAK'}
      </span>
    </div>
  );
}
