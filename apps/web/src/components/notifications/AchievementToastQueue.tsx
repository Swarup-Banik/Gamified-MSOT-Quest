'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Sparkles, X, ChevronRight } from 'lucide-react';
import { Pressable } from '../ui/Pressable';
import { sound } from '../../lib/sound-manager';

export interface AchievementToast {
  id: string;
  title: string;
  description: string;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpReward?: number;
  icon?: string;
}

// Global queue management
let toastQueue: AchievementToast[] = [];
let currentToast: AchievementToast | null = null;
const subscribers = new Set<(t: AchievementToast | null, q: AchievementToast[]) => void>();

function notify() {
  subscribers.forEach((cb) => cb(currentToast, [...toastQueue]));
}

export function showAchievementToast(toast: AchievementToast) {
  if (!currentToast) {
    currentToast = toast;
    sound.playPressTick('success');
    notify();
  } else if (toastQueue.length < 3) {
    toastQueue.push(toast);
    notify();
  }
}

export function dismissCurrentToast() {
  if (currentToast) {
    currentToast = null;
    notify();

    setTimeout(() => {
      if (toastQueue.length > 0) {
        currentToast = toastQueue.shift()!;
        sound.playPressTick('success');
        notify();
      }
    }, 250);
  }
}

export function AchievementToastQueue() {
  const [active, setActive] = useState<AchievementToast | null>(currentToast);
  const [queue, setQueue] = useState<AchievementToast[]>(toastQueue);

  useEffect(() => {
    const handler = (t: AchievementToast | null, q: AchievementToast[]) => {
      setActive(t);
      setQueue(q);
    };
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      dismissCurrentToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  const rarityBorders = {
    COMMON: 'border-[#9AA3B2]/50 shadow-[#9AA3B2]/20',
    UNCOMMON: 'border-[#3DDC97]/50 shadow-[#3DDC97]/20',
    RARE: 'border-[#22E3FF]/50 shadow-[#22E3FF]/20',
    EPIC: 'border-[#B26CFF]/50 shadow-[#B26CFF]/20',
    LEGENDARY: 'border-[#FFD23F]/60 shadow-[#FFD23F]/30',
  };

  const rarity = active.rarity || 'RARE';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full select-none pointer-events-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.24 }}
          onClick={dismissCurrentToast}
          className={`p-4 rounded-2xl bg-[#1A0933]/95 backdrop-blur-xl border-2 ${rarityBorders[rarity]} shadow-2xl flex items-start gap-3 relative cursor-pointer group`}
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFD23F] to-[#FF8A2B] p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#1A0933] rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#FFD23F]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-6 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display font-semibold uppercase text-[#FFD23F] tracking-wider">
                Achievement Unlocked
              </span>
              {active.xpReward && (
                <span className="text-[10px] font-bold text-[#3DDC97]">
                  +{active.xpReward} XP
                </span>
              )}
            </div>
            <h4 className="font-display text-sm font-bold text-white truncate">
              {active.title}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
              {active.description}
            </p>
          </div>

          {/* Close button */}
          <Pressable
            role="close"
            onClick={(e) => {
              e.stopPropagation();
              dismissCurrentToast();
            }}
            className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Pressable>

          {/* Queue Count Indicator */}
          {queue.length > 0 && (
            <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-[#FF3D9A] text-white text-[10px] font-bold shadow-md">
              +{queue.length} more
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
