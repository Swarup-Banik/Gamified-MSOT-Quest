'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';
import { Pressable } from '../ui/Pressable';
import { sound } from '../../lib/sound-manager';

interface KeyboardShortcutsModalProps {
  onNavigateTab?: (tab: string) => void;
}

export function KeyboardShortcutsModal({ onNavigateTab }: KeyboardShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gPending, setGPending] = useState(false);

  useEffect(() => {
    let gTimeout: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        sound.playPressTick('navigation');
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false);
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        sound.toggleMute();
        return;
      }

      // 'g' key chord navigation (e.g. g + h, g + m, g + a, g + c)
      if (e.key === 'g' || e.key === 'G') {
        setGPending(true);
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => setGPending(false), 1200);
        return;
      }

      if (gPending && onNavigateTab) {
        if (e.key === 'h' || e.key === 'H') {
          sound.playPressTick('navigation');
          onNavigateTab('lobby');
          setGPending(false);
        } else if (e.key === 'm' || e.key === 'M') {
          sound.playPressTick('navigation');
          onNavigateTab('map');
          setGPending(false);
        } else if (e.key === 'a' || e.key === 'A') {
          sound.playPressTick('navigation');
          onNavigateTab('arena');
          setGPending(false);
        } else if (e.key === 'c' || e.key === 'C') {
          sound.playPressTick('navigation');
          onNavigateTab('COLLECTION');
          setGPending(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [isOpen, gPending, onNavigateTab]);

  if (!isOpen) return null;

  const shortcuts = [
    { keyCombo: ['?'], label: 'Open shortcuts cheatsheet' },
    { keyCombo: ['g', 'h'], label: 'Go to Lobby / Home' },
    { keyCombo: ['g', 'm'], label: 'Go to Syllabus Map' },
    { keyCombo: ['g', 'a'], label: 'Go to Revenge Arena & Code Hub' },
    { keyCombo: ['g', 'c'], label: 'Go to Codex & Collection' },
    { keyCombo: ['m'], label: 'Toggle sound mute' },
    { keyCombo: ['Space'], label: 'Launch active action / run' },
    { keyCombo: ['Esc'], label: 'Dismiss celebration or modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-md rounded-3xl bg-[#1A0A33] border-2 border-white/20 p-6 space-y-5 shadow-2xl relative"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-[#FFD23F]" />
            <h3 className="font-display text-base font-bold text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <Pressable
            role="close"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Pressable>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
            >
              <span className="text-slate-300">{sc.label}</span>
              <div className="flex items-center gap-1">
                {sc.keyCombo.map((k, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-[#120424] border border-white/20 font-mono text-[11px] font-bold text-[#FFD23F] shadow-sm"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Press <kbd className="font-mono text-[#FFD23F]">Esc</kbd> anytime to exit.
        </div>
      </motion.div>
    </div>
  );
}
