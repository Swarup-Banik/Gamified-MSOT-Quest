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
  X,
  Check,
  ChevronRight,
  Flame,
  User,
  Heart,
  Image as ImageIcon,
  Square,
  Bookmark,
} from 'lucide-react';
import { api } from '../lib/api';
import { ChestSVG, ChestTier } from './assets/ChestSVG';
import { MonsterAvatar, MonsterFamily } from './assets/MonsterAvatar';
import { RarityBadge } from './ui/RarityBadge';
import { GameButton } from './ui/GameButton';
import { MysteryChestOpening } from './rewards/MysteryChestOpening';
import { MistakeMonsterBattle } from './monsters/MistakeMonsterBattle';
import { soundManager } from '../lib/sound-manager';
import { useReward } from '../lib/use-reward';
import { CosmeticSlot, CosmeticRarity, EquippedLoadout } from '@msot/shared';
import { CosmeticPreview } from './assets/AssetAdapter';
import { AvatarComposer } from './assets/AvatarComposer';
import { FrameGenerator } from './assets/FrameGenerator';
import { BannerGenerator } from './assets/BannerGenerator';
import { FlameGenerator } from './assets/FlameGenerator';
import { TitleBadge } from './assets/TitleBadge';

interface CollectionAndChestsProps {
  user: any;
  profile: any;
  onRefreshProfile: () => void;
}

const COSMETIC_SLOTS: { id: CosmeticSlot | 'ALL'; label: string; icon: any }[] = [
  { id: 'AVATAR_SKIN', label: 'Avatars', icon: User },
  { id: 'COMPANION_SKIN', label: 'Companions', icon: Heart },
  { id: 'PROFILE_BANNER', label: 'Banners', icon: ImageIcon },
  { id: 'FRAME', label: 'Frames', icon: Square },
  { id: 'TITLE', label: 'Titles', icon: Bookmark },
  { id: 'STREAK_FLAME', label: 'Flames', icon: Flame },
  { id: 'LEVELUP_EFFECT', label: 'Effects', icon: Sparkles },
];

const RARITY_CHIPS: { id: 'ALL' | CosmeticRarity; label: string; symbol: string; color: string }[] = [
  { id: 'ALL', label: 'All Tiers', symbol: '✦', color: 'text-slate-300' },
  { id: 'COMMON', label: 'Common', symbol: '●', color: 'text-slate-400' },
  { id: 'UNCOMMON', label: 'Uncommon', symbol: '◆', color: 'text-emerald-400' },
  { id: 'RARE', label: 'Rare', symbol: '⬢', color: 'text-sky-400' },
  { id: 'EPIC', label: 'Epic', symbol: '★', color: 'text-purple-400' },
  { id: 'LEGENDARY', label: 'Legendary', symbol: '👑', color: 'text-amber-400' },
];

export function CollectionAndChests({ user, profile, onRefreshProfile }: CollectionAndChestsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'WARDROBE' | 'CHESTS' | 'CODEX'>('WARDROBE');
  const [selectedSlot, setSelectedSlot] = useState<CosmeticSlot>('AVATAR_SKIN');
  const [selectedRarity, setSelectedRarity] = useState<'ALL' | CosmeticRarity>('ALL');

  // Cosmetics & Catalogue
  const [catalog, setCatalog] = useState<any[]>([]);
  const [equippedLoadout, setEquippedLoadout] = useState<EquippedLoadout>(
    user?.equippedLoadout || profile?.equippedLoadout || {
      avatar: 'cosm_avatar_fox_starter',
      companion: 'cosm_comp_kitsune_starter',
      banner: 'cosm_banner_sunset_starter',
      frame: 'cosm_frame_wood_starter',
      title: 'cosm_title_junior_scholar',
      streakFlame: 'cosm_flame_warm_lantern',
      levelupEffect: 'cosm_effect_confetti_spark',
    }
  );
  const [completionBySlot, setCompletionBySlot] = useState<Record<string, { owned: number; total: number; percent: number }>>({});
  const [totalCompletionPercent, setTotalCompletionPercent] = useState<number>(17);
  const [spendableShards, setSpendableShards] = useState<number>(profile?.spendableShards || 250);

  // Chests & Codex
  const [chests, setChests] = useState<any[]>([]);
  const [pity, setPity] = useState<any>({ rarePity: 2, epicPity: 7 });
  const [codex, setCodex] = useState<any[]>([]);
  const [codexCompletion, setCodexCompletion] = useState(0);

  // Modals & Inspection
  const [selectedChestToOpen, setSelectedChestToOpen] = useState<any | null>(null);
  const [selectedMonsterToBattle, setSelectedMonsterToBattle] = useState<any | null>(null);
  const [inspectedCosmetic, setInspectedCosmetic] = useState<any | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const { triggerLevelUp } = useReward();

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, [user?.id, activeSubTab]);

  const loadData = async () => {
    const studentId = user?.id || 'student_1';
    try {
      if (activeSubTab === 'WARDROBE') {
        const res = await api.getCosmeticsCatalog(studentId);
        setCatalog(res.catalog || []);
        if (res.equippedLoadout) {
          setEquippedLoadout(res.equippedLoadout);
        }
        if (res.completionBySlot) {
          setCompletionBySlot(res.completionBySlot);
        }
        if (typeof res.totalCompletionPercent === 'number') {
          setTotalCompletionPercent(res.totalCompletionPercent);
        }
        if (typeof res.spendableShards === 'number') {
          setSpendableShards(res.spendableShards);
        }
      } else if (activeSubTab === 'CHESTS') {
        const res = await api.getChests(studentId);
        setChests(res.chests || []);
        setPity(res.pity || { rarePity: 2, epicPity: 7 });
      } else if (activeSubTab === 'CODEX') {
        const res = await api.getMonsterCodex(studentId);
        setCodex(res.codex || []);
        setCodexCompletion(res.completionRate || 0);
      }
    } catch (err) {
      console.error('Failed to load collection data', err);
    }
  };

  const handleEquip = async (cosmetic: any) => {
    soundManager.play('tap');
    const studentId = user?.id || 'student_1';
    try {
      const res = await api.equipCosmetic(cosmetic.id, studentId, cosmetic.slot);
      if (res.equippedLoadout) {
        setEquippedLoadout(res.equippedLoadout);
      }
      soundManager.play('correct');
      showNotice(`Equipped ${cosmetic.name} into your active loadout!`);
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      soundManager.play('wrong');
      showNotice(err.message || 'Failed to equip cosmetic');
    }
  };

  const handleCraftCosmetic = async (cosmeticId: string) => {
    try {
      soundManager.play('tap');
      const studentId = user?.id || 'student_1';
      await api.craftCosmetic(studentId, cosmeticId);
      triggerLevelUp();
      soundManager.play('levelUp');
      showNotice('🎉 Cosmetic crafted and added to your wardrobe!');
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      soundManager.play('wrong');
      showNotice(err.message || 'Crafting error');
    }
  };

  const handleOpenChestDirect = async (chestId: string) => {
    const studentId = user?.id || 'student_1';
    return await api.openChest(chestId, studentId);
  };

  // Filtered catalogue
  const filteredCatalog = catalog.filter(item => {
    const slotMatch = item.slot === selectedSlot;
    const rarityMatch = selectedRarity === 'ALL' || item.rarity === selectedRarity;
    return slotMatch && rarityMatch;
  });

  const activeSlotStats = completionBySlot[selectedSlot] || { owned: 0, total: 1, percent: 0 };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#15062C]/95 border-2 border-[#FFC83D] text-[#FFF8E7] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-display animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#FFC83D] animate-spin" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Mode Tabs: WARDROBE (Cosmetics Collection), CHESTS, CODEX */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D2466] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.play('tap');
              setActiveSubTab('WARDROBE');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-display transition active:scale-95 ${
              activeSubTab === 'WARDROBE'
                ? 'bg-[#FFC83D] text-[#1B1740] shadow-glow-yellow font-bold'
                : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cosmetics Collection</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('tap');
              setActiveSubTab('CHESTS');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-display transition active:scale-95 ${
              activeSubTab === 'CHESTS'
                ? 'bg-[#3DDC97] text-[#1B1740] shadow-glow-lime font-bold'
                : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Mystery Vaults ({chests.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('tap');
              setActiveSubTab('CODEX');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-display transition active:scale-95 ${
              activeSubTab === 'CODEX'
                ? 'bg-[#B26CFF] text-white shadow-glow-purple font-bold'
                : 'bg-[#24104F]/80 text-[#FFF8E7]/70 hover:text-white hover:bg-[#5B2EE0]/40 border border-white/10'
            }`}
          >
            <Book className="w-4 h-4" />
            <span>Monster Codex</span>
          </button>
        </div>

        {/* Shards Balance Pill */}
        <div className="flex items-center gap-2 bg-[#1B1740] px-4 py-2 rounded-2xl border border-[#FFC83D]/40 shadow-inner">
          <Gem className="w-4 h-4 text-[#FFC83D]" />
          <span className="text-xs text-slate-300">Shards:</span>
          <span className="font-display text-sm text-[#FFC83D]">{spendableShards}</span>
        </div>
      </div>

      {/* 1. COSMETICS COLLECTION (Sunset Realm Wardrobe) */}
      {activeSubTab === 'WARDROBE' && (
        <div className="space-y-6">
          {/* Collection Progress & Equipped Spotlight Banner */}
          <div className="panel-quest-board p-5 rounded-3xl bg-gradient-to-r from-[#24104F] via-[#351C66] to-[#24104F] border-2 border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Overall Completion Progress */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* SVG Radial Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-twilight-950/60"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#FFC83D]"
                    strokeDasharray={`${totalCompletionPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-display text-xs text-[#FFC83D] font-black">
                  {totalCompletionPercent}%
                </span>
              </div>

              <div>
                <h3 className="font-display text-base text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FFC83D]" />
                  <span>Grand Collection Codex</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Unlocked across 7 gear slots: Avatars, Companions, Banners, Frames, Titles, Flames & Effects.
                </p>
                <div className="text-[11px] text-[#3DDC97] font-semibold mt-1">
                  Active slot: {activeSlotStats.owned} / {activeSlotStats.total} unlocked ({activeSlotStats.percent}%)
                </div>
              </div>
            </div>

            {/* Right: Active Equipped Loadout Micro-Preview */}
            <div className="flex items-center gap-3 bg-[#15062C]/70 px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="relative">
                <FrameGenerator
                  frameKey={equippedLoadout.frame || 'frame_rustic_wood'}
                  size={52}
                >
                  <AvatarComposer
                    avatarKey={equippedLoadout.avatar || 'avatar_fox_novice'}
                    size={42}
                  />
                </FrameGenerator>
              </div>

              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Active Loadout
                </span>
                <TitleBadge
                  titleKey={equippedLoadout.title || 'title_junior_scholar'}
                  size="sm"
                  className="mt-0.5"
                />
              </div>

              <FlameGenerator
                flameKey={equippedLoadout.streakFlame || 'flame_warm_lantern'}
                size={28}
                className="ml-1"
              />
            </div>
          </div>

          {/* 7 Slot Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {COSMETIC_SLOTS.map(slot => {
              const Icon = slot.icon;
              const isSelected = selectedSlot === slot.id;
              const slotStats = completionBySlot[slot.id] || { owned: 0, total: 0, percent: 0 };

              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    soundManager.play('tap');
                    setSelectedSlot(slot.id as CosmeticSlot);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-display whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-[#FFC83D] text-[#1B1740] font-black shadow-md'
                      : 'bg-[#24104F]/60 text-slate-300 hover:text-white hover:bg-[#24104F] border border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{slot.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-bold ${
                      isSelected ? 'bg-[#1B1740] text-[#FFC83D]' : 'bg-[#15062C] text-slate-400'
                    }`}
                  >
                    {slotStats.owned}/{slotStats.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rarity Filter Chips (with shape / icon for colorblind accessibility) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {RARITY_CHIPS.map(chip => {
              const isSelected = selectedRarity === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    soundManager.play('tap');
                    setSelectedRarity(chip.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display transition active:scale-95 ${
                    isSelected
                      ? 'bg-white/20 text-white border-2 border-white shadow-sm font-bold'
                      : 'bg-[#15062C]/60 text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  <span className={`${chip.color} text-xs`} aria-hidden="true">
                    {chip.symbol}
                  </span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cosmetics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
            {filteredCatalog.map(item => {
              const isEquipped = Object.values(equippedLoadout).includes(item.id);
              const isLocked = !item.isOwned;

              return (
                <div
                  key={item.id}
                  onClick={() => setInspectedCosmetic(item)}
                  className={`group relative card-reward p-4 rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer border-2 hover:border-[#FFC83D]/70 hover:-translate-y-1 hover:shadow-2xl ${
                    isEquipped
                      ? 'border-[#FFC83D] bg-gradient-to-b from-[#351C66] to-[#24104F]'
                      : isLocked
                      ? 'border-white/10 bg-[#1B1740]/80 opacity-90'
                      : 'border-white/15 bg-[#24104F]/90'
                  }`}
                >
                  {/* Top Bar: Rarity Badge and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <RarityBadge rarity={item.rarity} />
                    {isEquipped ? (
                      <span className="text-[11px] font-display font-black bg-[#FFC83D] text-[#1B1740] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> EQUIPPED
                      </span>
                    ) : isLocked ? (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#3DDC97] bg-[#3DDC97]/15 px-2 py-0.5 rounded-full border border-[#3DDC97]/30">
                        OWNED
                      </span>
                    )}
                  </div>

                  {/* Procedural Graphic Preview Container */}
                  <div className="h-32 w-full rounded-2xl bg-gradient-to-b from-[#15062C] to-[#1E0B3B] border border-white/10 flex items-center justify-center p-2 overflow-hidden shadow-inner mb-3">
                    <CosmeticPreview
                      slot={item.slot}
                      assetKey={item.assetKey}
                      rarity={item.rarity}
                      name={item.name}
                      size={92}
                      silhouette={isLocked}
                    />
                  </div>

                  {/* Item Lore & Details */}
                  <div className="space-y-1 mb-3">
                    <h4 className="font-display text-sm text-white group-hover:text-[#FFC83D] transition-colors leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                      {item.description}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <Sparkles className="w-3 h-3 text-[#FFC83D]" />
                      <span>{item.unlockCondition || 'Available in Mystery Vaults'}</span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {item.isOwned ? (
                      isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-xl bg-[#FFC83D]/20 text-[#FFC83D] font-display text-xs border border-[#FFC83D]/40 font-bold"
                        >
                          Active Loadout
                        </button>
                      ) : (
                        <GameButton
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquip(item);
                          }}
                        >
                          Equip
                        </GameButton>
                      )
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-display text-[#FFC83D]">
                          💎 {item.shardCost} Shards
                        </span>
                        <GameButton
                          variant="secondary"
                          size="sm"
                          disabled={spendableShards < item.shardCost}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCraftCosmetic(item.id);
                          }}
                        >
                          Craft
                        </GameButton>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="panel-quest-board p-10 text-center space-y-2 rounded-3xl">
              <span className="text-3xl block">🔍</span>
              <h4 className="font-display text-sm text-white">No items found</h4>
              <p className="text-xs text-slate-400">
                Try selecting a different rarity filter or gear slot.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. MYSTERY VAULTS (Chests) */}
      {activeSubTab === 'CHESTS' && (
        <div className="space-y-6">
          {/* Pity Meters Banner */}
          <div className="card-reward p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFC83D]" />
                <span>Fair Play Mystery Vaults</span>
              </h3>
              <span className="text-xs text-slate-300">
                Guaranteed drops ensure bad-luck protection!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Rare Pity */}
              <div className="bg-[#1B1740] p-3 rounded-2xl border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4CC9F0] font-bold">Guaranteed Rare or Better</span>
                  <span className="text-white font-mono">{pity.rarePity || 0}/5 opens</span>
                </div>
                <div className="w-full h-2 bg-[#15062C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4CC9F0] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((pity.rarePity || 0) / 5) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Epic Pity */}
              <div className="bg-[#1B1740] p-3 rounded-2xl border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#B26CFF] font-bold">Guaranteed Epic or Better</span>
                  <span className="text-white font-mono">{pity.epicPity || 0}/15 opens</span>
                </div>
                <div className="w-full h-2 bg-[#15062C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B26CFF] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((pity.epicPity || 0) / 15) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Unopened Chests Grid */}
          <div className="space-y-3">
            <h4 className="font-display text-sm text-white">Your Unopened Vaults ({chests.length})</h4>

            {chests.length === 0 ? (
              <div className="panel-quest-board p-8 text-center text-xs text-slate-300 rounded-3xl">
                📦 No unopened vaults right now. Complete Today's Run or defeat Bosses to earn more!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {chests.map(chest => (
                  <div
                    key={chest.id}
                    className="card-reward p-5 rounded-3xl text-center space-y-3 flex flex-col justify-between border-2 border-white/10 hover:border-[#FFC83D]/60 transition"
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

      {/* 3. MONSTER CODEX */}
      {activeSubTab === 'CODEX' && (
        <div className="space-y-6">
          <div className="card-monster p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-[#B26CFF]" />
                <span>Mistake Monster Codex</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Every mistake is cataloged without shame. Defeat them in revenge duels to earn mastery trophies!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#1B1740] px-4 py-2 rounded-2xl border border-[#3D3280]">
              <span className="text-xs text-slate-400">Codex:</span>
              <span className="text-sm font-display text-[#3DDC97]">{codexCompletion}% Cleared</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {codex.map(entry => (
              <div
                key={entry.id}
                className={`card-monster p-4 rounded-3xl space-y-3 flex flex-col justify-between ${
                  !entry.isDiscovered ? 'opacity-60' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <RarityBadge rarity={entry.rarity || 'COMMON'} />
                    {entry.isDiscovered ? (
                      <span className="text-[10px] font-bold text-[#3DDC97] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Conquered ×{entry.defeatCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Undiscovered
                      </span>
                    )}
                  </div>

                  <div className="flex justify-center py-2">
                    <MonsterAvatar
                      family={entry.speciesKey as MonsterFamily}
                      rarity={entry.rarity}
                      size={80}
                      className={!entry.isDiscovered ? 'filter grayscale opacity-40' : ''}
                    />
                  </div>

                  <h4 className="font-display text-sm text-white text-center">{entry.name}</h4>
                  <p className="text-xs text-slate-300 text-center mt-0.5">{entry.topic}</p>
                </div>

                <div className="pt-2 border-t border-[#3D3280]">
                  {entry.isDiscovered && entry.needsReview ? (
                    <GameButton
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedMonsterToBattle(entry)}
                    >
                      Revenge Duel
                    </GameButton>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 py-1">
                      {entry.isDiscovered ? 'Mastered Topic' : 'Encounter in Quizzes'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECT COSMETIC MODAL / SHEET */}
      {inspectedCosmetic && (
        <div className="fixed inset-0 z-50 bg-[#15062C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#24104F] border-2 border-[#FFC83D] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <RarityBadge rarity={inspectedCosmetic.rarity} />
                <span className="text-xs uppercase font-mono tracking-wider text-slate-300">
                  {inspectedCosmetic.slot}
                </span>
              </div>
              <button
                onClick={() => setInspectedCosmetic(null)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Centerpiece Visual Art */}
            <div className="h-44 w-full rounded-2xl bg-gradient-to-b from-[#15062C] to-[#1E0B3B] border border-white/15 flex items-center justify-center p-4 shadow-inner">
              <CosmeticPreview
                slot={inspectedCosmetic.slot}
                assetKey={inspectedCosmetic.assetKey}
                rarity={inspectedCosmetic.rarity}
                name={inspectedCosmetic.name}
                size={140}
                silhouette={!inspectedCosmetic.isOwned}
              />
            </div>

            {/* Lore and Details */}
            <div className="space-y-2">
              <h3 className="font-display text-xl text-white">
                {inspectedCosmetic.name}
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {inspectedCosmetic.description}
              </p>
              <div className="p-3 rounded-xl bg-[#15062C]/70 border border-white/10 text-xs space-y-1">
                <span className="text-[#FFC83D] font-bold block">Unlock Condition:</span>
                <span className="text-slate-300">
                  {inspectedCosmetic.unlockCondition || 'Obtainable in Mystery Vaults or Crafting Workshop'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              {inspectedCosmetic.isOwned ? (
                Object.values(equippedLoadout).includes(inspectedCosmetic.id) ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-2xl bg-[#FFC83D]/20 text-[#FFC83D] font-display text-sm border border-[#FFC83D]/40 font-bold"
                  >
                    Currently Equipped
                  </button>
                ) : (
                  <GameButton
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      handleEquip(inspectedCosmetic);
                      setInspectedCosmetic(null);
                    }}
                  >
                    Equip to {inspectedCosmetic.slot}
                  </GameButton>
                )
              ) : (
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="font-display text-sm text-[#FFC83D]">
                    💎 {inspectedCosmetic.shardCost} Shards
                  </span>
                  <GameButton
                    variant="primary"
                    size="md"
                    disabled={spendableShards < inspectedCosmetic.shardCost}
                    onClick={() => {
                      handleCraftCosmetic(inspectedCosmetic.id);
                      setInspectedCosmetic(null);
                    }}
                  >
                    Craft with Shards
                  </GameButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHEST OPENING MODAL */}
      {selectedChestToOpen && (
        <MysteryChestOpening
          isOpen={!!selectedChestToOpen}
          chest={selectedChestToOpen}
          pity={pity}
          onOpen={async (id) => await handleOpenChestDirect(id)}
          onClose={() => {
            setSelectedChestToOpen(null);
            loadData();
            onRefreshProfile();
          }}
        />
      )}

      {/* MISTAKE MONSTER REVENGE DUEL MODAL */}
      {selectedMonsterToBattle && (
        <MistakeMonsterBattle
          monster={selectedMonsterToBattle}
          onDefeated={(reward) => {
            showNotice(`Monster conquered! Earned +${reward.xp} XP and +${reward.shards} Shards!`);
            setSelectedMonsterToBattle(null);
            loadData();
            onRefreshProfile();
          }}
          onClose={() => {
            setSelectedMonsterToBattle(null);
            loadData();
            onRefreshProfile();
          }}
        />
      )}
    </div>
  );
}
