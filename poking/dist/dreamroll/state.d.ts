import type { DreamrollState, DreamrollConfig, Variation } from './types.js';
/**
 * Creates a new Dreamroll state from config.
 */
export declare function createState(config: DreamrollConfig): DreamrollState;
/**
 * Loads state from disk. Returns null if no state file exists or it's corrupted.
 */
export declare function loadState(projectRoot: string): DreamrollState | null;
/**
 * Saves state to disk.
 */
export declare function saveState(projectRoot: string, state: DreamrollState): void;
/**
 * Adds a completed variation to state and saves.
 */
export declare function addVariation(projectRoot: string, state: DreamrollState, variation: Variation): void;
/**
 * Updates the elapsed time and saves state.
 */
export declare function updateElapsed(projectRoot: string, state: DreamrollState, elapsedMs: number): void;
/**
 * Marks the run as stopped.
 */
export declare function stopRun(projectRoot: string, state: DreamrollState): void;
/**
 * Marks the run as completed.
 */
export declare function completeRun(projectRoot: string, state: DreamrollState): void;
/**
 * Checks if a previous run can be resumed.
 */
export declare function canResume(projectRoot: string): boolean;
