// Dreamroll Diversity: anti-convergence guardrails.
//
// After 20+ variations the evolution weights start to dominate and pages
// begin to look similar. This module adds five guardrails that fight
// convergence:
//
//   1. Full paramWeights reset every 20 variations (v20, v40, v60, ...).
//   2. Used-combination tracker. Each "style|harmony|mutation" trio can
//      only be rolled once per run. Duplicate trios are rejected and the
//      caller rerolls.
//   3. Chaos ramp: 2/5 mandatory chaos for the first 15 variations, 3/5
//      after that. (Implemented in evolution.ts.)
//   4. Style exclusion window: the last 5 style archetype IDs are tracked
//      and cannot be rolled again until they fall off the FIFO.
//   5. Prompt DIVERSITY DIRECTIVE listing recent styles with explicit
//      "must look completely different" instructions. (Implemented in
//      genome.ts.)

import type { DreamrollState, SeedParameters } from './types.js';

/** Every N variations, full weight reset back to uniform. */
export const DIVERSITY_RESET_INTERVAL = 20;

/** A style cannot reappear while it is within the last N variations. */
export const STYLE_EXCLUSION_WINDOW = 5;

/** Cap on how many times rollSeedParameters will retry to find a unique roll. */
export const MAX_DIVERSITY_REROLLS = 30;

/**
 * Canonical key for a genome's uniqueness trio. Two variations with the same
 * style + harmony + mutation are considered duplicates even if their other
 * dimensions (typography, layout, etc.) differ.
 */
export function combinationKey(seed: SeedParameters): string {
  return `${seed.genre}|${seed.colorPalette}|${seed.mutation ?? 'pure'}`;
}

/**
 * Returns true if the given seed's trio has already been used in this run.
 */
export function isCombinationUsed(state: DreamrollState, seed: SeedParameters): boolean {
  if (!state.usedCombinations || state.usedCombinations.length === 0) return false;
  return state.usedCombinations.includes(combinationKey(seed));
}

/**
 * Records a seed's trio in state. Idempotent.
 */
export function recordCombination(state: DreamrollState, seed: SeedParameters): void {
  if (!state.usedCombinations) state.usedCombinations = [];
  const key = combinationKey(seed);
  if (!state.usedCombinations.includes(key)) {
    state.usedCombinations.push(key);
  }
}

/**
 * Returns the set of style archetype IDs that are currently in the exclusion
 * window and therefore cannot be rolled next.
 */
export function getExcludedStyles(state: DreamrollState): string[] {
  return [...(state.recentStyles ?? [])];
}

/**
 * Returns the set of layout pattern IDs that are currently in the exclusion
 * window and therefore cannot be rolled next.
 */
export function getExcludedLayouts(state: DreamrollState): string[] {
  return [...(state.recentLayouts ?? [])];
}

/**
 * Appends a rolled style to the recent-styles FIFO, evicting the oldest entry
 * once the window is full.
 */
export function trackStyleHistory(state: DreamrollState, seed: SeedParameters): void {
  if (!state.recentStyles) state.recentStyles = [];
  state.recentStyles.push(seed.genre);
  while (state.recentStyles.length > STYLE_EXCLUSION_WINDOW) {
    state.recentStyles.shift();
  }
}

/**
 * Appends a rolled layout to the recent-layouts FIFO. Same window size as styles.
 */
export function trackLayoutHistory(state: DreamrollState, seed: SeedParameters): void {
  if (!state.recentLayouts) state.recentLayouts = [];
  state.recentLayouts.push(seed.layoutArchetype);
  while (state.recentLayouts.length > STYLE_EXCLUSION_WINDOW) {
    state.recentLayouts.shift();
  }
}

/**
 * Checks whether it is time for a diversity reset (every 20 completed variations)
 * and, if so, wipes paramWeights and records the reset in evolutionAdjustments.
 *
 * Returns true if a reset actually fired, false otherwise.
 *
 * Idempotent within a boundary: if currentVariation is 20 and the state already
 * recorded a reset at 20, no second reset happens even if this function is
 * called multiple times.
 */
/**
 * One-time migration: caps the sidebar-anchor layout weight back to 1.0.
 * The evolution engine can inflate it over many variations; this ensures
 * it starts fresh on every session load. Call once after loading state.
 */
export function capSidebarWeight(state: DreamrollState): void {
  const layout = state.paramWeights?.['layout'] as Record<string, number> | undefined;
  if (!layout) return;
  if (layout['sidebar-anchor'] !== undefined && layout['sidebar-anchor'] > 1) {
    layout['sidebar-anchor'] = 1;
  }
}

export function maybeDiversityReset(state: DreamrollState): boolean {
  const current = state.currentVariation;
  if (current <= 0) return false;
  if (current % DIVERSITY_RESET_INTERVAL !== 0) return false;
  if (state.lastDiversityReset === current) return false;

  state.paramWeights = {};
  state.lastDiversityReset = current;
  state.evolutionAdjustments.push({
    parameter: '*',
    direction: 'reset',
    reason: `diversity reset at v${current}`,
    appliedAt: current,
  });
  return true;
}
