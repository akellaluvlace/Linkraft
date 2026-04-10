// Dreamroll types: interfaces for the overnight design generation system

export interface DreamrollConfig {
  basePage: string;
  /** If set, the loop stops at this count. If null, runs until stop flag or context fills. */
  targetVariations: number | null;
  budgetHours: number;
  projectRoot: string;
  /** Product brief used in generated copy. Auto-detected from package.json/README if not provided. */
  brief?: string;
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
  /** Generation temperature, kept for backward compat. */
  temperature: number;
}

export interface JudgeScore {
  judge: 'brutus' | 'venus' | 'mercury';
  score: number;
  comment: string;
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
  screenshotPath: string | null;
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
  screenshotPath: string | null;
}
