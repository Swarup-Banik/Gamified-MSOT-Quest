'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Pressable } from '../components/ui/Pressable';
import { SunsetSkyBackground } from '../components/assets/SunsetSkyBackground';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <SunsetSkyBackground />

      <div className="relative z-10 max-w-md w-full rounded-3xl bg-[#1A0A33]/90 border-2 border-white/20 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF4D5E] to-[#FF8A2B] p-1 shadow-lg shadow-[#FF4D5E]/30 flex items-center justify-center">
          <div className="w-full h-full bg-[#1A0A33] rounded-[22px] flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[#FF4D5E] animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-display font-semibold uppercase text-[#FF4D5E] tracking-wider">
            A Wild Bug Appeared
          </span>
          <h1 className="font-display text-2xl font-black text-white">
            Something Hiccuped
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            The server had a momentary hiccup, but your XP and official grades are completely safe. Let&apos;s try that action again.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Pressable
            role="primary"
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Pressable>

          <Pressable
            role="secondary"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-display text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </Pressable>
        </div>
      </div>
    </main>
  );
}
