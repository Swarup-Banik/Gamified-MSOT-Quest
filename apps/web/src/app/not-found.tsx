'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Pressable } from '../components/ui/Pressable';
import { SunsetSkyBackground } from '../components/assets/SunsetSkyBackground';

export default function NotFound() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <SunsetSkyBackground />

      <div className="relative z-10 max-w-md w-full rounded-3xl bg-[#1A0A33]/90 border-2 border-white/20 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#FF5E6C] to-[#FFD23F] p-1 shadow-glow-yellow flex items-center justify-center">
          <div className="w-full h-full bg-[#1A0A33] rounded-[22px] flex items-center justify-center">
            <Compass className="w-10 h-10 text-[#FFD23F] animate-spin" style={{ animationDuration: '10s' }} />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-display font-semibold uppercase text-[#FF5E6C] tracking-wider">
            Lost in the Campus Realm
          </span>
          <h1 className="font-display text-3xl font-black text-white">
            404: Node Not Found
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            You strayed off the official syllabus trail! Even legendary explorers take a detour now and then. Let&apos;s guide you back to safety.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Pressable
              role="primary"
              className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Lobby</span>
            </Pressable>
          </Link>
        </div>
      </div>
    </main>
  );
}
