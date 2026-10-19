'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

interface ForbiddenPageProps {
  onReturnHome: () => void;
  requiredRole?: string;
}

export function ForbiddenPage({ onReturnHome, requiredRole = 'FACULTY' }: ForbiddenPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#24104F] border-2 border-[#FF4D5E] rounded-3xl p-8 shadow-2xl text-white text-center space-y-5">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#FF4D5E]/20 border-2 border-[#FF4D5E] flex items-center justify-center text-[#FF4D5E] animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D5E] bg-[#FF4D5E]/20 px-3 py-1 rounded-full border border-[#FF4D5E]/40">
            Error 403 • Restricted Sanctuary
          </span>
          <h2 className="font-display text-3xl text-white pt-2">
            Halt, Wanderer!
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            The Archons have sealed this chamber. This area requires elevated <strong className="text-[#FFD23F]">{requiredRole}</strong> authority that your current account does not possess.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#15062C] border border-white/10 text-xs text-slate-400 space-y-1">
          <p>• Scoped Authorization: Access is governed by least-privilege policy.</p>
          <p>• Audit Notice: Unauthorized access attempts are securely logged.</p>
        </div>

        <button
          onClick={() => {
            soundManager.play('tap');
            onReturnHome();
          }}
          className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return to Realm Lobby</span>
        </button>
      </div>
    </div>
  );
}
