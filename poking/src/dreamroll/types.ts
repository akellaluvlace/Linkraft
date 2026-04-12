// Dreamroll types: interfaces for the overnight design generation system

export interface DreamrollConfig {
  basePage: string;
  /** If set, the loop stops at this count. If null, runs until stop flag or context fills. */
  targetVariations: number | null;
  budgetHours: number;
  projectRoot: string;
  /** Product brief used in generated copy. Auto-detected from package.json/README if not provided. */
  brief?: string;
  /** Plain-text style guidance injected directly into the generation prompt as a constraint. */
  styleNote?: string;
}

/**
 * Style Genome: 17 parameter dimensions.
 *
 * Each variation is defined by a vector of values rolled from these pools.
 * The combination IS the design's DNA. See params.ts for pool definitions
 * and genome.ts for prompt construction.
 *
 * Field names preserve existing schema (genre = STYLE ARCHETYPE, colorPalette = HARMONY,
 * layoutArchetype = LAYOUT, wildcard = OBLIQUE CONSTRAINT) to avoid breaking
 * previously persisted state. New fields appended as optional with defaults.
 */
export interface SeedParameters {
  /** Dimension 1 — STYLE ARCHETYPE: glassmorphism, neo-brutalism, art-deco, synthwave, etc. (30 options) */
  genre: string;
  /** Dimension 2a — COLOR HARMONY scheme name (algorithmic or curated preset) */
  colorPalette: string;
  /** Dimension 2b — Base hue 0-360 used by algorithmic schemes (monochromatic, complementary, etc.) */
  harmonyBaseHue?: number;
  /** Dimension 3 — TYPOGRAPHY PAIRING id, e.g. "playfair-source", "bebas-heebo" (25 options) */
  typography: string;
  /** Dimension 4 — TYPE SCALE ratio name: minor-second through golden-ratio (6 options) */
  typeScale?: string;
  /** Dimension 5 — LAYOUT PATTERN: single-column-hero, bento-mosaic, etc. (10 options) */
  layoutArchetype: string;
  /** Dimension 6 — DENSITY: ultra-minimal through dense (5 options) */
  density: string;
  /** Dimension 7 — MOOD: corporate-trust, premium-luxury, techy-hacker, etc. (10 options) */
  mood: string;
  /** Dimension 8 — ERA INFLUENCE: 1920s-art-deco through timeless (10 options) */
  era: string;
  /** Dimension 9 — ANIMATION PERSONALITY: none, scroll-reveal, kinetic-type, etc. (7 options) */
  animation: string;
  /** Dimension 10 — IMAGERY APPROACH: no-images-pure-type, abstract-blobs, etc. (8 options) */
  imagery: string;
  /** Dimension 11 — BORDER RADIUS: sharp-zero through pill-full (5 options) */
  borderRadius?: string;
  /** Dimension 12 — SHADOW SYSTEM: no-shadows through soft-neumorphic (5 options) */
  shadows?: string;
  /** Dimension 13 — CTA STYLE: solid-fill, brutalist-block, gradient-button, etc. (6 options) */
  ctaStyle?: string;
  /** Dimension 14 — OBLIQUE STRATEGY CONSTRAINT: one-font-only, max-3-colors, etc. (40 options) */
  wildcard: string;
  /**
   * Dimension 15 — STYLE MUTATION: controls HOW the style archetype is applied.
   * Values: pure | mashup | invert | era-clash | material-swap | maximum | minimum | franken.
   * Non-pure values fundamentally change the generation instructions and may
   * roll additional archetypes (mashup, franken) or materials (material-swap).
   */
  mutation?: string;
  /** Secondary archetype for mashup mode (first.structure + second.color/texture). */
  mutationSecondary?: string;
  /** Tertiary archetype for franken mode (#1 colors + #2 typography + #3 layout). */
  mutationTertiary?: string;
  /** Physical material rolled for material-swap mode. */
  mutationMaterial?: string;
  /**
   * Dimension 16 — COPY ANGLE: how the headline/sub/CTA copy is framed.
   * pain-point-first | outcome-first | social-proof-first | contrarian | story |
   * data-driven | question | comparison | minimal | bold-claim.
   * The product brief stays the same; only the framing changes. This makes every
   * variation simultaneously test design and messaging.
   */
  copyAngle?: string;
  /**
   * Dimension 17 — SECTION VARIATION: how much each page section deviates from
   * the base genome. uniform = all sections follow base; subtle = 1-2 sections
   * shift density or layout slightly; dramatic = each section rolls its own
   * sub-parameter. Creates internal rhythm within a single page.
   */
  sectionVariation?: string;
  /**
   * Dimension 18 — IMAGE TREATMENT: how images are placed, cropped, and styled.
   * Controls presentation, not content. editorial-bleed | collage | masked-shapes |
   * duotone-filter | peek-through | filmstrip | single-hero-only |
   * background-ambient | device-mockup | scattered.
   */
  imageTreatment?: string;
  /** Generation temperature, kept for backward compat. */
  temperature: number;
}

export interface JudgeScore {
  judge: 'brutus' | 'venus' | 'mercury';
  /** Desktop score 1-10. */
  score: number;
  comment: string;
  /**
   * Mobile sub-score 1-10, scored against a 375x667 viewport.
   * - BRUTUS:  is the CTA above the fold at 375x667?
   * - VENUS:   does the layout feel DESIGNED at mobile, not BROKEN?
   * - MERCURY: could you actually tap the CTA with a thumb?
   * Optional for backward compatibility with state files that predate the
   * mobile dimension.
   */
  mobileScore?: number;
  mobileComment?: string;
}

export type Verdict = 'gem' | 'iterate' | 'discard';

export interface JudgeVerdict {
  scores: JudgeScore[];
  averageScore: number;
  verdict: Verdict;
  hasInstantKeep: boolean;
}

export interface Variation {
  id: number;
  seed: SeedParameters;
  verdict: JudgeVerdict | null;
  filesPath: string | null;
  createdAt: string;
}

export interface EvolutionAdjustment {
  parameter: string;
  direction: string;
  reason: string;
  appliedAt: number;
}

export interface UserPreferences {
  /** Variation IDs the user marked with /linkraft dreamroll like N. */
  liked: number[];
  /** Variation IDs the user marked with /linkraft dreamroll hate N. */
  hated: number[];
}

export interface DreamrollState {
  config: DreamrollConfig;
  currentVariation: number;
  variations: Variation[];
  gems: number[];
  evolutionAdjustments: EvolutionAdjustment[];
  startedAt: string;
  lastUpdatedAt: string;
  elapsedMs: number;
  status: 'running' | 'paused' | 'completed' | 'stopped';
  /** Evolution param weights, updated by maybeEvolve. Ignored during chaos rounds. */
  paramWeights?: Record<string, Record<string, number>>;
  /** When true, the next dreamroll_next call stops and marks the run stopped. */
  stopRequested?: boolean;
  /**
   * User-driven feedback. Liked genome dimensions get a 3x weight multiplier;
   * hated genome dimensions get 0.25x. These compose with evolution weights at
   * roll time and override judge-detected patterns.
   */
  userPreferences?: UserPreferences;
  /**
   * Pre-rolled child genomes from /linkraft dreamroll breed. The next N calls to
   * rollSeedParameters consume from this queue before doing a fresh roll.
   */
  pendingChildren?: SeedParameters[];
  /**
   * "style|harmony|mutation" trios that have already been rolled. The next roll
   * rejects duplicates. Prevents convergence — once a trio is used, it cannot
   * reappear for the entire run (regardless of how strong its evolution weights
   * get).
   */
  usedCombinations?: string[];
  /**
   * FIFO of the last N style archetype IDs that were rolled. Used to enforce the
   * style exclusion window: a style cannot reappear while it is in this list.
   */
  recentStyles?: string[];
  /**
   * FIFO of the last N layout pattern IDs that were rolled. Same exclusion window
   * as styles: a layout cannot reappear while it is in this list.
   */
  recentLayouts?: string[];
  /**
   * Variation number of the most recent diversity reset. Used to ensure the v20
   * / v40 / v60 reset fires exactly once per boundary even when
   * rollSeedParameters is called multiple times for the same currentVariation.
   */
  lastDiversityReset?: number;
  /**
   * Extracted design DNA from --reference URLs. Persists across sessions so
   * every variation in the run is influenced. Saved separately in
   * .dreamroll/references.json for human readability.
   */
  referenceData?: Array<{
    url: string;
    colors: string[];
    fonts: string[];
    radius: string;
    shadows: string;
    layout: string;
    mood: string;
  }>;
  /**
   * Weights derived from reference data, merged into evolution + user preference
   * weights at roll time. Computed once when references are set.
   */
  referenceWeights?: Record<string, Record<string, number>>;
}

export interface WildcardMutation {
  id: string;
  prompt: string;
  category: string;
}

export interface MorningReport {
  duration: string;
  totalVariations: number;
  gemCount: number;
  iteratedCount: number;
  discardedCount: number;
  topGems: GemSummary[];
  patterns: string[];
  wildcardDiscoveries: string[];
}

export interface GemSummary {
  variationId: number;
  averageScore: number;
  scores: JudgeScore[];
  seed: SeedParameters;
}
