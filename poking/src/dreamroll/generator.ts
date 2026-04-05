// Dreamroll Generator: the main generation loop engine.
// Orchestrates seed rolling, variation creation, judging, and evolution.

import type { DreamrollConfig, DreamrollState, SeedParameters, Variation } from './types.js';
import { getRandomWildcard } from './wildcards.js';
import { judgeVariation, type JudgeCaller } from './judges.js';
import { createState, loadState, addVariation, saveState, completeRun, stopRun } from './state.js';
import { maybeEvolve } from './evolution.js';
import { generateReport, formatReport } from './reporter.js';

const LAYOUT_ARCHETYPES = ['split', 'centered', 'asymmetric', 'editorial', 'cards', 'zigzag', 'single-column', 'sidebar'];
const GENRES = ['brutalism', 'glass', 'retro', 'organic', 'swiss', 'maximalist', 'minimal', 'editorial', 'futuristic'];
const MOODS = ['playful', 'serious', 'luxury', 'friendly', 'technical', 'rebellious', 'calm', 'urgent'];
const DENSITIES: Array<'airy' | 'balanced' | 'dense'> = ['airy', 'balanced', 'dense'];
const COLOR_PALETTES = ['warm-earth', 'cool-ocean', 'neon-night', 'monochrome', 'pastel-dream', 'high-contrast', 'muted-vintage', 'jewel-tones'];
const TYPOGRAPHY_PAIRINGS = ['serif-sans', 'mono-sans', 'display-body', 'geometric-humanist', 'slab-grotesque', 'handwritten-clean'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Generates random seed parameters for a variation.
 */
export function rollSeedParameters(): SeedParameters {
  const wildcard = getRandomWildcard();
  return {
    colorPalette: randomFrom(COLOR_PALETTES),
    typography: randomFrom(TYPOGRAPHY_PAIRINGS),
    layoutArchetype: randomFrom(LAYOUT_ARCHETYPES),
    genre: randomFrom(GENRES),
    density: randomFrom(DENSITIES),
    mood: randomFrom(MOODS),
    temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
    wildcard: wildcard.prompt,
  };
}

/**
 * Builds the generation prompt for Claude from seed parameters.
 */
export function buildGenerationPrompt(seed: SeedParameters, basePageContent: string): string {
  return [
    `Create a visually distinct variation of this landing page.`,
    ``,
    `Design Parameters:`,
    `- Color palette: ${seed.colorPalette}`,
    `- Typography: ${seed.typography}`,
    `- Layout: ${seed.layoutArchetype}`,
    `- Genre: ${seed.genre}`,
    `- Density: ${seed.density}`,
    `- Mood: ${seed.mood}`,
    ``,
    `Creative Wildcard: ${seed.wildcard}`,
    ``,
    `Keep the same content and functionality. Change everything visual:`,
    `colors, typography, spacing, layout, component styles, shadows, borders.`,
    ``,
    `Base page:`,
    '```',
    basePageContent,
    '```',
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
 * Runs the Dreamroll generation loop.
 * Resumable: checks for existing state and continues from last variation.
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

  for (let i = state.currentVariation + 1; i <= config.targetVariations; i++) {
    // Check time budget
    const elapsed = Date.now() - startTime;
    if (elapsed >= budgetMs) {
      state.elapsedMs = elapsed;
      completeRun(config.projectRoot, state);
      break;
    }

    // Check external stop signal
    if (shouldStop?.()) {
      state.elapsedMs = Date.now() - startTime;
      stopRun(config.projectRoot, state);
      break;
    }

    // Roll seed parameters (chaos or evolved)
    const seed = rollSeedParameters();

    // Judge the variation
    const description = buildGenerationPrompt(seed, `[Variation ${i} with ${seed.genre} style]`);
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
  }

  // Final state
  state.elapsedMs = Date.now() - startTime;
  if (state.currentVariation >= config.targetVariations) {
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
