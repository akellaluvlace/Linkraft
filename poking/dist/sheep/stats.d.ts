import type { SheepStats } from './types.js';
/**
 * Creates a new stats object for a session.
 */
export declare function createStats(projectName: string): SheepStats;
/**
 * Loads stats from disk. Returns null if not found.
 * Mid-session callers should use this — corruption is left in place
 * so the issue surfaces instead of being silently overwritten.
 */
export declare function loadStats(projectRoot: string): SheepStats | null;
/**
 * Loads stats with corruption recovery. Used at session init only.
 *
 * If stats.json exists but is corrupted (invalid JSON, truncated write,
 * etc.), renames it to stats.json.corrupted and returns corrupted=true.
 * This lets the overnight restart loop survive crash-during-write without
 * permanently breaking: the next init starts a fresh session and preserves
 * the corrupted file as a trace for debugging.
 */
export declare function loadStatsOrRecover(projectRoot: string): {
    stats: SheepStats | null;
    corrupted: boolean;
};
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
