"use strict";
// Dreamroll parameter pools: 10 dimensions per spec.
// Each variation rolls one value from each pool. Weighted selection
// supported for evolution (favored values 2x more likely).
Object.defineProperty(exports, "__esModule", { value: true });
exports.WILDCARD_POOL = exports.IMAGERY_POOL = exports.ANIMATION_POOL = exports.ERA_POOL = exports.MOOD_POOL = exports.DENSITY_POOL = exports.LAYOUT_POOL = exports.TYPOGRAPHY_POOL = exports.PALETTE_POOL = exports.STYLE_POOL = void 0;
exports.weightedPick = weightedPick;
exports.rollParams = rollParams;
exports.getAllPools = getAllPools;
exports.STYLE_POOL = [
    'glassmorphism', 'neo-brutalism', 'minimalist-swiss', 'retro-terminal',
    'soft-pastel', 'dark-luxe', 'newspaper', 'y2k', 'organic-earth',
    'corporate-clean', 'vaporwave', 'art-deco', 'memphis', 'scandinavian',
];
exports.PALETTE_POOL = [
    'monochrome', 'complementary', 'analogous', 'triadic', 'split-complementary',
    'earth-tones', 'neon-on-dark', 'pastels', 'jewel-tones', 'black-plus-one-accent',
];
exports.TYPOGRAPHY_POOL = [
    'serif-classic', 'geometric-sans', 'mono-terminal', 'display-chunky',
    'handwritten', 'slab-serif', 'thin-elegant', 'mixed-serif-sans',
];
exports.LAYOUT_POOL = [
    'single-column-hero', 'split-50-50', 'asymmetric-grid', 'full-bleed-sections',
    'card-grid', 'sidebar', 'stacked-blocks', 'overlapping-layers', 'z-pattern',
];
exports.DENSITY_POOL = [
    'ultra-minimal', 'sparse', 'balanced', 'information-rich', 'dense',
];
exports.MOOD_POOL = [
    'corporate-trust', 'playful', 'premium-luxury', 'raw-authentic', 'techy-hacker',
    'warm-friendly', 'cold-clinical', 'mysterious', 'energetic', 'calm',
];
exports.ERA_POOL = [
    '1920s-art-deco', '1960s-psychedelic', '1970s-warm', '1980s-neon',
    '1990s-grunge', '2000s-web2', '2010s-flat', '2020s-modern', 'far-future',
];
exports.ANIMATION_POOL = [
    'none', 'subtle-fade', 'moderate-scroll-reveals', 'bold-parallax',
    'kinetic-moving', 'micro-interactions-only',
];
exports.IMAGERY_POOL = [
    'no-images-pure-type', 'geometric-shapes', 'gradients-only',
    'illustrated-icons', 'photo-placeholders', 'single-hero-image', 'abstract-patterns',
];
exports.WILDCARD_POOL = [
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
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
/**
 * Picks from a pool respecting optional weights.
 * Unweighted values default to 1. Weighted values use their number.
 */
function weightedPick(pool, weights) {
    if (!weights || Object.keys(weights).length === 0)
        return randomFrom(pool);
    const weighted = pool.map(v => ({
        value: v,
        weight: weights[v] ?? 1,
    }));
    const total = weighted.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weighted) {
        r -= w.weight;
        if (r <= 0)
            return w.value;
    }
    return weighted[weighted.length - 1].value;
}
/**
 * Rolls all 10 parameter pools randomly. Returns a complete SeedParameters.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 */
function rollParams(weights, chaos = false) {
    const w = chaos ? undefined : weights;
    return {
        genre: weightedPick(exports.STYLE_POOL, w?.style),
        colorPalette: weightedPick(exports.PALETTE_POOL, w?.palette),
        typography: weightedPick(exports.TYPOGRAPHY_POOL, w?.typography),
        layoutArchetype: weightedPick(exports.LAYOUT_POOL, w?.layout),
        density: weightedPick(exports.DENSITY_POOL, w?.density),
        mood: weightedPick(exports.MOOD_POOL, w?.mood),
        era: weightedPick(exports.ERA_POOL, w?.era),
        animation: weightedPick(exports.ANIMATION_POOL, w?.animation),
        imagery: weightedPick(exports.IMAGERY_POOL, w?.imagery),
        wildcard: weightedPick(exports.WILDCARD_POOL, w?.wildcard),
        temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
    };
}
/**
 * Returns all 10 pools for tests and documentation.
 */
function getAllPools() {
    return {
        style: exports.STYLE_POOL,
        palette: exports.PALETTE_POOL,
        typography: exports.TYPOGRAPHY_POOL,
        layout: exports.LAYOUT_POOL,
        density: exports.DENSITY_POOL,
        mood: exports.MOOD_POOL,
        era: exports.ERA_POOL,
        animation: exports.ANIMATION_POOL,
        imagery: exports.IMAGERY_POOL,
        wildcard: exports.WILDCARD_POOL,
    };
}
//# sourceMappingURL=params.js.map