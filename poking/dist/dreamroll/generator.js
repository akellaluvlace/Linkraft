"use strict";
// Dreamroll Generator: the main generation loop engine.
// Orchestrates seed rolling, variation creation, judging, and evolution.
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollSeedParameters = rollSeedParameters;
exports.buildGenerationPrompt = buildGenerationPrompt;
exports.runDreamroll = runDreamroll;
exports.getMorningReport = getMorningReport;
const params_js_1 = require("./params.js");
const genome_js_1 = require("./genome.js");
const judges_js_1 = require("./judges.js");
const state_js_1 = require("./state.js");
const evolution_js_1 = require("./evolution.js");
const reporter_js_1 = require("./reporter.js");
/**
 * Generates random seed parameters for a variation.
 * If state has accumulated param weights, uses weighted selection.
 * Chaos rounds (20%) always use fully random.
 */
function rollSeedParameters(state) {
    const chaos = (0, evolution_js_1.shouldInjectChaos)(state?.currentVariation ?? 0);
    const weights = state?.paramWeights;
    return (0, params_js_1.rollParams)(weights, chaos);
}
/**
 * Builds the generation prompt for Claude from a Style Genome.
 * Delegates to genome.ts for the full 14-dimension instruction set.
 */
function buildGenerationPrompt(seed, brief, variationNumber = 0, outputPath = '') {
    return (0, genome_js_1.genomeToPrompt)(seed, brief, variationNumber, outputPath);
}
/**
 * Runs the Dreamroll generation loop (headless mode with optional judge caller).
 * Resumable: checks for existing state and continues from last variation.
 *
 * Never-stop mode: if config.targetVariations is null, runs until stop flag,
 * external stop callback, or time budget. Designed to run under a restart
 * loop that relaunches after context fills.
 */
async function runDreamroll(options) {
    const { config, agentsDir, judgeCaller, onVariation, shouldStop } = options;
    // Resume or create new state
    let state = (0, state_js_1.loadState)(config.projectRoot);
    if (!state || state.status === 'completed' || state.status === 'stopped') {
        state = (0, state_js_1.createState)(config);
        (0, state_js_1.saveState)(config.projectRoot, state);
    }
    const startTime = Date.now() - state.elapsedMs;
    const budgetMs = config.budgetHours * 3_600_000;
    const targetCap = config.targetVariations; // null => never-stop
    let i = state.currentVariation + 1;
    while (true) {
        // Stop conditions
        if (targetCap !== null && i > targetCap)
            break;
        const elapsed = Date.now() - startTime;
        if (elapsed >= budgetMs) {
            state.elapsedMs = elapsed;
            (0, state_js_1.completeRun)(config.projectRoot, state);
            break;
        }
        if (shouldStop?.() || state.stopRequested) {
            state.elapsedMs = Date.now() - startTime;
            (0, state_js_1.stopRun)(config.projectRoot, state);
            break;
        }
        // Roll seed parameters (chaos or evolved based on state)
        const seed = rollSeedParameters(state);
        // Judge the variation
        const description = buildGenerationPrompt(seed, config.brief ?? `Variation ${i}`);
        const verdict = await (0, judges_js_1.judgeVariation)(description, agentsDir, judgeCaller);
        const variation = {
            id: i,
            seed,
            verdict,
            screenshotPath: null, // Playwright stub
            filesPath: null,
            createdAt: new Date().toISOString(),
        };
        (0, state_js_1.addVariation)(config.projectRoot, state, variation);
        // Notify callback
        onVariation?.(variation, state);
        // Evolution check
        const adjustments = (0, evolution_js_1.maybeEvolve)(state);
        if (adjustments.length > 0) {
            state.evolutionAdjustments.push(...adjustments);
            (0, state_js_1.saveState)(config.projectRoot, state);
        }
        i++;
    }
    // Final state
    state.elapsedMs = Date.now() - startTime;
    if (targetCap !== null && state.currentVariation >= targetCap) {
        (0, state_js_1.completeRun)(config.projectRoot, state);
    }
    return state;
}
/**
 * Generates the morning report for a completed or in-progress run.
 */
function getMorningReport(projectRoot) {
    const state = (0, state_js_1.loadState)(projectRoot);
    if (!state)
        return 'No Dreamroll state found. Run /dreamroll start first.';
    const report = (0, reporter_js_1.generateReport)(state);
    return (0, reporter_js_1.formatReport)(report);
}
//# sourceMappingURL=generator.js.map