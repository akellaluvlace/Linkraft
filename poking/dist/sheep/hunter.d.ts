import type { SheepConfig, SheepStats, CycleResult, BugReport } from './types.js';
/**
 * Initializes a Sheep session. Creates .sheep/ with QA plan, stats, story.
 * If a running session exists, resumes from it.
 */
export declare function initSession(projectRoot: string): {
    config: SheepConfig;
    qaPlan: string;
    stats: SheepStats;
    resumed: boolean;
    preflightUsed: boolean;
    recoveredFromCorruption: boolean;
};
/**
 * Gets the next area to test based on current cycle count.
 */
export declare function getNextArea(projectRoot: string): {
    area: string;
    files: string[];
    description: string;
    riskLevel: string;
    cycleNumber: number;
} | null;
/**
 * Records a completed cycle. Called by Claude after analyzing and fixing.
 * Generates persona commentary, writes to stats + story, manages human-review.
 */
export declare function recordCycleResult(projectRoot: string, cycle: {
    area: string;
    target: string;
    filesScanned: string[];
    bugsFound: BugReport[];
    bugsFixed: BugReport[];
    bugsLogged: BugReport[];
    buildPassed: boolean;
    testsPassed: boolean;
    testCount: number;
    commitHash: string | null;
}): CycleResult;
/**
 * Completes the session. Generates content pack, writes epilogue.
 */
export declare function completeHunt(projectRoot: string): {
    stats: SheepStats;
    contentPackPath: string;
};
/**
 * Generates a session report from current stats.
 */
export declare function getReport(projectRoot: string): string;
