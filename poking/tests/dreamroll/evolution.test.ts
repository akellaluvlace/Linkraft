import { describe, it, expect } from 'vitest';
import { detectPatterns, shouldInjectChaos, maybeEvolve } from '../../src/dreamroll/evolution.js';
import type { DreamrollState, Variation } from '../../src/dreamroll/types.js';

function makeVariation(id: number, layout: string, genre: string, mood: string, isGem: boolean, extras: Partial<{ era: string; animation: string; imagery: string; wildcard: string; colorPalette: string; typography: string; density: string }> = {}): Variation {
  return {
    id,
    seed: {
      colorPalette: extras.colorPalette ?? `palette-${id}`,
      typography: extras.typography ?? `type-${id}`,
      layoutArchetype: layout,
      genre,
      density: extras.density ?? `density-${id}`,
      mood,
      era: extras.era ?? `era-${id}`,
      animation: extras.animation ?? `anim-${id}`,
      imagery: extras.imagery ?? `img-${id}`,
      temperature: 0.8,
      wildcard: extras.wildcard ?? `wild-${id}`,
    },
    verdict: {
      scores: [
        { judge: 'brutus', score: isGem ? 8 : 3, comment: '' },
        { judge: 'venus', score: isGem ? 7 : 4, comment: '' },
        { judge: 'mercury', score: isGem ? 8 : 3, comment: '' },
      ],
      averageScore: isGem ? 7.7 : 3.3,
      verdict: isGem ? 'gem' : 'discard',
      hasInstantKeep: false,
    },
    screenshotPath: null,
    filesPath: null,
    createdAt: new Date().toISOString(),
  };
}

function makeState(variations: Variation[], gems: number[]): DreamrollState {
  return {
    config: { basePage: 'test.tsx', targetVariations: 100, budgetHours: 8, projectRoot: '/tmp' },
    currentVariation: variations.length,
    variations,
    gems,
    evolutionAdjustments: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    elapsedMs: 0,
    status: 'running',
  };
}

// The evolution tests that previously used `maybeEvolve(state, 10)` assumed
// interval=10. Since the spec now uses 5 by default, tests pass explicit intervals.

describe('detectPatterns', () => {
  it('detects dominant layout pattern in gems', () => {
    const variations = [
      makeVariation(1, 'split', 'brutalism', 'serious', true),
      makeVariation(2, 'split', 'glass', 'calm', true),
      makeVariation(3, 'centered', 'retro', 'playful', true),
      makeVariation(4, 'asymmetric', 'minimal', 'luxury', false),
    ];
    const state = makeState(variations, [1, 2, 3]);

    const patterns = detectPatterns(state);
    expect(patterns.some(p => p.includes('split'))).toBe(true);
  });

  it('returns empty for too few gems', () => {
    const variations = [makeVariation(1, 'split', 'brutalism', 'serious', true)];
    const state = makeState(variations, [1]);
    expect(detectPatterns(state)).toEqual([]);
  });

  it('returns empty when no dominant pattern exists', () => {
    const variations = [
      makeVariation(1, 'split', 'brutalism', 'serious', true),
      makeVariation(2, 'centered', 'glass', 'calm', true),
      makeVariation(3, 'asymmetric', 'retro', 'playful', true),
      makeVariation(4, 'editorial', 'minimal', 'luxury', true),
    ];
    const state = makeState(variations, [1, 2, 3, 4]);
    // No single layout has >= 30% dominance with 4 equal entries
    // Each is 25% which is < 30%
    const patterns = detectPatterns(state);
    const layoutPatterns = patterns.filter(p => p.includes('Layout'));
    expect(layoutPatterns.length).toBe(0);
  });
});

describe('shouldInjectChaos', () => {
  it('returns a boolean', () => {
    const result = shouldInjectChaos(5);
    expect(typeof result).toBe('boolean');
  });

  it('produces some true values over many calls (chaos > 0%)', () => {
    const results = Array.from({ length: 100 }, (_, i) => shouldInjectChaos(i));
    const trueCount = results.filter(r => r).length;
    expect(trueCount).toBeGreaterThan(0);
  });
});

describe('maybeEvolve', () => {
  it('returns empty at non-interval variations', () => {
    const state = makeState([], []);
    state.currentVariation = 5;
    expect(maybeEvolve(state)).toEqual([]);
  });

  it('returns adjustments at interval with patterns', () => {
    const variations = Array.from({ length: 10 }, (_, i) =>
      makeVariation(i + 1, 'split', 'brutalism', 'serious', i < 5),
    );
    const state = makeState(variations, [1, 2, 3, 4, 5]);
    state.currentVariation = 10;

    const adjustments = maybeEvolve(state, 10);
    expect(adjustments.length).toBeGreaterThan(0);
  });

  it('returns empty at interval with no gems', () => {
    const state = makeState([], []);
    state.currentVariation = 10;
    expect(maybeEvolve(state, 10)).toEqual([]);
  });
});
