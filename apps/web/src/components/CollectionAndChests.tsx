'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gift,
  Hammer,
  Book,
  Lock,
  CheckCircle,
  Gem,
  Award,
  Shield,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { playChestOpenSound, playLevelUpSound } from '../lib/sound';

interface CollectionAndChestsProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

export function CollectionAndChests({ user, profile, onRefreshProfile }: CollectionAndChestsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'CHESTS' | 'COSMETICS' | 'CODEX'>('CHESTS');
  const [chests, setChests] = useState<any[]>([]);
  const [pity, setPity] = useState<any>({ rarePity: 0, epicPity: 0 });
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [codex, setCodex] = useState<any[]>([]);
  const [codexCompletion, setCodexCompletion] = useState(0);
  const [openingChest, setOpeningChest] = useState<any | null>(null);
  const [openedResult, setOpenedResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [user?.id, activeSubTab]);

  const loadData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      if (activeSubTab === 'CHESTS') {
        const res = await api.getChests(studentId);
        setChests(res.chests || []);
        setPity(res.pity || { rarePity: 0, epicPity: 0 });
      } else if (activeSubTab === 'COSMETICS') {
        const res = await api.getCosmeticsCatalog(studentId);
        setCosmetics(res.catalog || []);
      } else if (activeSubTab === 'CODEX') {
        const res = await api.getMonsterCodex(studentId);
        setCodex(res.codex || []);
        setCodexCompletion(res.completionRate || 0);
      }
    } catch (err) {
      console.error('Failed to load collection data', err);
    }
  };

  const handleOpenChest = async (chestId: string) => {
    try {
      setOpeningChest(true);
      playChestOpenSound();
      const studentId = user?.id || 'student_1';
      const result = await api.openChest(chestId, studentId);
      setOpenedResult(result);
      confetti({ particleCount: 70, spread: 80 });
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      alert(err.message || 'Error opening chest');
    } finally {
      setOpeningChest(false);
    }
  };

  const handleCraftCosmetic = async (cosmeticId: string) => {
    try {
      const studentId = user?.id || 'student_1';
      await api.craftCosmetic(studentId, cosmeticId);
      playLevelUpSound();
      confetti({ particleCount: 60, spread: 60 });
      alert('🎉 Cosmetic crafted successfully and added to your wardrobe!');
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      alert(err.message || 'Crafting error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('CHESTS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'CHESTS'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Mystery Chests & Pity</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COSMETICS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'COSMETICS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Cosmetics & Shard Workshop</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CODEX')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'CODEX'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Book className="w-4 h-4" />
          <span>Monster Codex ({codexCompletion}% Complete)</span>
        </button>
      </div>

      {/* 1. Mystery Chests View */}
      {activeSubTab === 'CHESTS' && (
        <div className="space-y-6">
          {/* Pity Counter Bar */}
          <div className="quest-card p-5 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Fairness Guarantee: Pity Timers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every student reliably receives high-rarity drops regardless of RNG.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-indigo-300">
                  Guaranteed Rare in: <strong className="text-white">{Math.max(0, 5 - pity.rarePity)}</strong> chests
                </span>
                <span className="text-purple-300">
                  Guaranteed Epic in: <strong className="text-white">{Math.max(0, 15 - pity.epicPity)}</strong> chests
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Rare Pity Meter</span>
                  <span>{pity.rarePity} / 5</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(pity.rarePity / 5) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Epic Pity Meter</span>
                  <span>{pity.epicPity} / 15</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(pity.epicPity / 15) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Unopened Chests Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">Your Unopened Chests ({chests.length})</h4>

            {chests.length === 0 ? (
              <div className="quest-card p-6 text-center text-xs text-slate-400">
                📦 No unopened chests right now. Complete Today's Run or defeat Bosses to earn more!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {chests.map(chest => (
                  <div
                    key={chest.id}
                    className="quest-card p-5 border border-amber-500/30 hover:border-amber-400 transition text-center space-y-3 bg-gradient-to-b from-slate-900 to-amber-950/20"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10">
                      🎁
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{chest.tier} Mystery Chest</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{chest.source}</p>
                    </div>

                    <button
                      onClick={() => handleOpenChest(chest.id)}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
                    >
                      Open Chest
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Cosmetics & Shard Workshop */}
      {activeSubTab === 'COSMETICS' && (
        <div className="space-y-6">
          <div className="quest-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-indigo-500/20">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Hammer className="w-4 h-4 text-indigo-400" />
                <span>Shard Crafting Workshop</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert duplicate items into Shards. Spend Shards to craft the exact item you desire!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-500/30">
              <span className="text-xs text-slate-400">Available:</span>
              <span className="text-sm font-black text-amber-400">💎 {profile?.spendableShards || 0} Shards</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cosmetics.map(item => {
              const rarityColors: Record<string, string> = {
                COMMON: 'border-slate-700 text-slate-300',
                UNCOMMON: 'border-emerald-500/40 text-emerald-300',
                RARE: 'border-indigo-500/40 text-indigo-300',
                EPIC: 'border-purple-500/40 text-purple-300',
                LEGENDARY: 'border-amber-500/40 text-amber-300',
              };

              return (
                <div
                  key={item.id}
                  className={`quest-card p-4 border transition space-y-3 flex flex-col justify-between ${
                    rarityColors[item.rarity] || 'border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.rarity}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{item.type}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    {item.isOwned ? (
                      <div className="w-full py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Owned & Equipped
                      </div>
                    ) : item.achievementLocked ? (
                      <div className="w-full py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Requires: {item.requiredAchievement}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCraftCosmetic(item.id)}
                        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Gem className="w-3.5 h-3.5 text-amber-300" />
                        <span>Craft for {item.shardCost} Shards</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Monster Codex View */}
      {activeSubTab === 'CODEX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Every defeated mistake monster becomes a permanent trophy in your codex</span>
            <span className="text-purple-400 font-bold">{codexCompletion}% Discovered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {codex.map(entry => (
              <div
                key={entry.id}
                className={`quest-card p-4 border transition ${
                  entry.isDiscovered
                    ? 'border-purple-500/30 bg-purple-950/10'
                    : 'border-slate-800 bg-slate-900/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-purple-300 uppercase">{entry.rarity}</span>
                  {entry.isDiscovered ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Defeated ×{entry.defeatCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Undiscovered
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-white">{entry.isDiscovered ? entry.name : 'Unknown Phantom'}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {entry.isDiscovered ? entry.lore : 'Make and conquer mistakes in curriculum quizzes to unlock.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chest Opened Celebration Modal */}
      {openedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="quest-card max-w-sm w-full p-6 text-center space-y-4 border border-amber-500/50 shadow-2xl animate-scaleIn">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">CHEST REVEAL</span>

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 mx-auto flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
              ✨
            </div>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                {openedResult.cosmetic.rarity}
              </span>
              <h3 className="font-black text-xl text-white mt-1">{openedResult.cosmetic.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{openedResult.cosmetic.type}</p>
            </div>

            {openedResult.isDuplicate ? (
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-amber-300">
                Duplicate item converted into <strong>+{openedResult.shardsAwarded} Shards</strong>!
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-bold">
                🎉 New unique cosmetic added to your wardrobe!
              </div>
            )}

            <button
              onClick={() => setOpenedResult(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
            >
              Collect & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
