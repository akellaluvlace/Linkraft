import { describe, it, expect } from 'vitest';
import {
  STYLE_POOL, PALETTE_POOL, TYPOGRAPHY_POOL, TYPE_SCALE_POOL, LAYOUT_POOL,
  DENSITY_POOL, MOOD_POOL, ERA_POOL, ANIMATION_POOL, IMAGERY_POOL,
  BORDER_RADIUS_POOL, SHADOW_POOL, CTA_STYLE_POOL, WILDCARD_POOL,
  MUTATION_POOL, MUTATIONS, MATERIALS,
  rollParams, weightedPick, getAllPools,
} from '../../src/dreamroll/params.js';

describe('parameter pools', () => {
  it('all 17 pools have at least 3 values', () => {
    const pools = getAllPools();
    expect(Object.keys(pools)).toHaveLength(17);
    for (const [name, pool] of Object.entries(pools)) {
      // sectionVariation has 3 values; mutation has 8; every other pool has >= 5
      const min = name === 'sectionVariation' ? 3 : 5;
      expect(pool.length, `pool ${name} should have >= ${min} values`).toBeGreaterThanOrEqual(min);
    }
  });

  it('no pool contains empty or falsy values', () => {
    const pools = getAllPools();
    for (const [name, pool] of Object.entries(pools)) {
      for (const value of pool) {
        expect(value, `pool ${name} should not have empty values`).toBeTruthy();
        expect(typeof value).toBe('string');
      }
    }
  });

  it('exposes all 14 individual pools as exports', () => {
    expect(STYLE_POOL.length).toBeGreaterThan(0);
    expect(PALETTE_POOL.length).toBeGreaterThan(0);
    expect(TYPOGRAPHY_POOL.length).toBeGreaterThan(0);
    expect(TYPE_SCALE_POOL.length).toBeGreaterThan(0);
    expect(LAYOUT_POOL.length).toBeGreaterThan(0);
    expect(DENSITY_POOL.length).toBeGreaterThan(0);
    expect(MOOD_POOL.length).toBeGreaterThan(0);
    expect(ERA_POOL.length).toBeGreaterThan(0);
    expect(ANIMATION_POOL.length).toBeGreaterThan(0);
    expect(IMAGERY_POOL.length).toBeGreaterThan(0);
    expect(BORDER_RADIUS_POOL.length).toBeGreaterThan(0);
    expect(SHADOW_POOL.length).toBeGreaterThan(0);
    expect(CTA_STYLE_POOL.length).toBeGreaterThan(0);
    expect(WILDCARD_POOL.length).toBeGreaterThan(0);
  });

  it('density has the 5 spec values', () => {
    expect(DENSITY_POOL).toEqual(['ultra-minimal', 'sparse', 'balanced', 'information-rich', 'dense']);
  });

  it('style includes spec signature values', () => {
    expect(STYLE_POOL).toContain('glassmorphism');
    expect(STYLE_POOL).toContain('neo-brutalism');
    expect(STYLE_POOL).toContain('swiss-international');
    expect(STYLE_POOL).toContain('art-deco');
    expect(STYLE_POOL).toContain('synthwave');
    expect(STYLE_POOL).toContain('cyberpunk');
  });

  it('has 30 style archetypes per spec', () => {
    expect(STYLE_POOL.length).toBe(30);
  });
});

describe('rollParams', () => {
  it('produces a complete StyleGenome with all 14 dimensions', () => {
    const seed = rollParams();
    expect(seed.genre).toBeTruthy();
    expect(seed.colorPalette).toBeTruthy();
    expect(seed.harmonyBaseHue).toBeGreaterThanOrEqual(0);
    expect(seed.harmonyBaseHue).toBeLessThan(360);
    expect(seed.typography).toBeTruthy();
    expect(seed.typeScale).toBeTruthy();
    expect(seed.layoutArchetype).toBeTruthy();
    expect(seed.density).toBeTruthy();
    expect(seed.mood).toBeTruthy();
    expect(seed.era).toBeTruthy();
    expect(seed.animation).toBeTruthy();
    expect(seed.imagery).toBeTruthy();
    expect(seed.borderRadius).toBeTruthy();
    expect(seed.shadows).toBeTruthy();
    expect(seed.ctaStyle).toBeTruthy();
    expect(seed.wildcard).toBeTruthy();
    expect(seed.temperature).toBeGreaterThanOrEqual(0.7);
    expect(seed.temperature).toBeLessThanOrEqual(1.3);
  });

  it('every rolled value is from its pool (all 14 dimensions)', () => {
    for (let i = 0; i < 50; i++) {
      const seed = rollParams();
      expect(STYLE_POOL).toContain(seed.genre);
      expect(PALETTE_POOL).toContain(seed.colorPalette);
      expect(TYPOGRAPHY_POOL).toContain(seed.typography);
      expect(TYPE_SCALE_POOL).toContain(seed.typeScale!);
      expect(LAYOUT_POOL).toContain(seed.layoutArchetype);
      expect(DENSITY_POOL).toContain(seed.density);
      expect(MOOD_POOL).toContain(seed.mood);
      expect(ERA_POOL).toContain(seed.era);
      expect(ANIMATION_POOL).toContain(seed.animation);
      expect(IMAGERY_POOL).toContain(seed.imagery);
      expect(BORDER_RADIUS_POOL).toContain(seed.borderRadius!);
      expect(SHADOW_POOL).toContain(seed.shadows!);
      expect(CTA_STYLE_POOL).toContain(seed.ctaStyle!);
      expect(WILDCARD_POOL).toContain(seed.wildcard);
    }
  });

  it('never picks empty string for required 15 dimensions', () => {
    const required = [
      'genre', 'colorPalette', 'typography', 'typeScale', 'layoutArchetype',
      'density', 'mood', 'era', 'animation', 'imagery', 'borderRadius',
      'shadows', 'ctaStyle', 'wildcard', 'mutation',
    ] as const;
    for (let i = 0; i < 50; i++) {
      const seed = rollParams() as unknown as Record<string, unknown>;
      for (const key of required) {
        expect(seed[key], `${key} should be defined`).toBeDefined();
        expect(seed[key], `${key} should not be null`).not.toBeNull();
        expect(seed[key], `${key} should not be empty`).not.toBe('');
      }
    }
  });

  it('produces varied output over many rolls', () => {
    const genres = new Set<string>();
    for (let i = 0; i < 100; i++) {
      genres.add(rollParams().genre);
    }
    // With 14 values and 100 rolls, we should hit most of them
    expect(genres.size).toBeGreaterThan(5);
  });
});

describe('weightedPick', () => {
  it('picks from pool when no weights provided', () => {
    const result = weightedPick(STYLE_POOL);
    expect(STYLE_POOL).toContain(result);
  });

  it('respects weights but still allows all options', () => {
    const counts: Record<string, number> = {};
    // With 30 styles in the pool and weight 50 for glassmorphism vs 1 for others,
    // glassmorphism probability = 50/(50+29) = 63.3%
    const weights = { glassmorphism: 50 };
    for (let i = 0; i < 1000; i++) {
      const v = weightedPick(STYLE_POOL, weights);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    // Weighted value should dominate (expect ~630, allow wide margin)
    expect(counts['glassmorphism']).toBeGreaterThan(450);
    // But others should still be picked (expect ~370)
    const otherCount = Object.entries(counts)
      .filter(([k]) => k !== 'glassmorphism')
      .reduce((s, [, c]) => s + c, 0);
    expect(otherCount).toBeGreaterThan(100);
  });

  it('returns from pool with empty weights object', () => {
    const result = weightedPick(STYLE_POOL, {});
    expect(STYLE_POOL).toContain(result);
  });
});

describe('STYLE_MUTATION (dimension 15)', () => {
  it('mutation pool has exactly 8 values per spec', () => {
    expect(MUTATION_POOL).toHaveLength(8);
    expect(MUTATION_POOL).toEqual([
      'pure', 'mashup', 'invert', 'era-clash',
      'material-swap', 'maximum', 'minimum', 'franken',
    ]);
  });

  it('mutation weights sum to 100', () => {
    const total = MUTATIONS.reduce((s, m) => s + m.weight, 0);
    expect(total).toBe(100);
  });

  it('mutation weights match the spec distribution', () => {
    const byId = Object.fromEntries(MUTATIONS.map(m => [m.id, m.weight]));
    expect(byId['pure']).toBe(30);
    expect(byId['mashup']).toBe(25);
    expect(byId['invert']).toBe(10);
    expect(byId['era-clash']).toBe(10);
    expect(byId['material-swap']).toBe(10);
    expect(byId['maximum']).toBe(5);
    expect(byId['minimum']).toBe(5);
    expect(byId['franken']).toBe(5);
  });

  it('materials pool has physical substances', () => {
    expect(MATERIALS.length).toBeGreaterThanOrEqual(5);
    expect(MATERIALS).toContain('concrete');
    expect(MATERIALS).toContain('silk');
    expect(MATERIALS).toContain('glass');
    expect(MATERIALS).toContain('paper');
  });

  it('rollParams always produces a mutation value', () => {
    for (let i = 0; i < 50; i++) {
      const seed = rollParams();
      expect(seed.mutation).toBeTruthy();
      expect(MUTATION_POOL).toContain(seed.mutation);
    }
  });

  it('mashup rolls include a secondary archetype different from primary', () => {
    let mashupHit = false;
    for (let i = 0; i < 500 && !mashupHit; i++) {
      const seed = rollParams();
      if (seed.mutation === 'mashup') {
        mashupHit = true;
        expect(seed.mutationSecondary).toBeTruthy();
        expect(seed.mutationSecondary).not.toBe(seed.genre);
        expect(STYLE_POOL).toContain(seed.mutationSecondary);
      }
    }
    expect(mashupHit, 'mashup should appear within 500 rolls at 25% weight').toBe(true);
  });

  it('franken rolls include secondary AND tertiary, all distinct', () => {
    let frankenHit = false;
    for (let i = 0; i < 1500 && !frankenHit; i++) {
      const seed = rollParams();
      if (seed.mutation === 'franken') {
        frankenHit = true;
        expect(seed.mutationSecondary).toBeTruthy();
        expect(seed.mutationTertiary).toBeTruthy();
        const styles = [seed.genre, seed.mutationSecondary, seed.mutationTertiary];
        expect(new Set(styles).size).toBe(3);
      }
    }
    expect(frankenHit, 'franken should appear within 1500 rolls at 5% weight').toBe(true);
  });

  it('material-swap rolls include a material', () => {
    let hit = false;
    for (let i = 0; i < 1000 && !hit; i++) {
      const seed = rollParams();
      if (seed.mutation === 'material-swap') {
        hit = true;
        expect(seed.mutationMaterial).toBeTruthy();
        expect(MATERIALS).toContain(seed.mutationMaterial);
      }
    }
    expect(hit).toBe(true);
  });

  it('non-mashup mutations do not populate secondary', () => {
    for (let i = 0; i < 100; i++) {
      const seed = rollParams();
      if (seed.mutation === 'pure' || seed.mutation === 'invert' || seed.mutation === 'maximum' || seed.mutation === 'minimum') {
        expect(seed.mutationSecondary).toBeUndefined();
        expect(seed.mutationTertiary).toBeUndefined();
      }
    }
  });

  it('distribution is roughly on-spec over 1000 rolls', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const m = rollParams().mutation!;
      counts[m] = (counts[m] ?? 0) + 1;
    }
    // pure should dominate (30% expected, generous tolerance)
    expect(counts['pure']).toBeGreaterThan(200);
    expect(counts['pure']).toBeLessThan(400);
    // mashup should be second (25% expected)
    expect(counts['mashup']).toBeGreaterThan(150);
    expect(counts['mashup']).toBeLessThan(350);
  });
});

describe('rollParams with weights', () => {
  it('favors weighted values', () => {
    // With 30 styles in pool, weight 50 vs 1 = ~63% probability
    const weights = { style: { 'glassmorphism': 50 } };
    const counts: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const seed = rollParams(weights);
      counts[seed.genre] = (counts[seed.genre] ?? 0) + 1;
    }
    expect(counts['glassmorphism']).toBeGreaterThan(200);
  });

  it('chaos mode ignores weights', () => {
    const weights = { style: { 'glassmorphism': 1000 } };
    const counts: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const seed = rollParams(weights, true); // chaos = true
      counts[seed.genre] = (counts[seed.genre] ?? 0) + 1;
    }
    // In chaos mode with 30 styles, glassmorphism should be picked ~1/30 = 16/500
    // Much less than the weighted case (~315)
    expect(counts['glassmorphism']).toBeLessThan(100);
  });
});
