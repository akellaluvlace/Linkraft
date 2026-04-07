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
const state_js_1 = require("../../dreamroll/state.js");
const generator_js_1 = require("../../dreamroll/generator.js");
const judges_js_1 = require("../../dreamroll/judges.js");
const path = __importStar(require("path"));
function registerDreamrollTools(server) {
    server.tool('dreamroll_status', 'Shows the current Dreamroll run status: progress, gems found, current variation.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
    }, async ({ projectRoot }) => {
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll run in progress.' }] };
        }
        const lines = [
            `Status: ${state.status}`,
            `Progress: ${state.currentVariation}/${state.config.targetVariations} variations`,
            `Gems found: ${state.gems.length}`,
            `Elapsed: ${Math.round(state.elapsedMs / 60000)}m`,
            `Evolution adjustments: ${state.evolutionAdjustments.length}`,
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('dreamroll_gems', 'Lists all gems (high-scoring variations) from the current or last Dreamroll run.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
    }, async ({ projectRoot }) => {
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
            return `v${g.id} - Avg: ${g.verdict?.averageScore ?? 0}/10 [${scores}] | ${g.seed.genre} ${g.seed.layoutArchetype}`;
        });
        return { content: [{ type: 'text', text: `${gems.length} gem(s):\n${lines.join('\n')}` }] };
    });
    server.tool('dreamroll_judge', 'Returns judge evaluation prompts for a design variation. Claude evaluates these in-context using the judge personalities (BRUTUS, VENUS, MERCURY). No separate API key needed.', {
        variationDescription: zod_1.z.string().describe('Description of the variation to judge (code, design parameters, screenshot description)'),
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
            'Comment: [2-3 sentence roast in character]',
            '',
            'Then after all three, provide:',
            'Average: [calculated average]',
            'Verdict: [gem if avg >= 7 or any 10, iterate if avg >= 5, discard if avg < 5]',
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
    server.tool('dreamroll_record_verdict', 'Records judge scores for a variation. Called after Claude evaluates using dreamroll_judge.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        variationId: zod_1.z.number().describe('Variation number'),
        scores: zod_1.z.array(zod_1.z.object({
            judge: zod_1.z.enum(['brutus', 'venus', 'mercury']),
            score: zod_1.z.number().min(1).max(10),
            comment: zod_1.z.string(),
        })).describe('Judge scores'),
    }, async ({ projectRoot, variationId, scores }) => {
        const verdict = (0, judges_js_1.calculateVerdict)(scores);
        const state = (0, state_js_1.loadState)(projectRoot);
        if (!state) {
            return { content: [{ type: 'text', text: 'No Dreamroll state found.' }] };
        }
        const variation = state.variations.find(v => v.id === variationId);
        if (variation) {
            variation.verdict = verdict;
            if (verdict.verdict === 'gem' && !state.gems.includes(variationId)) {
                state.gems.push(variationId);
            }
            const stateModule = await import('../../dreamroll/state.js');
            stateModule.saveState(projectRoot, state);
        }
        const lines = scores.map(s => `${s.judge.toUpperCase()}: ${s.score}/10 - "${s.comment}"`);
        lines.push('', `Average: ${verdict.averageScore}/10`, `Verdict: **${verdict.verdict.toUpperCase()}**`);
        if (verdict.hasInstantKeep)
            lines.push('(INSTANT KEEP: a judge gave 10!)');
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('dreamroll_report', 'Generates the morning report: top gems, patterns, wildcard discoveries, full statistics.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
    }, async ({ projectRoot }) => {
        const report = (0, generator_js_1.getMorningReport)(projectRoot);
        return { content: [{ type: 'text', text: report }] };
    });
}
//# sourceMappingURL=dreamroll-tools.js.map