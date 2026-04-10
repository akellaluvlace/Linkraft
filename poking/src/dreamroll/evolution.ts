// Dreamroll Evolution: analyzes gems and adjusts generation parameters.
// Runs every 5 variations to explore promising directions while maintaining chaos.
// Mandatory chaos: at least 2 of every 5 variations ignore weights (40% floor).

import type { DreamrollState, EvolutionAdjustment } from './types.js';

const CHAOS_RATIO = 0.4; // 2 of every 5 variations are mandatory chaos
const DOMINANCE_THRESHOLD = 0.3;
const DEFAULT_INTERVAL = 5;

/**
 * Counts occurrences of each value for a given seed field in gem variations.
 */
function countByField(
  gems: Array<{ seed: Record<string, unknown> }>,
  field: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of gems) {
    const val = v.seed[field];
    if (typeof val !== 'string') continue;
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

/**
 * All 16 parameter dimensions tracked by evolution. Maps SeedParameters field name
 * to human-readable label used in pattern messages. (Mutation is excluded —
 * its weights are computed differently in params.ts.)
 */
const TRACKED_FIELDS: Array<[string, string]> = [
  ['genre', 'Style'],
  ['colorPalette', 'Harmony'],
  ['typography', 'Typography'],
  ['typeScale', 'TypeScale'],
  ['layoutArchetype', 'Layout'],
  ['density', 'Density'],
  ['mood', 'Mood'],
  ['era', 'Era'],
  ['animation', 'Animation'],
  ['imagery', 'Imagery'],
  ['borderRadius', 'BorderRadius'],
  ['shadows', 'Shadows'],
  ['ctaStyle', 'CtaStyle'],
  ['wildcard', 'Constraint'],
  ['copyAngle', 'CopyAngle'],
  ['sectionVariation', 'SectionVariation'],
];

/**
 * Analyzes gems to find patterns in high-scoring variations.
 * A pattern is a parameter value that appears in >= 30% of gems.
 */
export function detectPatterns(state: DreamrollState): string[] {
  const patterns: string[] = [];
  const gemVariations = state.variations.filter(v => state.gems.includes(v.id));

  if (gemVariations.length < 2) return patterns;

  const threshold = gemVariations.length * DOMINANCE_THRESHOLD;

  for (const [field, label] of TRACKED_FIELDS) {
    const counts = countByField(
      gemVariations.map(v => ({ seed: v.seed as unknown as Record<string, unknown> })),
      field,
    );
    for (const [value, count] of Object.entries(counts)) {
      if (count >= threshold) {
        patterns.push(`${label} "${value}" appears in ${count}/${gemVariations.length} gems`);
      }
    }
  }

  return patterns;
}

/**
 * Generates evolution adjustments based on detected patterns.
 * Each adjustment records which parameter direction the roller should favor.
 */
export function generateAdjustments(
  state: DreamrollState,
  patterns: string[],
): EvolutionAdjustment[] {
  const adjustments: EvolutionAdjustment[] = [];

  for (const pattern of patterns) {
    const match = /^(\w+) "([^"]+)" appears/.exec(pattern);
    if (!match) continue;
    const label = match[1]!;
    const value = match[2]!;

    // Map label back to field name
    const field = TRACKED_FIELDS.find(([_, l]) => l === label)?.[0];
    if (!field) continue;

    adjustments.push({
      parameter: field,
      direction: `favor "${value}"`,
      reason: pattern,
      appliedAt: state.currentVariation,
    });
  }

  return adjustments;
}

/**
 * Applies adjustments to state.paramWeights so the next roll favors the winners.
 * Field name in adjustment maps to weight key (e.g., 'genre' -> 'style').
 */
const FIELD_TO_WEIGHT_KEY: Record<string, string> = {
  genre: 'style',
  colorPalette: 'palette',
  typography: 'typography',
  typeScale: 'typeScale',
  layoutArchetype: 'layout',
  density: 'density',
  mood: 'mood',
  era: 'era',
  animation: 'animation',
  imagery: 'imagery',
  borderRadius: 'borderRadius',
  shadows: 'shadows',
  ctaStyle: 'ctaStyle',
  wildcard: 'wildcard',
  copyAngle: 'copyAngle',
  sectionVariation: 'sectionVariation',
};

export function applyAdjustments(state: DreamrollState, adjustments: EvolutionAdjustment[]): void {
  if (!state.paramWeights) state.paramWeights = {};
  for (const adj of adjustments) {
    const weightKey = FIELD_TO_WEIGHT_KEY[adj.parameter];
    if (!weightKey) continue;
    const valueMatch = /favor "([^"]+)"/.exec(adj.direction);
    if (!valueMatch?.[1]) continue;
    const value = valueMatch[1];
    if (!state.paramWeights[weightKey]) state.paramWeights[weightKey] = {};
    state.paramWeights[weightKey]![value] = (state.paramWeights[weightKey]![value] ?? 1) + 1;
  }
}

/**
 * Determines if the current variation should use fully random parameters
 * (chaos injection) or evolved weighted parameters.
 *
 * Mandatory chaos: variations 4 and 5 of every 5-cycle are pure random.
 * Variations 1-3 use evolved weights if available.
 */
export function shouldInjectChaos(variationNumber: number): boolean {
  // Variations 4-5 of every 5 cycle (positions 4, 5, 9, 10, 14, 15...) are chaos
  const pos = variationNumber % 5;
  if (pos === 4 || pos === 0) return true; // positions 4 and 5 (5%5=0)
  return Math.random() < CHAOS_RATIO;
}

/**
 * Runs evolution analysis at the specified interval.
 * Returns adjustments if it's time to evolve, empty array otherwise.
 * Default interval: 5 variations per spec.
 */
export function maybeEvolve(
  state: DreamrollState,
  interval: number = DEFAULT_INTERVAL,
): EvolutionAdjustment[] {
  if (state.currentVariation === 0 || state.currentVariation % interval !== 0) {
    return [];
  }

  const patterns = detectPatterns(state);
  if (patterns.length === 0) return [];

  const adjustments = generateAdjustments(state, patterns);
  if (adjustments.length > 0) applyAdjustments(state, adjustments);
  return adjustments;
}
