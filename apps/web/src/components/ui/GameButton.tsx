'use client';

import React from 'react';
import { sound } from '../../lib/sound-manager';

export type GameButtonVariant =
  | 'gold'
  | 'plum'
  | 'coral'
  | 'mint'
  | 'sky'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost';

export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function GameButton({
  variant = 'gold',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  onClick,
  className = '',
  disabled = false,
  ...rest
}: GameButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      sound.playTap();
      if (onClick) onClick(e);
    }
  };

  const baseStyles =
    'btn-3d inline-flex items-center justify-center font-display uppercase tracking-wider rounded-2xl select-none cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-realm-gold/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl shadow-button-3d-gold',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-2xl shadow-button-3d-gold',
    lg: 'px-7 py-3.5 text-base gap-2.5 rounded-2xl shadow-button-3d-gold',
    hero: 'px-8 py-5 text-lg gap-3 rounded-3xl shadow-button-3d-gold font-black',
  };

  // Map semantic aliases to tokens
  const resolvedVariant: 'gold' | 'plum' | 'coral' | 'mint' | 'sky' =
    variant === 'primary'
      ? 'gold'
      : variant === 'secondary' || variant === 'ghost'
      ? 'plum'
      : variant === 'danger'
      ? 'coral'
      : variant;

  const variantStyles = {
    gold: 'bg-realm-gold text-realm-twilight shadow-button-3d-gold hover:bg-[#FFD25E] border-t border-white/30',
    plum: 'bg-realm-plum text-white shadow-button-3d-plum hover:bg-[#382E7A] border border-white/10',
    coral: 'bg-realm-coral text-white shadow-button-3d-coral hover:bg-[#FF7380] border-t border-white/20',
    mint: 'bg-realm-mint text-realm-twilight shadow-button-3d-mint hover:bg-[#52E4A6] border-t border-white/30 font-bold',
    sky: 'bg-realm-sky text-realm-twilight shadow-button-3d-sky hover:bg-[#68D3F3] border-t border-white/30 font-bold',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[resolvedVariant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
