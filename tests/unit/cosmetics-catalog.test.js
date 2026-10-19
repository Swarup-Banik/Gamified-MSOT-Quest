import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { cosmeticsService } from '../../apps/api/dist/services/cosmetics-service.js';
import {
  MASTER_COSMETICS_CATALOG,
  STARTER_KIT_COSMETIC_IDS,
  DEFAULT_LOADOUT,
} from '../../apps/api/dist/services/cosmetics-catalog.js';

describe('Cosmetics Catalogue & Starter Kit Unit Tests', () => {
  beforeEach(async () => {
    db.clearForTesting();
    await cosmeticsService.initializeDefaultCosmetics();
  });

  it('Verifies master catalogue contains exactly 60 items', () => {
    assert.equal(MASTER_COSMETICS_CATALOG.length, 60);
    const uniqueIds = new Set(MASTER_COSMETICS_CATALOG.map(c => c.id));
    assert.equal(uniqueIds.size, 60, 'All cosmetic IDs must be unique');
  });

  it('Verifies exact rarity distribution: 20 Common, 15 Uncommon, 12 Rare, 8 Epic, 5 Legendary', () => {
    const counts = {
      COMMON: 0,
      UNCOMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
    };
    for (const item of MASTER_COSMETICS_CATALOG) {
      assert.ok(counts[item.rarity] !== undefined, `Unknown rarity: ${item.rarity}`);
      counts[item.rarity]++;
    }
    assert.equal(counts.COMMON, 20, 'Common count must be 20');
    assert.equal(counts.UNCOMMON, 15, 'Uncommon count must be 15');
    assert.equal(counts.RARE, 12, 'Rare count must be 12');
    assert.equal(counts.EPIC, 8, 'Epic count must be 8');
    assert.equal(counts.LEGENDARY, 5, 'Legendary count must be 5');
  });

  it('Verifies all 7 cosmetic slots are populated with items', () => {
    const requiredSlots = [
      'AVATAR_SKIN',
      'COMPANION_SKIN',
      'PROFILE_BANNER',
      'FRAME',
      'TITLE',
      'STREAK_FLAME',
      'LEVELUP_EFFECT',
    ];
    const slotCounts = {};
    for (const item of MASTER_COSMETICS_CATALOG) {
      slotCounts[item.slot] = (slotCounts[item.slot] || 0) + 1;
    }
    for (const slot of requiredSlots) {
      assert.ok(slotCounts[slot] > 0, `Slot ${slot} must have cosmetics`);
    }
  });

  it('Verifies seed idempotency (calling initializeDefaultCosmetics twice does not duplicate records)', async () => {
    assert.equal(db.cosmetics.size, 60);
    await cosmeticsService.initializeDefaultCosmetics();
    assert.equal(db.cosmetics.size, 60, 'Database size should remain 60 after second initialization');
  });

  it('Verifies starter kit grant gives student default equipped loadout across all slots', async () => {
    const studentId = 'test_student_starter';
    await cosmeticsService.grantStarterKit(studentId);

    const profile = db.studentProfiles.get(studentId);
    assert.ok(profile, 'Profile must exist after starter kit grant');
    assert.ok(profile.equippedLoadout, 'Equipped loadout must be present');

    assert.equal(profile.equippedLoadout.avatar, DEFAULT_LOADOUT.avatar);
    assert.equal(profile.equippedLoadout.companion, DEFAULT_LOADOUT.companion);
    assert.equal(profile.equippedLoadout.banner, DEFAULT_LOADOUT.banner);
    assert.equal(profile.equippedLoadout.frame, DEFAULT_LOADOUT.frame);
    assert.equal(profile.equippedLoadout.title, DEFAULT_LOADOUT.title);
    assert.equal(profile.equippedLoadout.streakFlame, DEFAULT_LOADOUT.streakFlame);
    assert.equal(profile.equippedLoadout.levelupEffect, DEFAULT_LOADOUT.levelupEffect);

    const ownedRecords = db.userCosmetics.filter(uc => uc.studentId === studentId);
    assert.ok(ownedRecords.length >= STARTER_KIT_COSMETIC_IDS.length, 'Student must own all starter kit items');
    for (const starterId of STARTER_KIT_COSMETIC_IDS) {
      assert.ok(
        ownedRecords.some(r => r.cosmeticId === starterId),
        `Student must own starter item ${starterId}`
      );
    }
  });

  it('Verifies completion rates are calculated accurately by getCatalogForStudent', async () => {
    const studentId = 'test_student_completion';
    const result = await cosmeticsService.getCatalogForStudent(studentId);

    assert.equal(result.catalog.length, 60);
    assert.ok(typeof result.totalCompletionPercent === 'number');
    assert.ok(result.totalCompletionPercent >= 16, 'Starter kit yields ~17% completion');

    for (const [slot, stat] of Object.entries(result.completionBySlot)) {
      assert.ok(stat.total > 0, `Slot ${slot} must have total items`);
      assert.ok(stat.percent >= 0 && stat.percent <= 100, `Slot ${slot} percent must be 0-100`);
    }
  });

  it('Verifies shard pricing tiers align with rarity tiers', () => {
    for (const item of MASTER_COSMETICS_CATALOG) {
      if (item.rarity === 'COMMON') {
        assert.ok(item.shardCost <= 60, `Common shard cost too high: ${item.shardCost}`);
      } else if (item.rarity === 'UNCOMMON') {
        assert.ok(item.shardCost <= 120, `Uncommon shard cost too high: ${item.shardCost}`);
      } else if (item.rarity === 'RARE') {
        assert.ok(item.shardCost <= 300, `Rare shard cost too high: ${item.shardCost}`);
      } else if (item.rarity === 'EPIC') {
        assert.ok(item.shardCost <= 600, `Epic shard cost too high: ${item.shardCost}`);
      } else if (item.rarity === 'LEGENDARY') {
        assert.ok(item.shardCost <= 1500, `Legendary shard cost too high: ${item.shardCost}`);
      }
    }
  });
});
