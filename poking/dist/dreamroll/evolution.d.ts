import type { DreamrollState, EvolutionAdjustment } from './types.js';
/**
 * Analyzes gems to find patterns in high-scoring variations.
 * A pattern is a parameter value that appears in >= 30% of gems.
 */
export declare function detectPatterns(state: DreamrollState): string[];
/**
 * Generates evolution adjustments based on detected patterns.
 * Each adjustment records which parameter direction the roller should favor.
 */
export declare function generateAdjustments(state: DreamrollState, patterns: string[]): EvolutionAdjustment[];
export declare function applyAdjustments(state: DreamrollState, adjustments: EvolutionAdjustment[]): void;
/**
 * Determines if the current variation should use fully random parameters
 * (chaos injection) or evolved weighted parameters.
 *
 * Mandatory chaos: variations 4 and 5 of every 5-cycle are pure random.
 * Variations 1-3 use evolved weights if available.
 */
export declare function shouldInjectChaos(variationNumber: number): boolean;
/**
 * Runs evolution analysis at the specified interval.
 * Returns adjustments if it's time to evolve, empty array otherwise.
 * Default interval: 5 variations per spec.
 */
export declare function maybeEvolve(state: DreamrollState, interval?: number): EvolutionAdjustment[];
