import type { SeedParameters } from './types.js';
/**
 * Re-exports SeedParameters under the spec's "StyleGenome" name.
 * They're the same shape; this is naming alignment with the build spec.
 */
export type StyleGenome = SeedParameters;
/**
 * Builds the complete generation prompt for Claude to create a landing page
 * variation matching this genome. Includes:
 * - All 14 dimensions
 * - CSS signature for the chosen style archetype
 * - Computed harmony palette
 * - Google Fonts link tag
 * - Type scale steps
 * - Page content template
 * - CSS quality rules
 */
export declare function genomeToPrompt(genome: StyleGenome, brief: string, variationNumber: number, outputPath: string): string;
/**
 * Serializes a genome as the HTML comment header that goes at the top of
 * each generated variation file. Used for grep/compare across variations.
 * Scores are filled in by genomeWithScoresAsComment after judging.
 */
export declare function serializeGenomeAsComment(genome: StyleGenome, variationNumber: number): string;
/**
 * Returns a short single-line summary of a genome, used in status output and gem listings.
 */
export declare function genomeSummary(genome: StyleGenome): string;
