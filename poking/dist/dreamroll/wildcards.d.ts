import type { WildcardMutation } from './types.js';
export declare const WILDCARDS: WildcardMutation[];
/**
 * Returns a random wildcard mutation.
 */
export declare function getRandomWildcard(): WildcardMutation;
/**
 * Returns a random wildcard from a specific category.
 */
export declare function getRandomWildcardByCategory(category: string): WildcardMutation | null;
