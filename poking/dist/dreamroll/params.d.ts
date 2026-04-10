import type { SeedParameters } from './types.js';
export interface StyleArchetype {
    id: string;
    category: 'modern-digital' | 'historical' | 'subcultural' | 'editorial' | 'emerging';
    /** Short CSS signature string used in prompt summary. */
    signature: string;
    /** 3-4 sentence description of what makes this style VISUALLY DISTINCT from a generic page. */
    distinctive: string;
    /** Specific CSS declarations that MUST appear in the generated HTML. Checked programmatically. */
    distinctiveCSS: string[];
    /** Anti-patterns: what the page MUST NOT look like for this style. */
    notLikeThis: string[];
}
export declare const STYLE_ARCHETYPES: StyleArchetype[];
export declare const STYLE_POOL: string[];
export declare function getStyleSignature(styleId: string): string;
export declare function getStyleArchetype(styleId: string): StyleArchetype | undefined;
/**
 * Scans generated HTML for the required CSS declarations for a given style.
 * Returns which required strings are present vs missing.
 * Used by the auto-deduction path in the recording flow.
 */
export declare function checkDistinctiveCSS(htmlContent: string, styleId: string): {
    required: string[];
    present: string[];
    missing: string[];
};
export type HarmonyKind = 'algorithmic' | 'curated';
export interface HarmonyScheme {
    id: string;
    kind: HarmonyKind;
    /** Static palette for curated presets. Algorithmic schemes generate at runtime from base hue. */
    preset?: string[];
}
export declare const HARMONY_SCHEMES: HarmonyScheme[];
export declare const PALETTE_POOL: string[];
export declare function getHarmonyScheme(id: string): HarmonyScheme | undefined;
/**
 * Generates a palette from a harmony scheme + base hue.
 * For algorithmic schemes returns computed HSL values; for curated returns the preset.
 */
export declare function computeHarmonyPalette(schemeId: string, baseHue: number): string[];
export interface TypographyPairing {
    id: string;
    heading: string;
    headingWeight: number;
    body: string;
    bodyWeight: number;
    personality: string;
    category: 'serif-sans' | 'sans-sans' | 'display-workhorse' | 'mono-sans' | 'experimental';
    /** Google Fonts URL fragment for both fonts */
    googleFontsParam: string;
}
export declare const TYPOGRAPHY_PAIRINGS: TypographyPairing[];
export declare const TYPOGRAPHY_POOL: string[];
export declare function getTypographyPairing(id: string): TypographyPairing | undefined;
export interface TypeScale {
    id: string;
    ratio: number;
    description: string;
    steps: number[];
}
export declare const TYPE_SCALES: TypeScale[];
export declare const TYPE_SCALE_POOL: string[];
export declare function getTypeScale(id: string): TypeScale | undefined;
export declare const LAYOUT_POOL: string[];
export declare const DENSITY_POOL: string[];
export declare const MOOD_POOL: string[];
export declare const ERA_POOL: string[];
export declare const ANIMATION_POOL: string[];
export declare const IMAGERY_POOL: string[];
export interface BorderRadiusSpec {
    id: string;
    px: string;
}
export declare const BORDER_RADIUS_SPECS: BorderRadiusSpec[];
export declare const BORDER_RADIUS_POOL: string[];
export interface ShadowSpec {
    id: string;
    css: string;
}
export declare const SHADOW_SPECS: ShadowSpec[];
export declare const SHADOW_POOL: string[];
export interface CtaStyleSpec {
    id: string;
    css: string;
}
export declare const CTA_STYLE_SPECS: CtaStyleSpec[];
export declare const CTA_STYLE_POOL: string[];
export interface MutationSpec {
    id: string;
    weight: number;
    /** Short summary shown in the report + HTML comment. */
    summary: string;
    /** Per-type description of what the mutation does, templated with primary and other rolled values. */
    describe: (args: {
        primary: string;
        secondary?: string;
        tertiary?: string;
        material?: string;
        era?: string;
    }) => string;
}
export declare const MUTATIONS: MutationSpec[];
export declare const MUTATION_POOL: string[];
export declare function getMutation(id: string): MutationSpec | undefined;
/** Materials for the material-swap mode. */
export declare const MATERIALS: string[];
export declare const WILDCARD_POOL: string[];
export interface ParamWeights {
    style?: Record<string, number>;
    palette?: Record<string, number>;
    typography?: Record<string, number>;
    typeScale?: Record<string, number>;
    layout?: Record<string, number>;
    density?: Record<string, number>;
    mood?: Record<string, number>;
    era?: Record<string, number>;
    animation?: Record<string, number>;
    imagery?: Record<string, number>;
    borderRadius?: Record<string, number>;
    shadows?: Record<string, number>;
    ctaStyle?: Record<string, number>;
    wildcard?: Record<string, number>;
}
/**
 * Picks from a pool respecting optional weights.
 * Unweighted values default to 1. Weighted values use their number.
 */
export declare function weightedPick<T extends string>(pool: readonly T[], weights?: Record<string, number>): T;
/**
 * Rolls all 15 parameter dimensions, returning a complete StyleGenome.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 *
 * Mashup rolls a secondary archetype (distinct from the primary).
 * Franken rolls a secondary AND tertiary (both distinct from each other and primary).
 * Material-swap rolls a physical material from MATERIALS.
 */
export declare function rollParams(weights?: ParamWeights & {
    mutation?: Record<string, number>;
}, chaos?: boolean): SeedParameters;
/**
 * Returns all 15 pools for tests and documentation.
 */
export declare function getAllPools(): Record<string, readonly string[]>;
