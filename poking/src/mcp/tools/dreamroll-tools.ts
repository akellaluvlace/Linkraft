import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadState } from '../../dreamroll/state.js';
import { getMorningReport } from '../../dreamroll/generator.js';

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
