"use strict";
// Dreamroll Evolution: analyzes gems and adjusts generation parameters.
// Runs every N variations to explore promising directions while maintaining chaos.
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPatterns = detectPatterns;
exports.generateAdjustments = generateAdjustments;
exports.shouldInjectChaos = shouldInjectChaos;
exports.maybeEvolve = maybeEvolve;
const CHAOS_RATIO = 0.2; // 20% of variations must be fully random
/**
 * Analyzes gems to find patterns in high-scoring variations.
 */
function detectPatterns(state) {
    const patterns = [];
    const gemVariations = state.variations.filter(v => state.gems.includes(v.id));
    if (gemVariations.length < 2)
        return patterns;
    // Count occurrences of each seed parameter value in gems
    const layoutCounts = {};
    const genreCounts = {};
    const moodCounts = {};
    const densityCounts = {};
    for (const v of gemVariations) {
        layoutCounts[v.seed.layoutArchetype] = (layoutCounts[v.seed.layoutArchetype] ?? 0) + 1;
        genreCounts[v.seed.genre] = (genreCounts[v.seed.genre] ?? 0) + 1;
        moodCounts[v.seed.mood] = (moodCounts[v.seed.mood] ?? 0) + 1;
        densityCounts[v.seed.density] = (densityCounts[v.seed.density] ?? 0) + 1;
    }
    // Find dominant patterns (>= 30% of gems)
    const threshold = gemVariations.length * 0.3;
    for (const [layout, count] of Object.entries(layoutCounts)) {
        if (count >= threshold) {
            patterns.push(`Layout "${layout}" appears in ${count}/${gemVariations.length} gems`);
        }
    }
    for (const [genre, count] of Object.entries(genreCounts)) {
        if (count >= threshold) {
            patterns.push(`Genre "${genre}" appears in ${count}/${gemVariations.length} gems`);
        }
    }
    for (const [mood, count] of Object.entries(moodCounts)) {
        if (count >= threshold) {
            patterns.push(`Mood "${mood}" appears in ${count}/${gemVariations.length} gems`);
        }
    }
    for (const [density, count] of Object.entries(densityCounts)) {
        if (count >= threshold) {
            patterns.push(`Density "${density}" appears in ${count}/${gemVariations.length} gems`);
        }
    }
    return patterns;
}
/**
 * Generates evolution adjustments based on detected patterns.
 */
function generateAdjustments(state, patterns) {
    const adjustments = [];
    for (const pattern of patterns) {
        const layoutMatch = /Layout "([^"]+)" appears/.exec(pattern);
        if (layoutMatch?.[1]) {
            adjustments.push({
                parameter: 'layoutArchetype',
                direction: `favor "${layoutMatch[1]}"`,
                reason: pattern,
                appliedAt: state.currentVariation,
            });
        }
        const genreMatch = /Genre "([^"]+)" appears/.exec(pattern);
        if (genreMatch?.[1]) {
            adjustments.push({
                parameter: 'genre',
                direction: `favor "${genreMatch[1]}"`,
                reason: pattern,
                appliedAt: state.currentVariation,
            });
        }
        const moodMatch = /Mood "([^"]+)" appears/.exec(pattern);
        if (moodMatch?.[1]) {
            adjustments.push({
                parameter: 'mood',
                direction: `favor "${moodMatch[1]}"`,
                reason: pattern,
                appliedAt: state.currentVariation,
            });
        }
    }
    return adjustments;
}
/**
 * Determines if the current variation should use fully random parameters
 * (chaos injection) or evolved parameters.
 */
function shouldInjectChaos(_variationNumber) {
    // At least 20% of variations are fully random
    return Math.random() < CHAOS_RATIO;
}
/**
 * Runs evolution analysis at the specified interval.
 * Returns adjustments if it's time to evolve, empty array otherwise.
 */
function maybeEvolve(state, interval = 10) {
    if (state.currentVariation === 0 || state.currentVariation % interval !== 0) {
        return [];
    }
    const patterns = detectPatterns(state);
    if (patterns.length === 0)
        return [];
    const adjustments = generateAdjustments(state, patterns);
    return adjustments;
}
//# sourceMappingURL=evolution.js.map