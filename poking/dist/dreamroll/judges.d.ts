import type { JudgeScore, JudgeVerdict } from './types.js';
declare const JUDGE_NAMES: readonly ["brutus", "venus", "mercury"];
type JudgeName = typeof JUDGE_NAMES[number];
/**
 * Loads a judge prompt from the agents directory.
 */
export declare function loadJudgePrompt(judgeName: JudgeName, agentsDir: string): string | null;
/**
 * Parses a judge response to extract score and comment.
 * Expected format: "Score: N\nComment: ..."
 */
export declare function parseJudgeResponse(response: string): {
    score: number;
    comment: string;
};
/**
 * Applies the style-adherence auto-deduction to BRUTUS.
 *
 * Reads the generated HTML, checks it against the required CSS declarations
 * for the given style archetype, and deducts 2 BRUTUS points if ANY required
 * strings are missing. Returns the adjusted scores plus a note listing what
 * was missing so the caller can display it.
 *
 * IMPORTANT: The check is SKIPPED when `mutation` is anything other than 'pure'.
 * Mutations (mashup, invert, maximum, minimum, material-swap, era-clash, franken)
 * deliberately violate the archetype's CSS — checking it would unfairly punish
 * variations that are doing exactly what they were asked to do. In mutation mode
 * the judges evaluate whether the combination works, not whether it matches a
 * known style.
 *
 * This is the hard-coded check the build spec calls for: "If the distinctive
 * CSS is missing, BRUTUS deducts 2 points automatically."
 */
export declare function applyStyleAdherenceDeduction(scores: JudgeScore[], htmlContent: string, styleId: string, mutation?: string): {
    scores: JudgeScore[];
    deducted: boolean;
    missing: string[];
    skipped: boolean;
};
/**
 * Determines the verdict from judge scores.
 */
export declare function calculateVerdict(scores: JudgeScore[]): JudgeVerdict;
/**
 * Caller that sends a prompt to an external LLM (optional).
 */
export type JudgeCaller = (systemPrompt: string, userPrompt: string) => Promise<string>;
/**
 * Builds the evaluation prompt for a judge to be evaluated by Claude in-context.
 * This is the primary mode: Claude IS the judge. The prompt instructs Claude to
 * adopt the judge personality and score the variation.
 */
export declare function buildJudgeEvaluationPrompt(judgePrompt: string, variationDescription: string): string;
/**
 * Loads all three judge prompts and returns them as evaluation prompts.
 * These prompts are designed to be sent to Claude in the current session context.
 */
export declare function getJudgeEvaluationPrompts(agentsDir: string, variationDescription: string): Array<{
    judge: JudgeName;
    prompt: string;
}>;
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
export declare function judgeVariation(variationDescription: string, agentsDir: string, caller: JudgeCaller | null): Promise<JudgeVerdict>;
export {};
