import type { SheepStats, CycleResult } from './types.js';
/**
 * Initializes the story file with a header and prologue.
 */
export declare function initStory(projectRoot: string, projectName: string): void;
/**
 * Appends a cycle's narrative to the story in KAIROS format.
 */
export declare function appendCycle(projectRoot: string, cycle: CycleResult): void;
/**
 * Appends the final summary to the story.
 */
export declare function appendSummary(projectRoot: string, stats: SheepStats): void;
