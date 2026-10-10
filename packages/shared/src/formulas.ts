import { StudentProfile } from './types.js';

/**
 * Calculates level from lifetime XP using formula: Required XP for Level L = floor(100 * L^1.5)
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function calculateLevel(lifetimeXp: number): number {
  if (lifetimeXp <= 0) return 1;
  let level = 1;
  while (lifetimeXp >= xpRequiredForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function calculateLevelProgress(lifetimeXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(lifetimeXp);
  const currentLevelBaseXp = xpRequiredForLevel(currentLevel);
  const nextLevelBaseXp = xpRequiredForLevel(currentLevel + 1);
  const xpNeeded = nextLevelBaseXp - currentLevelBaseXp;
  const xpIntoLevel = Math.max(0, lifetimeXp - currentLevelBaseXp);
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / Math.max(1, xpNeeded)) * 100));

  return {
    currentLevel,
    xpInCurrentLevel: xpIntoLevel,
    xpRequiredForNextLevel: xpNeeded,
    progressPercent,
  };
}

/**
 * Applies the daily soft cap with diminishing returns (halved after cap, min 1 XP)
 */
export function applyDailySoftCap(
  dailyTotalBefore: number,
  rawXp: number,
  softCap: number = 150
): { finalXp: number; isDiminished: boolean } {
  if (dailyTotalBefore < softCap) {
    const headroom = softCap - dailyTotalBefore;
    if (rawXp <= headroom) {
      return { finalXp: rawXp, isDiminished: false };
    } else {
      const regularPortion = headroom;
      const overflowPortion = rawXp - headroom;
      const diminishedPortion = Math.max(1, Math.floor(overflowPortion * 0.5));
      return { finalXp: regularPortion + diminishedPortion, isDiminished: true };
    }
  } else {
    // Already exceeded cap
    const diminished = Math.max(1, Math.floor(rawXp * 0.5));
    return { finalXp: diminished, isDiminished: true };
  }
}

/**
 * Generates deterministic idempotency key for XP ledger entries
 */
export function generateXpIdempotencyKey(
  studentId: string,
  sourceType: string,
  sourceRef: string,
  dateOrEventTag?: string
): string {
  const tag = dateOrEventTag || 'default';
  return `xp:${studentId}:${sourceType}:${sourceRef}:${tag}`;
}

/**
 * Calculates improvement rate (growth % vs baseline)
 */
export function calculateImprovementRate(currentWeekXp: number, baselineXp: number): number {
  if (baselineXp <= 0) {
    return currentWeekXp > 0 ? 100 : 0;
  }
  const growth = ((currentWeekXp - baselineXp) / baselineXp) * 100;
  return Math.round(growth * 10) / 10;
}

const ADJECTIVES = [
  'Swift', 'Silent', 'Brave', 'Astral', 'Nebula', 'Cosmic', 'Solar', 'Quantum',
  'Clever', 'Agile', 'Radiant', 'Valiant', 'Mystic', 'Vibrant', 'Zenith', 'Echo'
];

const NOUNS = [
  'Falcon', 'Fox', 'Dragon', 'Phoenix', 'Otter', 'Wolf', 'Panther', 'Raven',
  'Lynx', 'Sparrow', 'Tiger', 'Pegasus', 'Orion', 'Vanguard', 'Sentinel', 'Nomad'
];

/**
 * Generates deterministic, friendly anonymous alias (e.g. "Swift Falcon 42")
 */
export function generateAnonymousAlias(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash << 5) - hash + studentId.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const adj = ADJECTIVES[absHash % ADJECTIVES.length];
  const noun = NOUNS[(absHash >> 4) % NOUNS.length];
  const num = (absHash % 90) + 10;
  return `${adj} ${noun} ${num}`;
}

/**
 * Calculates Z-Score of a given value against cohort or student history
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    if (value === mean) return 0;
    // Fallback to relative ratio as surrogate z-score if baseline had 0 variance
    return (value - mean) / Math.max(1, mean * 0.15);
  }
  return (value - mean) / stdDev;
}

/**
 * Computes mean and standard deviation of an array of numbers
 */
export function calculateMeanAndStdDev(numbers: number[]): { mean: number; stdDev: number } {
  if (!numbers.length) return { mean: 0, stdDev: 0 };
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
  return { mean, stdDev: Math.sqrt(variance) };
}
