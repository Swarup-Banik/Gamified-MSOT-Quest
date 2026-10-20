'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sword,
  Code2,
  Flame,
  Award,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { Pressable } from '../ui/Pressable';
import { sound } from '../../lib/sound-manager';

export interface WeeklyRecapData {
  studentName?: string;
  anonymousMode?: boolean;
  totalXp: number;
  bestDay: { day: string; xp: number };
  monstersDefeated: number;
  codingSolves: number;
  streakDays: number;
  biggestImprovement: string;
}

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: WeeklyRecapData;
}

export function WeeklyRecapModal({
  isOpen,
  onClose,
  data = {
    studentName: 'Scholar',
    anonymousMode: false,
    totalXp: 485,
    bestDay: { day: 'Wednesday', xp: 140 },
    monstersDefeated: 6,
    codingSolves: 5,
    streakDays: 7,
    biggestImprovement: 'Binary Trees & BFS Traversal (+40% accuracy)',
  },
}: WeeklyRecapModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen) return null;

  const slides = [
    {
      title: 'Your Week in Review',
      subtitle: 'A stellar week of growth and mastery in MSOT Quest!',
      icon: <Sparkles className="w-12 h-12 text-[#FFD23F] animate-bounce" />,
      highlight: `${data.totalXp} Total XP Earned`,
      detail: 'Consistent daily practice placed you in the top 15% of your campus batch!',
      badgeColor: 'from-[#FFD23F] to-[#FF8A2B]',
    },
    {
      title: 'Peak Performance Day',
      subtitle: 'When your brain was in ultra-focus mode',
      icon: <Zap className="w-12 h-12 text-[#3DDC97]" />,
      highlight: `${data.bestDay.day}: +${data.bestDay.xp} XP`,
      detail: 'You completed your daily run, defeated 2 Mistake Monsters, and solved a LeetCode problem!',
      badgeColor: 'from-[#3DDC97] to-[#22E3FF]',
    },
    {
      title: 'Monster Banishments',
      subtitle: 'Mistakes turned into stepping stones',
      icon: <Sword className="w-12 h-12 text-[#FF5E6C]" />,
      highlight: `${data.monstersDefeated} Monsters Banished`,
      detail: 'Off-by-One Imp, Null Demon, and Recursion Wraith were all overcome in Revenge Arena.',
      badgeColor: 'from-[#FF5E6C] to-[#B26CFF]',
    },
    {
      title: 'Verified Coding Solves',
      subtitle: 'Real-world muscle memory on competitive platforms',
      icon: <Code2 className="w-12 h-12 text-[#22E3FF]" />,
      highlight: `${data.codingSolves} Verified Practice Solves`,
      detail: 'Synced across LeetCode & GitHub without a single unverified mark.',
      badgeColor: 'from-[#22E3FF] to-[#7CF36B]',
    },
    {
      title: 'Mastery Breakthrough',
      subtitle: 'Your biggest syllabus leap this week',
      icon: <Award className="w-12 h-12 text-[#B26CFF]" />,
      highlight: data.biggestImprovement,
      detail: 'Your diagnostic mastery score jumped from 52% to 92% after reviewing key misconceptions.',
      badgeColor: 'from-[#B26CFF] to-[#FF3D9A]',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      sound.playPressTick('navigation');
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      sound.playPressTick('navigation');
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleShare = () => {
    sound.playPressTick('success');
    const text = `🌟 My MSOT Quest Week in Review: ${data.totalXp} XP, ${data.monstersDefeated} Monsters Defeated, ${data.codingSolves} Coding Solves, 7-Day Streak! 🚀`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const active = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#1A0933] border-2 border-white/20 p-6 space-y-6 shadow-2xl relative overflow-hidden text-center"
      >
        {/* Story Progress Indicators (Top Bars) */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-[#FFD23F]' : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <Pressable
          role="close"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Pressable>

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-4"
          >
            <div className="flex justify-center">{active.icon}</div>

            <div className="space-y-1">
              <span className="text-[11px] font-display font-semibold uppercase text-slate-400 tracking-wider">
                {active.subtitle}
              </span>
              <h3 className="font-display text-2xl font-bold text-white">
                {active.title}
              </h3>
            </div>

            <div
              className={`p-4 rounded-2xl bg-gradient-to-r ${active.badgeColor} text-[#140628] font-display text-lg font-black shadow-xl shadow-black/40`}
            >
              {active.highlight}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed px-4">
              {active.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation & Share Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <Pressable
            role="navigation"
            disabled={currentSlide === 0}
            onClick={handlePrev}
            className="p-2.5 rounded-xl bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </Pressable>

          <Pressable
            role="secondary"
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-[#3DDC97]" />
                <span className="text-[#3DDC97]">Copied Summary!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#22E3FF]" />
                <span>Share Summary</span>
              </>
            )}
          </Pressable>

          <Pressable
            role="primary"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1"
          >
            <span>{currentSlide === slides.length - 1 ? 'Finish' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </Pressable>
        </div>
      </motion.div>
    </div>
  );
}
