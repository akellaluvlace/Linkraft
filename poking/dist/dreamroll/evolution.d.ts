import type { DreamrollState, EvolutionAdjustment } from './types.js';
/**
 * Analyzes gems to find patterns in high-scoring variations.
 */
export declare function detectPatterns(state: DreamrollState): string[];
/**
 * Generates evolution adjustments based on detected patterns.
 */
export declare function generateAdjustments(state: DreamrollState, patterns: string[]): EvolutionAdjustment[];
/**
 * Determines if the current variation should use fully random parameters
 * (chaos injection) or evolved parameters.
 */
export declare function shouldInjectChaos(_variationNumber: number): boolean;
/**
 * Runs evolution analysis at the specified interval.
 * Returns adjustments if it's time to evolve, empty array otherwise.
 */
export declare function maybeEvolve(state: DreamrollState, interval?: number): EvolutionAdjustment[];
