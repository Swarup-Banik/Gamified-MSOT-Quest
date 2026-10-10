import {
  Cosmetic,
  CosmeticRarity,
  Chest,
  ChestTier,
} from '@msot/shared';
import { db } from '../db.js';

export class CosmeticsService {
  /**
   * Initializes starter cosmetic catalog across all rarity tiers
   */
  async initializeDefaultCosmetics(): Promise<void> {
    const defaultItems: Omit<Cosmetic, 'id'>[] = [
      // Avatars & Companion Skins
      {
        name: 'Cyber Falcon Cadet',
        type: 'AVATAR_SKIN',
        rarity: 'COMMON',
        shardCost: 50,
        achievementLocked: false,
        previewUrl: '/cosmetics/falcon-cadet.svg',
      },
      {
        name: 'Quantum Neon Scholar',
        type: 'AVATAR_SKIN',
        rarity: 'RARE',
        shardCost: 200,
        achievementLocked: false,
        previewUrl: '/cosmetics/quantum-scholar.svg',
      },
      {
        name: 'Aetherial Celestial Dragon',
        type: 'COMPANION_SKIN',
        rarity: 'LEGENDARY',
        shardCost: 1000,
        achievementLocked: true,
        requiredAchievement: '30_DAY_STREAK',
        previewUrl: '/cosmetics/celestial-dragon.svg',
      },
      // Frames & Titles
      {
        name: 'Gilded Top-Coder Frame',
        type: 'FRAME',
        rarity: 'EPIC',
        shardCost: 450,
        achievementLocked: false,
        previewUrl: '/cosmetics/gilded-frame.svg',
      },
      {
        name: 'Title: "Bug Annihilator"',
        type: 'TITLE',
        rarity: 'UNCOMMON',
        shardCost: 100,
        achievementLocked: false,
        previewUrl: '/cosmetics/title-bug.svg',
      },
      // Streak Flames & Level-up Effects
      {
        name: 'Supernova Blue Flame',
        type: 'STREAK_FLAME',
        rarity: 'RARE',
        shardCost: 250,
        achievementLocked: false,
        previewUrl: '/cosmetics/blue-flame.svg',
      },
      {
        name: 'Cosmic Particle Level Burst',
        type: 'LEVELUP_EFFECT',
        rarity: 'LEGENDARY',
        shardCost: 1200,
        achievementLocked: true,
        requiredAchievement: 'DEFEAT_COURSE_BOSS',
        previewUrl: '/cosmetics/level-burst.svg',
      },
    ];

    for (let i = 0; i < defaultItems.length; i++) {
      const item = defaultItems[i];
      const id = `cosm_${i + 1}`;
      if (!db.cosmetics.has(id)) {
        db.cosmetics.set(id, { id, ...item });
      }
    }
  }

  /**
   * Opens an unopened mystery chest.
   * Implements strict pity timers:
   * - Guaranteed RARE or better after 5 chests
   * - Guaranteed EPIC or better after 15 chests
   * Converts duplicates into Shards.
   */
  async openChest(chestId: string, studentId: string): Promise<{
    chest: Chest;
    cosmetic: Cosmetic;
    isDuplicate: boolean;
    shardsAwarded: number;
    newTotalShards: number;
    pityState: { rarePity: number; epicPity: number };
  }> {
    const chest = db.chests.get(chestId);
    if (!chest) throw new Error('Chest not found');
    if (chest.status === 'OPENED') throw new Error('Chest already opened');

    let pity = db.pityCounters.get(studentId) || { rarePity: 0, epicPity: 0 };
    pity.rarePity += 1;
    pity.epicPity += 1;

    // Determine Rarity
    let selectedRarity: CosmeticRarity = 'COMMON';

    if (pity.epicPity >= 15) {
      selectedRarity = 'EPIC';
      pity.epicPity = 0;
      pity.rarePity = 0;
    } else if (pity.rarePity >= 5) {
      selectedRarity = 'RARE';
      pity.rarePity = 0;
    } else {
      // Standard roll based on chest tier
      const roll = Math.random() * 100;
      if (chest.tier === 'LEGENDARY' && roll < 20) {
        selectedRarity = 'LEGENDARY';
      } else if (roll < 3) {
        selectedRarity = 'LEGENDARY';
      } else if (roll < 12) {
        selectedRarity = 'EPIC';
      } else if (roll < 35) {
        selectedRarity = 'RARE';
      } else if (roll < 70) {
        selectedRarity = 'UNCOMMON';
      } else {
        selectedRarity = 'COMMON';
      }

      if (selectedRarity === 'LEGENDARY' || selectedRarity === 'EPIC') {
        pity.epicPity = 0;
        pity.rarePity = 0;
      } else if (selectedRarity === 'RARE') {
        pity.rarePity = 0;
      }
    }

    db.pityCounters.set(studentId, pity);

    // Pick a cosmetic of that rarity
    const matchingCosmetics = Array.from(db.cosmetics.values()).filter(c => c.rarity === selectedRarity);
    const chosenCosmetic = matchingCosmetics.length > 0
      ? matchingCosmetics[Math.floor(Math.random() * matchingCosmetics.length)]
      : Array.from(db.cosmetics.values())[0];

    // Check if student already owns it
    const alreadyOwns = db.userCosmetics.some(
      uc => uc.studentId === studentId && uc.cosmeticId === chosenCosmetic.id
    );

    let shardsAwarded = 0;
    const shardConversion: Record<CosmeticRarity, number> = {
      COMMON: 15,
      UNCOMMON: 35,
      RARE: 100,
      EPIC: 300,
      LEGENDARY: 800,
    };

    const profile = db.studentProfiles.get(studentId) || {
      studentId,
      lifetimeXp: 0,
      currentLevel: 1,
      levelProgressPercent: 0,
      xpInCurrentLevel: 0,
      xpRequiredForNextLevel: 100,
      spendableShards: 0,
      currentStreak: 0,
      maxStreak: 0,
      freezeCount: 0,
      lastActiveDate: null,
      personalBests: { maxDailyXp: 0, highestStreak: 0, monstersDefeated: 0, perfectQuizzes: 0 },
    };

    if (alreadyOwns) {
      shardsAwarded = shardConversion[chosenCosmetic.rarity];
      profile.spendableShards += shardsAwarded;
    } else {
      db.userCosmetics.push({
        id: `uc_${Date.now()}`,
        studentId,
        cosmeticId: chosenCosmetic.id,
        isEquipped: false,
        unlockedAt: new Date().toISOString(),
      });
    }

    await db.saveStudentProfile(profile);

    chest.status = 'OPENED';
    chest.openedAt = new Date().toISOString();
    chest.awardedCosmetic = chosenCosmetic;
    chest.shardsEarned = shardsAwarded;
    db.chests.set(chest.id, chest);

    return {
      chest,
      cosmetic: chosenCosmetic,
      isDuplicate: alreadyOwns,
      shardsAwarded,
      newTotalShards: profile.spendableShards,
      pityState: { ...pity },
    };
  }

  /**
   * Craft a specific desired cosmetic using shards.
   * Guaranteed path: no dead drops or luck required.
   */
  async craftCosmetic(studentId: string, cosmeticId: string): Promise<UserCosmeticRecord> {
    const cosmetic = db.cosmetics.get(cosmeticId);
    if (!cosmetic) throw new Error('Cosmetic item not found');

    if (cosmetic.achievementLocked) {
      throw new Error(`This legendary cosmetic is achievement-locked (${cosmetic.requiredAchievement}) and cannot be crafted with shards.`);
    }

    const profile = db.studentProfiles.get(studentId);
    if (!profile || profile.spendableShards < cosmetic.shardCost) {
      throw new Error(`Insufficient shards. Required: ${cosmetic.shardCost}, Available: ${profile?.spendableShards || 0}`);
    }

    // Deduct shards
    profile.spendableShards -= cosmetic.shardCost;
    await db.saveStudentProfile(profile);

    const record: UserCosmeticRecord = {
      id: `uc_craft_${Date.now()}`,
      studentId,
      cosmeticId,
      isEquipped: true,
      unlockedAt: new Date().toISOString(),
    };
    db.userCosmetics.push(record);

    return record;
  }
}

export interface UserCosmeticRecord {
  id: string;
  studentId: string;
  cosmeticId: string;
  isEquipped: boolean;
  unlockedAt: string;
}

export const cosmeticsService = new CosmeticsService();
