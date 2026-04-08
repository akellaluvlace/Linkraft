"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDreamrollTools = registerDreamrollTools;
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const state_js_1 = require("../../dreamroll/state.js");
const generator_js_1 = require("../../dreamroll/generator.js");
const judges_js_1 = require("../../dreamroll/judges.js");
const evolution_js_1 = require("../../dreamroll/evolution.js");
const projectRootSchema = { projectRoot: zod_1.z.string().describe('Project root directory') };
/**
 * Reads project context from package.json and README for the brief.
 */
function detectBrief(projectRoot, overrideBrief) {
    if (overrideBrief)
        return overrideBrief;
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            const name = typeof pkg['name'] === 'string' ? pkg['name'] : path.basename(projectRoot);
            const desc = typeof pkg['description'] === 'string' ? pkg['description'] : '';
            return desc ? `${name}: ${desc}` : name;
        }
        catch { }
    }
    return path.basename(projectRoot);
}
function registerDreamrollTools(server) {
    server.tool('dreamroll_start', 'Starts or resumes a Dreamroll session. Initializes .dreamroll/ state and returns config + first variation parameters. Safe to call on resume — detects existing running state and continues.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        brief: zod_1.z.string().optional().describe('Product brief for generated copy. Auto-detected from package.json if omitted.'),
    }, async ({ projectRoot, brief }) => {
        // Check for resumable session
        const existing = (0, state_js_1.loadState)(projectRoot);
        if (existing && (existing.status === 'running' || existing.status === 'paused')) {
            existing.stopRequested = false;
            (0, state_js_1.saveState)(projectRoot, existing);
            return {
                content: [{
                        type: 'text',
                        text: [
                            'Dreamroll RESUMED.',
                            `Project: ${projectRoot}`,
                            `Brief: ${existing.config.brief ?? '(none)'}`,
                            `Last variation: ${existing.currentVariation}`,
                            `Gems so far: ${existing.gems.length}`,
                            '',
                            'Call dreamroll_next to get the next variation parameters.',
                        ].join('\n'),
                    }],
            };
        }
        // Fresh session
        const resolvedBrief = detectBrief(projectRoot, brief);
        const config = {
            basePage: '',
            targetVariations: null, // never-stop
            budgetHours: 24,
            projectRoot,
            brief: resolvedBrief,
        };
        const state = (0, state_js_1.createState)(config);
        // Ensure variations dir exists
        const variationsDir = path.join(projectRoot, '.dreamroll', 'variations');
        if (!fs.existsSync(variationsDir))
            fs.mkdirSync(variationsDir, { recursive: true });
        (0, state_js_1.saveState)(projectRoot, state);
        return {
            content: [{
                    type: 'text',
                    text: [
                        'Dreamroll INITIALIZED.',
                        `Project: ${projectRoot}`,
                        `Brief: ${resolvedBrief}`,
                        '',
                        'Files:',
                        '  .dreamroll/state.json               live state',
                        '  .dreamroll/variations/              generated HTML files',
                        '',
                        'Call dreamroll_next to get the first variation parameters.',
                    ].join('\n'),
                }],
        };
    });
    server.tool('dreamroll_next', 'Returns the next variation to generate: number, rolled parameters, brief, output path. Respects stop flag and evolution weights. Skill calls this in a loop until stopped.', projectRootSchema, async ({ projectRoot }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll session. Call dreamroll_start first.' }] };
        }
        // Honor stop flag
        if (state.stopRequested) {
            (0, state_js_1.stopRun)(projectRoot, state);
            return { content: [{ type: 'text', text: 'Stop requested. Run marked stopped. Call dreamroll_report for summary.' }] };
        }
        const nextId = state.currentVariation + 1;
        const seed = (0, generator_js_1.rollSeedParameters)(state);
        const outputPath = path.join(projectRoot, '.dreamroll', 'variations', `variation_${String(nextId).padStart(3, '0')}.html`);
        const lines = [
            `VARIATION ${nextId}`,
            `Output: ${outputPath}`,
            '',
            'Brief:',
            `  ${state.config.brief ?? '(no brief)'}`,
            '',
            'Design Parameters (all 10 rolled):',
            `  Style:       ${seed.genre}`,
            `  Palette:     ${seed.colorPalette}`,
            `  Typography:  ${seed.typography}`,
            `  Layout:      ${seed.layoutArchetype}`,
            `  Density:     ${seed.density}`,
            `  Mood:        ${seed.mood}`,
            `  Era:         ${seed.era}`,
            `  Animation:   ${seed.animation}`,
            `  Imagery:     ${seed.imagery}`,
            `  Wildcard:    ${seed.wildcard}`,
            '',
            'Next steps:',
            '1. Generate a standalone HTML landing page matching these 10 parameters',
            '2. Inline all CSS, no external dependencies',
            '3. HTML comment at top documenting params + scores',
            '4. Write file to the output path above',
            '5. Call dreamroll_judge with the variation description to evaluate',
            '6. Call dreamroll_record_verdict with the scores',
            '7. Call dreamroll_next again for the next variation',
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('dreamroll_stop', 'Sets the stop flag. The next dreamroll_next call will halt the run. Graceful stop; current variation completes if in progress.', projectRootSchema, async ({ projectRoot }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll session to stop.' }] };
        }
        state.stopRequested = true;
        (0, state_js_1.saveState)(projectRoot, state);
        return { content: [{ type: 'text', text: 'Stop flag set. Dreamroll will halt at next variation boundary.' }] };
    });
    server.tool('dreamroll_status', 'Shows the current Dreamroll run status: progress, gems found, current variation, evolution adjustments.', projectRootSchema, async ({ projectRoot }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll run in progress.' }] };
        }
        const lines = [
            `Status: ${state.status}${state.stopRequested ? ' (stop requested)' : ''}`,
            `Variations generated: ${state.currentVariation}`,
            `Gems found: ${state.gems.length}`,
            `Elapsed: ${Math.round(state.elapsedMs / 60000)}m`,
            `Evolution adjustments: ${state.evolutionAdjustments.length}`,
            `Brief: ${state.config.brief ?? '(none)'}`,
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('dreamroll_gems', 'Lists all gems (high-scoring variations) from the current or last Dreamroll run.', projectRootSchema, async ({ projectRoot }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll state found.' }] };
        }
        const gems = state.variations.filter(v => state.gems.includes(v.id));
        if (gems.length === 0) {
            return { content: [{ type: 'text', text: 'No gems found yet.' }] };
        }
        const lines = gems.map(g => {
            const scores = g.verdict?.scores.map(s => `${s.judge}: ${s.score}`).join(', ') ?? 'no scores';
            return `v${g.id} (avg ${g.verdict?.averageScore ?? 0}/10) [${scores}] style=${g.seed.genre} palette=${g.seed.colorPalette} wildcard=${g.seed.wildcard}`;
        });
        return { content: [{ type: 'text', text: `${gems.length} gem(s):\n${lines.join('\n')}` }] };
    });
    server.tool('dreamroll_judge', 'Returns judge evaluation prompts for a design variation. Claude evaluates these in-context using the judge personalities (BRUTUS, VENUS, MERCURY). No separate API key needed.', {
        variationDescription: zod_1.z.string().describe('Description of the variation to judge (file path, design parameters, HTML excerpt)'),
        pluginRoot: zod_1.z.string().describe('Linkraft plugin root directory (where agents/ live)'),
    }, async ({ variationDescription, pluginRoot }) => {
        const agentsDir = path.join(pluginRoot, 'agents');
        const prompts = (0, judges_js_1.getJudgeEvaluationPrompts)(agentsDir, variationDescription);
        if (prompts.length === 0) {
            return { content: [{ type: 'text', text: 'Judge prompts not found. Check that agents/dreamroll-*.md files exist.' }] };
        }
        const instructions = [
            'Evaluate this variation as each judge. For each judge below, respond with:',
            'Judge: [name]',
            'Score: [1-10]',
            'Comment: [1-2 sentence verdict in character]',
            '',
            'After all three, call dreamroll_record_verdict with the scores.',
            'Gem threshold: avg >= 7 or any single 10.',
            '',
            '---',
            '',
        ];
        for (const p of prompts) {
            instructions.push(`## ${p.judge.toUpperCase()}`);
            instructions.push(p.prompt);
            instructions.push('');
        }
        return { content: [{ type: 'text', text: instructions.join('\n') }] };
    });
    server.tool('dreamroll_record_verdict', 'Records judge scores for a variation. Called after Claude evaluates using dreamroll_judge. Saves the variation to state and updates gems list.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        variationId: zod_1.z.number().describe('Variation number'),
        filePath: zod_1.z.string().describe('Path to the generated HTML file'),
        scores: zod_1.z.array(zod_1.z.object({
            judge: zod_1.z.enum(['brutus', 'venus', 'mercury']),
            score: zod_1.z.number().min(1).max(10),
            comment: zod_1.z.string(),
        })).describe('Judge scores'),
    }, async ({ projectRoot, variationId, filePath, scores }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll state found.' }] };
        }
        const verdict = (0, judges_js_1.calculateVerdict)(scores);
        // Upsert the variation
        let variation = state.variations.find(v => v.id === variationId);
        if (variation) {
            variation.verdict = verdict;
            variation.filesPath = filePath;
        }
        else {
            // New variation being recorded — roll a placeholder seed from the file if possible
            variation = {
                id: variationId,
                seed: (0, generator_js_1.rollSeedParameters)(state), // placeholder; real seed was rolled at dreamroll_next
                verdict,
                screenshotPath: null,
                filesPath: filePath,
                createdAt: new Date().toISOString(),
            };
            state.variations.push(variation);
        }
        state.currentVariation = Math.max(state.currentVariation, variationId);
        if (verdict.verdict === 'gem' && !state.gems.includes(variationId)) {
            state.gems.push(variationId);
        }
        // Evolution check
        const adjustments = (0, evolution_js_1.maybeEvolve)(state);
        if (adjustments.length > 0) {
            state.evolutionAdjustments.push(...adjustments);
        }
        (0, state_js_1.saveState)(projectRoot, state);
        const lines = scores.map(s => `${s.judge.toUpperCase()}: ${s.score}/10 - "${s.comment}"`);
        lines.push('', `Average: ${verdict.averageScore}/10`, `Verdict: ${verdict.verdict.toUpperCase()}`);
        if (verdict.hasInstantKeep)
            lines.push('(INSTANT KEEP: a judge gave 10)');
        if (adjustments.length > 0) {
            lines.push('', `Evolution kicked in (${adjustments.length} adjustments)`);
        }
        lines.push('', 'Call dreamroll_next for the next variation.');
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('dreamroll_report', 'Generates the morning report: top gems, patterns, wildcard discoveries, full statistics.', projectRootSchema, async ({ projectRoot }) => {
        const report = (0, generator_js_1.getMorningReport)(projectRoot);
        return { content: [{ type: 'text', text: report }] };
    });
}
//# sourceMappingURL=dreamroll-tools.js.map