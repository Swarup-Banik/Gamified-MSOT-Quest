'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Gift, User, Languages } from 'lucide-react';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { ChestSVG } from '../assets/ChestSVG';
import { soundManager } from '../../lib/sound-manager';
import { useReward } from '../../lib/use-reward';
import { api } from '../../lib/api';

interface OnboardingWizardProps {
  user: any;
  onComplete: (user: any, profile: any) => void;
}

export function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [companion, setCompanion] = useState<'fox' | 'owl' | 'sprite' | 'golem'>('fox');
  const [displayName, setDisplayName] = useState(user?.name || 'Aarav Quest');
  const [language, setLanguage] = useState<'EN' | 'HINGLISH'>('EN');

  // Tutorial Quiz questions
  const [tutQ1Answer, setTutQ1Answer] = useState<number | null>(null);
  const [tutQ2Answer, setTutQ2Answer] = useState<number | null>(null);
  const [tutSubmitted, setTutSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const { triggerLevelUp } = useReward();

  const handleFinish = async () => {
    setLoading(true);
    soundManager.play('tap');

    try {
      const res = await api.completeProfileSetup({
        avatarId: `avatar_${companion}`,
        displayName,
        companionChoice: companion,
        preferredLanguage: language,
      });

      triggerLevelUp();
      soundManager.play('chestOpen');
      onComplete(res.user, res.profile);
    } catch (err: any) {
      console.error('Failed to complete onboarding', err);
      // Fallback
      onComplete({ ...user, status: 'ACTIVE' }, null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#24104F] border-2 border-[#FFD23F] rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-2 rounded-full transition-all ${
                  step >= s ? 'bg-[#FFD23F] shadow-[0_0_8px_#FFD23F]' : 'bg-white/10'
                }`}
              />
              <span className="text-[10px] font-bold text-slate-400">
                {s === 1 && 'Companion'}
                {s === 2 && 'Identity'}
                {s === 3 && 'Trial'}
                {s === 4 && 'Gift'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Choose Companion */}
        {step === 1 && (
          <div className="space-y-4 text-center">
            <div>
              <h3 className="font-display text-2xl text-white">Choose Your Companion</h3>
              <p className="text-xs text-slate-300 mt-1">
                Your familiar accompanies you through daily runs and celebrates your victories.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'fox', name: 'Ember Fox', trait: 'Agile & Curious' },
                { id: 'owl', name: 'Starlight Owl', trait: 'Wise & Focused' },
                { id: 'sprite', name: 'Neon Sprite', trait: 'Playful & Speedy' },
                { id: 'golem', name: 'Rune Golem', trait: 'Steadfast & Tough' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundManager.play('tap');
                    setCompanion(c.id as any);
                  }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition active:scale-95 ${
                    companion === c.id
                      ? 'bg-[#FFD23F]/20 border-[#FFD23F] shadow-lg shadow-[#FFD23F]/20'
                      : 'bg-[#15062C] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#24104F] flex items-center justify-center p-1 overflow-hidden">
                    <CompanionAvatar species={c.id as any} mood="happy" size={60} />
                  </div>
                  <div>
                    <h5 className="font-display text-xs text-white">{c.name}</h5>
                    <p className="text-[10px] text-slate-400">{c.trait}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundManager.play('tap');
                setStep(2);
              }}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Gamertag & Language */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-display text-2xl text-white">Your Learner Profile</h3>
              <p className="text-xs text-slate-300 mt-1">
                Pick the name that appears on league leaderboards and choose your preferred study tongue.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Realm Gamertag</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Aarav Quest"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Question & Explanation Tongue</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { soundManager.play('tap'); setLanguage('EN'); }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 ${
                      language === 'EN' ? 'bg-[#FFD23F]/20 border-[#FFD23F]' : 'bg-[#15062C] border-white/10'
                    }`}
                  >
                    <Languages className="w-4 h-4 text-[#FFD23F]" />
                    <div>
                      <p className="text-xs font-bold text-white">English</p>
                      <p className="text-[10px] text-slate-400">Standard Academic</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { soundManager.play('tap'); setLanguage('HINGLISH'); }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 ${
                      language === 'HINGLISH' ? 'bg-[#FFD23F]/20 border-[#FFD23F]' : 'bg-[#15062C] border-white/10'
                    }`}
                  >
                    <Languages className="w-4 h-4 text-[#FF3D9A]" />
                    <div>
                      <p className="text-xs font-bold text-white">Hinglish</p>
                      <p className="text-[10px] text-slate-400">Casual Bilingual</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.play('tap');
                setStep(3);
              }}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Test Your Knowledge (Tutorial)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Tutorial Run (2 questions) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-display text-2xl text-white">Initiation Trial</h3>
              <p className="text-xs text-slate-300 mt-1">
                Answer these 2 warmup questions to unlock your first mystery chest.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Q1 */}
              <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 space-y-2">
                <p className="font-bold text-white">1. Which data structure operates on a Last-In First-Out (LIFO) model?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Queue', 'Stack', 'Linked List', 'Binary Tree'].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => { soundManager.play('tap'); setTutQ1Answer(i); }}
                      className={`p-2 rounded-xl text-left font-semibold border ${
                        tutQ1Answer === i ? 'bg-[#FFD23F] text-[#24104F] border-[#FFD23F]' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 space-y-2">
                <p className="font-bold text-white">2. What happens if you make a mistake in MSOT Quest?</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'You lose college marks (Never!)',
                    'A playful Mistake Monster spawns for spaced revenge practice',
                    'Your account is locked',
                  ].map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => { soundManager.play('tap'); setTutQ2Answer(i); }}
                      className={`p-2 rounded-xl text-left font-semibold border ${
                        tutQ2Answer === i ? 'bg-[#7CF36B] text-[#24104F] border-[#7CF36B]' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (tutQ1Answer === null || tutQ2Answer === null) return;
                soundManager.play('correct');
                setStep(4);
              }}
              disabled={tutQ1Answer === null || tutQ2Answer === null}
              className={`w-full py-3 rounded-2xl font-display text-sm font-bold flex items-center justify-center gap-2 ${
                tutQ1Answer !== null && tutQ2Answer !== null
                  ? 'btn-sunset-3d btn-3d-yellow'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Submit Answers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4: Welcome Chest Gift */}
        {step === 4 && (
          <div className="text-center space-y-4 py-2">
            <div className="flex justify-center">
              <div className="w-28 h-28 p-2 rounded-3xl bg-gradient-to-tr from-[#FFD23F]/30 to-[#FF3D9A]/30 border-2 border-[#FFD23F] flex items-center justify-center animate-bounce">
                <ChestSVG tier="LEGENDARY" size={90} state="IDLE" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CF36B]/20 text-[#7CF36B] text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Initiation Complete!</span>
              </div>
              <h3 className="font-display text-3xl text-white">Welcome, {displayName}!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                You earned the <strong className="text-[#FFD23F]">Founder&rsquo;s Welcome Chest</strong>! Open it in your Collection to claim exclusive starter cosmetics.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-base font-bold flex items-center justify-center gap-2 shadow-xl"
            >
              <Gift className="w-5 h-5" />
              <span>{loading ? 'Entering Realm...' : 'Claim Gift & Enter Lobby'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
