import type { SheepStats } from './types.js';
/**
 * Creates a new stats object for a session.
 */
export declare function createStats(projectName: string): SheepStats;
/**
 * Loads stats from disk. Returns null if not found.
 */
export declare function loadStats(projectRoot: string): SheepStats | null;
/**
 * Saves stats to disk. Called after EVERY cycle.
 */
export declare function saveStats(projectRoot: string, stats: SheepStats): void;
/**
 * Marks the session as completed.
 */
export declare function completeSession(projectRoot: string, stats: SheepStats): void;
/**
 * Checks if a previous session can be resumed.
 */
export declare function canResume(projectRoot: string): boolean;
