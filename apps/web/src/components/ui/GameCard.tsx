'use client';

import React from 'react';
import { Pressable } from './Pressable';
import { motionManager } from '../../lib/motion-manager';

export interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'quiz' | 'reward' | 'battle' | 'monster';
  purpose?: 'standard' | 'quiz' | 'reward' | 'battle' | 'monster' | string;
  children: React.ReactNode;
  glow?: boolean;
  interactive?: boolean;
  disabledReason?: string;
}

export function GameCard({
  variant = 'standard',
  purpose,
  children,
  glow = false,
  interactive = false,
  onClick,
  className = '',
  disabledReason,
  ...rest
}: GameCardProps) {
  const activeVariant: 'standard' | 'quiz' | 'reward' | 'battle' | 'monster' =
    (purpose as any) || variant || 'standard';

  const variantClasses = {
    standard:
      'bg-realm-plum/90 border-2 border-white/10 rounded-2xl p-5 shadow-lg shadow-black/25',
    quiz: 'card-quiz p-6 md:p-8',
    reward: 'card-reward p-6 glow-gold',
    battle: 'card-battle p-6',
    monster: 'card-monster p-6 glow-coral',
  };

  const glowClass = glow ? 'ring-2 ring-realm-gold/50' : '';
  const isClickable = interactive || !!onClick;

  if (isClickable) {
    return (
      <Pressable
        as="div"
        role="secondary"
        onClick={onClick as any}
        disabledReason={disabledReason}
        className={`${variantClasses[activeVariant] || variantClasses.standard} ${glowClass} transition-shadow hover:shadow-xl ${className}`}
        {...(rest as any)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <div
      className={`${variantClasses[activeVariant] || variantClasses.standard} ${glowClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
