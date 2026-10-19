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
import { AuthModal } from '../components/auth/AuthModal';
import { ConsentModal } from '../components/auth/ConsentModal';
import { OnboardingWizard } from '../components/auth/OnboardingWizard';
import { SessionExpiredModal } from '../components/auth/SessionExpiredModal';
import { ForbiddenPage } from '../components/auth/ForbiddenPage';
import { soundManager } from '../lib/sound-manager';
import { useReward } from '../lib/use-reward';
import { api, setAccessToken } from '../lib/api';
import { Zap, Flame, Gift, RotateCcw, Sparkles, LogIn, KeyRound, Mail, CheckCircle2 } from 'lucide-react';

export type AppTab = StudentGameTab | 'FACULTY' | 'STORYBOOK';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AppTab>('HOME');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth & Lifecycle Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'SIGN_IN' | 'REGISTER' | 'CLAIM'>('SIGN_IN');
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

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
    checkCurrentUser();

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

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentUser();
      if (res && res.user) {
        setUser(res.user);
        setProfile(res.profile);
        await loadQuizQuestions(res.user.id);
      } else {
        // Fallback for seamless demo experience
        bootstrapDemoUser('student@msot.edu.in', 'STUDENT');
      }
    } catch {
      // In demo mode default to student
      bootstrapDemoUser('student@msot.edu.in', 'STUDENT');
    } finally {
      setLoading(false);
    }
  };

  const bootstrapDemoUser = async (email: string, role: string) => {
    try {
      setLoading(true);
      const auth = await api.login({ email, role });
      if (auth.accessToken) {
        setAccessToken(auth.accessToken);
      }
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
            questionText: q.prompt || q.questionText,
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
    } catch {
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
      bootstrapDemoUser('faculty@msot.edu.in', 'FACULTY');
      setCurrentTab('FACULTY');
    } else if (newRole === 'ADMIN') {
      bootstrapDemoUser('admin@msot.edu.in', 'ADMIN');
      setCurrentTab('FACULTY');
    } else {
      bootstrapDemoUser('student@msot.edu.in', 'STUDENT');
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
      soundManager.play('levelUp');
      handleRefreshProfile();
    } catch (err) {
      setRunSummary({
        score: summary.score,
        total: summary.total,
        xpEarned: summary.xpEarned || 45,
        maxCombo: summary.maxCombo,
      });
      setRewardChest({ id: 'vault_today', tier: 'GOLDEN' });
      setQuizState('COMPLETED');
      soundManager.play('levelUp');
    }
  };

  const handleOpenChestDirect = async () => {
    if (!selectedChest) return;
    soundManager.play('chestOpen');
    try {
      const studentId = user?.id || 'student_1';
      await api.openChest(selectedChest.id, studentId);
      triggerLevelUp();
      handleRefreshProfile();
    } catch (err) {
      console.error('Error opening chest:', err);
    }
  };

  const handleTabNavigate = (tab: StudentGameTab) => {
    soundManager.play('tap');
    setCurrentTab(tab);
  };

  const handleVerifyEmail = async () => {
    if (!verifyCode || !user?.email) return;
    soundManager.play('tap');
    try {
      const res = await api.verifyEmail({ code: verifyCode.trim(), email: user.email });
      soundManager.play('correct');
      setUser(res.user);
      setVerifyMsg('Email verified successfully! You are ready to enter.');
    } catch (err: any) {
      soundManager.play('wrong');
      setVerifyMsg(err.message || 'Invalid verification code.');
    }
  };

  // -----------------------------------------------------------
  // Lifecycle Gating:
  // 1. Not Authenticated -> Title Landing Screen
  // 2. EMAIL_VERIFICATION_PENDING -> Email code entry
  // 3. PENDING_APPROVAL -> Friendly approval queue notice
  // 4. CONSENTED / Needs Consent -> ConsentModal
  // 5. PROFILE_SETUP -> OnboardingWizard
  // 6. ACTIVE -> Full game
  // -----------------------------------------------------------

  return (
    <div
      className={`relative min-h-screen font-body text-[#FFF8E7] antialiased selection:bg-[#FFD23F] selection:text-[#24104F] ${
        theme === 'light' ? 'theme-daybreak' : ''
      } ${isDyslexic ? 'font-dyslexic' : ''}`}
    >
      <SunsetSkyBackground />

      {/* 1. Floating Top HUD (Sticky when active) */}
      {user && user.status === 'ACTIVE' && quizState !== 'ACTIVE' && (
        <FloatingGameHUD
          user={user}
          profile={profile}
          onNavigateTab={handleTabNavigate}
        />
      )}

      {/* 2. Main Content Viewport */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[#FFD23F] border-t-transparent animate-spin" />
            <p className="font-display text-sm text-[#FFD23F]">Summoning Realm...</p>
          </div>
        ) : !user ? (
          /* Title Screen / Landing Screen for unauthenticated visitors */
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto py-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD23F]/20 border border-[#FFD23F]/40 text-[#FFD23F] text-xs font-display tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>MSOT Challenge 2026</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide drop-shadow-lg">
                MSOT QUEST
              </h1>
              <p className="text-sm text-slate-300">
                Turn your classes, assignments, and coding practice into daily quests, mystery chests, and campus league glory.
              </p>
            </div>

            <div className="w-32 h-32 my-2 rounded-full p-2 bg-gradient-to-tr from-[#FFD23F] via-[#FF8A2B] to-[#FF3D9A] shadow-2xl flex items-center justify-center">
              <CompanionAvatar species="fox" mood="happy" size={100} />
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={() => {
                  soundManager.play('tap');
                  setAuthInitialTab('SIGN_IN');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3.5 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2 shadow-xl"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Realm / Sign In</span>
              </button>

              <button
                onClick={() => {
                  soundManager.play('tap');
                  setAuthInitialTab('CLAIM');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-[#15062C]/80 hover:bg-[#24104F] border border-white/20 text-xs font-display text-[#22E3FF] flex items-center justify-center gap-2 transition"
              >
                <KeyRound className="w-4 h-4" />
                <span>Claim Roster Invitation</span>
              </button>
            </div>
          </div>
        ) : user.status === 'EMAIL_VERIFICATION_PENDING' ? (
          /* Email Verification Step */
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-[#24104F] border-2 border-[#22E3FF] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#22E3FF]/20 flex items-center justify-center text-[#22E3FF]">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl text-white">Check Your Inbox</h2>
              <p className="text-xs text-slate-300">
                We sent a 6-digit verification code to <strong className="text-[#FFD23F]">{user.email}</strong>. (In local dev, open Mailpit at port 8025).
              </p>
              {verifyMsg && (
                <div className="p-2.5 rounded-xl bg-white/10 text-xs font-bold text-[#FFD23F]">
                  {verifyMsg}
                </div>
              )}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456"
                  className="w-full py-3 rounded-xl bg-[#15062C] border border-white/20 text-center font-mono text-2xl text-white focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
              <button
                onClick={handleVerifyEmail}
                className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-xs font-bold"
              >
                Verify & Continue
              </button>
            </div>
          </div>
        ) : user.status === 'PENDING_APPROVAL' ? (
          /* Pending Approval Queue Screen */
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-[#24104F] border-2 border-[#FFD23F] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FFD23F]/20 flex items-center justify-center text-[#FFD23F]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl text-white">Enrollment Pending Verification</h2>
              <p className="text-xs text-slate-300">
                Your institutional email <strong className="text-[#FFD23F]">{user.email}</strong> is not yet linked on the current semester roster.
              </p>
              <div className="p-3 rounded-2xl bg-[#15062C] text-xs text-slate-400 border border-white/10">
                Your faculty or campus admin has been notified. You will be able to play as soon as your batch enrollment is confirmed!
              </div>
              <button
                onClick={() => handleSwitchRole('STUDENT')}
                className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-bold text-slate-300"
              >
                Switch to Demo Student View
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Active Content */
          <>
            {/* Forbidden Protection for Faculty tab */}
            {currentTab === 'FACULTY' && user.role !== 'FACULTY' && user.role !== 'ADMIN' ? (
              <ForbiddenPage
                requiredRole="FACULTY"
                onReturnHome={() => setCurrentTab('HOME')}
              />
            ) : (
              <>
                {/* TAB: HOME (Daily Run + Lobby Hub) */}
                {currentTab === 'HOME' && (
                  <>
                    {/* Active Interactive Quiz Runner */}
                    {quizState === 'ACTIVE' && (
                      <QuizEngine
                        questions={quizQuestions}
                        onComplete={handleQuizEngineComplete}
                        onExit={() => setQuizState('IDLE')}
                      />
                    )}

                    {/* Quiz Victory / Completion Celebration Screen */}
                    {quizState === 'COMPLETED' && runSummary && (
                      <div className="panel-quest-board max-w-xl mx-auto p-8 text-center space-y-6">
                        <div className="space-y-1">
                          <span className="font-display text-xs text-[#FFD23F] uppercase tracking-wider">
                            Daily run completed
                          </span>
                          <h2 className="font-display text-3xl sm:text-4xl text-white">
                            Victory in the twilight!
                          </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10">
                            <span className="text-[11px] text-slate-400 font-bold block">Score</span>
                            <span className="font-display text-2xl text-[#7CF36B]">
                              {runSummary.score}/{runSummary.total}
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10">
                            <span className="text-[11px] text-slate-400 font-bold block">XP earned</span>
                            <span className="font-display text-2xl text-[#FFD23F] flex items-center justify-center gap-1">
                              <Zap className="w-5 h-5 text-[#FFD23F]" />
                              +{runSummary.xpEarned}
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10">
                            <span className="text-[11px] text-slate-400 font-bold block">Max streak combo</span>
                            <span className="font-display text-2xl text-[#FF8A2B] flex items-center justify-center gap-1">
                              <Flame className="w-5 h-5 text-[#FF8A2B]" />
                              {runSummary.maxCombo}x
                            </span>
                          </div>
                        </div>

                        {rewardChest && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD23F]/20 to-[#FF8A2B]/20 border border-[#FFD23F]/50 space-y-2">
                            <span className="font-display text-xs text-[#FFD23F] block">
                              Reward vault unlocked!
                            </span>
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
                    onLogout={() => {
                      setUser(null);
                      setProfile(null);
                      setAccessToken(null);
                    }}
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
          </>
        )}
      </main>

      {/* 3. Medallion Bottom Navigation */}
      {user && user.status === 'ACTIVE' && quizState !== 'ACTIVE' && currentTab !== 'FACULTY' && currentTab !== 'STORYBOOK' && (
        <GameBottomMenu
          activeTab={
            ['HOME', 'MAP', 'ARENA', 'CODEX', 'ME'].includes(currentTab)
              ? (currentTab as StudentGameTab)
              : 'HOME'
          }
          onSelectTab={tab => handleTabNavigate(tab)}
        />
      )}

      {/* 4. Judge & Game Master Drawer */}
      <GameMasterDrawer
        currentRole={user?.role || 'STUDENT'}
        onSwitchRole={handleSwitchRole}
        onOpenStorybook={() => setCurrentTab('STORYBOOK')}
        onAdvanceDay={async () => {
          soundManager.play('levelUp');
          handleRefreshProfile();
        }}
        onRolloverWeek={async () => {
          soundManager.play('leagueClimb');
          handleRefreshProfile();
        }}
        onSpawnMonster={async () => {
          soundManager.play('gentleWrong');
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

      {/* 5. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authInitialTab}
        onSuccess={(authU, authP) => {
          setUser(authU);
          setProfile(authP);
          setIsAuthModalOpen(false);
          loadQuizQuestions(authU.id);
        }}
      />

      {/* 6. DPDP Act Consent Modal */}
      {user && user.status === 'EMAIL_VERIFIED' && (
        <ConsentModal
          isOpen={true}
          onConsentAccepted={() => {
            setUser({ ...user, status: 'PROFILE_SETUP' });
          }}
        />
      )}

      {/* 7. Onboarding Wizard */}
      {user && user.status === 'PROFILE_SETUP' && (
        <OnboardingWizard
          user={user}
          onComplete={(finU, finP) => {
            setUser(finU);
            if (finP) setProfile(finP);
            handleRefreshProfile();
          }}
        />
      )}

      {/* 8. Session Expired Modal */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onReLogin={() => {
          setIsSessionExpired(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 9. Mystery Chest Opening Modal */}
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

      {/* 10. Mistake Monster Revenge Duel Modal */}
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
            setSelectedMonster(null);
            handleRefreshProfile();
          }}
          onClose={() => setSelectedMonster(null)}
        />
      )}

      {/* 11. Pilot Feedback Survey Modal */}
      <PilotFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />
    </div>
  );
}
