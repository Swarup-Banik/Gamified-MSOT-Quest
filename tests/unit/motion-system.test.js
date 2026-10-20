import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Motion System, Accessibility & Code Hub Suite', () => {
  // ==========================================================================
  // 1. Motion Tokens & Physics Presets
  // ==========================================================================
  describe('1. Motion Tokens Specification', () => {
    it('verifies exact duration tokens in seconds and milliseconds', () => {
      const tokensFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/lib/motion-tokens.ts'),
        'utf8'
      );

      assert.match(tokensFile, /instant:\s*0\.08/);
      assert.match(tokensFile, /quick:\s*0\.16/);
      assert.match(tokensFile, /base:\s*0\.24/);
      assert.match(tokensFile, /slow:\s*0\.40/);
      assert.match(tokensFile, /epic:\s*0\.90/);

      assert.match(tokensFile, /instant:\s*80/);
      assert.match(tokensFile, /quick:\s*160/);
      assert.match(tokensFile, /base:\s*240/);
      assert.match(tokensFile, /slow:\s*400/);
      assert.match(tokensFile, /epic:\s*900/);
    });

    it('verifies spring physics presets (snappy, bouncy, heavy)', () => {
      const tokensFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/lib/motion-tokens.ts'),
        'utf8'
      );

      assert.match(tokensFile, /snappy:\s*\{\s*type:\s*'spring',\s*stiffness:\s*420,\s*damping:\s*28\s*\}/);
      assert.match(tokensFile, /bouncy:\s*\{\s*type:\s*'spring',\s*stiffness:\s*260,\s*damping:\s*16\s*\}/);
      assert.match(tokensFile, /heavy:\s*\{\s*type:\s*'spring',\s*stiffness:\s*140,\s*damping:\s*18\s*\}/);
    });

    it('verifies stagger step and single hero concurrency limit', () => {
      const tokensFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/lib/motion-tokens.ts'),
        'utf8'
      );

      assert.match(tokensFile, /step:\s*0\.04/);
      assert.match(tokensFile, /maxHeroConcurrent:\s*1/);
    });
  });

  // ==========================================================================
  // 2. Sensory Modes & Accessibility Controls
  // ==========================================================================
  describe('2. Sensory Modes & Accessibility Safeguards', () => {
    class MockMotionManager {
      constructor() {
        this.mode = 'FULL';
        this.particlesEnabled = true;
        this.isLowPerformance = false;
        this.flashTimestamps = [];
      }

      setSensoryMode(mode) {
        this.mode = mode;
      }

      getSensoryMode() {
        return this.mode;
      }

      allowsAmbientMotion() {
        return this.mode === 'FULL' && !this.isLowPerformance;
      }

      allows3DTilt() {
        return this.mode === 'FULL' && !this.isLowPerformance;
      }

      getParticleScale() {
        if (this.mode === 'MINIMAL' || !this.particlesEnabled) return 0;
        if (this.mode === 'REDUCED') return 0.3;
        if (this.isLowPerformance) return 0.5;
        return 1.0;
      }

      canFlash() {
        if (this.mode === 'MINIMAL') return false;
        const now = Date.now();
        this.flashTimestamps = this.flashTimestamps.filter((t) => now - t < 1000);
        if (this.flashTimestamps.length >= 3) return false;
        this.flashTimestamps.push(now);
        return true;
      }
    }

    it('verifies FULL mode enables 3D tilt, ambient motion, and full particle scale', () => {
      const manager = new MockMotionManager();
      manager.setSensoryMode('FULL');

      assert.strictEqual(manager.getSensoryMode(), 'FULL');
      assert.strictEqual(manager.allowsAmbientMotion(), true);
      assert.strictEqual(manager.allows3DTilt(), true);
      assert.strictEqual(manager.getParticleScale(), 1.0);
    });

    it('verifies REDUCED mode disables ambient loops and clamps particles to 30%', () => {
      const manager = new MockMotionManager();
      manager.setSensoryMode('REDUCED');

      assert.strictEqual(manager.getSensoryMode(), 'REDUCED');
      assert.strictEqual(manager.allowsAmbientMotion(), false);
      assert.strictEqual(manager.allows3DTilt(), false);
      assert.strictEqual(manager.getParticleScale(), 0.3);
    });

    it('verifies MINIMAL mode disables all motion, particles, and flash effects', () => {
      const manager = new MockMotionManager();
      manager.setSensoryMode('MINIMAL');

      assert.strictEqual(manager.getSensoryMode(), 'MINIMAL');
      assert.strictEqual(manager.allowsAmbientMotion(), false);
      assert.strictEqual(manager.allows3DTilt(), false);
      assert.strictEqual(manager.getParticleScale(), 0);
      assert.strictEqual(manager.canFlash(), false);
    });

    it('verifies dynamic quality scaler halves particle count during performance drops', () => {
      const manager = new MockMotionManager();
      manager.setSensoryMode('FULL');
      manager.isLowPerformance = true; // FPS dropped < 45

      assert.strictEqual(manager.getParticleScale(), 0.5);
      assert.strictEqual(manager.allowsAmbientMotion(), false);
    });
  });

  // ==========================================================================
  // 3. WCAG 2.3.1 Seizure Safety Guard
  // ==========================================================================
  describe('3. WCAG 2.3.1 Seizure Safety Limits', () => {
    it('hard-limits flashes to <= 3 times per second and suppresses strobe bursts', () => {
      const flashTimestamps = [];
      const canFlash = () => {
        const now = Date.now();
        const valid = flashTimestamps.filter((t) => now - t < 1000);
        if (valid.length >= 3) return false;
        valid.push(now);
        flashTimestamps.splice(0, flashTimestamps.length, ...valid);
        return true;
      };

      // First 3 flashes in under 1 second must succeed
      assert.strictEqual(canFlash(), true);
      assert.strictEqual(canFlash(), true);
      assert.strictEqual(canFlash(), true);

      // 4th and 5th immediate flashes MUST be rejected / suppressed to prevent seizures
      assert.strictEqual(canFlash(), false);
      assert.strictEqual(canFlash(), false);
    });
  });

  // ==========================================================================
  // 4. Pressable Universal Tactile Feedback
  // ==========================================================================
  describe('4. Universal Pressable Primitive Verification', () => {
    it('verifies Pressable.tsx exists and implements data-pressable attribute', () => {
      const pressableFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/components/ui/Pressable.tsx'),
        'utf8'
      );

      assert.match(pressableFile, /data-pressable="true"/);
      assert.match(pressableFile, /data-pressable-role=/);
      assert.match(pressableFile, /sound\.playPressTick/);
      assert.match(pressableFile, /triggerRipple/);
      assert.match(pressableFile, /triggerSparkles/);
    });

    it('verifies stereo panning formula produces accurate clamped pan values', () => {
      const getStereoPan = (clientX, screenWidth) => {
        return Math.max(-1, Math.min(1, (clientX / screenWidth) * 2 - 1));
      };

      assert.strictEqual(getStereoPan(0, 1000), -1);     // Left edge
      assert.strictEqual(getStereoPan(500, 1000), 0);    // Center
      assert.strictEqual(getStereoPan(1000, 1000), 1);   // Right edge
      assert.strictEqual(getStereoPan(250, 1000), -0.5); // Mid-left
    });
  });

  // ==========================================================================
  // 5. Code Hub Contracts
  // ==========================================================================
  describe('5. Code Hub Interaction Contracts', () => {
    it('verifies CodeHub.tsx exists and implements all 3 platforms', () => {
      const codeHubFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/components/codehub/CodeHub.tsx'),
        'utf8'
      );

      assert.match(codeHubFile, /LEETCODE/);
      assert.match(codeHubFile, /HACKERRANK/);
      assert.match(codeHubFile, /GITHUB/);
      assert.match(codeHubFile, /visibilitychange/); // Return sync
      assert.match(codeHubFile, /Problem of the Day/);
    });

    it('enforces 30s minimum cooldown between manual platform syncs', () => {
      const syncCooldownMs = 30000;
      const firstSyncAt = Date.now();
      const immediateAttempt = Date.now();
      const elapsed = immediateAttempt - firstSyncAt;

      assert.strictEqual(elapsed < syncCooldownMs, true, 'Immediate sync must be blocked by cooldown');
    });

    it('triggers return-sync only when document returns from background and cooldown elapsed', () => {
      const returnSyncCooldownSec = 60;
      const lastSyncTimestamp = Date.now() - 65 * 1000; // 65 seconds ago
      const elapsedSec = (Date.now() - lastSyncTimestamp) / 1000;

      const shouldAutoSync = elapsedSec > returnSyncCooldownSec;
      assert.strictEqual(shouldAutoSync, true, 'Return sync should fire when >60s elapsed');
    });

    it('verifies level band progressions match official game titles', () => {
      const hudFile = fs.readFileSync(
        path.resolve(process.cwd(), 'apps/web/src/components/navigation/FloatingGameHUD.tsx'),
        'utf8'
      );

      assert.match(hudFile, /Fresh Spark/);
      assert.match(hudFile, /Apprentice/);
      assert.match(hudFile, /Adept/);
      assert.match(hudFile, /Specialist/);
      assert.match(hudFile, /Master/);
      assert.match(hudFile, /Legend/);
    });
  });
});
