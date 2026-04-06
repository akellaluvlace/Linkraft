import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadState } from '../../dreamroll/state.js';
import { getMorningReport } from '../../dreamroll/generator.js';
import { getJudgeEvaluationPrompts, calculateVerdict } from '../../dreamroll/judges.js';
import * as path from 'path';

export function registerDreamrollTools(server: McpServer): void {
  server.tool(
    'dreamroll_status',
    'Shows the current Dreamroll run status: progress, gems found, current variation.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll run in progress.' }] };
      }

      const lines = [
        `Status: ${state.status}`,
        `Progress: ${state.currentVariation}/${state.config.targetVariations} variations`,
        `Gems found: ${state.gems.length}`,
        `Elapsed: ${Math.round(state.elapsedMs / 60000)}m`,
        `Evolution adjustments: ${state.evolutionAdjustments.length}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_gems',
    'Lists all gems (high-scoring variations) from the current or last Dreamroll run.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
      }

      const gems = state.variations.filter(v => state.gems.includes(v.id));
      if (gems.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No gems found yet.' }] };
      }

      const lines = gems.map(g => {
        const scores = g.verdict?.scores.map(s => `${s.judge}: ${s.score}`).join(', ') ?? 'no scores';
        return `v${g.id} - Avg: ${g.verdict?.averageScore ?? 0}/10 [${scores}] | ${g.seed.genre} ${g.seed.layoutArchetype}`;
      });
      return { content: [{ type: 'text' as const, text: `${gems.length} gem(s):\n${lines.join('\n')}` }] };
    },
  );

  server.tool(
    'dreamroll_judge',
    'Returns judge evaluation prompts for a design variation. Claude evaluates these in-context using the judge personalities (BRUTUS, VENUS, MERCURY). No separate API key needed.',
    {
      variationDescription: z.string().describe('Description of the variation to judge (code, design parameters, screenshot description)'),
      pluginRoot: z.string().describe('Linkraft plugin root directory (where agents/ live)'),
    },
    async ({ variationDescription, pluginRoot }) => {
      const agentsDir = path.join(pluginRoot, 'agents');
      const prompts = getJudgeEvaluationPrompts(agentsDir, variationDescription);

      if (prompts.length === 0) {
        return { content: [{ type: 'text' as const, text: 'Judge prompts not found. Check that agents/dreamroll-*.md files exist.' }] };
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

      return { content: [{ type: 'text' as const, text: instructions.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_record_verdict',
    'Records judge scores for a variation. Called after Claude evaluates using dreamroll_judge.',
    {
      projectRoot: z.string().describe('Project root directory'),
      variationId: z.number().describe('Variation number'),
      scores: z.array(z.object({
        judge: z.enum(['brutus', 'venus', 'mercury']),
        score: z.number().min(1).max(10),
        comment: z.string(),
      })).describe('Judge scores'),
    },
    async ({ projectRoot, variationId, scores }) => {
      const verdict = calculateVerdict(scores);
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
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
      if (verdict.hasInstantKeep) lines.push('(INSTANT KEEP: a judge gave 10!)');

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_report',
    'Generates the morning report: top gems, patterns, wildcard discoveries, full statistics.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const report = getMorningReport(projectRoot);
      return { content: [{ type: 'text' as const, text: report }] };
    },
  );
}
