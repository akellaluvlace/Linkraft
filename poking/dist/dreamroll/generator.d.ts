import type { DreamrollConfig, DreamrollState, SeedParameters, Variation } from './types.js';
import { type JudgeCaller } from './judges.js';
/**
 * Generates random seed parameters for a variation.
 * If state has accumulated param weights, uses weighted selection.
 * Chaos rounds (20%) always use fully random.
 */
export declare function rollSeedParameters(state?: DreamrollState): SeedParameters;
/**
 * Builds the generation prompt for Claude from a Style Genome.
 * Delegates to genome.ts for the full 14-dimension instruction set.
 */
export declare function buildGenerationPrompt(seed: SeedParameters, brief: string, variationNumber?: number, outputPath?: string): string;
export interface GeneratorOptions {
    config: DreamrollConfig;
    agentsDir: string;
    judgeCaller: JudgeCaller | null;
    onVariation?: (variation: Variation, state: DreamrollState) => void;
    shouldStop?: () => boolean;
}
/**
 * Runs the Dreamroll generation loop (headless mode with optional judge caller).
 * Resumable: checks for existing state and continues from last variation.
 *
 * Never-stop mode: if config.targetVariations is null, runs until stop flag,
 * external stop callback, or time budget. Designed to run under a restart
 * loop that relaunches after context fills.
 */
export declare function runDreamroll(options: GeneratorOptions): Promise<DreamrollState>;
/**
 * Generates the morning report for a completed or in-progress run.
 */
export declare function getMorningReport(projectRoot: string): string;
