'use client';

import React, { useRef, useState, useCallback, useId } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { sound, PressableRole } from '../../lib/sound-manager';
import { motionSprings } from '../../lib/motion-tokens';
import { motionManager } from '../../lib/motion-manager';

export interface RippleEffect {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface SparkleEffect {
  id: number;
  x: number;
  y: number;
}

export interface PressableProps extends React.HTMLAttributes<HTMLElement> {
  role?: PressableRole;
  as?: 'button' | 'div' | 'a' | 'span';
  disabled?: boolean;
  disabledReason?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

const roleColors: Record<PressableRole, string> = {
  primary: '#FFD23F',
  secondary: '#22E3FF',
  danger: '#FF4D5E',
  success: '#3DDC97',
  navigation: '#B26CFF',
  toggle: '#FFD23F',
  close: '#9AA3B2',
  disabled: '#6B7280',
};

export const Pressable = React.forwardRef<HTMLElement, PressableProps>(
  (
    {
      role = 'primary',
      as = 'button',
      disabled = false,
      disabledReason,
      onClick,
      children,
      className = '',
      title,
      'aria-label': ariaLabel,
      tabIndex = 0,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLElement | null>(null);
    const [ripples, setRipples] = useState<RippleEffect[]>([]);
    const [sparkles, setSparkles] = useState<SparkleEffect[]>([]);
    const [isShaking, setIsShaking] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Calculate stereo pan (-1 to +1) based on screen position
    const getStereoPan = useCallback((): number => {
      if (typeof window === 'undefined' || !internalRef.current) return 0;
      const rect = internalRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const screenWidth = window.innerWidth || 1000;
      return (centerX / screenWidth) * 2 - 1; // -1 on left edge, 0 center, +1 right edge
    }, []);

    const triggerRipple = useCallback((clientX: number, clientY: number, color: string) => {
      if (!internalRef.current || motionManager.getSensoryMode() === 'MINIMAL') return;
      const rect = internalRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev.slice(-3), { id, x, y, color }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 450);
    }, []);

    const triggerSparkles = useCallback((clientX: number, clientY: number) => {
      if (!internalRef.current || motionManager.getSensoryMode() === 'MINIMAL') return;
      const rect = internalRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const id = Date.now() + Math.random();

      setSparkles((prev) => [...prev.slice(-2), { id, x, y }]);
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== id));
      }, 500);
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        sound.playPressTick('disabled', getStereoPan());
        setIsShaking(true);
        setShowTooltip(true);
        setTimeout(() => setIsShaking(false), 300);
        setTimeout(() => setShowTooltip(false), 2200);
        return;
      }

      const pan = getStereoPan();
      sound.playPressTick(role, pan);
      triggerRipple(e.clientX, e.clientY, roleColors[role]);
      triggerSparkles(e.clientX, e.clientY);

      if (onClick) onClick(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (disabled) {
          sound.playPressTick('disabled', getStereoPan());
          setIsShaking(true);
          setShowTooltip(true);
          setTimeout(() => setIsShaking(false), 300);
          setTimeout(() => setShowTooltip(false), 2200);
          return;
        }

        const rect = internalRef.current?.getBoundingClientRect();
        const clientX = rect ? rect.left + rect.width / 2 : 0;
        const clientY = rect ? rect.top + rect.height / 2 : 0;

        const pan = getStereoPan();
        sound.playPressTick(role, pan);
        triggerRipple(clientX, clientY, roleColors[role]);
        triggerSparkles(clientX, clientY);

        if (onClick) onClick(e as unknown as React.MouseEvent<HTMLElement>);
      }
    };

    const sensoryMode = motionManager.getSensoryMode();
    const allowMotion = sensoryMode !== 'MINIMAL';

    const ElementComponent = as === 'button' ? motion.button : motion.div;

    return (
      <ElementComponent
        ref={(node: any) => {
          internalRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        data-pressable="true"
        data-pressable-role={role}
        data-disabled={disabled ? 'true' : undefined}
        tabIndex={disabled ? -1 : tabIndex}
        aria-label={ariaLabel || title}
        aria-disabled={disabled}
        title={title}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        whileTap={
          allowMotion && !disabled
            ? { scale: 0.96, transition: motionSprings.snappy }
            : undefined
        }
        whileHover={
          allowMotion && !disabled
            ? { scale: 1.02, y: -1, transition: motionSprings.snappy }
            : undefined
        }
        animate={
          isShaking
            ? { x: [-4, 4, -3, 3, -1, 1, 0], transition: { duration: 0.28 } }
            : { x: 0 }
        }
        className={`relative overflow-hidden select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-realm-gold/70 disabled:cursor-not-allowed ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${className}`}
        {...(rest as any)}
      >
        {/* Ripple Overlays */}
        {ripples.map((rip) => (
          <span
            key={rip.id}
            className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{
              left: rip.x,
              top: rip.y,
              width: 50,
              height: 50,
              backgroundColor: rip.color,
              opacity: 0.45,
            }}
          />
        ))}

        {/* Sparkle Burst */}
        {sparkles.map((spk) => (
          <span
            key={spk.id}
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: spk.x, top: spk.y }}
          >
            <span className="w-2 h-2 rounded-full bg-white shadow-lg shadow-realm-gold animate-bounce" />
          </span>
        ))}

        {/* Disabled Reason Tooltip */}
        {showTooltip && disabledReason && (
          <span className="absolute z-50 -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs font-semibold text-white bg-realm-dusk/95 border border-realm-coral rounded-lg shadow-xl shadow-black/50 whitespace-nowrap pointer-events-none animate-fadeIn">
            {disabledReason}
          </span>
        )}

        {children}
      </ElementComponent>
    );
  }
);

Pressable.displayName = 'Pressable';
