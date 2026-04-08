import type { SeedParameters } from './types.js';
export declare const STYLE_POOL: string[];
export declare const PALETTE_POOL: string[];
export declare const TYPOGRAPHY_POOL: string[];
export declare const LAYOUT_POOL: string[];
export declare const DENSITY_POOL: string[];
export declare const MOOD_POOL: string[];
export declare const ERA_POOL: string[];
export declare const ANIMATION_POOL: string[];
export declare const IMAGERY_POOL: string[];
export declare const WILDCARD_POOL: string[];
/**
 * Per-parameter weight map. Higher weight = more likely to be picked.
 * Used by evolution to bias toward gem-producing values.
 */
export interface ParamWeights {
    style?: Record<string, number>;
    palette?: Record<string, number>;
    typography?: Record<string, number>;
    layout?: Record<string, number>;
    density?: Record<string, number>;
    mood?: Record<string, number>;
    era?: Record<string, number>;
    animation?: Record<string, number>;
    imagery?: Record<string, number>;
    wildcard?: Record<string, number>;
}
/**
 * Picks from a pool respecting optional weights.
 * Unweighted values default to 1. Weighted values use their number.
 */
export declare function weightedPick<T extends string>(pool: readonly T[], weights?: Record<string, number>): T;
/**
 * Rolls all 10 parameter pools randomly. Returns a complete SeedParameters.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 */
export declare function rollParams(weights?: ParamWeights, chaos?: boolean): SeedParameters;
/**
 * Returns all 10 pools for tests and documentation.
 */
export declare function getAllPools(): Record<string, readonly string[]>;
