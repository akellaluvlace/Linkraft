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
