'use client';

import React, { useState, useEffect } from 'react';
import { SunsetSkyBackground } from '../components/assets/SunsetSkyBackground';
import { FloatingGameHUD } from '../components/navigation/FloatingGameHUD';
import { GameBottomMenu, StudentGameTab } from '../components/navigation/GameBottomMenu';
import { LobbyHomeScreen } from '../components/home/LobbyHomeScreen';
import { SyllabusWorldMap } from '../components/map/SyllabusWorldMap';
import { LeaguesAndBattles } from '../components/LeaguesAndBattles';
import { CollectionAndChests } from '../components/CollectionAndChests';
import { ProfileAndSettings } from '../components/profile/ProfileAndSettings';
import { FacultyPortal } from '../components/FacultyPortal';
import { StorybookShowcase } from '../components/storybook/StorybookShowcase';
import { GameMasterDrawer } from '../components/demo/GameMasterDrawer';
import { PilotFeedbackModal } from '../components/PilotFeedbackModal';
import { QuizEngine, QuizQuestion } from '../components/quiz/QuizEngine';
import { MysteryChestOpening } from '../components/rewards/MysteryChestOpening';
import { MistakeMonsterBattle } from '../components/monsters/MistakeMonsterBattle';
import { CompanionAvatar } from '../components/assets/CompanionAvatar';
import { ChestSVG } from '../components/assets/ChestSVG';
import { GameButton } from '../components/ui/GameButton';
import { soundManager } from '../lib/sound-manager';
import { useReward } from '../lib/use-reward';
import { api } from '../lib/api';
import { Zap, Flame, Gift, RotateCcw } from 'lucide-react';

export type AppTab = StudentGameTab | 'FACULTY' | 'STORYBOOK';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AppTab>('HOME');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Theme & Accessibility
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isDyslexic, setIsDyslexic] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Active Quiz & Modal States
  const [quizState, setQuizState] = useState<'IDLE' | 'ACTIVE' | 'COMPLETED'>('IDLE');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [runSummary, setRunSummary] = useState<any | null>(null);
  const [rewardChest, setRewardChest] = useState<any | null>(null);

  // Modals for Chest Opening & Monster Battle
  const [selectedChest, setSelectedChest] = useState<any | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<any | null>(null);

  const { triggerLevelUp } = useReward();

  // Multi-format fallback questions
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
    bootstrapUser('student@msot.edu.in', 'STUDENT');

    if (typeof window !== 'undefined') {
      const paramTab = new URLSearchParams(window.location.search).get('tab')?.toUpperCase();
      if (paramTab) {
        if (paramTab === 'TODAY' || paramTab === 'HOME') setCurrentTab('HOME');
        else if (paramTab === 'MAP') setCurrentTab('MAP');
        else if (paramTab === 'ARENA' || paramTab === 'LEAGUES') setCurrentTab('ARENA');
        else if (paramTab === 'CODEX' || paramTab === 'COLLECTION' || paramTab === 'VAULT') setCurrentTab('CODEX');
        else if (paramTab === 'ME' || paramTab === 'PROFILE') setCurrentTab('ME');
        else if (paramTab === 'FACULTY') setCurrentTab('FACULTY');
        else if (paramTab === 'STORYBOOK') setCurrentTab('STORYBOOK');
      }
    }
  }, []);

  const bootstrapUser = async (email: string, role: string) => {
    try {
      setLoading(true);
      const auth = await api.login(email, role);
      setUser(auth.user);
      setProfile(auth.profile);
      await loadQuizQuestions(auth.user?.id || 'student_1');
    } catch (err) {
      console.error('Error logging in demo user', err);
      setQuizQuestions(sampleFallbackQuestions);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizQuestions = async (studentId: string) => {
    try {
      const res = await api.getTodayQuiz(studentId, 'EN');
      if (res.questions && res.questions.length > 0) {
        const mapped = res.questions.map((q: any, idx: number) => {
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
        setQuizQuestions(mapped);
      } else {
        setQuizQuestions(sampleFallbackQuestions);
      }
    } catch (err) {
      setQuizQuestions(sampleFallbackQuestions);
    }
  };

  const handleRefreshProfile = async () => {
    if (!user) return;
    try {
      const res = await api.getProfile(user.id);
      setProfile(res.profile);
    } catch (err) {
      console.error('Error refreshing profile', err);
    }
  };

  const handleToggleAnonymous = async () => {
    if (!user) return;
    try {
      const res = await api.toggleAnonymous(user.id, !user.isAnonymous);
      setUser(res.user);
    } catch (err) {
      console.error('Error toggling anonymity', err);
    }
  };

  const handleSwitchRole = (newRole: string) => {
    soundManager.play('tap');
    if (newRole === 'FACULTY') {
      bootstrapUser('faculty@msot.edu.in', 'FACULTY');
      setCurrentTab('FACULTY');
    } else if (newRole === 'ADMIN') {
      bootstrapUser('admin@msot.edu.in', 'ADMIN');
      setCurrentTab('FACULTY');
    } else {
      bootstrapUser('student@msot.edu.in', 'STUDENT');
      setCurrentTab('HOME');
    }
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

      triggerLevelUp();
      handleRefreshProfile();
    } catch (err: any) {
      console.error('Quiz submit failed', err);
      setQuizState('COMPLETED');
    }
  };

  const handleOpenChestDirect = async (chestId: string) => {
    const studentId = user?.id || 'student_1';
    return await api.openChest(chestId, studentId);
  };

  const handleTabNavigate = (tab: AppTab) => {
    soundManager.play('tap');
    setQuizState('IDLE');
    setCurrentTab(tab);
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative text-[#FFF8E7] pb-24 sm:pb-20 select-none ${
        theme === 'light' ? 'theme-daybreak' : ''
      } ${isDyslexic ? 'font-dyslexic' : ''}`}
    >
      {/* 1. Dynamic Parallax Sky & Island World Background */}
      <SunsetSkyBackground />

      {/* 2. Floating Glass Capsule HUD (Persistent Header) */}
      <FloatingGameHUD
        user={user}
        profile={profile}
        onNavigateTab={handleTabNavigate}
      />

      {/* 3. Main World Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-14 h-14 border-4 border-[#FFD23F] border-t-transparent rounded-full animate-spin shadow-glow-yellow" />
            <p className="font-display text-base text-[#FFD23F] tracking-wide animate-pulse">
              Entering the Sunset Realm...
            </p>
          </div>
        ) : (
          <>
            {/* TAB: HOME (Today's Run Lobby & Quiz Engine) */}
            {currentTab === 'HOME' && (
              <>
                {/* Active Quiz Mode */}
                {quizState === 'ACTIVE' && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          soundManager.play('tap');
                          setQuizState('IDLE');
                        }}
                        className="text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24104F]/60 border border-white/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Leave run</span>
                      </button>
                      <span className="text-xs font-display text-[#FFD23F]">
                        Today's challenge run
                      </span>
                    </div>

                    <QuizEngine
                      questions={quizQuestions}
                      onComplete={handleQuizEngineComplete}
                      onExit={() => setQuizState('IDLE')}
                      allowBlitz={true}
                    />
                  </div>
                )}

                {/* Completed Run Victory Banner */}
                {quizState === 'COMPLETED' && (
                  <div className="panel-reward-tray p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-300 max-w-lg mx-auto">
                    <div className="flex justify-center">
                      <CompanionAvatar species="fox" mood="happy" size={80} />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-display text-[#FFD23F] tracking-wider block">
                        Quest cleared!
                      </span>
                      <h2 className="text-2xl font-display text-white">
                        Today's run complete
                      </h2>
                      <p className="text-xs text-slate-300">
                        Score: {runSummary?.score}/{runSummary?.total} • Max combo: {runSummary?.maxCombo}x
                      </p>
                    </div>

                    {/* XP & Streak banner */}
                    <div className="inline-flex items-center gap-6 bg-[#15062C]/80 border border-white/10 px-6 py-3 rounded-2xl shadow-inner">
                      <div className="flex items-center gap-2 font-display text-base text-[#FFD23F]">
                        <Zap className="w-5 h-5 fill-current" />
                        <span>+{runSummary?.xpEarned || 45} XP</span>
                      </div>
                      <span className="h-4 w-[1px] bg-slate-700" />
                      <div className="flex items-center gap-1.5 font-display text-base text-[#FF8A2B]">
                        <Flame className="w-5 h-5 fill-current" />
                        <span>Streak safe!</span>
                      </div>
                    </div>

                    {/* Procedural Vault Chest Award */}
                    {rewardChest && (
                      <div className="p-4 rounded-2xl bg-[#15062C]/60 border-2 border-[#FFD23F]/50 space-y-3">
                        <div className="flex justify-center">
                          <ChestSVG tier="GOLDEN" state="IDLE" size={90} />
                        </div>
                        <h4 className="font-display text-sm text-white">
                          Golden vault chest earned!
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Bad-luck pity counter advanced towards guaranteed legendary loot.
                        </p>
                        <button
                          onClick={() => {
                            soundManager.play('tap');
                            setSelectedChest({ id: 'vault_today', tier: 'GOLDEN', source: "Today's challenge run" });
                          }}
                          className="btn-sunset-3d btn-3d-yellow w-full py-2.5 rounded-2xl font-display text-xs text-[#24104F] flex items-center justify-center gap-2"
                        >
                          <Gift className="w-4 h-4" />
                          <span>Open mystery vault</span>
                        </button>
                      </div>
                    )}

                    <div>
                      <button
                        onClick={() => {
                          soundManager.play('tap');
                          setQuizState('IDLE');
                        }}
                        className="btn-sunset-3d btn-3d-purple px-6 py-2.5 rounded-2xl font-display text-xs text-white"
                      >
                        Return to lobby
                      </button>
                    </div>
                  </div>
                )}

                {/* Idle / Full Lobby Screen */}
                {quizState === 'IDLE' && (
                  <LobbyHomeScreen
                    user={user}
                    profile={profile}
                    onRefreshProfile={handleRefreshProfile}
                    onLaunchQuiz={() => setQuizState('ACTIVE')}
                    onNavigateTab={handleTabNavigate}
                    onFightMonster={mon => setSelectedMonster(mon)}
                    onOpenChest={chest => setSelectedChest(chest)}
                  />
                )}
              </>
            )}

            {/* TAB: MAP (Syllabus World Map) */}
            {currentTab === 'MAP' && <SyllabusWorldMap />}

            {/* TAB: ARENA (Leagues & Campus Battles) */}
            {currentTab === 'ARENA' && (
              <LeaguesAndBattles
                user={user}
                profile={profile}
                onRefreshProfile={handleRefreshProfile}
              />
            )}

            {/* TAB: CODEX (Monsters, Cosmetics & Mystery Vaults) */}
            {currentTab === 'CODEX' && (
              <CollectionAndChests
                user={user}
                profile={profile}
                onRefreshProfile={handleRefreshProfile}
              />
            )}

            {/* TAB: ME (Profile, Badges & Consolidated Settings) */}
            {currentTab === 'ME' && (
              <ProfileAndSettings
                user={user}
                profile={profile}
                onRefreshProfile={handleRefreshProfile}
                theme={theme}
                onToggleTheme={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                isDyslexic={isDyslexic}
                onToggleDyslexic={() => setIsDyslexic(prev => !prev)}
                onOpenFeedback={() => setIsFeedbackOpen(true)}
                onToggleAnonymous={handleToggleAnonymous}
              />
            )}

            {/* TAB: FACULTY (Game Master Console) */}
            {currentTab === 'FACULTY' && (
              <FacultyPortal user={user} onRefreshProfile={handleRefreshProfile} />
            )}

            {/* TAB: STORYBOOK */}
            {currentTab === 'STORYBOOK' && <StorybookShowcase />}
          </>
        )}
      </main>

      {/* 4. Tactile Medallion Game Menu (Bottom Nav Dock) */}
      {quizState !== 'ACTIVE' && currentTab !== 'FACULTY' && currentTab !== 'STORYBOOK' && (
        <GameBottomMenu
          activeTab={
            ['HOME', 'MAP', 'ARENA', 'CODEX', 'ME'].includes(currentTab)
              ? (currentTab as StudentGameTab)
              : 'HOME'
          }
          onSelectTab={tab => handleTabNavigate(tab)}
        />
      )}

      {/* 5. Discreet Judge & Game Master Drawer (Bottom Right) */}
      <GameMasterDrawer
        currentRole={user?.role || 'STUDENT'}
        onSwitchRole={handleSwitchRole}
        onOpenStorybook={() => setCurrentTab('STORYBOOK')}
        onAdvanceDay={async () => {
          soundManager.play('levelUp');
          alert('Fast-forwarded 1 day: Streak checked, new daily run generated.');
          handleRefreshProfile();
        }}
        onRolloverWeek={async () => {
          soundManager.play('leagueClimb');
          alert('Weekly league rolled over: Top 4 promoted, standings reset.');
          handleRefreshProfile();
        }}
        onSpawnMonster={async () => {
          soundManager.play('gentleWrong');
          alert('Spawned Mistake Monster in queue for student testing.');
        }}
        onAwardChest={async () => {
          soundManager.play('chestOpen');
          setSelectedChest({ id: 'vault_demo', tier: 'EPIC', source: 'GM Award' });
        }}
        onTriggerBurst={async () => {
          soundManager.play('leagueClimb');
          triggerLevelUp();
        }}
        onStartDemoTour={() => {
          alert('3-Minute Tour: Explore Home -> Map -> Arena -> Codex -> Me -> GM Console.');
        }}
      />

      {/* 6. Mystery Chest Opening Modal */}
      <MysteryChestOpening
        isOpen={!!selectedChest}
        chest={selectedChest}
        pity={{ rarePity: 7, epicPity: 22 }}
        onOpen={handleOpenChestDirect}
        onClose={() => {
          setSelectedChest(null);
          handleRefreshProfile();
        }}
      />

      {/* 7. Mistake Monster Revenge Duel Modal */}
      {selectedMonster && (
        <MistakeMonsterBattle
          monster={{
            id: selectedMonster.id || 'mon_1',
            name: selectedMonster.name || 'Off-by-One Imp',
            family: selectedMonster.family || 'OFF_BY_ONE',
            tier: selectedMonster.tier || 'COMMON',
            description: selectedMonster.weakness || 'Prone to index bounds confusion',
            weakness: selectedMonster.weakness || 'Use < instead of <=',
            question: {
              questionText: 'Which iteration bound correctly traverses an array of length N without overflow?',
              options: ['i <= N', 'i < N', 'i <= N + 1', 'i < N - 1'],
              correctOptionIndex: 1,
              explanation: 'Array indices range from 0 to N-1, so i < N stops safely at the last valid index.',
            },
            xpReward: 35,
            shardsReward: 15,
          }}
          onDefeated={reward => {
            soundManager.play('monsterDefeat');
            alert(`Monster purified! Earned +${reward.xp} XP and +${reward.shards} Shards!`);
            setSelectedMonster(null);
            handleRefreshProfile();
          }}
          onClose={() => setSelectedMonster(null)}
        />
      )}

      {/* 8. Pilot Feedback Survey Modal */}
      <PilotFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />
    </div>
  );
}
