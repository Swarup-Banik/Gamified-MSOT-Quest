'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, Heart } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

interface CompanionHeroSceneProps {
  mood?: 'idle' | 'happy' | 'cheering' | 'sleeping';
  studentName?: string;
  streakCount?: number;
  className?: string;
  onPet?: () => void;
}

export function CompanionHeroScene({
  mood = 'idle',
  studentName = 'Scholar',
  streakCount = 7,
  className = '',
  onPet,
}: CompanionHeroSceneProps) {
  const [isPet, setIsPet] = useState(false);
  const [speechText, setSpeechText] = useState("Let's conquer today's run!");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Rotating kind, encouraging, non-guilt tips
  const tips = [
    `Welcome back, ${studentName}! 3 minutes to lock in your streak!`,
    `Every mistake is just a monster waiting to be purified in your Codex.`,
    `You're on a ${streakCount}-day streak! Two freeze shields are standing by.`,
    `Campus Arena rivalries are heating up — Section A is pushing!`,
    `Pro tip: Check your two-pointer partition before submitting!`,
  ];

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setSpeechText(randomTip);

    const interval = setInterval(() => {
      setSpeechText(prev => {
        const nextIdx = (tips.indexOf(prev) + 1) % tips.length;
        return tips[nextIdx];
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [studentName, streakCount]);

  const handleCompanionClick = () => {
    soundManager.play('combo');
    setIsPet(true);
    setSpeechText('✨ Kitsune loves your study dedication! (+5 spirit)');
    if (onPet) onPet();
    setTimeout(() => setIsPet(false), 800);
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 1. Interactive Speech Bubble */}
      <div className="relative mb-2 max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl bg-[#FFF8E7] text-[#24104F] border-2 border-[#FFD23F] shadow-xl text-xs sm:text-sm font-semibold leading-snug animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="flex items-center gap-1.5">
          <span className="font-display text-[#FF8A2B]">Kitsune:</span>
          <span>{speechText}</span>
        </p>
        {/* Tail triangle for speech bubble pointing to companion */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#FFD23F]" />
      </div>

      {/* 2. Floating Island with Lanterns and Giant Animated Companion */}
      <div
        onClick={handleCompanionClick}
        className="group relative cursor-pointer flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95"
        title="Tap to pet your study companion!"
      >
        {/* Floating Heart Popup when Petted */}
        {isPet && (
          <div className="absolute -top-6 text-[#FF3D9A] animate-[floatUp_0.8s_ease-out_forwards] pointer-events-none z-30">
            <Heart className="w-8 h-8 fill-current drop-shadow-lg" />
          </div>
        )}

        {/* Ambient Island Glow */}
        <div className="absolute -bottom-6 w-48 h-12 bg-[#FFD23F]/35 rounded-full blur-xl pointer-events-none" />

        {/* Giant Parametric SVG Companion (>= 220px on desktop) */}
        <div className={`relative z-10 w-44 h-44 sm:w-56 sm:h-56 ${isPet ? 'animate-bounce' : 'animate-island-bob'}`}>
          <svg viewBox="0 0 160 160" width="100%" height="100%" className="overflow-visible">
            <defs>
              <radialGradient id="fox-fur" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFA654" />
                <stop offset="60%" stopColor="#FF8A2B" />
                <stop offset="100%" stopColor="#C96008" />
              </radialGradient>
              <linearGradient id="fox-belly" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FFF8E7" />
                <stop offset="100%" stopColor="#FFE1A8" />
              </linearGradient>
              <radialGradient id="fox-eye-glow" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFE873" />
                <stop offset="100%" stopColor="#FFD23F" />
              </radialGradient>
            </defs>

            {/* Glowing Celestial Halo */}
            <circle cx="80" cy="55" r="48" fill="none" stroke="rgba(255, 210, 63, 0.4)" strokeWidth="3" strokeDasharray="4,4" className="animate-spin" style={{ animationDuration: '24s' }} />

            {/* Fluffy Bushy Tail */}
            <path
              d="M 112 110 C 145 95 160 65 140 45 C 120 25 105 50 115 80 Z"
              fill="url(#fox-fur)"
              stroke="#24104F"
              strokeWidth="4"
              className="origin-[112px_110px] animate-[wiggle_3s_ease-in-out_infinite]"
            />
            {/* White Tail Tip */}
            <path d="M 132 52 C 142 45 140 45 130 38 C 122 35 120 40 125 48 Z" fill="#FFF8E7" />

            {/* Companion Body */}
            <ellipse cx="80" cy="112" rx="42" ry="36" fill="url(#fox-fur)" stroke="#24104F" strokeWidth="4.5" />
            {/* Soft Creamy Belly */}
            <ellipse cx="80" cy="118" rx="25" ry="24" fill="url(#fox-belly)" stroke="#24104F" strokeWidth="2.5" />

            {/* Head */}
            <circle cx="80" cy="68" r="34" fill="url(#fox-fur)" stroke="#24104F" strokeWidth="4.5" />

            {/* Big Pointy Ears with Fluffy Insides */}
            {/* Left Ear */}
            <polygon points="54,42 36,12 68,34" fill="#FF8A2B" stroke="#24104F" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="52,38 42,20 62,33" fill="#FFF8E7" />
            {/* Right Ear */}
            <polygon points="106,42 124,12 92,34" fill="#FF8A2B" stroke="#24104F" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="108,38 118,20 98,33" fill="#FFF8E7" />

            {/* Head Mask / Face Fur Shape */}
            <path
              d="M 52 75 Q 80 92 108 75 Q 98 102 80 102 Q 62 102 52 75 Z"
              fill="#FFF8E7"
            />

            {/* Big Expressive Cartoon Eyes */}
            <g className="animate-[wiggle_6s_ease-in-out_infinite]">
              {/* Left Eye */}
              <ellipse cx="66" cy="68" rx="10" ry="12" fill="#24104F" stroke="#24104F" strokeWidth="2" />
              <ellipse cx="66" cy="68" rx="8" ry="10" fill="url(#fox-eye-glow)" />
              <circle cx="66" cy="68" r="5" fill="#24104F" />
              <circle cx="64" cy="65" r="2.5" fill="#FFF8E7" />
              <circle cx="68" cy="71" r="1.2" fill="#FFF8E7" />

              {/* Right Eye */}
              <ellipse cx="94" cy="68" rx="10" ry="12" fill="#24104F" stroke="#24104F" strokeWidth="2" />
              <ellipse cx="94" cy="68" rx="8" ry="10" fill="url(#fox-eye-glow)" />
              <circle cx="94" cy="68" r="5" fill="#24104F" />
              <circle cx="92" cy="65" r="2.5" fill="#FFF8E7" />
              <circle cx="96" cy="71" r="1.2" fill="#FFF8E7" />
            </g>

            {/* Rosy Cheeks */}
            <circle cx="56" cy="78" r="5" fill="#FF3D9A" opacity="0.6" />
            <circle cx="104" cy="78" r="5" fill="#FF3D9A" opacity="0.6" />

            {/* Cute Black Nose */}
            <polygon points="78,82 82,82 80,85" fill="#24104F" />

            {/* Happy Smile */}
            <path d="M 74 86 Q 80 92 86 86" stroke="#24104F" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Scholar's Amber Gemstone Necklace */}
            <path d="M 64 98 Q 80 108 96 98" stroke="#24104F" strokeWidth="3" fill="none" />
            <polygon points="80,102 85,108 80,114 75,108" fill="#FFD23F" stroke="#24104F" strokeWidth="2" />
          </svg>
        </div>

        {/* 3. Floating Mossy Island Surface */}
        <div className="relative -mt-6 z-0 w-52 sm:w-64 h-16 sm:h-20">
          <svg viewBox="0 0 240 70" width="100%" height="100%">
            {/* Floating Island Crust */}
            <path
              d="M 15 25 Q 120 10 225 25 Q 180 65 120 70 Q 60 65 15 25 Z"
              fill="#24104F"
              stroke="#5B2EE0"
              strokeWidth="3.5"
            />
            {/* Glowing Grass Cap */}
            <path
              d="M 12 25 Q 120 12 228 25 Q 210 35 120 38 Q 30 35 12 25 Z"
              fill="linear-gradient(180deg, #7CF36B 0%, #4FA841 100%)"
              stroke="#FFF8E7"
              strokeWidth="2"
            />
            {/* Tiny Lantern on Island Edge */}
            <circle cx="36" cy="22" r="5" fill="#FFD23F" stroke="#24104F" strokeWidth="1.5" />
            <circle cx="36" cy="22" r="14" fill="#FF8A2B" opacity="0.4" />
            {/* Glowing Crystal on Island Right */}
            <polygon points="205,24 210,12 215,24" fill="#22E3FF" stroke="#24104F" strokeWidth="1.5" />
          </svg>
        </div>

        <span className="mt-1 text-[11px] font-display text-[#FFD23F] tracking-wide bg-[#24104F]/90 px-3 py-0.5 rounded-full border border-[#FFD23F]/40 shadow-md">
          Level 3 Kitsune (Tap to pet)
        </span>
      </div>
    </div>
  );
}
