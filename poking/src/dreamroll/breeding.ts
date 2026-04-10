// Dreamroll Breeding: genetic crossover for two parent genomes.
//
// /linkraft dreamroll breed A B picks two existing variations and produces 3
// child genomes by alternating dimensions between the parents. Each child also
// receives one random mutation rolled fresh.
//
// This is the only place in dreamroll where the user explicitly directs
// evolution. Children are queued in state.pendingChildren so the next 3 calls
// to rollSeedParameters consume them before doing a fresh random roll.

import type { SeedParameters, DreamrollState } from './types.js';
import {
  MUTATIONS,
  MUTATION_POOL,
  STYLE_POOL,
  MATERIALS,
} from './params.js';

/** Dimensions that participate in crossover. Order matters: alternation walks this list. */
const CROSSOVER_FIELDS: Array<keyof SeedParameters> = [
  'genre',
  'colorPalette',
  'typography',
  'typeScale',
  'layoutArchetype',
  'density',
  'mood',
  'era',
  'animation',
  'imagery',
  'borderRadius',
  'shadows',
  'ctaStyle',
  'wildcard',
  'copyAngle',
  'sectionVariation',
];

export interface BreedOptions {
  /** Seed for randomness, used by tests. Defaults to Math.random. */
  random?: () => number;
  /** Number of children to produce. Defaults to 3. */
  count?: number;
}

/**
 * Crosses two parent genomes into N children. Children differ by their
 * alternation pattern:
 *   - child 0: A starts (positions 0,2,4,... from A; 1,3,5,... from B)
 *   - child 1: B starts (the inverse of child 0)
 *   - child 2..n: random per dimension
 *
 * Each child also receives a freshly rolled mutation, distinct from either
 * parent's mutation when possible.
 *
 * The harmonyBaseHue is averaged so the child's color harmony sits between
 * the parents' hues. Mutation-secondary/tertiary/material come from whichever
 * parent's mutation field was kept (or are re-rolled if the child got a fresh
 * mutation that needs them).
 */
export function breedGenomes(
  parentA: SeedParameters,
  parentB: SeedParameters,
  options: BreedOptions = {},
): SeedParameters[] {
  const random = options.random ?? Math.random;
  const count = options.count ?? 3;
  const children: SeedParameters[] = [];

  for (let i = 0; i < count; i++) {
    const child: Partial<SeedParameters> = {};
    for (let j = 0; j < CROSSOVER_FIELDS.length; j++) {
      const field = CROSSOVER_FIELDS[j]!;
      let pickFromA: boolean;
      if (i === 0) {
        pickFromA = j % 2 === 0;
      } else if (i === 1) {
        pickFromA = j % 2 === 1;
      } else {
        pickFromA = random() < 0.5;
      }
      const source = pickFromA ? parentA : parentB;
      const value = source[field];
      if (value !== undefined) {
        (child as Record<string, unknown>)[field] = value;
      }
    }

    // Average the base hue between parents
    const hueA = parentA.harmonyBaseHue ?? 0;
    const hueB = parentB.harmonyBaseHue ?? 0;
    child.harmonyBaseHue = Math.round((hueA + hueB) / 2);

    // Roll a fresh mutation, biased away from both parents' mutations to add variety
    child.mutation = rollChildMutation(parentA.mutation, parentB.mutation, random);

    // Reseed dependent fields based on the new mutation
    if (child.mutation === 'mashup') {
      child.mutationSecondary = pickDifferent([child.genre as string], random);
      child.mutationTertiary = undefined;
      child.mutationMaterial = undefined;
    } else if (child.mutation === 'franken') {
      child.mutationSecondary = pickDifferent([child.genre as string], random);
      child.mutationTertiary = pickDifferent([child.genre as string, child.mutationSecondary], random);
      child.mutationMaterial = undefined;
    } else if (child.mutation === 'material-swap') {
      child.mutationMaterial = MATERIALS[Math.floor(random() * MATERIALS.length)];
      child.mutationSecondary = undefined;
      child.mutationTertiary = undefined;
    } else {
      child.mutationSecondary = undefined;
      child.mutationTertiary = undefined;
      child.mutationMaterial = undefined;
    }

    child.temperature = Math.round(((parentA.temperature + parentB.temperature) / 2) * 100) / 100;
    children.push(child as SeedParameters);
  }

  return children;
}

function rollChildMutation(
  parentAMutation: string | undefined,
  parentBMutation: string | undefined,
  random: () => number,
): string {
  // Try to pick a mutation different from both parents using weighted selection
  const exclude = new Set<string>([parentAMutation ?? 'pure', parentBMutation ?? 'pure']);
  const candidates = MUTATIONS.filter(m => !exclude.has(m.id));
  const pool = candidates.length > 0 ? candidates : MUTATIONS;
  const total = pool.reduce((s, m) => s + m.weight, 0);
  let r = random() * total;
  for (const m of pool) {
    r -= m.weight;
    if (r <= 0) return m.id;
  }
  return pool[pool.length - 1]?.id ?? MUTATION_POOL[0]!;
}

function pickDifferent(exclude: Array<string | undefined>, random: () => number): string {
  const excludeSet = new Set(exclude.filter((s): s is string => typeof s === 'string'));
  const pool = STYLE_POOL.filter(s => !excludeSet.has(s));
  const choice = pool[Math.floor(random() * pool.length)];
  return choice ?? STYLE_POOL[0]!;
}

/**
 * Queues breed children in state. They are consumed in FIFO order by the next
 * calls to rollSeedParameters (in generator.ts).
 */
export function queuePendingChildren(state: DreamrollState, children: SeedParameters[]): void {
  if (!state.pendingChildren) state.pendingChildren = [];
  state.pendingChildren.push(...children);
}

/**
 * Pops the oldest pending child off the queue. Returns undefined when empty.
 */
export function popPendingChild(state: DreamrollState): SeedParameters | undefined {
  if (!state.pendingChildren || state.pendingChildren.length === 0) return undefined;
  return state.pendingChildren.shift();
}
