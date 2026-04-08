// Dreamroll Generator: the main generation loop engine.
// Orchestrates seed rolling, variation creation, judging, and evolution.

import type { DreamrollConfig, DreamrollState, SeedParameters, Variation } from './types.js';
import { rollParams, type ParamWeights } from './params.js';
import { judgeVariation, type JudgeCaller } from './judges.js';
import { createState, loadState, addVariation, saveState, completeRun, stopRun } from './state.js';
import { maybeEvolve, shouldInjectChaos } from './evolution.js';
import { generateReport, formatReport } from './reporter.js';

/**
 * Generates random seed parameters for a variation.
 * If state has accumulated param weights, uses weighted selection.
 * Chaos rounds (20%) always use fully random.
 */
export function rollSeedParameters(state?: DreamrollState): SeedParameters {
  const chaos = shouldInjectChaos(state?.currentVariation ?? 0);
  const weights = state?.paramWeights as ParamWeights | undefined;
  return rollParams(weights, chaos);
}

/**
 * Builds the generation prompt for Claude from seed parameters.
 * Covers all 10 parameter dimensions plus the product brief.
 */
export function buildGenerationPrompt(seed: SeedParameters, brief: string): string {
  return [
    'Generate a standalone HTML landing page variation with inline CSS only.',
    '',
    `Product brief: ${brief}`,
    '',
    'Design Parameters (roll all 10):',
    `- Style: ${seed.genre}`,
    `- Palette: ${seed.colorPalette}`,
    `- Typography: ${seed.typography}`,
    `- Layout: ${seed.layoutArchetype}`,
    `- Density: ${seed.density}`,
    `- Mood: ${seed.mood}`,
    `- Era: ${seed.era}`,
    `- Animation: ${seed.animation}`,
    `- Imagery: ${seed.imagery}`,
    `- Wildcard constraint: ${seed.wildcard}`,
    '',
    'Output requirements:',
    '- Single standalone HTML file, no external dependencies',
    '- All CSS inline in <style> tag',
    '- Valid HTML5, opens in any browser',
    '- HTML comment at the top documenting all 10 parameters',
    '- Real content for the product (not lorem ipsum)',
    '- Clear CTA above the fold',
  ].join('\n');
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
      screenshotPath: null, // Playwright stub
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
