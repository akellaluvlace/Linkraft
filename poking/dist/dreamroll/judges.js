"use strict";
// Dreamroll Judges: loads judge prompts from agents/*.md, evaluates variations.
// Primary mode: Claude evaluates using judge personality (runs inside Claude Code).
// Fallback: mock scores with self-evaluation warning.
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
exports.loadJudgePrompt = loadJudgePrompt;
exports.parseJudgeResponse = parseJudgeResponse;
exports.calculateVerdict = calculateVerdict;
exports.buildJudgeEvaluationPrompt = buildJudgeEvaluationPrompt;
exports.getJudgeEvaluationPrompts = getJudgeEvaluationPrompts;
exports.judgeVariation = judgeVariation;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const JUDGE_NAMES = ['brutus', 'venus', 'mercury'];
/**
 * Loads a judge prompt from the agents directory.
 */
function loadJudgePrompt(judgeName, agentsDir) {
    const filePath = path.join(agentsDir, `dreamroll-${judgeName}.md`);
    if (!fs.existsSync(filePath)) {
        process.stderr.write(`[dreamroll] Judge prompt not found: ${filePath}\n`);
        return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const stripped = content.replace(/^---[\s\S]*?---\n/, '');
    return stripped.trim();
}
/**
 * Parses a judge response to extract score and comment.
 * Expected format: "Score: N\nComment: ..."
 */
function parseJudgeResponse(response) {
    const scoreMatch = /Score:\s*(\d+)/i.exec(response);
    const commentMatch = /Comment:\s*(.+)/is.exec(response);
    const score = scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1], 10))) : 5;
    const comment = commentMatch ? commentMatch[1].trim() : response.trim();
    return { score, comment };
}
/**
 * Determines the verdict from judge scores.
 */
function calculateVerdict(scores) {
    if (scores.length === 0) {
        return { scores: [], averageScore: 0, verdict: 'discard', hasInstantKeep: false };
    }
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const averageScore = Math.round((totalScore / scores.length) * 10) / 10;
    const hasInstantKeep = scores.some(s => s.score === 10);
    let verdict;
    if (hasInstantKeep || averageScore >= 7) {
        verdict = 'gem';
    }
    else if (averageScore >= 5) {
        verdict = 'iterate';
    }
    else {
        verdict = 'discard';
    }
    return { scores, averageScore, verdict, hasInstantKeep };
}
/**
 * Builds the evaluation prompt for a judge to be evaluated by Claude in-context.
 * This is the primary mode: Claude IS the judge. The prompt instructs Claude to
 * adopt the judge personality and score the variation.
 */
function buildJudgeEvaluationPrompt(judgePrompt, variationDescription) {
    return [
        'You are now evaluating a design variation as a judge. Adopt the following personality completely.',
        '',
        '--- JUDGE PERSONALITY ---',
        judgePrompt,
        '--- END PERSONALITY ---',
        '',
        '--- VARIATION TO JUDGE ---',
        variationDescription,
        '--- END VARIATION ---',
        '',
        'Respond with EXACTLY this format:',
        'Score: [1-10]',
        'Comment: [Your roast in 2-3 sentences]',
        '',
        'Stay in character. Be honest. Score harshly.',
    ].join('\n');
}
/**
 * Loads all three judge prompts and returns them as evaluation prompts.
 * These prompts are designed to be sent to Claude in the current session context.
 */
function getJudgeEvaluationPrompts(agentsDir, variationDescription) {
    const prompts = [];
    for (const judgeName of JUDGE_NAMES) {
        const judgePrompt = loadJudgePrompt(judgeName, agentsDir);
        if (!judgePrompt)
            continue;
        prompts.push({
            judge: judgeName,
            prompt: buildJudgeEvaluationPrompt(judgePrompt, variationDescription),
        });
    }
    return prompts;
}
/**
 * Runs all three judges on a variation.
 *
 * Modes (in priority order):
 * 1. External caller provided: uses it (e.g., Anthropic API)
 * 2. No caller: returns evaluation prompts for Claude to judge in-context
 *    via the dreamroll_judge MCP tool. The SKILL.md instructs Claude to
 *    call dreamroll_judge for each variation, which returns the prompt
 *    that Claude evaluates as itself.
 *
 * The mock fallback only triggers during automated/headless runs.
 */
async function judgeVariation(variationDescription, agentsDir, caller) {
    const scores = [];
    for (const judgeName of JUDGE_NAMES) {
        const prompt = loadJudgePrompt(judgeName, agentsDir);
        if (!prompt)
            continue;
        let score;
        let comment;
        if (caller) {
            try {
                const response = await caller(prompt, variationDescription);
                const parsed = parseJudgeResponse(response);
                score = parsed.score;
                comment = parsed.comment;
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                process.stderr.write(`[dreamroll] Judge ${judgeName} error: ${msg}\n`);
                score = 5;
                comment = `[Judge error: ${msg}]`;
            }
        }
        else {
            // Self-evaluation mode: mock scores for automated runs.
            // In interactive mode, the SKILL.md instructs Claude to use
            // dreamroll_judge tool and evaluate in-context instead.
            score = Math.floor(Math.random() * 6) + 3;
            comment = `[Self-evaluation mode: ${judgeName} mock score. For real judging, run interactively.]`;
        }
        scores.push({ judge: judgeName, score, comment });
    }
    return calculateVerdict(scores);
}
//# sourceMappingURL=judges.js.map