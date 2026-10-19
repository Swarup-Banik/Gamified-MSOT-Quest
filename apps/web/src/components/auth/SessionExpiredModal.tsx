'use client';

import React from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onReLogin: () => void;
}

export function SessionExpiredModal({ isOpen, onReLogin }: SessionExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#24104F] border-2 border-[#FF8A2B] rounded-3xl p-6 shadow-2xl text-white text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FF8A2B]/20 border border-[#FF8A2B] flex items-center justify-center text-[#FF8A2B]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="font-display text-2xl text-white">Session Expired</h3>
        <p className="text-xs text-slate-300">
          Your secure authentication ticket has lapsed or was signed out from another device. Please sign back in to continue your adventure.
        </p>
        <button
          onClick={() => {
            soundManager.play('tap');
            onReLogin();
          }}
          className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In Again</span>
        </button>
      </div>
    </div>
  );
}
