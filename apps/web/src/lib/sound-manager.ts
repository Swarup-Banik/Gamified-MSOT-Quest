/**
 * Campus Realm Central Sound & Haptic Engine
 * Synthesizes high-fidelity game sounds using Web Audio API (zero external mp3 lag).
 * Supports mute toggle, separate volume sliders, and mobile haptic vibration patterns.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = false; // Enabled after first user gesture
  private userHasInteracted: boolean = false;
  private sfxVolume: number = 0.8;
  private hapticsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedSound = localStorage.getItem('msot_sound_enabled');
      const storedHaptics = localStorage.getItem('msot_haptics_enabled');
      const storedVol = localStorage.getItem('msot_sfx_volume');

      if (storedSound !== null) this.soundEnabled = storedSound === 'true';
      if (storedHaptics !== null) this.hapticsEnabled = storedHaptics !== 'true' ? false : true;
      if (storedVol !== null) this.sfxVolume = parseFloat(storedVol) || 0.8;

      // Auto-unlock AudioContext on first tap
      const unlockAudio = () => {
        if (!this.userHasInteracted) {
          this.userHasInteracted = true;
          this.initContext();
          if (storedSound === null) {
            this.soundEnabled = true;
            localStorage.setItem('msot_sound_enabled', 'true');
          }
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return !this.soundEnabled;
  }

  public toggleMute(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_sound_enabled', String(this.soundEnabled));
    }
    if (this.soundEnabled) this.initContext();
    return !this.soundEnabled;
  }

  public setVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_sfx_volume', String(this.sfxVolume));
    }
  }

  public getVolume(): number {
    return this.sfxVolume;
  }

  public toggleHaptics(): boolean {
    this.hapticsEnabled = !this.hapticsEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_haptics_enabled', String(this.hapticsEnabled));
    }
    return this.hapticsEnabled;
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  // --- HAPTIC TRIGGERS ---
  public vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if unsupported on desktop
      }
    }
  }

  // --- SOUND EFFECTS ---

  public playTap() {
    this.vibrate(15);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.035);

    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playCorrect() {
    this.vibrate([30, 40, 50]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playGentleWrong() {
    this.vibrate([40, 60]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Gentle soft descending tone (never harsh buzzer)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.22); // E3

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCombo(comboStep: number = 1) {
    this.vibrate(25);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 440; // A4
    const pitch = baseFreq * (1 + Math.min(1.5, comboStep * 0.18));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, now + 0.12);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playLevelUp() {
    this.vibrate([50, 60, 50, 60, 100]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playChestShake() {
    this.vibrate(40);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playChestOpen(rarity: string = 'COMMON') {
    this.vibrate([80, 50, 150]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseChord = rarity === 'LEGENDARY'
      ? [587.33, 739.99, 880.00, 1174.66, 1479.98] // D Major 9th
      : rarity === 'EPIC'
      ? [440, 554.37, 659.25, 880]
      : [392, 493.88, 587.33];

    baseChord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.09;

      osc.type = rarity === 'LEGENDARY' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  public playMonsterHit() {
    this.vibrate(60);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playMonsterDefeat() {
    this.vibrate([60, 40, 120]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sequence = [261.63, 329.63, 392.00, 523.25];
    sequence.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playLeagueClimb() {
    this.vibrate([40, 50, 60]);
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public play(
    name:
      | 'tap'
      | 'correct'
      | 'gentleWrong'
      | 'wrong'
      | 'combo'
      | 'levelUp'
      | 'chestShake'
      | 'chestOpen'
      | 'monsterHit'
      | 'monsterDefeat'
      | 'leagueClimb',
    arg?: number
  ) {
    switch (name) {
      case 'tap':
        return this.playTap();
      case 'correct':
        return this.playCorrect();
      case 'gentleWrong':
      case 'wrong':
        return this.playGentleWrong();
      case 'combo':
        return this.playCombo(arg);
      case 'levelUp':
        return this.playLevelUp();
      case 'chestShake':
        return this.playChestShake();
      case 'chestOpen':
        return this.playChestOpen();
      case 'monsterHit':
        return this.playMonsterHit();
      case 'monsterDefeat':
        return this.playMonsterDefeat();
      case 'leagueClimb':
        return this.playLeagueClimb();
      default:
        return this.playTap();
    }
  }
}

export const soundManager = new SoundManager();
export const sound = soundManager;
