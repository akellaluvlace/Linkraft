import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeStack, detectConventions } from '../../plan/stack-analyzer.js';
import { scanProject, generateClaudeMd, generateAndWriteClaudeMd } from '../../plan/claude-md-gen.js';

export function registerPlanTools(server: McpServer): void {
  server.tool(
    'plan_analyze_stack',
    'Detects the project tech stack: framework, language, styling, database, auth, testing, deployment, coding conventions.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const stack = analyzeStack(projectRoot);
      const conventions = detectConventions(projectRoot);

      const lines = [
        '**Tech Stack:**',
        `- Framework: ${stack.framework ?? 'not detected'}`,
        `- Language: ${stack.language}`,
        `- Styling: ${stack.styling ?? 'not detected'}`,
        `- Database: ${stack.database ?? 'not detected'}`,
        `- Auth: ${stack.auth ?? 'not detected'}`,
        `- Testing: ${stack.testing ?? 'not detected'}`,
        `- Deployment: ${stack.deployment ?? 'not detected'}`,
        '',
        '**Coding Conventions:**',
        `- Indentation: ${conventions.indentation}`,
        `- Quotes: ${conventions.quotes}`,
        `- Semicolons: ${conventions.semicolons ? 'yes' : 'no'}`,
        `- State management: ${conventions.stateManagement ?? 'none detected'}`,
      ];

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'plan_generate_claude_md',
    'Generates a complete CLAUDE.md from the project. Scans code, detects stack, conventions, commands, file map, and constraints. Writes to project root.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const result = generateAndWriteClaudeMd(projectRoot);
      return {
        content: [{
          type: 'text' as const,
          text: [
            `CLAUDE.md generated and written to: ${result.path}`,
            '',
            '---',
            '',
            result.content,
          ].join('\n'),
        }],
      };
    },
  );

  server.tool(
    'plan_preview_claude_md',
    'Previews what a generated CLAUDE.md would look like without writing it.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const config = scanProject(projectRoot);
      const content = generateClaudeMd(config);
      return { content: [{ type: 'text' as const, text: `Preview (not written):\n\n${content}` }] };
    },
  );
}
