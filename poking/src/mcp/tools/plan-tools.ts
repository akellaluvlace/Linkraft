import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeStack, detectConventions } from '../../plan/stack-analyzer.js';
import { scanProject, generateClaudeMd, generateAndWriteClaudeMd, writeClaudeMd } from '../../plan/claude-md-gen.js';
import { extractSchema, formatSchema } from '../../plan/schema-extractor.js';
import { mapApiEndpoints, formatApiMap } from '../../plan/api-mapper.js';
import { extractDesignTokens, formatDesignTokens } from '../../plan/token-extractor.js';
import { detectFeatures } from '../../plan/feature-detector.js';
import * as fs from 'fs';
import * as path from 'path';

export function registerPlanTools(server: McpServer): void {
  server.tool(
    'plan_analyze_stack',
    'Detects tech stack, coding conventions, and project features.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const stack = analyzeStack(projectRoot);
      const conventions = detectConventions(projectRoot);
      const features = detectFeatures(projectRoot);

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
        '**Conventions:**',
        `- Indentation: ${conventions.indentation}`,
        `- Quotes: ${conventions.quotes}`,
        `- Semicolons: ${conventions.semicolons ? 'yes' : 'no'}`,
        `- State: ${conventions.stateManagement ?? 'none'}`,
        '',
        '**Features detected:**',
        `- Database: ${features.hasDatabase ? `yes (${features.databaseType})` : 'no'}`,
        `- API routes: ${features.hasApiRoutes ? 'yes' : 'no'}`,
        `- Mobile app: ${features.hasMobileApp ? 'yes' : 'no'}`,
        `- Design system: ${features.hasDesignSystem ? 'yes' : 'no'}`,
        `- Is product: ${features.isProduct ? 'yes' : 'no'}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'plan_generate_claude_md',
    'Generates a complete CLAUDE.md from scanning the project. If one exists, reports diff for merge review.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const result = generateAndWriteClaudeMd(projectRoot);
      if (result.merged) {
        const lines = [
          'Existing CLAUDE.md found.',
          '',
          `New sections to add (${result.newSections.length}): ${result.newSections.join(', ') || 'none'}`,
          `Sections with updates (${result.updatedSections.length}): ${result.updatedSections.join(', ') || 'none'}`,
          '',
          'Generated CLAUDE.md preview:',
          '---',
          result.content,
        ];
        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      }

      return { content: [{ type: 'text' as const, text: `CLAUDE.md written to: ${result.path}\n\n---\n\n${result.content}` }] };
    },
  );

  server.tool(
    'plan_write_claude_md',
    'Writes the provided CLAUDE.md content to the project root. Use after reviewing the generated content.',
    {
      projectRoot: z.string().describe('Project root directory'),
      content: z.string().describe('CLAUDE.md content to write'),
    },
    async ({ projectRoot, content }) => {
      const filePath = writeClaudeMd(projectRoot, content);
      return { content: [{ type: 'text' as const, text: `Written to: ${filePath}` }] };
    },
  );

  server.tool(
    'plan_preview_claude_md',
    'Previews generated CLAUDE.md without writing it.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const config = scanProject(projectRoot);
      const content = generateClaudeMd(config);
      return { content: [{ type: 'text' as const, text: `Preview:\n\n${content}` }] };
    },
  );

  server.tool(
    'plan_schema',
    'Extracts database schema from migrations, Prisma, or Drizzle. Returns SCHEMA.md content.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const result = extractSchema(projectRoot);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'No database schema detected. Checked: prisma/, supabase/migrations/, drizzle/, migrations/' }] };
      }
      const md = formatSchema(result.tables, result.source);

      // Write to .plan/
      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'SCHEMA.md'), md, 'utf-8');

      return { content: [{ type: 'text' as const, text: `Written to .plan/SCHEMA.md\n\n${md}` }] };
    },
  );

  server.tool(
    'plan_api_map',
    'Maps all API endpoints, Edge Functions, and server actions. Returns API_MAP.md.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const endpoints = mapApiEndpoints(projectRoot);
      const md = formatApiMap(endpoints);

      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'API_MAP.md'), md, 'utf-8');

      return { content: [{ type: 'text' as const, text: `Written to .plan/API_MAP.md (${endpoints.length} endpoints)\n\n${md}` }] };
    },
  );

  server.tool(
    'plan_tokens',
    'Extracts design tokens from tailwind.config or CSS variables. Returns DESIGN_TOKENS.md.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const tokens = extractDesignTokens(projectRoot);
      if (!tokens) {
        return { content: [{ type: 'text' as const, text: 'No design system detected. Checked: tailwind.config, globals.css' }] };
      }
      const md = formatDesignTokens(tokens);

      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'DESIGN_TOKENS.md'), md, 'utf-8');

      return { content: [{ type: 'text' as const, text: `Written to .plan/DESIGN_TOKENS.md\n\n${md}` }] };
    },
  );

  server.tool(
    'plan_features',
    'Detects project features: database, API routes, mobile app, design system, product vs tool.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const features = detectFeatures(projectRoot);
      const applicable: string[] = ['CLAUDE.md', 'STACK_ANALYSIS', 'ARCHITECTURE', 'RISK_MATRIX', 'DEPENDENCY_GRAPH'];
      if (features.hasDatabase) applicable.push('SCHEMA');
      if (features.hasApiRoutes) applicable.push('API_MAP');
      if (features.hasDesignSystem) applicable.push('DESIGN_TOKENS');
      if (features.isProduct) applicable.push('MONETIZATION');
      if (features.hasMobileApp) applicable.push('ASO_KEYWORDS');

      return {
        content: [{
          type: 'text' as const,
          text: [
            'Applicable plan outputs:',
            ...applicable.map(a => `  - ${a}`),
            '',
            `Database: ${features.databaseType ?? 'none'}`,
            `API routes: ${features.hasApiRoutes}`,
            `Mobile: ${features.hasMobileApp}`,
            `Design system: ${features.hasDesignSystem}`,
            `Product: ${features.isProduct}`,
          ].join('\n'),
        }],
      };
    },
  );
}
