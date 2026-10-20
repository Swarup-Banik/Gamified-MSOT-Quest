'use client';

import React from 'react';
import { WifiOff, Wrench, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Pressable } from './Pressable';
import { MonsterAvatar } from '../assets/MonsterAvatar';
import { CompanionAvatar } from '../assets/CompanionAvatar';

export function EmptyStateView({
  title = 'Nothing here yet',
  message = 'Your shelves are quiet right now. Crack open a Mystery Vault from Today’s Run to discover rewards!',
  actionLabel = 'Explore Syllabus',
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="p-8 rounded-3xl bg-[#1A0933]/80 border border-white/10 text-center space-y-4 max-w-md mx-auto my-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFD23F] to-[#B26CFF] p-0.5 shadow-lg">
          <div className="w-full h-full bg-[#1A0933] rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#FFD23F] animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
      </div>
      {onAction && (
        <Pressable
          role="primary"
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <span>{actionLabel}</span>
        </Pressable>
      )}
    </div>
  );
}

export function OfflineStateView({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <div className="p-8 rounded-3xl bg-[#1A0933]/90 border-2 border-[#FF5E6C]/30 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xl">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF5E6C]/20 border border-[#FF5E6C]/40 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-[#FF5E6C] animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-white">Disconnected from Realm</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Looks like your connection dropped. Don&apos;t worry — offline practice progress will sync the moment you reconnect!
        </p>
      </div>
      {onRetry && (
        <Pressable
          role="primary"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD23F] to-[#FF8A2B] text-[#140628] font-display text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </Pressable>
      )}
    </div>
  );
}

export function MaintenanceStateView() {
  return (
    <div className="p-8 rounded-3xl bg-[#1A0933]/90 border-2 border-[#22E3FF]/30 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xl">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#22E3FF]/20 border border-[#22E3FF]/40 flex items-center justify-center">
          <Wrench className="w-8 h-8 text-[#22E3FF] animate-bounce" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-white">Campus Realm Maintenance</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Our archmages are tuning the crystal conduits for an upcoming semester festival. We will be back online shortly!
        </p>
      </div>
    </div>
  );
}
