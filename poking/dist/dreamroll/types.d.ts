export interface DreamrollConfig {
    basePage: string;
    targetVariations: number;
    budgetHours: number;
    projectRoot: string;
}
export interface SeedParameters {
    colorPalette: string;
    typography: string;
    layoutArchetype: string;
    genre: string;
    density: 'airy' | 'balanced' | 'dense';
    mood: string;
    temperature: number;
    wildcard: string;
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
