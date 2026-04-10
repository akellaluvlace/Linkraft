// Anti-convergence tests. Covers:
//   1. diversity reset at v20 / v40 / v60
//   2. used-combinations tracker (style|harmony|mutation trio)
//   3. chaos ramp: 2/5 -> 3/5 after v15
//   4. style exclusion window
//   5. DIVERSITY DIRECTIVE prompt block

import { describe, it, expect } from 'vitest';
import {
  combinationKey,
  isCombinationUsed,
  recordCombination,
  getExcludedStyles,
  trackStyleHistory,
  maybeDiversityReset,
  STYLE_EXCLUSION_WINDOW,
  DIVERSITY_RESET_INTERVAL,
} from '../../src/dreamroll/diversity.js';
import { shouldInjectChaos, CHAOS_RAMP_AT } from '../../src/dreamroll/evolution.js';
import { rollParams, STYLE_POOL } from '../../src/dreamroll/params.js';
import { rollSeedParameters } from '../../src/dreamroll/generator.js';
import { genomeToPrompt, type StyleGenome } from '../../src/dreamroll/genome.js';
import type { DreamrollState, SeedParameters } from '../../src/dreamroll/types.js';

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

function makeState(overrides: Partial<DreamrollState> = {}): DreamrollState {
  return {
    config: { basePage: '', targetVariations: null, budgetHours: 24, projectRoot: '/tmp' },
    currentVariation: 0,
    variations: [],
    gems: [],
    evolutionAdjustments: [],
    startedAt: '',
    lastUpdatedAt: '',
    elapsedMs: 0,
    status: 'running',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 1. Diversity reset
// ──────────────────────────────────────────────────────────────────────────

describe('maybeDiversityReset', () => {
  it('does nothing for variation 0', () => {
    const state = makeState({ currentVariation: 0 });
    expect(maybeDiversityReset(state)).toBe(false);
  });

  it('does nothing for non-boundary variations', () => {
    const state = makeState({ currentVariation: 13, paramWeights: { style: { cyberpunk: 5 } } });
    expect(maybeDiversityReset(state)).toBe(false);
    expect(state.paramWeights?.style?.['cyberpunk']).toBe(5);
  });

  it('resets paramWeights at variation 20', () => {
    const state = makeState({
      currentVariation: 20,
      paramWeights: { style: { cyberpunk: 7 }, palette: { 'neon-on-dark': 5 } },
    });
    expect(maybeDiversityReset(state)).toBe(true);
    expect(state.paramWeights).toEqual({});
  });

  it('logs the reset in evolutionAdjustments', () => {
    const state = makeState({ currentVariation: 40, paramWeights: { style: { cyberpunk: 3 } } });
    maybeDiversityReset(state);
    const log = state.evolutionAdjustments.find(a => a.reason.includes('diversity reset'));
    expect(log).toBeDefined();
    expect(log?.reason).toContain('v40');
    expect(log?.parameter).toBe('*');
  });

  it('is idempotent within a boundary — only fires once per reset point', () => {
    const state = makeState({ currentVariation: 20, paramWeights: { style: { cyberpunk: 5 } } });
    expect(maybeDiversityReset(state)).toBe(true);
    expect(maybeDiversityReset(state)).toBe(false);
    expect(maybeDiversityReset(state)).toBe(false);
    expect(state.evolutionAdjustments).toHaveLength(1);
  });

  it('fires again at the next boundary', () => {
    const state = makeState({ currentVariation: 20 });
    maybeDiversityReset(state);
    state.currentVariation = 40;
    expect(maybeDiversityReset(state)).toBe(true);
    expect(state.evolutionAdjustments).toHaveLength(2);
  });

  it('DIVERSITY_RESET_INTERVAL is 20', () => {
    expect(DIVERSITY_RESET_INTERVAL).toBe(20);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 2. Used-combinations tracker
// ──────────────────────────────────────────────────────────────────────────

describe('combinations tracker', () => {
  it('combinationKey builds a style|harmony|mutation trio', () => {
    expect(combinationKey(makeSeed({ genre: 'cyberpunk', colorPalette: 'neon-on-dark', mutation: 'pure' })))
      .toBe('cyberpunk|neon-on-dark|pure');
  });

  it('treats undefined mutation as "pure"', () => {
    expect(combinationKey(makeSeed({ mutation: undefined }))).toContain('|pure');
  });

  it('isCombinationUsed is false on a fresh state', () => {
    const state = makeState();
    expect(isCombinationUsed(state, makeSeed())).toBe(false);
  });

  it('records and detects a combination', () => {
    const state = makeState();
    const seed = makeSeed();
    recordCombination(state, seed);
    expect(isCombinationUsed(state, seed)).toBe(true);
  });

  it('different trios are tracked independently', () => {
    const state = makeState();
    recordCombination(state, makeSeed({ genre: 'cyberpunk' }));
    expect(isCombinationUsed(state, makeSeed({ genre: 'cyberpunk' }))).toBe(true);
    expect(isCombinationUsed(state, makeSeed({ genre: 'art-deco' }))).toBe(false);
  });

  it('recording is idempotent', () => {
    const state = makeState();
    const seed = makeSeed();
    recordCombination(state, seed);
    recordCombination(state, seed);
    expect(state.usedCombinations).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 3. Chaos ramp
// ──────────────────────────────────────────────────────────────────────────

describe('chaos ramp', () => {
  it('CHAOS_RAMP_AT is 15', () => {
    expect(CHAOS_RAMP_AT).toBe(15);
  });

  it('early runs force chaos at positions 4 and 5 only (2/5 mandatory)', () => {
    // Use a fresh math.random? No — we only check forced positions. For
    // non-forced positions we run many trials and expect variance below 100%.
    expect(shouldInjectChaos(4)).toBe(true);  // pos 4
    expect(shouldInjectChaos(5)).toBe(true);  // pos 0
    expect(shouldInjectChaos(9)).toBe(true);  // pos 4
    expect(shouldInjectChaos(10)).toBe(true); // pos 0
  });

  it('late runs force chaos at positions 3, 4, and 5 (3/5 mandatory)', () => {
    expect(shouldInjectChaos(18)).toBe(true);  // pos 3
    expect(shouldInjectChaos(19)).toBe(true);  // pos 4
    expect(shouldInjectChaos(20)).toBe(true);  // pos 0
    expect(shouldInjectChaos(23)).toBe(true);  // pos 3
  });

  it('early run position 3 is not always chaos (non-mandatory)', () => {
    // 40% chance of being chaos. Run 500 trials and expect neither extreme.
    let chaosCount = 0;
    for (let i = 0; i < 500; i++) if (shouldInjectChaos(3)) chaosCount++;
    expect(chaosCount).toBeGreaterThan(100);
    expect(chaosCount).toBeLessThan(400);
  });

  it('late run positions 1 and 2 are more chaotic than early runs', () => {
    // Higher random ratio should produce more chaos
    let earlyChaos = 0;
    let lateChaos = 0;
    for (let i = 0; i < 1000; i++) {
      if (shouldInjectChaos(1)) earlyChaos++;       // pos 1, early
      if (shouldInjectChaos(16)) lateChaos++;       // pos 1, late
    }
    expect(lateChaos).toBeGreaterThan(earlyChaos);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 4. Style exclusion window
// ──────────────────────────────────────────────────────────────────────────

describe('style exclusion window', () => {
  it(`STYLE_EXCLUSION_WINDOW is 5`, () => {
    expect(STYLE_EXCLUSION_WINDOW).toBe(5);
  });

  it('trackStyleHistory builds a FIFO capped at the window size', () => {
    const state = makeState();
    const styles = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (const s of styles) trackStyleHistory(state, makeSeed({ genre: s }));
    expect(state.recentStyles).toEqual(['c', 'd', 'e', 'f', 'g']);
    expect(state.recentStyles).toHaveLength(STYLE_EXCLUSION_WINDOW);
  });

  it('getExcludedStyles returns a snapshot of recentStyles', () => {
    const state = makeState({ recentStyles: ['cyberpunk', 'art-deco'] });
    expect(getExcludedStyles(state)).toEqual(['cyberpunk', 'art-deco']);
  });

  it('rollParams never picks an excluded style', () => {
    const exclude = ['cyberpunk', 'art-deco', 'glassmorphism', 'neo-brutalism', 'bauhaus'];
    for (let i = 0; i < 200; i++) {
      const seed = rollParams(undefined, false, exclude);
      expect(exclude).not.toContain(seed.genre);
    }
  });

  it('rollParams gracefully falls back when excludeStyles would empty the pool', () => {
    // Exclude every style → fallback returns SOMETHING rather than crashing.
    const seed = rollParams(undefined, false, STYLE_POOL);
    expect(seed.genre).toBeDefined();
    expect(STYLE_POOL).toContain(seed.genre);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 5. rollSeedParameters end-to-end diversity behaviour
// ──────────────────────────────────────────────────────────────────────────

describe('rollSeedParameters diversity integration', () => {
  it('populates recentStyles and usedCombinations after each roll', () => {
    const state = makeState();
    const seed = rollSeedParameters(state);
    expect(state.recentStyles).toEqual([seed.genre]);
    expect(state.usedCombinations).toHaveLength(1);
    expect(state.usedCombinations?.[0]).toBe(combinationKey(seed));
  });

  it('never rolls the same style twice within the exclusion window', () => {
    const state = makeState();
    const rolled: string[] = [];
    for (let i = 0; i < 20; i++) {
      const seed = rollSeedParameters(state);
      rolled.push(seed.genre);
      state.currentVariation = i + 1;
    }
    // Check: within any sliding window of (STYLE_EXCLUSION_WINDOW + 1) consecutive
    // rolls, styles must be unique.
    const W = STYLE_EXCLUSION_WINDOW + 1;
    for (let i = 0; i + W <= rolled.length; i++) {
      const window = rolled.slice(i, i + W);
      expect(new Set(window).size).toBe(W);
    }
  });

  it('triggers a diversity reset when currentVariation hits 20', () => {
    const state = makeState({
      currentVariation: 20,
      paramWeights: { style: { cyberpunk: 10 } },
    });
    rollSeedParameters(state);
    expect(state.paramWeights).toEqual({});
    expect(state.lastDiversityReset).toBe(20);
    expect(state.evolutionAdjustments.some(a => a.reason.includes('diversity reset'))).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 6. DIVERSITY DIRECTIVE prompt block
// ──────────────────────────────────────────────────────────────────────────

function makeGenome(overrides: Partial<StyleGenome> = {}): StyleGenome {
  return makeSeed(overrides);
}

describe('DIVERSITY DIRECTIVE block in genomeToPrompt', () => {
  it('is omitted when recentStyles is empty', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html', []);
    expect(prompt).not.toContain('DIVERSITY DIRECTIVE');
  });

  it('lists every recent style when present', () => {
    const recent = ['cyberpunk', 'art-deco', 'glassmorphism', 'bauhaus', 'synthwave'];
    const prompt = genomeToPrompt(makeGenome(), 'X', 7, '/tmp/x.html', recent);
    expect(prompt).toContain('DIVERSITY DIRECTIVE');
    for (const style of recent) {
      expect(prompt).toContain(style);
    }
  });

  it('contains the mandatory-difference instructions', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html', ['cyberpunk']);
    expect(prompt).toContain('MUST look completely different');
    expect(prompt).toContain('color temperature');
    expect(prompt).toContain('layout structure');
    expect(prompt).toContain('typography mood');
  });

  it('appears before VISUAL IDENTITY so the generator reads it first', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html', ['cyberpunk']);
    const diversityPos = prompt.indexOf('DIVERSITY DIRECTIVE');
    const visualPos = prompt.indexOf('VISUAL IDENTITY');
    expect(diversityPos).toBeGreaterThan(0);
    expect(visualPos).toBeGreaterThan(diversityPos);
  });
});
