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
  Sword,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { ChestSVG, ChestTier } from './assets/ChestSVG';
import { MonsterAvatar, MonsterFamily } from './assets/MonsterAvatar';
import { RarityBadge } from './ui/RarityBadge';
import { GameButton } from './ui/GameButton';
import { MysteryChestOpening } from './rewards/MysteryChestOpening';
import { MistakeMonsterBattle } from './monsters/MistakeMonsterBattle';
import { soundManager } from '../lib/sound-manager';
import { useReward } from '../lib/use-reward';

interface CollectionAndChestsProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

export function CollectionAndChests({ user, profile, onRefreshProfile }: CollectionAndChestsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'CHESTS' | 'COSMETICS' | 'CODEX'>('CHESTS');
  const [chests, setChests] = useState<any[]>([]);
  const [pity, setPity] = useState<any>({ rarePity: 2, epicPity: 7 });
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [codex, setCodex] = useState<any[]>([]);
  const [codexCompletion, setCodexCompletion] = useState(0);

  // Modal States
  const [selectedChestToOpen, setSelectedChestToOpen] = useState<any | null>(null);
  const [selectedMonsterToBattle, setSelectedMonsterToBattle] = useState<any | null>(null);

  const { triggerLevelUp } = useReward();

  useEffect(() => {
    loadData();
  }, [user?.id, activeSubTab]);

  const loadData = async () => {
    try {
      const studentId = user?.id || 'student_1';
      if (activeSubTab === 'CHESTS') {
        const res = await api.getChests(studentId);
        setChests(res.chests || []);
        setPity(res.pity || { rarePity: 2, epicPity: 7 });
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

  const handleOpenChestDirect = async (chestId: string) => {
    const studentId = user?.id || 'student_1';
    return await api.openChest(chestId, studentId);
  };

  const handleCraftCosmetic = async (cosmeticId: string) => {
    try {
      const studentId = user?.id || 'student_1';
      await api.craftCosmetic(studentId, cosmeticId);
      triggerLevelUp();
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
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2D2466] pb-3">
        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('CHESTS');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display transition ${
            activeSubTab === 'CHESTS'
              ? 'bg-[#FFC83D] text-[#1B1740] shadow-lg shadow-[#FFC83D]/20'
              : 'bg-[#2D2466] text-slate-300 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Mystery Vaults & Pity</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('COSMETICS');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display transition ${
            activeSubTab === 'COSMETICS'
              ? 'bg-[#4CC9F0] text-[#1B1740] shadow-lg shadow-[#4CC9F0]/20'
              : 'bg-[#2D2466] text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Cosmetics & Shard Workshop</span>
        </button>

        <button
          onClick={() => {
            soundManager.play('tap');
            setActiveSubTab('CODEX');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display transition ${
            activeSubTab === 'CODEX'
              ? 'bg-[#B26CFF] text-[#1B1740] shadow-lg shadow-[#B26CFF]/20'
              : 'bg-[#2D2466] text-slate-300 hover:text-white'
          }`}
        >
          <Book className="w-4 h-4" />
          <span>Monster Codex ({codexCompletion}% Cleared)</span>
        </button>
      </div>

      {/* 1. Mystery Vaults & Pity */}
      {activeSubTab === 'CHESTS' && (
        <div className="space-y-6">
          {/* Pity Counter Bar */}
          <div className="card-reward p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFC83D]" />
                  <span>Fairness Guarantee: Bad-Luck Pity Timers</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Every student reliably receives high-rarity drops regardless of RNG.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-[#4CC9F0]">
                  Guaranteed Rare in: <strong className="text-white">{Math.max(0, 5 - pity.rarePity)}</strong> opens
                </span>
                <span className="text-[#B26CFF]">
                  Guaranteed Epic in: <strong className="text-white">{Math.max(0, 15 - pity.epicPity)}</strong> opens
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Rare Pity Meter</span>
                  <span>{pity.rarePity} / 5</span>
                </div>
                <div className="w-full h-1.5 bg-[#1B1740] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4CC9F0] rounded-full" style={{ width: `${(pity.rarePity / 5) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Epic Pity Meter</span>
                  <span>{pity.epicPity} / 15</span>
                </div>
                <div className="w-full h-1.5 bg-[#1B1740] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B26CFF] rounded-full" style={{ width: `${(pity.epicPity / 15) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Unopened Chests Grid */}
          <div className="space-y-3">
            <h4 className="font-display text-sm text-white">Your Unopened Vaults ({chests.length})</h4>

            {chests.length === 0 ? (
              <div className="card-quiz p-8 text-center text-xs text-slate-400">
                📦 No unopened vaults right now. Complete Today's Run or defeat Bosses to earn more!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {chests.map(chest => (
                  <div
                    key={chest.id}
                    className="card-reward p-5 text-center space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex justify-center py-2">
                      <ChestSVG tier={chest.tier as ChestTier} state="IDLE" size={96} />
                    </div>

                    <div>
                      <h4 className="font-display text-sm text-white">{chest.tier} Mystery Vault</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">{chest.source}</p>
                    </div>

                    <GameButton
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedChestToOpen(chest)}
                    >
                      Unlock Vault
                    </GameButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Cosmetics & Shards */}
      {activeSubTab === 'COSMETICS' && (
        <div className="space-y-6">
          <div className="card-quiz p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm text-white flex items-center gap-2">
                <Hammer className="w-4 h-4 text-[#FFC83D]" />
                <span>Shard Crafting Workshop</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Duplicate items convert into Shards. Spend Shards to craft the exact item you desire!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#1B1740] px-3.5 py-1.5 rounded-xl border border-[#FFC83D]/40">
              <span className="text-xs text-slate-400">Available:</span>
              <span className="text-sm font-display text-[#FFC83D]">💎 {profile?.spendableShards || 0} Shards</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cosmetics.map(item => (
              <div
                key={item.id}
                className="card-reward p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <RarityBadge rarity={item.rarity} />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{item.type}</span>
                  </div>

                  <h4 className="font-display text-sm text-white">{item.name}</h4>
                  <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-[#3D3280] flex items-center justify-between">
                  <span className="font-display text-xs text-[#FFC83D]">
                    💎 {item.shardCost} Shards
                  </span>
                  <GameButton
                    variant="secondary"
                    size="sm"
                    disabled={(profile?.spendableShards || 0) < item.shardCost}
                    onClick={() => handleCraftCosmetic(item.id)}
                  >
                    Craft
                  </GameButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Monster Codex */}
      {activeSubTab === 'CODEX' && (
        <div className="space-y-6">
          <div className="card-monster p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm text-white flex items-center gap-2">
                <Book className="w-4 h-4 text-[#B26CFF]" />
                <span>Mistake Monster Codex</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Every mistake is cataloged without shame. Defeat them in revenge duels to earn mastery trophies!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#1B1740] px-3 py-1.5 rounded-xl border border-[#3D3280]">
              <span className="text-xs text-slate-400">Codex:</span>
              <span className="text-sm font-display text-[#3DDC97]">{codexCompletion}% Cleared</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {codex.map(entry => (
              <div
                key={entry.id}
                className={`card-monster p-4 space-y-3 flex flex-col justify-between ${
                  !entry.isDiscovered ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <RarityBadge rarity={entry.rarity || 'COMMON'} />
                    {entry.isDiscovered ? (
                      <span className="text-[10px] font-bold text-[#3DDC97] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Conquered ×{entry.defeatCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Undiscovered
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <MonsterAvatar family={(entry.family as any) || 'OFF_BY_ONE'} tier="COMMON" size={48} />
                    <div>
                      <h4 className="font-display text-sm text-white">
                        {entry.isDiscovered ? entry.name : 'Unknown Phantom'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {entry.isDiscovered ? entry.lore : 'Make and conquer mistakes in quizzes to unlock.'}
                      </p>
                    </div>
                  </div>
                </div>

                {entry.isDiscovered && (
                  <div className="pt-2 border-t border-[#3D3280]">
                    <GameButton
                      variant="danger"
                      size="sm"
                      fullWidth
                      onClick={() => {
                        setSelectedMonsterToBattle({
                          id: entry.id,
                          name: entry.name,
                          family: (entry.family as MonsterFamily) || 'OFF_BY_ONE',
                          tier: 'COMMON',
                          description: entry.lore || 'A sneaky conceptual error.',
                          weakness: 'Checking array index boundaries.',
                          question: {
                            questionText: 'Which condition prevents accessing an invalid index in array of size N?',
                            options: ['i < N', 'i <= N', 'i == N', 'i > N'],
                            correctOptionIndex: 0,
                            explanation: 'In 0-indexed arrays with length N, valid elements run from 0 to N-1.',
                          },
                          xpReward: 35,
                          shardsReward: 20,
                        });
                      }}
                      icon={<Sword className="w-3.5 h-3.5" />}
                    >
                      Re-challenge Monster
                    </GameButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mystery Chest Opening Modal */}
      {selectedChestToOpen && (
        <MysteryChestOpening
          isOpen={true}
          chest={selectedChestToOpen}
          pity={pity}
          onOpen={handleOpenChestDirect}
          onClose={() => {
            setSelectedChestToOpen(null);
            loadData();
            onRefreshProfile();
          }}
        />
      )}

      {/* Mistake Monster Battle Modal */}
      {selectedMonsterToBattle && (
        <MistakeMonsterBattle
          monster={selectedMonsterToBattle}
          onDefeated={async () => {
            setSelectedMonsterToBattle(null);
            loadData();
            onRefreshProfile();
          }}
          onClose={() => setSelectedMonsterToBattle(null)}
        />
      )}
    </div>
  );
}
