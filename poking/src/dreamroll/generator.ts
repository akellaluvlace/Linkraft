// Dreamroll Generator: the main generation loop engine.
// Orchestrates seed rolling, variation creation, judging, and evolution.

import type { DreamrollConfig, DreamrollState, SeedParameters, Variation } from './types.js';
import { rollParams, type ParamWeights } from './params.js';
import { genomeToPrompt } from './genome.js';
import { judgeVariation, type JudgeCaller } from './judges.js';
import { createState, loadState, addVariation, saveState, completeRun, stopRun } from './state.js';
import { maybeEvolve, shouldInjectChaos } from './evolution.js';
import { generateReport, formatReport } from './reporter.js';
import { computeUserPreferenceWeights, mergeWeights } from './feedback.js';
import { popPendingChild } from './breeding.js';
import {
  maybeDiversityReset,
  getExcludedStyles,
  getExcludedLayouts,
  isCombinationUsed,
  recordCombination,
  trackStyleHistory,
  trackLayoutHistory,
  MAX_DIVERSITY_REROLLS,
} from './diversity.js';

/**
 * Generates the next seed parameters for a variation.
 *
 * Priority order:
 *   1. If state has pending children from /linkraft dreamroll breed, pop one
 *      off the queue. Bred children bypass all diversity guardrails — the user
 *      asked for them explicitly.
 *   2. Diversity reset: every 20 variations wipe paramWeights to 1.0.
 *   3. Otherwise roll fresh, merging user feedback weights on top of evolution
 *      weights and honoring the style exclusion window.
 *   4. Chaos rounds ignore weights entirely.
 *   5. Reject the roll if its style|harmony|mutation trio has already been used;
 *      reroll up to MAX_DIVERSITY_REROLLS times.
 */
export function rollSeedParameters(state?: DreamrollState): SeedParameters {
  if (state) {
    const child = popPendingChild(state);
    if (child) return child;
  }

  if (state) maybeDiversityReset(state);

  const chaos = shouldInjectChaos(state?.currentVariation ?? 0);
  const evolutionWeights = state?.paramWeights as ParamWeights | undefined;
  const userWeights = state ? computeUserPreferenceWeights(state) : undefined;
  const merged = mergeWeights(evolutionWeights, userWeights);
  const excludedStyles = state ? getExcludedStyles(state) : [];
  const excludedLayouts = state ? getExcludedLayouts(state) : [];

  let seed = rollParams(merged, chaos, excludedStyles, excludedLayouts);
  if (state) {
    let attempts = 0;
    while (isCombinationUsed(state, seed) && attempts < MAX_DIVERSITY_REROLLS) {
      seed = rollParams(merged, chaos, excludedStyles, excludedLayouts);
      attempts++;
    }
    recordCombination(state, seed);
    trackStyleHistory(state, seed);
    trackLayoutHistory(state, seed);
  }
  return seed;
}

/**
 * Builds the generation prompt for Claude from a Style Genome.
 * Delegates to genome.ts for the full 14-dimension instruction set.
 */
export function buildGenerationPrompt(seed: SeedParameters, brief: string, variationNumber = 0, outputPath = ''): string {
  return genomeToPrompt(seed, brief, variationNumber, outputPath);
}

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
export async function runDreamroll(options: GeneratorOptions): Promise<DreamrollState> {
  const { config, agentsDir, judgeCaller, onVariation, shouldStop } = options;

  // Resume or create new state
  let state = loadState(config.projectRoot);
  if (!state || state.status === 'completed' || state.status === 'stopped') {
    state = createState(config);
    saveState(config.projectRoot, state);
  }

  const startTime = Date.now() - state.elapsedMs;
  const budgetMs = config.budgetHours * 3_600_000;
  const targetCap = config.targetVariations; // null => never-stop

  let i = state.currentVariation + 1;
  while (true) {
    // Stop conditions
    if (targetCap !== null && i > targetCap) break;
    const elapsed = Date.now() - startTime;
    if (elapsed >= budgetMs) {
      state.elapsedMs = elapsed;
      completeRun(config.projectRoot, state);
      break;
    }
    if (shouldStop?.() || state.stopRequested) {
      state.elapsedMs = Date.now() - startTime;
      stopRun(config.projectRoot, state);
      break;
    }

    // Roll seed parameters (chaos or evolved based on state)
    const seed = rollSeedParameters(state);

    // Judge the variation
    const description = buildGenerationPrompt(seed, config.brief ?? `Variation ${i}`);
    const verdict = await judgeVariation(description, agentsDir, judgeCaller);

    const variation: Variation = {
      id: i,
      seed,
      verdict,
      filesPath: null,
      createdAt: new Date().toISOString(),
    };

    addVariation(config.projectRoot, state, variation);

    // Notify callback
    onVariation?.(variation, state);

    // Evolution check
    const adjustments = maybeEvolve(state);
    if (adjustments.length > 0) {
      state.evolutionAdjustments.push(...adjustments);
      saveState(config.projectRoot, state);
    }

    i++;
  }

  // Final state
  state.elapsedMs = Date.now() - startTime;
  if (targetCap !== null && state.currentVariation >= targetCap) {
    completeRun(config.projectRoot, state);
  }

  return state;
}

/**
 * Generates the morning report for a completed or in-progress run.
 */
export function getMorningReport(projectRoot: string): string {
  const state = loadState(projectRoot);
  if (!state) return 'No Dreamroll state found. Run /dreamroll start first.';

  const report = generateReport(state);
  return formatReport(report);
}
