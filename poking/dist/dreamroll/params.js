"use strict";
// Dreamroll Style Genome: 14 parameter dimensions per dreamroll-build-spec.
// Each variation rolls one value from each pool. Combination = design DNA.
// Some pools attach metadata (CSS signatures, font names, etc.) used by genome.ts
// when constructing the generation prompt.
Object.defineProperty(exports, "__esModule", { value: true });
exports.WILDCARD_POOL = exports.CTA_STYLE_POOL = exports.CTA_STYLE_SPECS = exports.SHADOW_POOL = exports.SHADOW_SPECS = exports.BORDER_RADIUS_POOL = exports.BORDER_RADIUS_SPECS = exports.IMAGERY_POOL = exports.ANIMATION_POOL = exports.ERA_POOL = exports.MOOD_POOL = exports.DENSITY_POOL = exports.LAYOUT_POOL = exports.TYPE_SCALE_POOL = exports.TYPE_SCALES = exports.TYPOGRAPHY_POOL = exports.TYPOGRAPHY_PAIRINGS = exports.PALETTE_POOL = exports.HARMONY_SCHEMES = exports.STYLE_POOL = exports.STYLE_ARCHETYPES = void 0;
exports.getStyleSignature = getStyleSignature;
exports.getHarmonyScheme = getHarmonyScheme;
exports.computeHarmonyPalette = computeHarmonyPalette;
exports.getTypographyPairing = getTypographyPairing;
exports.getTypeScale = getTypeScale;
exports.weightedPick = weightedPick;
exports.rollParams = rollParams;
exports.getAllPools = getAllPools;
exports.STYLE_ARCHETYPES = [
    // MODERN DIGITAL
    { id: 'glassmorphism', category: 'modern-digital', signature: 'backdrop-filter: blur(10px); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.18)' },
    { id: 'neumorphism', category: 'modern-digital', signature: 'matching bg + element color; box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' },
    { id: 'aurora-ui', category: 'modern-digital', signature: 'absolute-positioned color blobs with filter: blur(50px) and animated hue-rotate()' },
    { id: 'bento-grid', category: 'modern-digital', signature: 'CSS Grid with mixed span sizes, consistent gap: 16px, border-radius: 16px' },
    { id: 'neo-brutalism', category: 'modern-digital', signature: 'border: 3px solid #000; box-shadow: 4px 4px 0 #000; saturated flat fills' },
    { id: 'claymorphism', category: 'modern-digital', signature: 'border-radius: 30px; background: pastel; box-shadow with inner highlight + outer soft shadow' },
    { id: 'liquid-glass', category: 'modern-digital', signature: 'backdrop-filter: blur(20px) saturate(180%); semi-transparent layers; refraction borders (Apple 2025)' },
    // HISTORICAL MOVEMENTS
    { id: 'bauhaus', category: 'historical', signature: 'circles + triangles + squares; primary colors (#DD0000, #FFD700, #003DA5); Futura; strict grid' },
    { id: 'art-deco', category: 'historical', signature: 'navy bg (#1A1A2E) + gold (#C9A94E); geometric symmetry; condensed serif; wide letter-spacing' },
    { id: 'de-stijl', category: 'historical', signature: 'CSS Grid asymmetric blocks; border: 3px solid #000; pure primaries only; Mondrian composition' },
    { id: 'constructivism', category: 'historical', signature: 'transform: rotate(-15deg); diagonal compositions; Bebas Neue; red/black/cream' },
    { id: 'swiss-international', category: 'historical', signature: 'Helvetica/Arial; strict 12-column grid; asymmetric layout; black + white + one accent' },
    { id: 'memphis', category: 'historical', signature: 'squiggles + dots + triangles; clashing pastels + neons; playful sans-serif; pattern backgrounds' },
    { id: 'art-nouveau', category: 'historical', signature: 'organic curves; clip-path with flowing shapes; muted greens/golds; decorative serif' },
    // SUBCULTURAL
    { id: 'synthwave', category: 'subcultural', signature: 'sunset gradient (purple to orange); perspective grid lines; neon glow text-shadows; chrome text' },
    { id: 'cyberpunk', category: 'subcultural', signature: 'clip-path angular cuts; magenta/cyan neon; #0A0A0A bg; glitch effects; monospace' },
    { id: 'vaporwave', category: 'subcultural', signature: 'pastel neons (#FF71CE, #01CDFE, #05FFA1); glitch text; monospace; nostalgic imagery references' },
    { id: 'solarpunk', category: 'subcultural', signature: 'warm greens + amber; organic shapes; rounded everything; natural textures via CSS patterns' },
    { id: 'steampunk', category: 'subcultural', signature: 'brass/copper gradients; gear-shaped borders; sepia tones; ornate serif; textured backgrounds' },
    { id: 'y2k', category: 'subcultural', signature: 'glossy bubbles; filter: saturate(1.5); bubblegum neons; metallic text; blob shapes' },
    // EDITORIAL / PRINT
    { id: 'newspaper', category: 'editorial', signature: 'multi-column text (column-count: 3); serif body; rules between columns; masthead layout' },
    { id: 'magazine', category: 'editorial', signature: 'full-bleed images; overlapping text on image; dramatic scale contrast; editorial serif' },
    { id: 'poster', category: 'editorial', signature: 'single viewport; massive typography (120px+); minimal elements; maximum impact' },
    { id: 'book-cover', category: 'editorial', signature: 'centered composition; single typeface; restrained color; strong vertical rhythm' },
    // EMERGING 2025-2026
    { id: 'kinetic-type', category: 'emerging', signature: 'variable font animation; font-variation-settings transitions; text as hero element' },
    { id: 'tactile-rebellion', category: 'emerging', signature: 'grain texture overlays; hand-drawn SVG borders; deliberate imperfection; anti-AI-polish' },
    { id: 'dopamine-design', category: 'emerging', signature: 'hyper-saturated palettes; bold gradients; energetic layout; maximum visual stimulation' },
    { id: 'dark-luxe', category: 'emerging', signature: 'near-black bg (#0A0A0A); gold or silver accent; thin serif; extreme whitespace' },
    { id: 'scrollytelling', category: 'emerging', signature: 'CSS scroll-timeline animations; narrative section flow; parallax depth layers' },
    { id: 'organic-minimal', category: 'emerging', signature: 'earth tones; generous whitespace; rounded shapes; natural proportions; calm energy' },
];
exports.STYLE_POOL = exports.STYLE_ARCHETYPES.map(s => s.id);
function getStyleSignature(styleId) {
    return exports.STYLE_ARCHETYPES.find(s => s.id === styleId)?.signature ?? '';
}
exports.HARMONY_SCHEMES = [
    { id: 'monochromatic', kind: 'algorithmic' },
    { id: 'complementary', kind: 'algorithmic' },
    { id: 'analogous', kind: 'algorithmic' },
    { id: 'triadic', kind: 'algorithmic' },
    { id: 'split-complementary', kind: 'algorithmic' },
    { id: 'tetradic', kind: 'algorithmic' },
    { id: 'golden-ratio', kind: 'algorithmic' },
    { id: 'earth-tones', kind: 'curated', preset: ['#8B7355', '#6B8E23', '#CD853F', '#DEB887', '#556B2F'] },
    { id: 'neon-on-dark', kind: 'curated', preset: ['#0A0A0A', '#FF006E', '#00F5D4', '#FFD166'] },
    { id: 'jewel-tones', kind: 'curated', preset: ['#7B2D8E', '#1B4D3E', '#8B0000', '#DAA520', '#191970'] },
    { id: 'pastels', kind: 'curated', preset: ['#FFB5E8', '#B5DEFF', '#E7FFAC', '#FFC9DE', '#C4FAF8'] },
    { id: 'black-plus-accent', kind: 'curated', preset: ['#0A0A0A', '#1A1A1A', '#2A2A2A'] }, // accent appended at runtime
];
exports.PALETTE_POOL = exports.HARMONY_SCHEMES.map(h => h.id);
function getHarmonyScheme(id) {
    return exports.HARMONY_SCHEMES.find(h => h.id === id);
}
/**
 * Generates a palette from a harmony scheme + base hue.
 * For algorithmic schemes returns computed HSL values; for curated returns the preset.
 */
function computeHarmonyPalette(schemeId, baseHue) {
    const scheme = getHarmonyScheme(schemeId);
    if (!scheme)
        return [];
    if (scheme.kind === 'curated' && scheme.preset)
        return scheme.preset;
    const sat = 60;
    const light = 50;
    const hsl = (h, s, l) => `hsl(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%)`;
    switch (schemeId) {
        case 'monochromatic':
            return [hsl(baseHue, sat, 30), hsl(baseHue, sat, 50), hsl(baseHue, sat, 70), hsl(baseHue, sat - 20, 40), hsl(baseHue, sat - 20, 60)];
        case 'complementary':
            return [hsl(baseHue, sat, light), hsl(baseHue + 180, sat, light)];
        case 'analogous':
            return [hsl(baseHue - 30, sat, light), hsl(baseHue, sat, light), hsl(baseHue + 30, sat, light)];
        case 'triadic':
            return [hsl(baseHue, sat, light), hsl(baseHue + 120, sat, light), hsl(baseHue + 240, sat, light)];
        case 'split-complementary':
            return [hsl(baseHue, sat, light), hsl(baseHue + 150, sat, light), hsl(baseHue + 210, sat, light)];
        case 'tetradic':
            return [hsl(baseHue, sat, light), hsl(baseHue + 60, sat, light), hsl(baseHue + 180, sat, light), hsl(baseHue + 240, sat, light)];
        case 'golden-ratio': {
            const phi = 0.618;
            return [
                hsl(baseHue, sat, light),
                hsl(baseHue + 360 * phi, sat, light),
                hsl(baseHue + 720 * phi, sat, light),
                hsl(baseHue + 1080 * phi, sat, light),
            ];
        }
        default:
            return [];
    }
}
exports.TYPOGRAPHY_PAIRINGS = [
    // SERIF + SANS
    { id: 'playfair-source', heading: 'Playfair Display', headingWeight: 700, body: 'Source Sans 3', bodyWeight: 400, personality: 'editorial-luxury', category: 'serif-sans', googleFontsParam: 'family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400' },
    { id: 'abril-lato', heading: 'Abril Fatface', headingWeight: 400, body: 'Lato', bodyWeight: 400, personality: 'dramatic-warm', category: 'serif-sans', googleFontsParam: 'family=Abril+Fatface&family=Lato:wght@400' },
    { id: 'bodoni-inter', heading: 'Bodoni Moda', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'high-fashion', category: 'serif-sans', googleFontsParam: 'family=Bodoni+Moda:wght@700&family=Inter:wght@400' },
    { id: 'dm-serif-dm-sans', heading: 'DM Serif Display', headingWeight: 400, body: 'DM Sans', bodyWeight: 400, personality: 'balanced-modern', category: 'serif-sans', googleFontsParam: 'family=DM+Serif+Display&family=DM+Sans:wght@400' },
    { id: 'cormorant-proza', heading: 'Cormorant Garamond', headingWeight: 600, body: 'Proza Libre', bodyWeight: 400, personality: 'literary-refined', category: 'serif-sans', googleFontsParam: 'family=Cormorant+Garamond:wght@600&family=Proza+Libre:wght@400' },
    // SANS + SANS
    { id: 'montserrat-opensans', heading: 'Montserrat', headingWeight: 700, body: 'Open Sans', bodyWeight: 400, personality: 'modern-workhorse', category: 'sans-sans', googleFontsParam: 'family=Montserrat:wght@700&family=Open+Sans:wght@400' },
    { id: 'poppins-inter', heading: 'Poppins', headingWeight: 600, body: 'Inter', bodyWeight: 400, personality: 'friendly-precise', category: 'sans-sans', googleFontsParam: 'family=Poppins:wght@600&family=Inter:wght@400' },
    { id: 'clash-satoshi', heading: 'Manrope', headingWeight: 600, body: 'Inter', bodyWeight: 400, personality: 'bold-contemporary', category: 'sans-sans', googleFontsParam: 'family=Manrope:wght@600&family=Inter:wght@400' },
    { id: 'space-grotesk-inter', heading: 'Space Grotesk', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'geometric-clean', category: 'sans-sans', googleFontsParam: 'family=Space+Grotesk:wght@700&family=Inter:wght@400' },
    { id: 'outfit-plus-jakarta', heading: 'Outfit', headingWeight: 600, body: 'Plus Jakarta Sans', bodyWeight: 400, personality: 'rounded-approachable', category: 'sans-sans', googleFontsParam: 'family=Outfit:wght@600&family=Plus+Jakarta+Sans:wght@400' },
    // DISPLAY + WORKHORSE
    { id: 'bebas-heebo', heading: 'Bebas Neue', headingWeight: 400, body: 'Heebo', bodyWeight: 400, personality: 'bold-impact', category: 'display-workhorse', googleFontsParam: 'family=Bebas+Neue&family=Heebo:wght@400' },
    { id: 'oswald-merriweather', heading: 'Oswald', headingWeight: 600, body: 'Merriweather', bodyWeight: 400, personality: 'condensed-readable', category: 'display-workhorse', googleFontsParam: 'family=Oswald:wght@600&family=Merriweather:wght@400' },
    { id: 'archivo-black-karla', heading: 'Archivo Black', headingWeight: 400, body: 'Karla', bodyWeight: 400, personality: 'heavy-friendly', category: 'display-workhorse', googleFontsParam: 'family=Archivo+Black&family=Karla:wght@400' },
    { id: 'anton-work-sans', heading: 'Anton', headingWeight: 400, body: 'Work Sans', bodyWeight: 400, personality: 'ultra-bold-clean', category: 'display-workhorse', googleFontsParam: 'family=Anton&family=Work+Sans:wght@400' },
    { id: 'righteous-nunito', heading: 'Righteous', headingWeight: 400, body: 'Nunito Sans', bodyWeight: 400, personality: 'retro-soft', category: 'display-workhorse', googleFontsParam: 'family=Righteous&family=Nunito+Sans:wght@400' },
    // MONO + SANS
    { id: 'space-mono-inter', heading: 'Space Mono', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'terminal-precise', category: 'mono-sans', googleFontsParam: 'family=Space+Mono:wght@700&family=Inter:wght@400' },
    { id: 'jetbrains-source', heading: 'JetBrains Mono', headingWeight: 700, body: 'Source Sans 3', bodyWeight: 400, personality: 'developer-clean', category: 'mono-sans', googleFontsParam: 'family=JetBrains+Mono:wght@700&family=Source+Sans+3:wght@400' },
    { id: 'fira-code-rubik', heading: 'Fira Code', headingWeight: 600, body: 'Rubik', bodyWeight: 400, personality: 'code-friendly', category: 'mono-sans', googleFontsParam: 'family=Fira+Code:wght@600&family=Rubik:wght@400' },
    { id: 'ibm-plex-mono-sans', heading: 'IBM Plex Mono', headingWeight: 600, body: 'IBM Plex Sans', bodyWeight: 400, personality: 'ibm-systematic', category: 'mono-sans', googleFontsParam: 'family=IBM+Plex+Mono:wght@600&family=IBM+Plex+Sans:wght@400' },
    // EXPERIMENTAL
    { id: 'syne-general-sans', heading: 'Syne', headingWeight: 700, body: 'DM Sans', bodyWeight: 400, personality: 'avant-garde', category: 'experimental', googleFontsParam: 'family=Syne:wght@700&family=DM+Sans:wght@400' },
    { id: 'cabinet-grotesk-inter', heading: 'Manrope', headingWeight: 800, body: 'Inter', bodyWeight: 400, personality: 'trendy-sharp', category: 'experimental', googleFontsParam: 'family=Manrope:wght@800&family=Inter:wght@400' },
    { id: 'instrument-serif-sans', heading: 'Instrument Serif', headingWeight: 400, body: 'Instrument Sans', bodyWeight: 400, personality: 'elegant-matched', category: 'experimental', googleFontsParam: 'family=Instrument+Serif&family=Instrument+Sans:wght@400' },
    { id: 'fraunces-commissioner', heading: 'Fraunces', headingWeight: 700, body: 'Commissioner', bodyWeight: 400, personality: 'quirky-professional', category: 'experimental', googleFontsParam: 'family=Fraunces:wght@700&family=Commissioner:wght@400' },
    { id: 'young-serif-outfit', heading: 'Young Serif', headingWeight: 400, body: 'Outfit', bodyWeight: 400, personality: 'nostalgic-modern', category: 'experimental', googleFontsParam: 'family=Young+Serif&family=Outfit:wght@400' },
    { id: 'bricolage-atkinson', heading: 'Bricolage Grotesque', headingWeight: 700, body: 'Atkinson Hyperlegible', bodyWeight: 400, personality: 'accessible-bold', category: 'experimental', googleFontsParam: 'family=Bricolage+Grotesque:wght@700&family=Atkinson+Hyperlegible:wght@400' },
];
exports.TYPOGRAPHY_POOL = exports.TYPOGRAPHY_PAIRINGS.map(t => t.id);
function getTypographyPairing(id) {
    return exports.TYPOGRAPHY_PAIRINGS.find(t => t.id === id);
}
exports.TYPE_SCALES = [
    { id: 'minor-second', ratio: 1.067, description: 'subtle, calm', steps: [16, 17, 18, 19, 21] },
    { id: 'major-second', ratio: 1.125, description: 'gentle, editorial', steps: [16, 18, 20, 23, 25] },
    { id: 'minor-third', ratio: 1.200, description: 'balanced, versatile', steps: [16, 19, 23, 28, 33] },
    { id: 'major-third', ratio: 1.250, description: 'confident, standard', steps: [16, 20, 25, 31, 39] },
    { id: 'perfect-fourth', ratio: 1.333, description: 'dramatic, bold', steps: [16, 21, 28, 38, 50] },
    { id: 'golden-ratio', ratio: 1.618, description: 'maximum impact, display', steps: [16, 26, 42, 67, 109] },
];
exports.TYPE_SCALE_POOL = exports.TYPE_SCALES.map(s => s.id);
function getTypeScale(id) {
    return exports.TYPE_SCALES.find(s => s.id === id);
}
// ============================================================================
// Dimension 5: LAYOUT PATTERN (10 options)
// ============================================================================
exports.LAYOUT_POOL = [
    'single-column-hero',
    'split-50-50',
    'asymmetric-golden',
    'full-bleed-sections',
    'bento-mosaic',
    'editorial-magazine',
    'card-grid',
    'sidebar-anchor',
    'z-pattern',
    'stacked-panels',
];
// ============================================================================
// Dimension 6: DENSITY (5 options)
// ============================================================================
exports.DENSITY_POOL = [
    'ultra-minimal',
    'sparse',
    'balanced',
    'information-rich',
    'dense',
];
// ============================================================================
// Dimension 7: MOOD (10 options)
// ============================================================================
exports.MOOD_POOL = [
    'corporate-trust',
    'playful-energy',
    'premium-luxury',
    'raw-authentic',
    'techy-hacker',
    'warm-friendly',
    'cold-clinical',
    'mysterious-dark',
    'energetic-bold',
    'calm-zen',
];
// ============================================================================
// Dimension 8: ERA INFLUENCE (10 options)
// ============================================================================
exports.ERA_POOL = [
    '1920s-art-deco',
    '1960s-psychedelic',
    '1970s-warm',
    '1980s-neon',
    '1990s-grunge',
    '2000s-web2',
    '2010s-flat',
    '2020s-modern',
    'far-future',
    'timeless',
];
// ============================================================================
// Dimension 9: ANIMATION PERSONALITY (7 options)
// ============================================================================
exports.ANIMATION_POOL = [
    'none',
    'subtle-fade',
    'scroll-reveal',
    'kinetic-type',
    'bouncy-playful',
    'cinematic-reveal',
    'glitch-digital',
];
// ============================================================================
// Dimension 10: IMAGERY APPROACH (8 options)
// ============================================================================
exports.IMAGERY_POOL = [
    'no-images-pure-type',
    'geometric-shapes',
    'gradients-only',
    'pattern-backgrounds',
    'abstract-blobs',
    'svg-illustrations',
    'photo-placeholders',
    'noise-texture',
];
exports.BORDER_RADIUS_SPECS = [
    { id: 'sharp-zero', px: '0px everywhere (brutalist, terminal, constructivist)' },
    { id: 'subtle-small', px: '4px (professional, corporate, precise)' },
    { id: 'moderate-medium', px: '8-12px (modern default, balanced)' },
    { id: 'rounded-large', px: '16-24px (friendly, approachable, bento)' },
    { id: 'pill-full', px: '9999px on buttons, 24px on containers (playful, bubbly)' },
];
exports.BORDER_RADIUS_POOL = exports.BORDER_RADIUS_SPECS.map(b => b.id);
exports.SHADOW_SPECS = [
    { id: 'no-shadows', css: 'flat, no shadows; depth via color/border' },
    { id: 'subtle-ambient', css: 'box-shadow: 0 1px 3px rgba(0,0,0,0.1)' },
    { id: 'medium-layered', css: 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)' },
    { id: 'dramatic-offset', css: 'box-shadow: 8px 8px 0 #000 (neo-brutalism, retro)' },
    { id: 'soft-neumorphic', css: 'dual directional shadows, light + dark, matching bg hue' },
];
exports.SHADOW_POOL = exports.SHADOW_SPECS.map(s => s.id);
exports.CTA_STYLE_SPECS = [
    { id: 'solid-fill', css: 'bg-accent, text-white, no border, standard button' },
    { id: 'outline-ghost', css: 'border: 2px solid accent, transparent bg, hover fills' },
    { id: 'gradient-button', css: 'linear-gradient bg, subtle hover shift' },
    { id: 'text-link-arrow', css: 'no button shape, text + arrow icon, underline on hover' },
    { id: 'pill-glow', css: 'border-radius: 9999px + box-shadow glow in accent color' },
    { id: 'brutalist-block', css: 'thick border, hard shadow offset, square corners, uppercase' },
];
exports.CTA_STYLE_POOL = exports.CTA_STYLE_SPECS.map(c => c.id);
// ============================================================================
// Dimension 14: OBLIQUE STRATEGY CONSTRAINT (40 options)
// ============================================================================
exports.WILDCARD_POOL = [
    // REDUCTION
    'one-font-only',
    'max-3-colors',
    'no-borders',
    'no-images-text-only',
    'only-system-fonts',
    'no-padding-over-16px',
    'no-headings-over-3-words',
    // INVERSION
    'dark-mode-only',
    'light-mode-only',
    'everything-centered',
    'all-uppercase',
    'all-lowercase',
    'inverted-hierarchy',
    // MATERIAL
    'paper-texture',
    'glass-everything',
    'metal-industrial',
    'neon-signs',
    'watercolor-wash',
    // STRUCTURAL
    'single-scroll-no-sections',
    'alternating-dark-light',
    'full-viewport-sections',
    'sidebar-layout',
    'asymmetric-whitespace',
    'css-grid-only-no-flexbox',
    'sticky-everything',
    // CREATIVE (Oblique Strategies adapted)
    'use-unacceptable-color',
    'simple-subtraction',
    'turn-it-upside-down',
    'empty-hero',
    'one-element-per-kind',
    'make-blank-valuable',
    'what-would-a-child-draw',
    'design-for-one-person',
    'contradict-every-section',
    'the-accidental-masterpiece',
    'maximum-with-minimum',
    'analog-in-digital',
    'the-last-page-on-earth',
    'brutally-honest-copy',
    'hand-drawn-borders',
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
 * Rolls all 14 parameter dimensions, returning a complete StyleGenome.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 */
function rollParams(weights, chaos = false) {
    const w = chaos ? undefined : weights;
    return {
        genre: weightedPick(exports.STYLE_POOL, w?.style),
        colorPalette: weightedPick(exports.PALETTE_POOL, w?.palette),
        harmonyBaseHue: Math.floor(Math.random() * 360),
        typography: weightedPick(exports.TYPOGRAPHY_POOL, w?.typography),
        typeScale: weightedPick(exports.TYPE_SCALE_POOL, w?.typeScale),
        layoutArchetype: weightedPick(exports.LAYOUT_POOL, w?.layout),
        density: weightedPick(exports.DENSITY_POOL, w?.density),
        mood: weightedPick(exports.MOOD_POOL, w?.mood),
        era: weightedPick(exports.ERA_POOL, w?.era),
        animation: weightedPick(exports.ANIMATION_POOL, w?.animation),
        imagery: weightedPick(exports.IMAGERY_POOL, w?.imagery),
        borderRadius: weightedPick(exports.BORDER_RADIUS_POOL, w?.borderRadius),
        shadows: weightedPick(exports.SHADOW_POOL, w?.shadows),
        ctaStyle: weightedPick(exports.CTA_STYLE_POOL, w?.ctaStyle),
        wildcard: weightedPick(exports.WILDCARD_POOL, w?.wildcard),
        temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
    };
}
/**
 * Returns all 14 pools for tests and documentation.
 */
function getAllPools() {
    return {
        style: exports.STYLE_POOL,
        palette: exports.PALETTE_POOL,
        typography: exports.TYPOGRAPHY_POOL,
        typeScale: exports.TYPE_SCALE_POOL,
        layout: exports.LAYOUT_POOL,
        density: exports.DENSITY_POOL,
        mood: exports.MOOD_POOL,
        era: exports.ERA_POOL,
        animation: exports.ANIMATION_POOL,
        imagery: exports.IMAGERY_POOL,
        borderRadius: exports.BORDER_RADIUS_POOL,
        shadows: exports.SHADOW_POOL,
        ctaStyle: exports.CTA_STYLE_POOL,
        wildcard: exports.WILDCARD_POOL,
    };
}
//# sourceMappingURL=params.js.map