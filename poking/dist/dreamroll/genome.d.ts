import type { SeedParameters } from './types.js';
/**
 * Re-exports SeedParameters under the spec's "StyleGenome" name.
 * They're the same shape; this is naming alignment with the build spec.
 */
export type StyleGenome = SeedParameters;
/**
 * Builds the complete generation prompt for Claude to create a landing page
 * variation matching this genome.
 *
 * Structure (spec-driven to combat generic output):
 *   1. VISUAL IDENTITY (the style archetype, front and center)
 *   2. Constraint (first of three repetitions)
 *   3. THIS PAGE MUST NOT LOOK LIKE
 *   4. Required distinctive CSS declarations
 *   5. All 14 genome dimensions with metadata
 *   6. Constraint (second repetition)
 *   7. Google Fonts link
 *   8. Page structure + CSS quality rules
 *   9. HTML comment header template
 *  10. Constraint (third repetition) + failure warning
 */
export declare function genomeToPrompt(genome: StyleGenome, brief: string, variationNumber: number, outputPath: string): string;
/**
 * Serializes a genome as the HTML comment header that goes at the top of
 * each generated variation file.
 */
export declare function serializeGenomeAsComment(genome: StyleGenome, variationNumber: number): string;
/**
 * Short single-line summary of a genome for status output.
 */
export declare function genomeSummary(genome: StyleGenome): string;
