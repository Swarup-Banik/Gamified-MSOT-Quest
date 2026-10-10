'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Map as MapIcon,
  Trophy,
  Package,
  GraduationCap,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { TodayRun } from '../components/TodayRun';
import { SkillTree } from '../components/SkillTree';
import { LeaguesAndBattles } from '../components/LeaguesAndBattles';
import { CollectionAndChests } from '../components/CollectionAndChests';
import { FacultyPortal } from '../components/FacultyPortal';
import { PilotFeedbackModal } from '../components/PilotFeedbackModal';
import { api } from '../lib/api';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'TODAY' | 'MAP' | 'LEAGUES' | 'COLLECTION' | 'FACULTY'>('TODAY');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 pb-20 sm:pb-8">
      {/* Top Navbar */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={(tab: any) => setCurrentTab(tab)}
        user={user}
        profile={profile}
        onToggleAnonymous={handleToggleAnonymous}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold tracking-wide">Entering MSOT Quest...</p>
          </div>
        ) : (
          <>
            {currentTab === 'TODAY' && (
              <TodayRun user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'MAP' && <SkillTree />}
            {currentTab === 'LEAGUES' && (
              <LeaguesAndBattles user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'COLLECTION' && (
              <CollectionAndChests user={user} profile={profile} onRefreshProfile={handleRefreshProfile} />
            )}
            {currentTab === 'FACULTY' && (
              <FacultyPortal user={user} onRefreshProfile={handleRefreshProfile} />
            )}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2 sm:hidden">
        <div className="flex items-center justify-around px-2">
          <button
            onClick={() => setCurrentTab('TODAY')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'TODAY' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>

          <button
            onClick={() => setCurrentTab('MAP')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'MAP' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px]">Map</span>
          </button>

          <button
            onClick={() => setCurrentTab('LEAGUES')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'LEAGUES' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Leagues</span>
          </button>

          <button
            onClick={() => setCurrentTab('COLLECTION')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'COLLECTION' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px]">Vault</span>
          </button>

          <button
            onClick={() => setCurrentTab('FACULTY')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${
              currentTab === 'FACULTY' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px]">Faculty</span>
          </button>
        </div>
      </nav>

      {/* Desktop Secondary Sub-Nav Pills */}
      <div className="hidden sm:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl items-center gap-1">
        <button
          onClick={() => setCurrentTab('TODAY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentTab === 'TODAY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Today's Run</span>
        </button>

        <button
          onClick={() => setCurrentTab('MAP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentTab === 'MAP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Syllabus Map</span>
        </button>

        <button
          onClick={() => setCurrentTab('LEAGUES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentTab === 'LEAGUES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Leagues & Battles</span>
        </button>

        <button
          onClick={() => setCurrentTab('COLLECTION')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentTab === 'COLLECTION' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Collection & Vault</span>
        </button>

        <button
          onClick={() => setCurrentTab('FACULTY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            currentTab === 'FACULTY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Faculty & Admin</span>
        </button>
      </div>

      {/* Pilot Feedback Survey Modal */}
      <PilotFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />
    </div>
  );
}
