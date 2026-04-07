"use strict";
// Dreamroll Generator: the main generation loop engine.
// Orchestrates seed rolling, variation creation, judging, and evolution.
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollSeedParameters = rollSeedParameters;
exports.buildGenerationPrompt = buildGenerationPrompt;
exports.runDreamroll = runDreamroll;
exports.getMorningReport = getMorningReport;
const wildcards_js_1 = require("./wildcards.js");
const judges_js_1 = require("./judges.js");
const state_js_1 = require("./state.js");
const evolution_js_1 = require("./evolution.js");
const reporter_js_1 = require("./reporter.js");
const LAYOUT_ARCHETYPES = ['split', 'centered', 'asymmetric', 'editorial', 'cards', 'zigzag', 'single-column', 'sidebar'];
const GENRES = ['brutalism', 'glass', 'retro', 'organic', 'swiss', 'maximalist', 'minimal', 'editorial', 'futuristic'];
const MOODS = ['playful', 'serious', 'luxury', 'friendly', 'technical', 'rebellious', 'calm', 'urgent'];
const DENSITIES = ['airy', 'balanced', 'dense'];
const COLOR_PALETTES = ['warm-earth', 'cool-ocean', 'neon-night', 'monochrome', 'pastel-dream', 'high-contrast', 'muted-vintage', 'jewel-tones'];
const TYPOGRAPHY_PAIRINGS = ['serif-sans', 'mono-sans', 'display-body', 'geometric-humanist', 'slab-grotesque', 'handwritten-clean'];
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
/**
 * Generates random seed parameters for a variation.
 */
function rollSeedParameters() {
    const wildcard = (0, wildcards_js_1.getRandomWildcard)();
    return {
        colorPalette: randomFrom(COLOR_PALETTES),
        typography: randomFrom(TYPOGRAPHY_PAIRINGS),
        layoutArchetype: randomFrom(LAYOUT_ARCHETYPES),
        genre: randomFrom(GENRES),
        density: randomFrom(DENSITIES),
        mood: randomFrom(MOODS),
        temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
        wildcard: wildcard.prompt,
    };
}
/**
 * Builds the generation prompt for Claude from seed parameters.
 */
function buildGenerationPrompt(seed, basePageContent) {
    return [
        `Create a visually distinct variation of this landing page.`,
        ``,
        `Design Parameters:`,
        `- Color palette: ${seed.colorPalette}`,
        `- Typography: ${seed.typography}`,
        `- Layout: ${seed.layoutArchetype}`,
        `- Genre: ${seed.genre}`,
        `- Density: ${seed.density}`,
        `- Mood: ${seed.mood}`,
        ``,
        `Creative Wildcard: ${seed.wildcard}`,
        ``,
        `Keep the same content and functionality. Change everything visual:`,
        `colors, typography, spacing, layout, component styles, shadows, borders.`,
        ``,
        `Base page:`,
        '```',
        basePageContent,
        '```',
    ].join('\n');
}
/**
 * Runs the Dreamroll generation loop.
 * Resumable: checks for existing state and continues from last variation.
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
    for (let i = state.currentVariation + 1; i <= config.targetVariations; i++) {
        // Check time budget
        const elapsed = Date.now() - startTime;
        if (elapsed >= budgetMs) {
            state.elapsedMs = elapsed;
            (0, state_js_1.completeRun)(config.projectRoot, state);
            break;
        }
        // Check external stop signal
        if (shouldStop?.()) {
            state.elapsedMs = Date.now() - startTime;
            (0, state_js_1.stopRun)(config.projectRoot, state);
            break;
        }
        // Roll seed parameters (chaos or evolved)
        const seed = rollSeedParameters();
        // Judge the variation
        const description = buildGenerationPrompt(seed, `[Variation ${i} with ${seed.genre} style]`);
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
    }
    // Final state
    state.elapsedMs = Date.now() - startTime;
    if (state.currentVariation >= config.targetVariations) {
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