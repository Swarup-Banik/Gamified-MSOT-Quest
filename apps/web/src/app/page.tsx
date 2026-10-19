'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Map as MapIcon,
  Trophy,
  Package,
  GraduationCap,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { TodayRun } from '../components/TodayRun';
import { SyllabusWorldMap } from '../components/map/SyllabusWorldMap';
import { LeaguesAndBattles } from '../components/LeaguesAndBattles';
import { CollectionAndChests } from '../components/CollectionAndChests';
import { FacultyPortal } from '../components/FacultyPortal';
import { StorybookShowcase } from '../components/storybook/StorybookShowcase';
import { TimeMachinePanel } from '../components/demo/TimeMachinePanel';
import { PilotFeedbackModal } from '../components/PilotFeedbackModal';
import { api } from '../lib/api';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<
    'TODAY' | 'MAP' | 'LEAGUES' | 'COLLECTION' | 'FACULTY' | 'STORYBOOK'
  >('TODAY');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Themes and accessibility toggles
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isDyslexic, setIsDyslexic] = useState(false);

  useEffect(() => {
    bootstrapUser('student@msot.edu.in', 'STUDENT');
  }, []);

  const bootstrapUser = async (email: string, role: string) => {
    try {
      setLoading(true);
      const auth = await api.login(email, role);
      setUser(auth.user);
      setProfile(auth.profile);
    } catch (err) {
      console.error('Error logging in demo user', err);
    } finally {
      setLoading(false);
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
    if (newRole === 'FACULTY') {
      bootstrapUser('faculty@msot.edu.in', 'FACULTY');
      setCurrentTab('FACULTY');
    } else if (newRole === 'ADMIN') {
      bootstrapUser('admin@msot.edu.in', 'ADMIN');
      setCurrentTab('FACULTY');
    } else {
      bootstrapUser('student@msot.edu.in', 'STUDENT');
      setCurrentTab('TODAY');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleDyslexic = () => {
    setIsDyslexic(prev => !prev);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 pb-24 sm:pb-12 ${
        theme === 'light' ? 'theme-daybreak bg-amber-50 text-slate-900' : 'bg-[#1B1740] text-slate-100'
      } ${isDyslexic ? 'font-dyslexic' : ''}`}
    >
      {/* Top HUD Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={(tab: any) => setCurrentTab(tab)}
        user={user}
        profile={profile}
        onToggleAnonymous={handleToggleAnonymous}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onSwitchRole={handleSwitchRole}
        theme={theme}
        onToggleTheme={toggleTheme}
        isDyslexic={isDyslexic}
        onToggleDyslexic={toggleDyslexic}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-3">
            <div className="w-12 h-12 border-4 border-[#FFC83D] border-t-transparent rounded-full animate-spin" />
            <p className="font-display text-sm text-[#FFC83D] tracking-wide">
              Entering Campus Realm...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'TODAY' && (
              <TodayRun user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'MAP' && <SyllabusWorldMap />}
            {currentTab === 'LEAGUES' && (
              <LeaguesAndBattles user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'COLLECTION' && (
              <CollectionAndChests user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'FACULTY' && (
              <FacultyPortal user={user} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'STORYBOOK' && <StorybookShowcase />}
          </>
        )}
      </main>

      {/* Mobile-First Tactile Game Menu (Bottom Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1B1740]/95 backdrop-blur-md border-t border-[#2D2466] py-2 sm:hidden shadow-2xl">
        <div className="flex items-center justify-around px-2">
          <button
            onClick={() => setCurrentTab('TODAY')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'TODAY'
                ? 'text-[#FFC83D] font-display scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>

          <button
            onClick={() => setCurrentTab('MAP')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'MAP'
                ? 'text-[#FFC83D] font-display scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px]">Map</span>
          </button>

          <button
            onClick={() => setCurrentTab('LEAGUES')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'LEAGUES'
                ? 'text-[#FFC83D] font-display scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Arena</span>
          </button>

          <button
            onClick={() => setCurrentTab('COLLECTION')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'COLLECTION'
                ? 'text-[#FFC83D] font-display scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px]">Vault</span>
          </button>

          <button
            onClick={() => setCurrentTab('FACULTY')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'FACULTY'
                ? 'text-[#FFC83D] font-display scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px]">Faculty</span>
          </button>
        </div>
      </nav>

      {/* Desktop Secondary Tactile Floating Pills */}
      <div className="hidden sm:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#1B1740]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border-2 border-[#2D2466] shadow-2xl items-center gap-1.5">
        <button
          onClick={() => setCurrentTab('TODAY')}
          style={currentTab === 'TODAY' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'TODAY'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Today's run</span>
        </button>

        <button
          onClick={() => setCurrentTab('MAP')}
          style={currentTab === 'MAP' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'MAP'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Syllabus map</span>
        </button>

        <button
          onClick={() => setCurrentTab('LEAGUES')}
          style={currentTab === 'LEAGUES' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'LEAGUES'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Campus arena</span>
        </button>

        <button
          onClick={() => setCurrentTab('COLLECTION')}
          style={currentTab === 'COLLECTION' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'COLLECTION'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Vault & codex</span>
        </button>

        <button
          onClick={() => setCurrentTab('FACULTY')}
          style={currentTab === 'FACULTY' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'FACULTY'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Game master console</span>
        </button>

        <button
          onClick={() => setCurrentTab('STORYBOOK')}
          style={currentTab === 'STORYBOOK' ? { borderBottom: '3px solid #D99818' } : undefined}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display transition active:translate-y-0.5 ${
            currentTab === 'STORYBOOK'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/30'
              : 'text-slate-300 hover:text-white hover:bg-[#2D2466]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Storybook</span>
        </button>
      </div>

      {/* Floating Judge & Demo Time Machine */}
      <TimeMachinePanel
        onRefresh={handleRefreshProfile}
        onSelectTab={(tab: any) => setCurrentTab(tab)}
      />

      {/* Pilot Feedback Survey Modal */}
      <PilotFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />
    </div>
  );
}
