import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { autoConfig, generateQAPlan } from '../../sheep/auto-config.js';
import { initSession, getReport } from '../../sheep/hunter.js';
import { loadStats } from '../../sheep/stats.js';

export function registerSheepTools(server: McpServer): void {
  server.tool(
    'sheep_scan',
    'Auto-detects project stack, build/test commands, and generates a QA plan. Zero config required.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const config = autoConfig(projectRoot);
      const qaPlan = generateQAPlan(config);

      const summary = [
        `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
        `Styling: ${config.stack.styling ?? 'none detected'}`,
        `Database: ${config.stack.database ?? 'none detected'}`,
        `Testing: ${config.stack.testing ?? 'none detected'}`,
        `Build: ${config.buildCommand ?? 'not found'}`,
        `Test: ${config.testCommand ?? 'not found'}`,
        `Package manager: ${config.stack.packageManager}`,
        '',
        '---',
        '',
        qaPlan,
      ].join('\n');

      return { content: [{ type: 'text' as const, text: summary }] };
    },
  );

  server.tool(
    'sheep_init',
    'Initializes a Sheep QA session: auto-config, QA plan, baseline stats. Creates .sheep/ directory.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const { config } = initSession(projectRoot);
      return {
        content: [{
          type: 'text' as const,
          text: [
            'SheepCalledShip initialized.',
            '',
            `Project: ${projectRoot}`,
            `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
            `Build: ${config.buildCommand ?? 'not detected'}`,
            `Test: ${config.testCommand ?? 'not detected'}`,
            '',
            'Files created:',
            '  .sheep/QA_PLAN.md',
            '  .sheep/stats.json',
            '  .sheep/story.md',
            '',
            'Ready to hunt. The sheep is in the field.',
          ].join('\n'),
        }],
      };
    },
  );

  server.tool(
    'sheep_status',
    'Shows current Sheep QA session status: cycles, bugs found/fixed, areas tested.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const report = getReport(projectRoot);
      return { content: [{ type: 'text' as const, text: report }] };
    },
  );

  server.tool(
    'sheep_report',
    'Generates the full session report with stats, narrative highlights, and content pack location.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const stats = loadStats(projectRoot);
      if (!stats) {
        return { content: [{ type: 'text' as const, text: 'No Sheep session found. Run /linkraft sheep to start.' }] };
      }

      const report = getReport(projectRoot);
      const extras = [
        report,
        '',
        'Files:',
        '  .sheep/QA_PLAN.md    — auto-generated QA plan',
        '  .sheep/stats.json    — session statistics',
        '  .sheep/story.md      — narrative field report',
        stats.status === 'completed' ? '  .sheep/content-pack.md — social media content' : '',
      ].filter(l => l !== '');

      return { content: [{ type: 'text' as const, text: extras.join('\n') }] };
    },
  );
}
