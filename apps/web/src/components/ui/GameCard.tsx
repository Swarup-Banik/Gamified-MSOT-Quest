'use client';

import React from 'react';

export interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'quiz' | 'reward' | 'battle' | 'monster';
  purpose?: 'standard' | 'quiz' | 'reward' | 'battle' | 'monster' | string;
  children: React.ReactNode;
  glow?: boolean;
}

export function GameCard({
  variant = 'standard',
  purpose,
  children,
  glow = false,
  className = '',
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

  return (
    <div className={`${variantClasses[activeVariant] || variantClasses.standard} ${glowClass} ${className}`} {...rest}>
      {children}
    </div>
  );
}
