import { describe, it, expect } from 'vitest';
import {
  breedGenomes,
  queuePendingChildren,
  popPendingChild,
} from '../../src/dreamroll/breeding.js';
import type { DreamrollState, SeedParameters } from '../../src/dreamroll/types.js';

function seedA(): SeedParameters {
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
  };
}

function seedB(): SeedParameters {
  return {
    genre: 'art-deco',
    colorPalette: 'jewel-tones',
    harmonyBaseHue: 40,
    typography: 'playfair-source',
    typeScale: 'golden-ratio',
    layoutArchetype: 'editorial-magazine',
    density: 'sparse',
    mood: 'premium-luxury',
    era: '1920s-art-deco',
    animation: 'cinematic-reveal',
    imagery: 'svg-illustrations',
    borderRadius: 'rounded-large',
    shadows: 'soft-neumorphic',
    ctaStyle: 'pill-glow',
    wildcard: 'all-uppercase',
    mutation: 'pure',
    copyAngle: 'story',
    sectionVariation: 'dramatic',
    temperature: 0.7,
  };
}

describe('breedGenomes', () => {
  it('produces 3 children by default', () => {
    const children = breedGenomes(seedA(), seedB());
    expect(children).toHaveLength(3);
  });

  it('honors a custom child count', () => {
    expect(breedGenomes(seedA(), seedB(), { count: 5 })).toHaveLength(5);
  });

  it('child 0 alternates A,B,A,B... starting with A', () => {
    const [child] = breedGenomes(seedA(), seedB(), { count: 1, random: () => 0 });
    expect(child).toBeDefined();
    // genre is position 0 (from A), colorPalette position 1 (from B), typography position 2 (from A)
    expect(child!.genre).toBe('cyberpunk');
    expect(child!.colorPalette).toBe('jewel-tones');
    expect(child!.typography).toBe('space-mono-inter');
    expect(child!.typeScale).toBe('golden-ratio');
  });

  it('child 1 alternates B,A,B,A... starting with B', () => {
    const children = breedGenomes(seedA(), seedB(), { count: 2, random: () => 0 });
    const child = children[1]!;
    expect(child.genre).toBe('art-deco');
    expect(child.colorPalette).toBe('neon-on-dark');
    expect(child.typography).toBe('playfair-source');
  });

  it('every dimension comes from one of the two parents', () => {
    const children = breedGenomes(seedA(), seedB());
    const a = seedA();
    const b = seedB();
    for (const child of children) {
      expect([a.genre, b.genre]).toContain(child.genre);
      expect([a.colorPalette, b.colorPalette]).toContain(child.colorPalette);
      expect([a.typography, b.typography]).toContain(child.typography);
      expect([a.layoutArchetype, b.layoutArchetype]).toContain(child.layoutArchetype);
      expect([a.density, b.density]).toContain(child.density);
      expect([a.mood, b.mood]).toContain(child.mood);
      expect([a.copyAngle, b.copyAngle]).toContain(child.copyAngle);
      expect([a.sectionVariation, b.sectionVariation]).toContain(child.sectionVariation);
    }
  });

  it('averages the harmonyBaseHue between the parents', () => {
    const children = breedGenomes(seedA(), seedB(), { count: 1 });
    expect(children[0]!.harmonyBaseHue).toBe(120); // (200 + 40) / 2
  });

  it('rolls a fresh mutation per child, not always pure', () => {
    // Both parents are pure mutation; child mutation should be sampled from the
    // remaining pool. Run many trials to confirm at least one non-pure result.
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const [c] = breedGenomes(seedA(), seedB(), { count: 1 });
      seen.add(c!.mutation ?? 'pure');
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('temperature is the average of the parents', () => {
    const [child] = breedGenomes(seedA(), seedB(), { count: 1 });
    expect(child!.temperature).toBeCloseTo((0.9 + 0.7) / 2, 2);
  });
});

describe('pending children queue', () => {
  function makeState(): DreamrollState {
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
    };
  }

  it('queues and pops in FIFO order', () => {
    const state = makeState();
    const children = breedGenomes(seedA(), seedB());
    queuePendingChildren(state, children);
    expect(state.pendingChildren).toHaveLength(3);

    const first = popPendingChild(state);
    expect(first).toBe(children[0]);
    expect(state.pendingChildren).toHaveLength(2);

    popPendingChild(state);
    popPendingChild(state);
    expect(popPendingChild(state)).toBeUndefined();
  });

  it('appending more children does not reset the queue', () => {
    const state = makeState();
    queuePendingChildren(state, breedGenomes(seedA(), seedB()));
    queuePendingChildren(state, breedGenomes(seedA(), seedB(), { count: 2 }));
    expect(state.pendingChildren).toHaveLength(5);
  });
});
