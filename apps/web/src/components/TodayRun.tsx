'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Sword,
  Shield,
  Gift,
  ArrowRight,
  Clock,
  Languages,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import {
  playCorrectSound,
  playWrongSound,
  playLevelUpSound,
  playChestOpenSound,
} from '../lib/sound';

interface TodayRunProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

export function TodayRun({ user, profile, onRefreshProfile }: TodayRunProps) {
  const [language, setLanguage] = useState<'EN' | 'HINGLISH'>('EN');
  const [quizState, setQuizState] = useState<'IDLE' | 'ACTIVE' | 'COMPLETED'>('IDLE');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<any[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeMonsters, setActiveMonsters] = useState<any[]>([]);
  const [fightMonsterModal, setFightMonsterModal] = useState<any | null>(null);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [rewardChest, setRewardChest] = useState<any | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadTodayData();
  }, [user?.id, language]);

  const loadTodayData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      const quizRes = await api.getTodayQuiz(studentId, language);
      setQuestions(quizRes.questions || []);
      setAlreadyCompletedToday(quizRes.alreadyCompleted);

      const monRes = await api.getActiveMonsters(studentId);
      setActiveMonsters(monRes.monsters || []);
    } catch (err) {
      console.error('Failed to load today run data', err);
    }
  };

  const handleStartRun = () => {
    setQuizState('ACTIVE');
    setCurrentQIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setQuestionStartTime(Date.now());
  };

  const handleSelectOption = (optionIndex: number) => {
    if (showExplanation) return; // Prevent double select
    const responseTime = Date.now() - questionStartTime;
    const currentQ = questions[currentQIndex];

    const answerRecord = {
      questionId: currentQ.id,
      selectedOption: optionIndex,
      responseTimeMs: responseTime,
      pasteDetected: false,
    };

    const newAnswers = [...selectedAnswers, answerRecord];
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    // Audio cue
    const isCorrect = currentQ.correctOptionIndex === optionIndex;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      // Submit full quiz
      try {
        const studentId = user?.id || 'student_1';
        const result = await api.submitQuiz(studentId, selectedAnswers);
        setEarnedXp(result.xpEarned || 30);
        setRewardChest(result.chestAwarded || null);
        setQuizState('COMPLETED');
        setAlreadyCompletedToday(true);

        if (result.score === questions.length) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          playLevelUpSound();
        } else {
          playChestOpenSound();
        }

        onRefreshProfile();
        loadTodayData();
      } catch (err: any) {
        alert(err.message || 'Submission error');
      }
    }
  };

  const handleFightMonster = async (optionIndex: number) => {
    if (!fightMonsterModal) return;
    try {
      const studentId = user?.id || 'student_1';
      const res = await api.fightMonster(fightMonsterModal.id, studentId, optionIndex);
      if (res.defeated) {
        playCorrectSound();
        confetti({ particleCount: 60, spread: 60 });
        alert(`🏆 Monster Defeated! You earned +${res.xpEarned} XP and unlocked its trophy in your Monster Codex!`);
        setFightMonsterModal(null);
        loadTodayData();
        onRefreshProfile();
      } else {
        playWrongSound();
        alert(res.message || 'The monster dodged! Review the topic and try again.');
        setFightMonsterModal(null);
      }
    } catch (err: any) {
      alert(err.message || 'Fight failed');
    }
  };

  const currentQ = questions[currentQIndex];

  return (
    <div className="space-y-6">
      {/* 1. Today's Run Core Hero Banner */}
      <div className="quest-card p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Week 4 Curriculum • Recursion & Arrays</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Today's Run</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">
              A 3-minute daily micro-challenge on topics taught in lecture this week. Protect your streak and earn mystery chests.
            </p>
          </div>

          {/* Language Toggle & Primary CTA Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'EN' ? 'HINGLISH' : 'EN')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              <Languages className="w-4 h-4 text-indigo-400" />
              <span>{language === 'EN' ? 'English' : 'Hinglish'}</span>
            </button>

            {quizState === 'IDLE' && (
              <button
                onClick={handleStartRun}
                disabled={alreadyCompletedToday}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition ${
                  alreadyCompletedToday
                    ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                }`}
              >
                {alreadyCompletedToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed Today</span>
                  </>
                ) : (
                  <>
                    <span>Start Today's Run</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Active Quiz Runner State */}
        {quizState === 'ACTIVE' && currentQ && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 uppercase font-mono text-[10px]">
                {currentQ.difficulty}
              </span>
            </div>

            <p className="text-white font-semibold text-base leading-relaxed">{currentQ.prompt}</p>

            {/* Answer Options */}
            <div className="grid gap-2.5 pt-2">
              {currentQ.options?.map((opt: string, idx: number) => {
                const isSelected = selectedAnswers[currentQIndex]?.selectedOption === idx;
                const isCorrect = currentQ.correctOptionIndex === idx;

                let optClass = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200';
                if (showExplanation) {
                  if (isCorrect) {
                    optClass = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
                  } else if (isSelected) {
                    optClass = 'bg-rose-950/70 border-rose-500 text-rose-200';
                  } else {
                    optClass = 'bg-slate-800/40 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition flex items-center justify-between ${optClass}`}
                  >
                    <span>{opt}</span>
                    {showExplanation && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {showExplanation && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Card */}
            {showExplanation && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    {language === 'HINGLISH' && currentQ.explanationHinglish
                      ? currentQ.explanationHinglish
                      : currentQ.explanation}
                  </p>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>{currentQIndex + 1 < questions.length ? 'Next Question' : 'Complete Run'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Run Completed Reward Card */}
        {quizState === 'COMPLETED' && (
          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Daily Run Conquered!</h3>
              <p className="text-slate-400 text-xs mt-1">
                You earned <span className="font-bold text-indigo-400">+{earnedXp} XP</span> and kept your learning streak alive!
              </p>
            </div>
            {rewardChest && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>{rewardChest.tier} Mystery Chest Awarded! Available in Collection.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Mistake Monsters (Spaced Repetition Revenge Rounds) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white">Active Mistake Monsters</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {activeMonsters.length} / 5
            </span>
          </div>
          <span className="text-xs text-slate-400">Spaced revenge round • Defeat for +15 XP</span>
        </div>

        {activeMonsters.length === 0 ? (
          <div className="quest-card p-5 text-center text-slate-400 text-xs">
            ✨ No active monsters! You have answered all recent curriculum questions accurately.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeMonsters.map(monster => (
              <div
                key={monster.id}
                className="quest-card p-4 border border-rose-500/20 hover:border-rose-500/40 transition space-y-3 bg-gradient-to-b from-slate-900 to-slate-900/90"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 uppercase">
                    {monster.species?.rarity || 'COMMON'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> Ready
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{monster.species?.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {monster.questionPrompt || monster.species?.lore}
                  </p>
                </div>

                <button
                  onClick={() => setFightMonsterModal(monster)}
                  className="w-full py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Sword className="w-3.5 h-3.5" />
                  <span>Fight Revenge Round</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Spaced Repetition Monster Fight Modal */}
      {fightMonsterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="quest-card max-w-md w-full p-6 space-y-4 border border-rose-500/40 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-lg text-white">Revenge Challenge</h4>
              </div>
              <button onClick={() => setFightMonsterModal(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <p className="text-xs text-rose-300">
              Prove you have mastered this concept to banish the {fightMonsterModal.species?.name}!
            </p>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-sm text-white">
              {fightMonsterModal.questionPrompt || 'What is the base case invariant in this algorithm?'}
            </div>

            <div className="grid gap-2">
              <button
                onClick={() => handleFightMonster(0)}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              >
                A. Elements to the left satisfy property P; right pointer guarantees invariant
              </button>
              <button
                onClick={() => handleFightMonster(1)}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              >
                B. Unwind recursive call frames without condition validation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
