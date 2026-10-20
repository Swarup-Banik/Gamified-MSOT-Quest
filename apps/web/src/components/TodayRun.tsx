'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  Sword,
  Shield,
  Gift,
  ArrowRight,
  Clock,
  Zap,
  Play,
  RotateCcw,
  Code,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { QuizEngine, QuizQuestion } from './quiz/QuizEngine';
import { CompanionAvatar } from './assets/CompanionAvatar';
import { MonsterAvatar } from './assets/MonsterAvatar';
import { ChestSVG } from './assets/ChestSVG';
import { MysteryChestOpening } from './rewards/MysteryChestOpening';
import { MistakeMonsterBattle } from './monsters/MistakeMonsterBattle';
import { GameButton } from './ui/GameButton';
import { soundManager } from '../lib/sound-manager';
import { useReward } from '../lib/use-reward';

interface TodayRunProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

export function TodayRun({ user, profile, onRefreshProfile }: TodayRunProps) {
  const [language, setLanguage] = useState<'EN' | 'HINGLISH'>('EN');
  const [quizState, setQuizState] = useState<'IDLE' | 'ACTIVE' | 'COMPLETED'>('IDLE');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activeMonsters, setActiveMonsters] = useState<any[]>([]);
  const [selectedMonsterForBattle, setSelectedMonsterForBattle] = useState<any | null>(null);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [rewardChest, setRewardChest] = useState<any | null>(null);
  const [isOpeningChestModal, setIsOpeningChestModal] = useState(false);
  const [runSummary, setRunSummary] = useState<any | null>(null);
  const [codingSyncing, setCodingSyncing] = useState(false);
  const [codingSyncNotice, setCodingSyncNotice] = useState<string | null>(null);

  const { triggerLevelUp } = useReward();

  const handleSyncCodingPractice = async () => {
    soundManager.play('tap');
    setCodingSyncing(true);
    setCodingSyncNotice(null);
    try {
      const res = await api.syncIntegration('LEETCODE').catch(() => null);
      const ghRes = await api.syncIntegration('GITHUB').catch(() => null);
      const totalXp = (res?.xpAwarded || 0) + (ghRes?.xpAwarded || 0);
      const totalSolves = (res?.newSolvesDetected || 0) + (ghRes?.newSolvesDetected || 0);

      if (totalXp > 0) {
        soundManager.play('levelUp');
        confetti({ particleCount: 60, spread: 60 });
        setCodingSyncNotice(`🎉 Synced ${totalSolves} new problem(s)! +${totalXp} XP awarded.`);
        triggerLevelUp();
        onRefreshProfile();
      } else {
        soundManager.play('correct');
        setCodingSyncNotice('Coding practice is up to date! Solve problems on LeetCode or commit to GitHub to earn XP.');
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setCodingSyncNotice(err.message || 'Sync failed. Connect accounts in Me page.');
    } finally {
      setCodingSyncing(false);
    }
  };

  // Multi-format fallback questions ensuring variety
  const sampleFallbackQuestions: QuizQuestion[] = [
    {
      id: 'q_mc_1',
      format: 'MULTIPLE_CHOICE',
      questionText: 'What is the worst-case time complexity of QuickSort when a naive pivot is picked?',
      codeSnippet: 'pivot = arr[0] // naive first element',
      options: ['O(N log N)', 'O(N²)', 'O(log N)', 'O(N)'],
      correctOptionIndex: 1,
      explanation: 'When arrays are already sorted and the first element is selected as pivot, partitions become completely unbalanced, degrading to O(N²).',
    },
    {
      id: 'q_drag_1',
      format: 'DRAG_TO_ORDER',
      questionText: 'Arrange the core phases of Merge Sort in the correct execution order:',
      items: [
        'Merge the two sorted halves into one buffer',
        'Check base case: if len <= 1, return',
        'Divide array into left and right sub-arrays',
        'Recursively sort left and right halves',
      ],
      correctOrder: [
        'Check base case: if len <= 1, return',
        'Divide array into left and right sub-arrays',
        'Recursively sort left and right halves',
        'Merge the two sorted halves into one buffer',
      ],
      explanation: 'Base case must terminate recursion first, then division, then recursive resolution, then merging.',
    },
    {
      id: 'q_match_1',
      format: 'MATCH_PAIRS',
      questionText: 'Match each data structure with its principal characteristic:',
      pairs: [
        { left: 'Queue', right: 'FIFO (First-In First-Out)' },
        { left: 'Stack', right: 'LIFO (Last-In First-Out)' },
        { left: 'Priority Queue', right: 'Heap-ordered retrieval' },
      ],
      explanation: 'Queues maintain arrival order, stacks reverse processing order, and priority queues prioritize by key magnitude.',
    },
    {
      id: 'q_fill_1',
      format: 'FILL_BLANK',
      questionText: 'Complete the cycle detection step in Floyd’s algorithm:',
      codeTemplate: 'slow = slow.next;\nfast = fast.next.{{BLANK_0}};\nif (slow === {{BLANK_1}}) return true;',
      correctTokens: ['next', 'fast'],
      tokenBank: ['next', 'fast', 'slow', 'head', 'val'],
      explanation: 'The fast pointer travels at double speed (fast.next.next). When slow matches fast, a cycle is proven.',
    },
    {
      id: 'q_bug_1',
      format: 'SPOT_THE_BUG',
      questionText: 'Tap the line containing the Null Pointer vulnerability:',
      codeLines: [
        'function getHeadValue(list) {',
        '  let val = list.head.value;',
        '  return val;',
        '}',
      ],
      bugLineIndex: 1,
      bugFix: 'let val = list?.head?.value ?? null;',
      explanation: 'Line 2 accesses list.head directly without checking if list or head is null, which throws a runtime exception on empty lists!',
    },
  ];

  useEffect(() => {
    loadTodayData();
  }, [user?.id, language]);

  const loadTodayData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      const quizRes = await api.getTodayQuiz(studentId, language);

      if (quizRes.questions && quizRes.questions.length > 0) {
        // Map backend questions to QuizQuestion interface, injecting sample formats
        const mapped = quizRes.questions.map((q: any, idx: number) => {
          if (idx === 1 && sampleFallbackQuestions[1]) return sampleFallbackQuestions[1];
          if (idx === 2 && sampleFallbackQuestions[2]) return sampleFallbackQuestions[2];
          if (idx === 3 && sampleFallbackQuestions[3]) return sampleFallbackQuestions[3];
          if (idx === 4 && sampleFallbackQuestions[4]) return sampleFallbackQuestions[4];
          return {
            id: q.id,
            format: 'MULTIPLE_CHOICE' as const,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
            codeSnippet: q.codeSnippet,
          };
        });
        setQuestions(mapped);
      } else {
        setQuestions(sampleFallbackQuestions);
      }

      setAlreadyCompletedToday(quizRes.alreadyCompleted);

      const monRes = await api.getActiveMonsters(studentId);
      setActiveMonsters(monRes.monsters || []);
    } catch (err) {
      console.error('Failed to load today run data', err);
      setQuestions(sampleFallbackQuestions);
    }
  };

  const handleStartRun = () => {
    soundManager.play('tap');
    setQuizState('ACTIVE');
  };

  const handleQuizEngineComplete = async (summary: {
    score: number;
    total: number;
    xpEarned: number;
    maxCombo: number;
    answers: any[];
  }) => {
    try {
      const studentId = user?.id || 'student_1';
      const result = await api.submitQuiz(studentId, summary.answers);

      setRunSummary({
        score: summary.score,
        total: summary.total,
        xpEarned: summary.xpEarned || result.xpEarned || 45,
        maxCombo: summary.maxCombo,
      });

      setRewardChest(result.chestAwarded || { id: 'vault_today', tier: 'GOLDEN' });
      setQuizState('COMPLETED');
      setAlreadyCompletedToday(true);

      triggerLevelUp();
      onRefreshProfile();
      loadTodayData();
    } catch (err: any) {
      console.error('Quiz submit failed', err);
      setQuizState('COMPLETED');
    }
  };

  const handleOpenChestModal = () => {
    setIsOpeningChestModal(true);
  };

  const handleExecuteChestOpen = async (chestId: string) => {
    const studentId = user?.id || 'student_1';
    return await api.openChest(chestId, studentId);
  };

  return (
    <div className="space-y-6">
      {/* Active Quiz State */}
      {quizState === 'ACTIVE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setQuizState('IDLE')}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Leave run</span>
            </button>
            <span className="text-xs font-bold text-[#FFC83D]">
              Today's Challenge Run
            </span>
          </div>

          <QuizEngine
            questions={questions}
            onComplete={handleQuizEngineComplete}
            onExit={() => setQuizState('IDLE')}
            allowBlitz={true}
          />
        </div>
      )}

      {/* Completed Run Victory Banner */}
      {quizState === 'COMPLETED' && (
        <div className="card-reward p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
          <div className="flex justify-center">
            <CompanionAvatar species="FOX" mood="CHEERING" size={72} />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-display text-[#FFC83D] uppercase tracking-wider">
              Quest Cleared!
            </span>
            <h2 className="text-2xl font-display text-white">
              Today's Run Complete
            </h2>
            <p className="text-xs text-slate-300">
              Score: {runSummary?.score}/{runSummary?.total} • Max Combo: {runSummary?.maxCombo}x
            </p>
          </div>

          {/* XP & Streak update */}
          <div className="inline-flex items-center gap-6 bg-[#1B1740] border border-[#3D3280] px-6 py-3 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2 font-display text-base text-[#FFC83D]">
              <Zap className="w-5 h-5 fill-current" />
              <span>+{runSummary?.xpEarned || 45} XP</span>
            </div>
            <span className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5 font-display text-base text-[#FF5E6C]">
              <Flame className="w-5 h-5 fill-current" />
              <span>Streak Safe!</span>
            </div>
          </div>

          {/* Procedural Vault Chest Award */}
          {rewardChest && (
            <div className="p-4 rounded-2xl bg-[#1B1740] border-2 border-[#FFC83D]/60 space-y-3">
              <div className="flex justify-center">
                <ChestSVG tier="GOLDEN" state="IDLE" size={100} />
              </div>
              <h4 className="font-display text-sm text-white">
                Golden Vault Chest Earned!
              </h4>
              <p className="text-[11px] text-slate-300">
                Guaranteed bad-luck pity counter advances towards legendary cosmetic drops.
              </p>
              <GameButton
                variant="primary"
                size="md"
                fullWidth
                onClick={handleOpenChestModal}
                icon={<Gift className="w-4 h-4" />}
              >
                Open Mystery Vault
              </GameButton>
            </div>
          )}

          <div>
            <GameButton
              variant="secondary"
              size="md"
              onClick={() => setQuizState('IDLE')}
            >
              Back to Campus Dashboard
            </GameButton>
          </div>
        </div>
      )}

      {/* IDLE / Dashboard View: Today's Run Trail */}
      {quizState === 'IDLE' && (
        <div className="space-y-6">
          {/* Hero "Today's Run" Card */}
          <div className="card-quiz p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Background Twilight Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FFC83D]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FFC83D]/20 text-[#FFC83D] text-xs font-display tracking-wide border border-[#FFC83D]/30">
                    Daily Mastery Loop
                  </span>
                  <span className="text-xs text-slate-400">
                    ~3 minutes
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display text-white leading-tight">
                  Today's Run: Arrays & Recursion
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed">
                  5 interactive challenges designed to build long-term retention. Pure learning actions — no negative marks for absence, no public shaming.
                </p>

                {/* Trail Steps Indicator */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#3DDC97] text-[#1B1740] font-display text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">Quiz</span>
                  </div>
                  <span className="h-0.5 w-6 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FFC83D] text-[#1B1740] font-display text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">Streak</span>
                  </div>
                  <span className="h-0.5 w-6 bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#B26CFF] text-[#1B1740] font-display text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">Vault</span>
                  </div>
                </div>
              </div>

              {/* Companion Character & Big Glowing CTA */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <CompanionAvatar species="FOX" mood="HAPPY" size={96} />
                  <div className="absolute -bottom-2 bg-[#1B1740] px-2.5 py-0.5 rounded-full border border-[#3D3280] text-[10px] text-slate-300 font-bold">
                    Kitsune Idling
                  </div>
                </div>

                <GameButton
                  variant="primary"
                  size="lg"
                  onClick={handleStartRun}
                  icon={<Play className="w-5 h-5 fill-current" />}
                  className="shadow-xl"
                >
                  {alreadyCompletedToday ? "Replay Today's Run" : "Launch Today's Run"}
                </GameButton>
              </div>
            </div>
          </div>

          {/* Daily Coding Practice Quest */}
          <div className="card-quest p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#22E3FF]/30 bg-gradient-to-r from-[#1B1740] to-[#24104F] shadow-lg rounded-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#22E3FF]/20 border border-[#22E3FF]/40 flex items-center justify-center text-[#22E3FF] shrink-0">
                <Code className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs text-[#22E3FF] uppercase tracking-wider">
                    Coding Practice Quest
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFD23F]/20 text-[#FFD23F] font-bold text-[10px] border border-[#FFD23F]/40">
                    +10 to +40 XP
                  </span>
                </div>
                <h4 className="font-display text-sm text-white">
                  Solve 1 Problem on LeetCode / HackerRank or Push to GitHub
                </h4>
                <p className="text-[11px] text-slate-300">
                  {codingSyncNotice || 'Verified solves sync directly into your immutable XP ledger with topic-aligned bonuses.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSyncCodingPractice}
              disabled={codingSyncing}
              className="px-4 py-2 rounded-xl btn-sunset-3d btn-3d-cyan text-xs font-bold shrink-0 flex items-center gap-1.5 self-end sm:self-center"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${codingSyncing ? 'animate-spin' : ''}`} />
              <span>{codingSyncing ? 'Syncing...' : 'Sync Solves'}</span>
            </button>
          </div>

          {/* Active Mistake Monsters Encounter Deck */}
          {activeMonsters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-[#FF5E6C]" />
                  <h3 className="font-display text-sm text-white">
                    Mistake Monsters Awaiting Revenge ({activeMonsters.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Zero grade penalties • Turn-based mastery
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeMonsters.map(monster => (
                  <div
                    key={monster.id}
                    className="card-battle p-4 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <MonsterAvatar family={monster.family || 'OFF_BY_ONE'} tier="COMMON" size={44} />
                      <div>
                        <h4 className="font-bold text-xs text-white">{monster.name}</h4>
                        <p className="text-[11px] text-slate-400">Topic: {monster.topic || 'Arrays'}</p>
                      </div>
                    </div>

                    <GameButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedMonsterForBattle({
                          id: monster.id,
                          name: monster.name,
                          family: monster.family || 'OFF_BY_ONE',
                          tier: 'COMMON',
                          description: monster.description || 'A sneaky error that occurs at array boundaries.',
                          weakness: 'Checking strict less-than inequality < rather than <=.',
                          question: {
                            questionText: 'Which condition prevents an off-by-one index error in array length N?',
                            options: ['i <= N', 'i < N', 'i == N', 'i > N'],
                            correctOptionIndex: 1,
                            explanation: 'Arrays in modern languages are 0-indexed (indices 0 through N-1). Thus i < N is correct.',
                          },
                          xpReward: 40,
                          shardsReward: 25,
                        });
                      }}
                      icon={<Sword className="w-3.5 h-3.5" />}
                    >
                      Fight
                    </GameButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mystery Chest Opening Modal */}
      <MysteryChestOpening
        isOpen={isOpeningChestModal}
        chest={rewardChest || { id: 'vault_demo', tier: 'GOLDEN' }}
        onOpen={handleExecuteChestOpen}
        onClose={() => {
          setIsOpeningChestModal(false);
          onRefreshProfile();
        }}
      />

      {/* Mistake Monster Battle Modal */}
      {selectedMonsterForBattle && (
        <MistakeMonsterBattle
          monster={selectedMonsterForBattle}
          onDefeated={async reward => {
            soundManager.play('levelUp');
            confetti({ particleCount: 70, spread: 70 });
            setSelectedMonsterForBattle(null);
            onRefreshProfile();
            loadTodayData();
          }}
          onClose={() => setSelectedMonsterForBattle(null)}
        />
      )}
    </div>
  );
}
