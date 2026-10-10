/**
 * Calculates level from lifetime XP using formula: Required XP for Level L = floor(100 * L^1.5)
 */
export declare function xpRequiredForLevel(level: number): number;
export declare function calculateLevel(lifetimeXp: number): number;
export declare function calculateLevelProgress(lifetimeXp: number): {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpRequiredForNextLevel: number;
    progressPercent: number;
};
/**
 * Applies the daily soft cap with diminishing returns (halved after cap, min 1 XP)
 */
export declare function applyDailySoftCap(dailyTotalBefore: number, rawXp: number, softCap?: number): {
    finalXp: number;
    isDiminished: boolean;
};
/**
 * Generates deterministic idempotency key for XP ledger entries
 */
export declare function generateXpIdempotencyKey(studentId: string, sourceType: string, sourceRef: string, dateOrEventTag?: string): string;
/**
 * Calculates improvement rate (growth % vs baseline)
 */
export declare function calculateImprovementRate(currentWeekXp: number, baselineXp: number): number;
/**
 * Generates deterministic, friendly anonymous alias (e.g. "Swift Falcon 42")
 */
export declare function generateAnonymousAlias(studentId: string): string;
/**
 * Calculates Z-Score of a given value against cohort or student history
 */
export declare function calculateZScore(value: number, mean: number, stdDev: number): number;
/**
 * Computes mean and standard deviation of an array of numbers
 */
export declare function calculateMeanAndStdDev(numbers: number[]): {
    mean: number;
    stdDev: number;
};
