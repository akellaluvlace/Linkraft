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
 * 10 parameter pools per dreamroll spec:
 * STYLE, PALETTE, TYPOGRAPHY, LAYOUT, DENSITY, MOOD, ERA, ANIMATION, IMAGERY, WILDCARD.
 *
 * Field names preserve existing schema (genre = STYLE, colorPalette = PALETTE,
 * layoutArchetype = LAYOUT) to avoid breaking previously persisted state.
 */
export interface SeedParameters {
  /** STYLE: glassmorphism, neo-brutalism, minimalist-swiss, etc. */
  genre: string;
  /** PALETTE: monochrome, complementary, jewel-tones, neon-on-dark, etc. */
  colorPalette: string;
  /** TYPOGRAPHY: serif-classic, geometric-sans, mono-terminal, etc. */
  typography: string;
  /** LAYOUT: single-column-hero, split-50-50, asymmetric-grid, etc. */
  layoutArchetype: string;
  /** DENSITY: ultra-minimal through dense (5 values). */
  density: string;
  /** MOOD: corporate-trust, playful, premium-luxury, techy-hacker, etc. */
  mood: string;
  /** ERA: 1920s-art-deco through far-future. */
  era: string;
  /** ANIMATION: none, subtle-fade, moderate-scroll-reveals, bold-parallax, etc. */
  animation: string;
  /** IMAGERY: no-images-pure-type, geometric-shapes, gradients-only, etc. */
  imagery: string;
  /** WILDCARD: design constraint like "one-font-only", "all-sharp-corners". */
  wildcard: string;
  /** Temperature used for generation prompt (kept for backward compat). */
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
