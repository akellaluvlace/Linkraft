// Dreamroll Judges: loads judge prompts from agents/*.md, evaluates variations.
// Primary mode: Claude evaluates using judge personality (runs inside Claude Code).
// Fallback: mock scores with self-evaluation warning.

import * as fs from 'fs';
import * as path from 'path';
import type { JudgeScore, JudgeVerdict, Verdict } from './types.js';
import { checkDistinctiveCSS } from './params.js';

const AUTO_DEDUCTION = 2;

const JUDGE_NAMES = ['brutus', 'venus', 'mercury'] as const;
type JudgeName = typeof JUDGE_NAMES[number];

/**
 * Loads a judge prompt from the agents directory.
 */
export function loadJudgePrompt(judgeName: JudgeName, agentsDir: string): string | null {
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
export function parseJudgeResponse(response: string): { score: number; comment: string } {
  const scoreMatch = /Score:\s*(\d+)/i.exec(response);
  const commentMatch = /Comment:\s*(.+)/is.exec(response);

  const score = scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1]!, 10))) : 5;
  const comment = commentMatch ? commentMatch[1]!.trim() : response.trim();

  return { score, comment };
}

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
export function applyStyleAdherenceDeduction(
  scores: JudgeScore[],
  htmlContent: string,
  styleId: string,
  mutation: string = 'pure',
): { scores: JudgeScore[]; deducted: boolean; missing: string[]; skipped: boolean } {
  // Skip the check entirely for non-pure mutations
  if (mutation !== 'pure') {
    return { scores, deducted: false, missing: [], skipped: true };
  }

  const { missing } = checkDistinctiveCSS(htmlContent, styleId);
  if (missing.length === 0) {
    return { scores, deducted: false, missing: [], skipped: false };
  }

  const adjusted = scores.map(s => {
    if (s.judge !== 'brutus') return s;
    const newScore = Math.max(1, s.score - AUTO_DEDUCTION);
    const note = ` [auto: -${AUTO_DEDUCTION} for missing distinctive CSS (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', ...' : ''})]`;
    return { ...s, score: newScore, comment: s.comment + note };
  });
  return { scores: adjusted, deducted: true, missing, skipped: false };
}

/**
 * Determines the verdict from judge scores.
 */
export function calculateVerdict(scores: JudgeScore[]): JudgeVerdict {
  if (scores.length === 0) {
    return { scores: [], averageScore: 0, verdict: 'discard', hasInstantKeep: false };
  }

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const averageScore = Math.round((totalScore / scores.length) * 10) / 10;
  const hasInstantKeep = scores.some(s => s.score === 10);

  let verdict: Verdict;
  if (hasInstantKeep || averageScore >= 7) {
    verdict = 'gem';
  } else if (averageScore >= 5) {
    verdict = 'iterate';
  } else {
    verdict = 'discard';
  }

  return { scores, averageScore, verdict, hasInstantKeep };
}

/**
 * Caller that sends a prompt to an external LLM (optional).
 */
export type JudgeCaller = (systemPrompt: string, userPrompt: string) => Promise<string>;

/**
 * Builds the evaluation prompt for a judge to be evaluated by Claude in-context.
 * This is the primary mode: Claude IS the judge. The prompt instructs Claude to
 * adopt the judge personality and score the variation.
 */
export function buildJudgeEvaluationPrompt(judgePrompt: string, variationDescription: string): string {
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
export function getJudgeEvaluationPrompts(
  agentsDir: string,
  variationDescription: string,
): Array<{ judge: JudgeName; prompt: string }> {
  const prompts: Array<{ judge: JudgeName; prompt: string }> = [];

  for (const judgeName of JUDGE_NAMES) {
    const judgePrompt = loadJudgePrompt(judgeName, agentsDir);
    if (!judgePrompt) continue;

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
export async function judgeVariation(
  variationDescription: string,
  agentsDir: string,
  caller: JudgeCaller | null,
): Promise<JudgeVerdict> {
  const scores: JudgeScore[] = [];

  for (const judgeName of JUDGE_NAMES) {
    const prompt = loadJudgePrompt(judgeName, agentsDir);
    if (!prompt) continue;

    let score: number;
    let comment: string;

    if (caller) {
      try {
        const response = await caller(prompt, variationDescription);
        const parsed = parseJudgeResponse(response);
        score = parsed.score;
        comment = parsed.comment;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[dreamroll] Judge ${judgeName} error: ${msg}\n`);
        score = 5;
        comment = `[Judge error: ${msg}]`;
      }
    } else {
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
