/**
 * MSOT Quest — Central Motion & Sensory Manager
 * Manages sensory accessibility tiers (FULL, REDUCED, MINIMAL),
 * live frame rate quality scaling, particle budgets, and WCAG 2.3.1 seizure safety limits.
 */

export type SensoryMode = 'FULL' | 'REDUCED' | 'MINIMAL';

export interface SensoryPreferences {
  mode: SensoryMode;
  particlesEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  cursorEnabled: boolean;
  dynamicQualityScaler: boolean;
}

class MotionManager {
  private mode: SensoryMode = 'FULL';
  private particlesEnabled: boolean = true;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;
  private cursorEnabled: boolean = true;
  private dynamicQualityScaler: boolean = true;

  // FPS Dynamic Scaler
  private currentFps: number = 60;
  private isLowPerformance: boolean = false;
  private frameTimes: number[] = [];
  private lastFrameTimestamp: number = 0;
  private animFrameId: number | null = null;

  // Seizure Safety Limiter (WCAG 2.3.1 - max 3 flashes/sec)
  private flashTimestamps: number[] = [];

  // Listeners
  private listeners: Set<(prefs: SensoryPreferences) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('msot_sensory_mode') as SensoryMode | null;
      const storedParticles = localStorage.getItem('msot_particles_enabled');
      const storedSound = localStorage.getItem('msot_sound_enabled');
      const storedHaptics = localStorage.getItem('msot_haptics_enabled');
      const storedCursor = localStorage.getItem('msot_cursor_enabled');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (storedMode) {
        this.mode = storedMode;
      } else if (prefersReduced) {
        this.mode = 'REDUCED';
      } else {
        this.mode = 'FULL';
      }

      if (storedParticles !== null) this.particlesEnabled = storedParticles === 'true';
      if (storedSound !== null) this.soundEnabled = storedSound === 'true';
      if (storedHaptics !== null) this.hapticsEnabled = storedHaptics === 'true';
      if (storedCursor !== null) this.cursorEnabled = storedCursor === 'true';

      // Start FPS monitor
      this.startFpsMonitor();

      // Listen for system preference changes
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (!localStorage.getItem('msot_sensory_mode')) {
          this.setSensoryMode(e.matches ? 'REDUCED' : 'FULL');
        }
      });
    }
  }

  public getPreferences(): SensoryPreferences {
    return {
      mode: this.mode,
      particlesEnabled: this.particlesEnabled,
      soundEnabled: this.soundEnabled,
      hapticsEnabled: this.hapticsEnabled,
      cursorEnabled: this.cursorEnabled,
      dynamicQualityScaler: this.dynamicQualityScaler,
    };
  }

  public getSensoryMode(): SensoryMode {
    return this.mode;
  }

  public setSensoryMode(mode: SensoryMode) {
    this.mode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_sensory_mode', mode);
    }
    this.notify();
  }

  public toggleParticles(): boolean {
    this.particlesEnabled = !this.particlesEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_particles_enabled', String(this.particlesEnabled));
    }
    this.notify();
    return this.particlesEnabled;
  }

  public toggleCursor(): boolean {
    this.cursorEnabled = !this.cursorEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('msot_cursor_enabled', String(this.cursorEnabled));
    }
    this.notify();
    return this.cursorEnabled;
  }

  public isParticleAllowed(): boolean {
    if (this.mode === 'MINIMAL') return false;
    if (!this.particlesEnabled) return false;
    return true;
  }

  public getParticleScale(): number {
    if (this.mode === 'MINIMAL' || !this.particlesEnabled) return 0;
    if (this.mode === 'REDUCED') return 0.3;
    if (this.isLowPerformance) return 0.5;
    return 1.0;
  }

  public allowsAmbientMotion(): boolean {
    return this.mode === 'FULL' && !this.isLowPerformance;
  }

  public allows3DTilt(): boolean {
    return this.mode === 'FULL' && !this.isLowPerformance;
  }

  // --- WCAG 2.3.1 SEIZURE SAFETY GUARD ---
  /**
   * Checks whether a screen flash or high-contrast strobe is permitted.
   * Hard limits to <= 3 events per rolling 1000ms window.
   */
  public canFlash(): boolean {
    if (this.mode === 'MINIMAL') return false;
    const now = Date.now();
    // Filter timestamps within last 1000ms
    this.flashTimestamps = this.flashTimestamps.filter((t) => now - t < 1000);
    if (this.flashTimestamps.length >= 3) {
      console.warn('[MotionManager] Strobe flash suppressed to protect against photosensitive seizures (WCAG 2.3.1).');
      return false;
    }
    this.flashTimestamps.push(now);
    return true;
  }

  // --- DYNAMIC QUALITY SCALER (FPS MONITOR) ---
  private startFpsMonitor() {
    if (typeof window === 'undefined') return;

    const sampleFps = (timestamp: number) => {
      if (this.lastFrameTimestamp) {
        const delta = timestamp - this.lastFrameTimestamp;
        if (delta > 0) {
          const fps = 1000 / delta;
          this.frameTimes.push(fps);
          if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
            const avgFps = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.currentFps = Math.round(avgFps);

            if (this.dynamicQualityScaler) {
              if (avgFps < 45 && !this.isLowPerformance) {
                this.isLowPerformance = true;
                this.notify();
              } else if (avgFps >= 55 && this.isLowPerformance) {
                this.isLowPerformance = false;
                this.notify();
              }
            }
          }
        }
      }
      this.lastFrameTimestamp = timestamp;
      this.animFrameId = requestAnimationFrame(sampleFps);
    };

    this.animFrameId = requestAnimationFrame(sampleFps);
  }

  public getFps(): number {
    return this.currentFps;
  }

  public isPerformanceDegraded(): boolean {
    return this.isLowPerformance;
  }

  // --- SUBSCRIBER NOTIFICATIONS ---
  public subscribe(listener: (prefs: SensoryPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const prefs = this.getPreferences();
    this.listeners.forEach((l) => l(prefs));
  }
}

export const motionManager = new MotionManager();
