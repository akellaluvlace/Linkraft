// Dreamroll User Feedback: applies /linkraft dreamroll like / hate to bias rolls.
//
// The user is the real judge. Judge scores drive evolution, but the user's
// "more like this / less like this" feedback is treated as authoritative and
// overrides judge-detected patterns at roll time.
//
// Math:
//   Liked variation -> every dimension value in its genome gets a 3x multiplier.
//   Hated variation -> every dimension value in its genome gets a 0.25x multiplier.
//
// Multipliers compose: a value liked twice becomes 9x. A value liked once and
// hated once becomes 0.75x. The merged map is applied on top of evolution
// weights so the next roll favors what the user actually wants.

import type { DreamrollState, SeedParameters, UserPreferences } from './types.js';
import type { ParamWeights } from './params.js';

export const LIKE_MULTIPLIER = 3;
export const HATE_MULTIPLIER = 0.25;

/**
 * Maps a SeedParameters field name to the ParamWeights key for that dimension.
 * The same map is duplicated in evolution.ts (FIELD_TO_WEIGHT_KEY) but kept
 * locally so feedback.ts has no dependency on evolution.
 */
const FIELD_TO_WEIGHT_KEY: Array<[keyof SeedParameters, keyof ParamWeights]> = [
  ['genre', 'style'],
  ['colorPalette', 'palette'],
  ['typography', 'typography'],
  ['typeScale', 'typeScale'],
  ['layoutArchetype', 'layout'],
  ['density', 'density'],
  ['mood', 'mood'],
  ['era', 'era'],
  ['animation', 'animation'],
  ['imagery', 'imagery'],
  ['borderRadius', 'borderRadius'],
  ['shadows', 'shadows'],
  ['ctaStyle', 'ctaStyle'],
  ['wildcard', 'wildcard'],
  ['copyAngle', 'copyAngle'],
  ['sectionVariation', 'sectionVariation'],
];

/**
 * Initializes user preferences if missing. Idempotent.
 */
export function ensureUserPreferences(state: DreamrollState): UserPreferences {
  if (!state.userPreferences) {
    state.userPreferences = { liked: [], hated: [] };
  }
  return state.userPreferences;
}

/**
 * Marks a variation as liked. No-op if already liked. Removes it from hated.
 * Returns true if the variation exists in state and was newly liked.
 */
export function likeVariation(state: DreamrollState, variationId: number): boolean {
  if (!state.variations.find(v => v.id === variationId)) return false;
  const prefs = ensureUserPreferences(state);
  prefs.hated = prefs.hated.filter(id => id !== variationId);
  if (prefs.liked.includes(variationId)) return false;
  prefs.liked.push(variationId);
  return true;
}

/**
 * Marks a variation as hated. No-op if already hated. Removes it from liked.
 */
export function hateVariation(state: DreamrollState, variationId: number): boolean {
  if (!state.variations.find(v => v.id === variationId)) return false;
  const prefs = ensureUserPreferences(state);
  prefs.liked = prefs.liked.filter(id => id !== variationId);
  if (prefs.hated.includes(variationId)) return false;
  prefs.hated.push(variationId);
  return true;
}

/**
 * Builds a ParamWeights map from user preferences alone. Each value in a liked
 * genome contributes a 3x multiplier; each value in a hated genome contributes
 * 0.25x. Values that appear in multiple liked or hated variations stack
 * multiplicatively.
 *
 * Returns undefined if the user has no preferences yet (so callers can skip
 * the merge fast path).
 */
export function computeUserPreferenceWeights(state: DreamrollState): ParamWeights | undefined {
  const prefs = state.userPreferences;
  if (!prefs || (prefs.liked.length === 0 && prefs.hated.length === 0)) return undefined;

  const weights: ParamWeights = {};

  const apply = (variationId: number, multiplier: number): void => {
    const variation = state.variations.find(v => v.id === variationId);
    if (!variation) return;
    for (const [field, key] of FIELD_TO_WEIGHT_KEY) {
      const value = variation.seed[field];
      if (typeof value !== 'string') continue;
      const dim = (weights[key] ??= {}) as Record<string, number>;
      const current = dim[value] ?? 1;
      dim[value] = current * multiplier;
    }
  };

  for (const id of prefs.liked) apply(id, LIKE_MULTIPLIER);
  for (const id of prefs.hated) apply(id, HATE_MULTIPLIER);

  return weights;
}

/**
 * Merges user preference weights with evolution weights. User preferences take
 * precedence: where both exist for a dimension/value, the user multiplier is
 * applied to the evolution weight (not replacing it). For values only present
 * in user weights, the evolution baseline of 1 is assumed.
 *
 * Either input may be undefined; if both are, returns undefined.
 */
export function mergeWeights(
  evolution?: ParamWeights,
  user?: ParamWeights,
): ParamWeights | undefined {
  if (!evolution && !user) return undefined;
  if (!user) return evolution;
  if (!evolution) return user;

  const merged: ParamWeights = {};
  const dims = new Set<keyof ParamWeights>([
    ...Object.keys(evolution),
    ...Object.keys(user),
  ] as Array<keyof ParamWeights>);

  for (const dim of dims) {
    const evoDim = evolution[dim];
    const userDim = user[dim];
    const out: Record<string, number> = {};
    if (evoDim) for (const [k, v] of Object.entries(evoDim)) out[k] = v;
    if (userDim) {
      for (const [k, v] of Object.entries(userDim)) {
        out[k] = (out[k] ?? 1) * v;
      }
    }
    (merged[dim] as Record<string, number>) = out;
  }
  return merged;
}
