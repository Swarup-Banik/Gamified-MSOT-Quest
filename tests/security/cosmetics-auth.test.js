import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../apps/api/dist/db.js';
import { cosmeticsService } from '../../apps/api/dist/services/cosmetics-service.js';
import { DEFAULT_LOADOUT } from '../../apps/api/dist/services/cosmetics-catalog.js';

describe('Cosmetics Authorization, Isolation & Fair-Play Tests', () => {
  const studentA = 'student_alice';
  const studentB = 'student_bob';

  beforeEach(async () => {
    db.clearForTesting();
    await cosmeticsService.initializeDefaultCosmetics();

    // Register Student A
    db.users.set(studentA, {
      id: studentA,
      email: 'alice@msot.edu.in',
      passwordHash: 'hash',
      name: 'Alice Learner',
      role: 'STUDENT',
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      isAnonymous: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equippedLoadout: { ...DEFAULT_LOADOUT },
    });
    await cosmeticsService.grantStarterKit(studentA);

    // Register Student B
    db.users.set(studentB, {
      id: studentB,
      email: 'bob@msot.edu.in',
      passwordHash: 'hash',
      name: 'Bob Learner',
      role: 'STUDENT',
      campusId: 'campus_1',
      batchId: 'batch_2025',
      sectionId: 'sec_a',
      isAnonymous: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equippedLoadout: { ...DEFAULT_LOADOUT },
    });
    await cosmeticsService.grantStarterKit(studentB);
  });

  it('Rejects equipping an unowned cosmetic with an explicit error', async () => {
    const unownedEpicAvatar = 'cosm_avatar_recursion_archmage';
    await assert.rejects(
      async () => {
        await cosmeticsService.equipCosmetic(studentA, unownedEpicAvatar);
      },
      {
        message: /You do not own this cosmetic/,
      }
    );
  });

  it('Equips an owned cosmetic and updates loadout state in profile and user record', async () => {
    // Owl scholar is in starter kit
    const ownedAvatar = 'cosm_avatar_owl_scholar';
    const res = await cosmeticsService.equipCosmetic(studentA, ownedAvatar);

    assert.equal(res.success, true);
    assert.equal(res.equippedLoadout.avatar, ownedAvatar);

    const profile = db.studentProfiles.get(studentA);
    assert.equal(profile?.equippedLoadout?.avatar, ownedAvatar);

    const user = db.users.get(studentA);
    assert.equal(user?.equippedLoadout?.avatar, ownedAvatar);
    assert.equal(user?.avatarId, ownedAvatar);
  });

  it('Maintains slot isolation: equipping an item replaces only that slot', async () => {
    const initialBanner = db.studentProfiles.get(studentA)?.equippedLoadout?.banner;
    const initialFrame = db.studentProfiles.get(studentA)?.equippedLoadout?.frame;

    // Equip owned owl avatar
    await cosmeticsService.equipCosmetic(studentA, 'cosm_avatar_owl_scholar');

    const updated = db.studentProfiles.get(studentA)?.equippedLoadout;
    assert.equal(updated?.avatar, 'cosm_avatar_owl_scholar');
    assert.equal(updated?.banner, initialBanner, 'Banner slot must remain untouched');
    assert.equal(updated?.frame, initialFrame, 'Frame slot must remain untouched');
  });

  it('Unequipping a slot resets it back to the starter default', async () => {
    await cosmeticsService.equipCosmetic(studentA, 'cosm_avatar_owl_scholar');
    const unequipRes = await cosmeticsService.unequipCosmetic(studentA, 'avatar');

    assert.equal(unequipRes.success, true);
    assert.equal(unequipRes.equippedLoadout.avatar, DEFAULT_LOADOUT.avatar);
  });

  it('Guarantees strict horizontal boundary: Student A loadout change cannot affect Student B', async () => {
    await cosmeticsService.equipCosmetic(studentA, 'cosm_avatar_owl_scholar');

    const bobProfile = db.studentProfiles.get(studentB);
    assert.equal(
      bobProfile?.equippedLoadout?.avatar,
      DEFAULT_LOADOUT.avatar,
      "Bob's loadout must not be altered by Alice's equip action"
    );
  });

  it('Pity timer: opening chests triggers guaranteed Rare after 5 opens', async () => {
    // Set pity counter to 4 (so next is 5th)
    db.pityCounters.set(studentA, { rarePity: 4, epicPity: 4 });

    const chest = await cosmeticsService.grantChest(studentA, 'WOODEN');
    const result = await cosmeticsService.openChest(chest.id, studentA);

    assert.ok(
      result.cosmetic.rarity === 'RARE' || result.cosmetic.rarity === 'EPIC' || result.cosmetic.rarity === 'LEGENDARY',
      `Guaranteed drop must be RARE or higher, got: ${result.cosmetic.rarity}`
    );
    // Rare pity counter should reset to 0
    const newPity = db.pityCounters.get(studentA);
    assert.equal(newPity?.rarePity, 0);
  });

  it('Pity timer: opening chests triggers guaranteed Epic after 15 opens', async () => {
    db.pityCounters.set(studentA, { rarePity: 2, epicPity: 14 });

    const chest = await cosmeticsService.grantChest(studentA, 'SILVER');
    const result = await cosmeticsService.openChest(chest.id, studentA);

    assert.ok(
      result.cosmetic.rarity === 'EPIC' || result.cosmetic.rarity === 'LEGENDARY',
      `Guaranteed drop must be EPIC or higher, got: ${result.cosmetic.rarity}`
    );
    const newPity = db.pityCounters.get(studentA);
    assert.equal(newPity?.epicPity, 0);
  });

  it('Crafting a cosmetic with sufficient shards deducts shards and equips the item', async () => {
    const profile = db.studentProfiles.get(studentA);
    if (profile) {
      profile.spendableShards = 1000;
      db.studentProfiles.set(studentA, profile);
    }

    const targetCosmetic = 'cosm_banner_crystal_peaks'; // 90 shards
    const record = await cosmeticsService.craftCosmetic(studentA, targetCosmetic);

    assert.ok(record, 'Crafted record must be returned');
    assert.equal(record.cosmeticId, targetCosmetic);

    const updatedProfile = db.studentProfiles.get(studentA);
    assert.equal(updatedProfile?.spendableShards, 910);
    assert.equal(updatedProfile?.equippedLoadout?.banner, targetCosmetic);
  });

  it('Crafting without sufficient shards is rejected with an error', async () => {
    const profile = db.studentProfiles.get(studentA);
    if (profile) {
      profile.spendableShards = 10;
      db.studentProfiles.set(studentA, profile);
    }

    const expensiveCraftable = 'cosm_avatar_quantum_scholar'; // 250 shards, chest unlock
    await assert.rejects(
      async () => {
        await cosmeticsService.craftCosmetic(studentA, expensiveCraftable);
      },
      {
        message: /Insufficient shards/,
      }
    );
  });

  it('GM Demo grant adds random cosmetic to student and makes it equippable', async () => {
    const granted = await cosmeticsService.grantRandomCosmetic(studentA, 'RARE');
    assert.ok(granted, 'Granted item must exist');
    assert.equal(granted.rarity, 'RARE');

    // Should now be equippable
    const equipRes = await cosmeticsService.equipCosmetic(studentA, granted.id);
    assert.equal(equipRes.success, true);
  });
});
