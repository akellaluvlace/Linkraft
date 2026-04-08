// Dreamroll parameter pools: 10 dimensions per spec.
// Each variation rolls one value from each pool. Weighted selection
// supported for evolution (favored values 2x more likely).

import type { SeedParameters } from './types.js';

export const STYLE_POOL = [
  'glassmorphism', 'neo-brutalism', 'minimalist-swiss', 'retro-terminal',
  'soft-pastel', 'dark-luxe', 'newspaper', 'y2k', 'organic-earth',
  'corporate-clean', 'vaporwave', 'art-deco', 'memphis', 'scandinavian',
];

export const PALETTE_POOL = [
  'monochrome', 'complementary', 'analogous', 'triadic', 'split-complementary',
  'earth-tones', 'neon-on-dark', 'pastels', 'jewel-tones', 'black-plus-one-accent',
];

export const TYPOGRAPHY_POOL = [
  'serif-classic', 'geometric-sans', 'mono-terminal', 'display-chunky',
  'handwritten', 'slab-serif', 'thin-elegant', 'mixed-serif-sans',
];

export const LAYOUT_POOL = [
  'single-column-hero', 'split-50-50', 'asymmetric-grid', 'full-bleed-sections',
  'card-grid', 'sidebar', 'stacked-blocks', 'overlapping-layers', 'z-pattern',
];

export const DENSITY_POOL = [
  'ultra-minimal', 'sparse', 'balanced', 'information-rich', 'dense',
];

export const MOOD_POOL = [
  'corporate-trust', 'playful', 'premium-luxury', 'raw-authentic', 'techy-hacker',
  'warm-friendly', 'cold-clinical', 'mysterious', 'energetic', 'calm',
];

export const ERA_POOL = [
  '1920s-art-deco', '1960s-psychedelic', '1970s-warm', '1980s-neon',
  '1990s-grunge', '2000s-web2', '2010s-flat', '2020s-modern', 'far-future',
];

export const ANIMATION_POOL = [
  'none', 'subtle-fade', 'moderate-scroll-reveals', 'bold-parallax',
  'kinetic-moving', 'micro-interactions-only',
];

export const IMAGERY_POOL = [
  'no-images-pure-type', 'geometric-shapes', 'gradients-only',
  'illustrated-icons', 'photo-placeholders', 'single-hero-image', 'abstract-patterns',
];

export const WILDCARD_POOL = [
  'one-font-only', 'no-borders', 'all-rounded', 'all-sharp-corners',
  'max-3-colors', 'monochrome-plus-one-accent', 'no-headings-over-3-words',
  'cta-above-fold-375px', 'dark-mode-only', 'brutally-honest-copy',
  'all-uppercase', 'no-padding-over-16px', 'everything-centered',
  'asymmetric-whitespace', 'one-continuous-scroll', 'no-white-background',
  'only-system-fonts', 'css-grid-only-no-flexbox', 'gradient-backgrounds-everywhere',
  'text-over-image', 'split-screen-hero', 'floating-elements',
  'border-on-everything', 'no-images-text-only', 'retro-pixel-aesthetic',
  'handdrawn-borders', 'transparent-sections', 'sticky-nav',
  'full-viewport-sections', 'alternating-dark-light-sections',
];

/**
 * Per-parameter weight map. Higher weight = more likely to be picked.
 * Used by evolution to bias toward gem-producing values.
 */
export interface ParamWeights {
  style?: Record<string, number>;
  palette?: Record<string, number>;
  typography?: Record<string, number>;
  layout?: Record<string, number>;
  density?: Record<string, number>;
  mood?: Record<string, number>;
  era?: Record<string, number>;
  animation?: Record<string, number>;
  imagery?: Record<string, number>;
  wildcard?: Record<string, number>;
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Picks from a pool respecting optional weights.
 * Unweighted values default to 1. Weighted values use their number.
 */
export function weightedPick<T extends string>(pool: readonly T[], weights?: Record<string, number>): T {
  if (!weights || Object.keys(weights).length === 0) return randomFrom(pool);

  const weighted: Array<{ value: T; weight: number }> = pool.map(v => ({
    value: v,
    weight: weights[v] ?? 1,
  }));
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.value;
  }
  return weighted[weighted.length - 1]!.value;
}

/**
 * Rolls all 10 parameter pools randomly. Returns a complete SeedParameters.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 */
export function rollParams(weights?: ParamWeights, chaos = false): SeedParameters {
  const w = chaos ? undefined : weights;
  return {
    genre: weightedPick(STYLE_POOL, w?.style),
    colorPalette: weightedPick(PALETTE_POOL, w?.palette),
    typography: weightedPick(TYPOGRAPHY_POOL, w?.typography),
    layoutArchetype: weightedPick(LAYOUT_POOL, w?.layout),
    density: weightedPick(DENSITY_POOL, w?.density),
    mood: weightedPick(MOOD_POOL, w?.mood),
    era: weightedPick(ERA_POOL, w?.era),
    animation: weightedPick(ANIMATION_POOL, w?.animation),
    imagery: weightedPick(IMAGERY_POOL, w?.imagery),
    wildcard: weightedPick(WILDCARD_POOL, w?.wildcard),
    temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
  };
}

/**
 * Returns all 10 pools for tests and documentation.
 */
export function getAllPools(): Record<string, readonly string[]> {
  return {
    style: STYLE_POOL,
    palette: PALETTE_POOL,
    typography: TYPOGRAPHY_POOL,
    layout: LAYOUT_POOL,
    density: DENSITY_POOL,
    mood: MOOD_POOL,
    era: ERA_POOL,
    animation: ANIMATION_POOL,
    imagery: IMAGERY_POOL,
    wildcard: WILDCARD_POOL,
  };
}
