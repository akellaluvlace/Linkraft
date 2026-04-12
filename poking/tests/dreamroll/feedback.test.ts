import { describe, it, expect } from 'vitest';
import {
  likeVariation,
  hateVariation,
  computeUserPreferenceWeights,
  mergeWeights,
  LIKE_MULTIPLIER,
  HATE_MULTIPLIER,
} from '../../src/dreamroll/feedback.js';
import type { DreamrollState, SeedParameters, Variation } from '../../src/dreamroll/types.js';

function makeSeed(overrides: Partial<SeedParameters> = {}): SeedParameters {
  return {
    genre: 'cyberpunk',
    colorPalette: 'neon-on-dark',
    harmonyBaseHue: 200,
    typography: 'space-mono-inter',
    typeScale: 'major-third',
    layoutArchetype: 'asymmetric-golden',
    density: 'dense',
    mood: 'techy-hacker',
    era: 'far-future',
    animation: 'glitch-digital',
    imagery: 'noise-texture',
    borderRadius: 'sharp-zero',
    shadows: 'no-shadows',
    ctaStyle: 'brutalist-block',
    wildcard: 'use-unacceptable-color',
    mutation: 'pure',
    copyAngle: 'bold-claim',
    sectionVariation: 'subtle',
    temperature: 0.9,
    ...overrides,
  };
}

function makeVariation(id: number, seed: SeedParameters): Variation {
  return {
    id,
    seed,
    verdict: null,

    filesPath: null,
    createdAt: new Date().toISOString(),
  };
}

function makeState(variations: Variation[]): DreamrollState {
  return {
    config: { basePage: '', targetVariations: null, budgetHours: 24, projectRoot: '/tmp' },
    currentVariation: variations.length,
    variations,
    gems: [],
    evolutionAdjustments: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    elapsedMs: 0,
    status: 'running',
  };
}

describe('likeVariation / hateVariation', () => {
  it('marks a variation as liked and creates userPreferences if missing', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    expect(state.userPreferences).toBeUndefined();
    expect(likeVariation(state, 1)).toBe(true);
    expect(state.userPreferences?.liked).toEqual([1]);
    expect(state.userPreferences?.hated).toEqual([]);
  });

  it('refuses to like a variation that does not exist', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    expect(likeVariation(state, 99)).toBe(false);
    expect(state.userPreferences).toBeUndefined();
  });

  it('liking removes the variation from hated', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    hateVariation(state, 1);
    expect(state.userPreferences?.hated).toEqual([1]);
    likeVariation(state, 1);
    expect(state.userPreferences?.liked).toEqual([1]);
    expect(state.userPreferences?.hated).toEqual([]);
  });

  it('liking the same variation twice is idempotent', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    expect(likeVariation(state, 1)).toBe(true);
    expect(likeVariation(state, 1)).toBe(false);
    expect(state.userPreferences?.liked).toEqual([1]);
  });

  it('hating removes the variation from liked', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    likeVariation(state, 1);
    hateVariation(state, 1);
    expect(state.userPreferences?.liked).toEqual([]);
    expect(state.userPreferences?.hated).toEqual([1]);
  });
});

describe('computeUserPreferenceWeights', () => {
  it('returns undefined when no preferences exist', () => {
    const state = makeState([makeVariation(1, makeSeed())]);
    expect(computeUserPreferenceWeights(state)).toBeUndefined();
  });

  it('applies LIKE_MULTIPLIER to every dimension value of a liked variation', () => {
    const seed = makeSeed({ genre: 'cyberpunk', colorPalette: 'neon-on-dark', copyAngle: 'bold-claim' });
    const state = makeState([makeVariation(7, seed)]);
    likeVariation(state, 7);
    const weights = computeUserPreferenceWeights(state);
    expect(weights).toBeDefined();
    expect(weights!.style?.['cyberpunk']).toBe(LIKE_MULTIPLIER);
    expect(weights!.palette?.['neon-on-dark']).toBe(LIKE_MULTIPLIER);
    expect(weights!.copyAngle?.['bold-claim']).toBe(LIKE_MULTIPLIER);
    expect(weights!.sectionVariation?.['subtle']).toBe(LIKE_MULTIPLIER);
  });

  it('applies HATE_MULTIPLIER to every dimension value of a hated variation', () => {
    const seed = makeSeed({ genre: 'corporate-saas', colorPalette: 'pastels' });
    const state = makeState([makeVariation(3, seed)]);
    hateVariation(state, 3);
    const weights = computeUserPreferenceWeights(state)!;
    expect(weights.style?.['corporate-saas']).toBe(HATE_MULTIPLIER);
    expect(weights.palette?.['pastels']).toBe(HATE_MULTIPLIER);
  });

  it('multipliers stack across multiple liked variations sharing a value', () => {
    const a = makeVariation(1, makeSeed({ genre: 'cyberpunk' }));
    const b = makeVariation(2, makeSeed({ genre: 'cyberpunk' }));
    const state = makeState([a, b]);
    likeVariation(state, 1);
    likeVariation(state, 2);
    const weights = computeUserPreferenceWeights(state)!;
    expect(weights.style?.['cyberpunk']).toBe(LIKE_MULTIPLIER * LIKE_MULTIPLIER);
  });

  it('like and hate compose multiplicatively', () => {
    const a = makeVariation(1, makeSeed({ genre: 'cyberpunk' }));
    const b = makeVariation(2, makeSeed({ genre: 'cyberpunk' }));
    const state = makeState([a, b]);
    likeVariation(state, 1);
    hateVariation(state, 2);
    const weights = computeUserPreferenceWeights(state)!;
    expect(weights.style?.['cyberpunk']).toBeCloseTo(LIKE_MULTIPLIER * HATE_MULTIPLIER, 5);
  });
});

describe('mergeWeights', () => {
  it('returns undefined when both inputs are undefined', () => {
    expect(mergeWeights(undefined, undefined)).toBeUndefined();
  });

  it('returns the user weights when evolution is undefined', () => {
    const user = { style: { cyberpunk: 3 } };
    expect(mergeWeights(undefined, user)).toEqual(user);
  });

  it('multiplies user weights into evolution weights for shared values', () => {
    const evolution = { style: { cyberpunk: 2, swiss: 1 } };
    const user = { style: { cyberpunk: 3 } };
    const merged = mergeWeights(evolution, user)!;
    expect(merged.style?.['cyberpunk']).toBe(6);
    expect(merged.style?.['swiss']).toBe(1);
  });

  it('user weights for new values get a baseline of 1', () => {
    const evolution = { style: { swiss: 2 } };
    const user = { style: { cyberpunk: 0.25 } };
    const merged = mergeWeights(evolution, user)!;
    expect(merged.style?.['cyberpunk']).toBe(0.25);
    expect(merged.style?.['swiss']).toBe(2);
  });
});
