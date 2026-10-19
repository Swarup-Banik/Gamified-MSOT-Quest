import {
  Cosmetic,
  CosmeticRarity,
  CosmeticSlot,
  Chest,
  ChestTier,
  EquippedLoadout,
} from '@msot/shared';
import { db } from '../db.js';
import {
  MASTER_COSMETICS_CATALOG,
  STARTER_KIT_COSMETIC_IDS,
  DEFAULT_LOADOUT,
} from './cosmetics-catalog.js';

export interface UserCosmeticRecord {
  id: string;
  studentId: string;
  cosmeticId: string;
  isEquipped: boolean;
  unlockedAt: string;
}

export class CosmeticsService {
  /**
   * Initializes starter cosmetic catalog with 60 items across all rarity tiers
   * Idempotent: safe to run multiple times without duplicates
   */
  async initializeDefaultCosmetics(): Promise<void> {
    for (const item of MASTER_COSMETICS_CATALOG) {
      db.cosmetics.set(item.id, { ...item });
    }
  }

  /**
   * Grants the starter kit of cosmetics to a student and equips the default loadout.
   * Ensures every student has an avatar, companion, banner, frame, title, and flame on day one.
   */
  async grantStarterKit(studentId: string): Promise<void> {
    const existing = db.userCosmetics.filter(uc => uc.studentId === studentId);
    const existingIds = new Set(existing.map(uc => uc.cosmeticId));

    // Ensure all starter kit items are in userCosmetics
    for (const cosmeticId of STARTER_KIT_COSMETIC_IDS) {
      if (!existingIds.has(cosmeticId)) {
        const isDefaultEquipped = Object.values(DEFAULT_LOADOUT).includes(cosmeticId);
        db.userCosmetics.push({
          id: `uc_${studentId}_${cosmeticId}`,
          studentId,
          cosmeticId,
          isEquipped: isDefaultEquipped,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    // Initialize equipped loadout on student profile
    let profile = db.studentProfiles.get(studentId);
    if (!profile) {
      profile = {
        studentId,
        lifetimeXp: 0,
        currentLevel: 1,
        levelProgressPercent: 0,
        xpInCurrentLevel: 0,
        xpRequiredForNextLevel: 100,
        spendableShards: 250,
        currentStreak: 1,
        maxStreak: 1,
        freezeCount: 2,
        lastActiveDate: new Date().toISOString().split('T')[0],
        equippedLoadout: { ...DEFAULT_LOADOUT },
        personalBests: { maxDailyXp: 0, highestStreak: 1, monstersDefeated: 0, perfectQuizzes: 0 },
      };
      db.studentProfiles.set(studentId, profile);
    } else if (!profile.equippedLoadout || !profile.equippedLoadout.avatar) {
      profile.equippedLoadout = { ...DEFAULT_LOADOUT };
      db.studentProfiles.set(studentId, profile);
    }

    // Also update User record if present
    const user = db.users.get(studentId);
    if (user && (!user.equippedLoadout || !user.equippedLoadout.avatar)) {
      user.equippedLoadout = { ...DEFAULT_LOADOUT };
      user.avatarId = DEFAULT_LOADOUT.avatar;
      db.users.set(studentId, user);
    }
  }

  /**
   * Backfills starter kits for all registered student accounts.
   */
  async backfillAllStudentsStarterKit(): Promise<number> {
    let count = 0;
    for (const user of db.users.values()) {
      if (user.role === 'STUDENT') {
        await this.grantStarterKit(user.id);
        count++;
      }
    }
    return count;
  }

  /**
   * Gets the full cosmetic catalogue for a student, calculating:
   * - isOwned
   * - isEquipped
   * - silhouette and unlock hints for locked items
   * - completion rates by slot
   */
  async getCatalogForStudent(studentId: string): Promise<{
    catalog: any[];
    equippedLoadout: EquippedLoadout;
    completionBySlot: Record<string, { owned: number; total: number; percent: number }>;
    totalCompletionPercent: number;
    spendableShards: number;
  }> {
    // Ensure starter kit is present
    await this.grantStarterKit(studentId);

    const profile = db.studentProfiles.get(studentId);
    const loadout: EquippedLoadout = profile?.equippedLoadout || { ...DEFAULT_LOADOUT };

    const ownedRecords = db.userCosmetics.filter(uc => uc.studentId === studentId);
    const ownedMap = new Map(ownedRecords.map(r => [r.cosmeticId, r]));

    const catalogItems = Array.from(db.cosmetics.values()).map(cosmetic => {
      const isOwned = ownedMap.has(cosmetic.id);
      const isEquipped = Object.values(loadout).includes(cosmetic.id);

      if (isOwned) {
        return {
          ...cosmetic,
          isOwned: true,
          isEquipped,
          unlockedAt: ownedMap.get(cosmetic.id)?.unlockedAt,
        };
      }

      // Locked item returns silhouette and unlock hints
      return {
        id: cosmetic.id,
        slug: cosmetic.slug,
        name: cosmetic.name,
        slot: cosmetic.slot,
        type: cosmetic.slot,
        rarity: cosmetic.rarity,
        description: cosmetic.description,
        shardCost: cosmetic.shardCost,
        unlockType: cosmetic.unlockType,
        unlockCondition: cosmetic.unlockCondition || 'Available in Mystery Vaults or Codex Workshop',
        unlockHint: cosmetic.unlockCondition || 'Available in Mystery Vaults or Codex Workshop',
        achievementLocked: cosmetic.achievementLocked || false,
        requiredAchievement: cosmetic.requiredAchievement,
        assetKey: cosmetic.assetKey,
        silhouetteKey: cosmetic.assetKey,
        themeTag: cosmetic.themeTag,
        isOwned: false,
        isEquipped: false,
      };
    });

    // Calculate completion rates by slot
    const slots: CosmeticSlot[] = [
      'AVATAR_SKIN',
      'COMPANION_SKIN',
      'PROFILE_BANNER',
      'FRAME',
      'TITLE',
      'STREAK_FLAME',
      'LEVELUP_EFFECT',
    ];

    const completionBySlot: Record<string, { owned: number; total: number; percent: number }> = {};
    let totalOwned = 0;
    const totalItems = db.cosmetics.size || 1;

    for (const slot of slots) {
      const slotItems = Array.from(db.cosmetics.values()).filter(c => c.slot === slot);
      const ownedInSlot = slotItems.filter(c => ownedMap.has(c.id)).length;
      totalOwned += ownedInSlot;
      completionBySlot[slot] = {
        owned: ownedInSlot,
        total: slotItems.length,
        percent: slotItems.length > 0 ? Math.round((ownedInSlot / slotItems.length) * 100) : 0,
      };
    }

    const totalCompletionPercent = Math.round((totalOwned / totalItems) * 100);

    return {
      catalog: catalogItems,
      equippedLoadout: loadout,
      completionBySlot,
      totalCompletionPercent,
      spendableShards: profile?.spendableShards || 0,
    };
  }

  /**
   * Retrieves owned cosmetics for a student.
   */
  async getOwnedCosmetics(studentId: string): Promise<{
    cosmetics: any[];
    equippedLoadout: EquippedLoadout;
    spendableShards: number;
  }> {
    await this.grantStarterKit(studentId);

    const profile = db.studentProfiles.get(studentId);
    const loadout: EquippedLoadout = profile?.equippedLoadout || { ...DEFAULT_LOADOUT };

    const ownedRecords = db.userCosmetics.filter(uc => uc.studentId === studentId);
    const ownedCosmetics = ownedRecords
      .map(rec => {
        const item = db.cosmetics.get(rec.cosmeticId);
        if (!item) return null;
        return {
          ...item,
          isEquipped: Object.values(loadout).includes(item.id),
          unlockedAt: rec.unlockedAt,
        };
      })
      .filter(Boolean);

    return {
      cosmetics: ownedCosmetics,
      equippedLoadout: loadout,
      spendableShards: profile?.spendableShards || 0,
    };
  }

  /**
   * Equips a cosmetic into its designated slot.
   * Enforces:
   * 1. Student must own the item.
   * 2. Only 1 item equipped per slot.
   */
  async equipCosmetic(
    studentId: string,
    cosmeticId: string,
    slotOverride?: string
  ): Promise<{ success: boolean; equippedLoadout: EquippedLoadout; message: string }> {
    const cosmetic = db.cosmetics.get(cosmeticId);
    if (!cosmetic) throw new Error('Cosmetic not found');

    const ownsItem = db.userCosmetics.some(
      uc => uc.studentId === studentId && uc.cosmeticId === cosmeticId
    );
    if (!ownsItem) {
      throw new Error('You do not own this cosmetic. Unlock it first from a Mystery Vault or Codex Workshop.');
    }

    // Determine target slot
    const slotMap: Record<CosmeticSlot, keyof EquippedLoadout> = {
      AVATAR_SKIN: 'avatar',
      COMPANION_SKIN: 'companion',
      PROFILE_BANNER: 'banner',
      FRAME: 'frame',
      TITLE: 'title',
      STREAK_FLAME: 'streakFlame',
      LEVELUP_EFFECT: 'levelupEffect',
    };

    const targetKey = (slotOverride as keyof EquippedLoadout) || slotMap[cosmetic.slot];
    if (!targetKey) throw new Error(`Invalid slot for cosmetic type: ${cosmetic.slot}`);

    // Update StudentProfile
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
      equippedLoadout: { ...DEFAULT_LOADOUT },
      personalBests: { maxDailyXp: 0, highestStreak: 0, monstersDefeated: 0, perfectQuizzes: 0 },
    };

    if (!profile.equippedLoadout) {
      profile.equippedLoadout = { ...DEFAULT_LOADOUT };
    }

    // Previous equipped item in slot
    const previousId = profile.equippedLoadout[targetKey];

    // Update loadout slot
    (profile.equippedLoadout as any)[targetKey] = cosmeticId;
    db.studentProfiles.set(studentId, profile);

    // Update userCosmetics flags
    for (const uc of db.userCosmetics) {
      if (uc.studentId === studentId) {
        if (uc.cosmeticId === previousId) uc.isEquipped = false;
        if (uc.cosmeticId === cosmeticId) uc.isEquipped = true;
      }
    }

    // Sync to User record
    const user = db.users.get(studentId);
    if (user) {
      user.equippedLoadout = { ...profile.equippedLoadout };
      if (targetKey === 'avatar') {
        user.avatarId = cosmeticId;
      }
      db.users.set(studentId, user);
    }

    return {
      success: true,
      equippedLoadout: profile.equippedLoadout,
      message: `Equipped ${cosmetic.name} into ${cosmetic.slot}!`,
    };
  }

  /**
   * Unequips an optional cosmetic slot, resetting it to starter default.
   */
  async unequipCosmetic(
    studentId: string,
    slot: keyof EquippedLoadout
  ): Promise<{ success: boolean; equippedLoadout: EquippedLoadout }> {
    const profile = db.studentProfiles.get(studentId);
    if (!profile || !profile.equippedLoadout) {
      return { success: true, equippedLoadout: { ...DEFAULT_LOADOUT } };
    }

    const defaultForSlot = DEFAULT_LOADOUT[slot];
    if (defaultForSlot) {
      profile.equippedLoadout[slot] = defaultForSlot;
      db.studentProfiles.set(studentId, profile);
    }

    const user = db.users.get(studentId);
    if (user) {
      user.equippedLoadout = { ...profile.equippedLoadout };
      db.users.set(studentId, user);
    }

    return {
      success: true,
      equippedLoadout: profile.equippedLoadout,
    };
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
      if (chest.tier === 'LEGENDARY') {
        if (roll < 25) selectedRarity = 'LEGENDARY';
        else if (roll < 65) selectedRarity = 'EPIC';
        else selectedRarity = 'RARE';
      } else if (chest.tier === 'GOLDEN') {
        if (roll < 5) selectedRarity = 'LEGENDARY';
        else if (roll < 25) selectedRarity = 'EPIC';
        else if (roll < 60) selectedRarity = 'RARE';
        else selectedRarity = 'UNCOMMON';
      } else if (chest.tier === 'SILVER') {
        if (roll < 2) selectedRarity = 'LEGENDARY';
        else if (roll < 10) selectedRarity = 'EPIC';
        else if (roll < 35) selectedRarity = 'RARE';
        else if (roll < 75) selectedRarity = 'UNCOMMON';
        else selectedRarity = 'COMMON';
      } else {
        // Wooden
        if (roll < 1) selectedRarity = 'LEGENDARY';
        else if (roll < 5) selectedRarity = 'EPIC';
        else if (roll < 20) selectedRarity = 'RARE';
        else if (roll < 55) selectedRarity = 'UNCOMMON';
        else selectedRarity = 'COMMON';
      }

      if (selectedRarity === 'LEGENDARY' || selectedRarity === 'EPIC') {
        pity.epicPity = 0;
        pity.rarePity = 0;
      } else if (selectedRarity === 'RARE') {
        pity.rarePity = 0;
      }
    }

    db.pityCounters.set(studentId, pity);

    // Pick a cosmetic of that rarity (excluding achievement-only items from chest drops)
    const matchingCosmetics = Array.from(db.cosmetics.values()).filter(
      c => c.rarity === selectedRarity && c.unlockType !== 'achievement'
    );
    const chosenCosmetic = matchingCosmetics.length > 0
      ? matchingCosmetics[Math.floor(Math.random() * matchingCosmetics.length)]
      : Array.from(db.cosmetics.values()).find(c => c.rarity === selectedRarity) ||
        Array.from(db.cosmetics.values())[0];

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
      equippedLoadout: { ...DEFAULT_LOADOUT },
      personalBests: { maxDailyXp: 0, highestStreak: 0, monstersDefeated: 0, perfectQuizzes: 0 },
    };

    if (alreadyOwns) {
      shardsAwarded = shardConversion[chosenCosmetic.rarity];
      profile.spendableShards += shardsAwarded;
    } else {
      db.userCosmetics.push({
        id: `uc_${Date.now()}_${chosenCosmetic.id}`,
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
      throw new Error(`This cosmetic is achievement-locked (${cosmetic.unlockCondition || cosmetic.requiredAchievement}) and cannot be crafted with shards.`);
    }

    const ownsAlready = db.userCosmetics.some(
      uc => uc.studentId === studentId && uc.cosmeticId === cosmeticId
    );
    if (ownsAlready) {
      throw new Error('You already own this cosmetic item.');
    }

    const profile = db.studentProfiles.get(studentId);
    if (!profile || profile.spendableShards < cosmetic.shardCost) {
      throw new Error(`Insufficient shards. Required: ${cosmetic.shardCost}, Available: ${profile?.spendableShards || 0}`);
    }

    // Deduct shards
    profile.spendableShards -= cosmetic.shardCost;
    await db.saveStudentProfile(profile);

    const record: UserCosmeticRecord = {
      id: `uc_craft_${Date.now()}_${cosmeticId}`,
      studentId,
      cosmeticId,
      isEquipped: true,
      unlockedAt: new Date().toISOString(),
    };
    db.userCosmetics.push(record);

    // Auto-equip crafted item
    await this.equipCosmetic(studentId, cosmeticId);

    return record;
  }

  /**
   * Admin/Demo support: grants a random cosmetic of a specified rarity to a student.
   */
  async grantRandomCosmetic(studentId: string, rarity?: CosmeticRarity): Promise<Cosmetic> {
    const pool = Array.from(db.cosmetics.values()).filter(c => !rarity || c.rarity === rarity);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || pool[0];

    const owns = db.userCosmetics.some(
      uc => uc.studentId === studentId && uc.cosmeticId === chosen.id
    );
    if (!owns) {
      db.userCosmetics.push({
        id: `uc_demo_${Date.now()}`,
        studentId,
        cosmeticId: chosen.id,
        isEquipped: false,
        unlockedAt: new Date().toISOString(),
      });
    }

    return chosen;
  }

  /**
   * Admin/Demo support: grants a mystery chest of specified tier.
   */
  async grantChest(studentId: string, tier: ChestTier = 'GOLDEN', source: string = 'GM Grant'): Promise<Chest> {
    const chestId = `chest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const chest: Chest = {
      id: chestId,
      studentId,
      tier,
      source,
      status: 'UNOPENED',
    };
    db.chests.set(chestId, chest);
    return chest;
  }

  /**
   * Admin/Demo support: resets student loadout to the default starter kit.
   */
  async resetToStarterLoadout(studentId: string): Promise<{ success: boolean; equippedLoadout: EquippedLoadout }> {
    await this.grantStarterKit(studentId);
    const profile = db.studentProfiles.get(studentId);
    if (profile) {
      profile.equippedLoadout = { ...DEFAULT_LOADOUT };
      db.studentProfiles.set(studentId, profile);
    }
    const user = db.users.get(studentId);
    if (user) {
      user.equippedLoadout = { ...DEFAULT_LOADOUT };
      user.avatarId = DEFAULT_LOADOUT.avatar;
      db.users.set(studentId, user);
    }
    return {
      success: true,
      equippedLoadout: { ...DEFAULT_LOADOUT },
    };
  }
}

export const cosmeticsService = new CosmeticsService();
