import type { DreamrollConfig, DreamrollState, SeedParameters, Variation } from './types.js';
import { type JudgeCaller } from './judges.js';
/**
 * Generates random seed parameters for a variation.
 */
export declare function rollSeedParameters(): SeedParameters;
/**
 * Builds the generation prompt for Claude from seed parameters.
 */
export declare function buildGenerationPrompt(seed: SeedParameters, basePageContent: string): string;
export interface GeneratorOptions {
    config: DreamrollConfig;
    agentsDir: string;
    judgeCaller: JudgeCaller | null;
    onVariation?: (variation: Variation, state: DreamrollState) => void;
    shouldStop?: () => boolean;
}
/**
 * Runs the Dreamroll generation loop.
 * Resumable: checks for existing state and continues from last variation.
 */
export declare function runDreamroll(options: GeneratorOptions): Promise<DreamrollState>;
/**
 * Generates the morning report for a completed or in-progress run.
 */
export declare function getMorningReport(projectRoot: string): string;
