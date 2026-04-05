// Dreamroll Judges: loads judge prompts from agents/*.md, spawns scoring calls.
// When no API access is available, returns mock scores.

import * as fs from 'fs';
import * as path from 'path';
import type { JudgeScore, JudgeVerdict, Verdict } from './types.js';

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
  // Strip frontmatter
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
 * Determines the verdict from judge scores.
 * - Average >= 7: gem
 * - Average >= 5: iterate
 * - Average < 5: discard
 * - Any single 10: instant keep (gem)
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

export type JudgeCaller = (systemPrompt: string, userPrompt: string) => Promise<string>;

/**
 * Runs all three judges on a variation.
 * If caller is null, returns mock scores (for when API is unavailable).
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
      // Mock scoring when API is unavailable
      score = Math.floor(Math.random() * 6) + 3; // 3-8 range
      comment = `[Mock ${judgeName} score - API unavailable]`;
    }

    scores.push({ judge: judgeName, score, comment });
  }

  return calculateVerdict(scores);
}
