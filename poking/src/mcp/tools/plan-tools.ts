import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeStack, detectConventions } from '../../plan/stack-analyzer.js';
import { scanProject, generateClaudeMd, generateAndWriteClaudeMd, writeClaudeMd } from '../../plan/claude-md-gen.js';
import { extractSchema, formatSchema } from '../../plan/schema-extractor.js';
import { mapApiEndpoints, formatApiMap } from '../../plan/api-mapper.js';
import { extractDesignTokens, formatDesignTokens } from '../../plan/token-extractor.js';
import { detectFeatures } from '../../plan/feature-detector.js';
import { collectCompetitorContext, generateCompetitorTemplate, writeCompetitors } from '../../plan/competitors-gen.js';
import { collectArchitectureContext, generateArchitectureTemplate, writeArchitecture } from '../../plan/architecture-gen.js';
import { collectExecutiveSummaryContext, generateExecutiveSummaryTemplate, writeExecutiveSummary } from '../../plan/executive-summary-gen.js';
import { collectRiskMatrixContext, generateRiskMatrixTemplate, writeRiskMatrix } from '../../plan/risk-matrix-gen.js';
import { collectDependencyGraphContext, generateDependencyGraphTemplate, writeDependencyGraph } from '../../plan/dependency-graph-gen.js';
import { collectMonetizationContext, generateMonetizationTemplate, writeMonetization } from '../../plan/monetization-gen.js';
import { collectAsoContext, generateAsoTemplate, writeAso } from '../../plan/aso-gen.js';
import * as fs from 'fs';
import * as path from 'path';

const projectRootSchema = { projectRoot: z.string().describe('Project root directory') };

const twoModeSchema = {
  projectRoot: z.string().describe('Project root directory'),
  content: z.string().optional().describe('Completed analysis to write. If omitted, returns local context and template.'),
};

export function registerPlanTools(server: McpServer): void {
  server.tool(
    'plan_analyze_stack',
    'Detects tech stack, coding conventions, and project features.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const stack = analyzeStack(projectRoot);
      const conventions = detectConventions(projectRoot);
      const features = detectFeatures(projectRoot);

      const lines = [
        '# Stack Analysis',
        '',
        '## Tech Stack',
        `- Framework: ${stack.framework ?? 'not detected'}`,
        `- Language: ${stack.language}`,
        `- Styling: ${stack.styling ?? 'not detected'}`,
        `- Database: ${stack.database ?? 'not detected'}`,
        `- Auth: ${stack.auth ?? 'not detected'}`,
        `- Testing: ${stack.testing ?? 'not detected'}`,
        `- Deployment: ${stack.deployment ?? 'not detected'}`,
        '',
        '## Conventions',
        `- Indentation: ${conventions.indentation}`,
        `- Quotes: ${conventions.quotes}`,
        `- Semicolons: ${conventions.semicolons ? 'yes' : 'no'}`,
        `- Naming: ${conventions.namingStyle}`,
        `- Imports: ${conventions.importStyle}`,
        `- State management: ${conventions.stateManagement ?? 'none'}`,
        '',
        '## Features Detected',
        `- Database: ${features.hasDatabase ? `yes (${features.databaseType})` : 'no'}`,
        `- API routes: ${features.hasApiRoutes ? 'yes' : 'no'}`,
        `- Mobile app: ${features.hasMobileApp ? 'yes' : 'no'}`,
        `- Design system: ${features.hasDesignSystem ? 'yes' : 'no'}`,
        `- Is product: ${features.isProduct ? 'yes' : 'no'}`,
      ];

      const md = lines.join('\n');
      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'STACK.md'), md, 'utf-8');

      return { content: [{ type: 'text' as const, text: `Written to .plan/STACK.md\n\n${md}` }] };
    },
  );

  server.tool(
    'plan_generate_claude_md',
    'Generates a complete CLAUDE.md from scanning the project. If one exists, reports diff for merge review.',
    projectRootSchema,
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
    projectRootSchema,
    async ({ projectRoot }) => {
      const config = scanProject(projectRoot);
      const content = generateClaudeMd(config);
      return { content: [{ type: 'text' as const, text: `Preview:\n\n${content}` }] };
    },
  );

  server.tool(
    'plan_schema',
    'Extracts database schema from migrations, Prisma, or Drizzle. Returns SCHEMA.md content.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = extractSchema(projectRoot);
      if (!result) {
        return { content: [{ type: 'text' as const, text: 'No database schema detected. Checked: prisma/, supabase/migrations/, drizzle/, migrations/' }] };
      }
      const md = formatSchema(result.tables, result.source);

      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'SCHEMA.md'), md, 'utf-8');

      return { content: [{ type: 'text' as const, text: `Written to .plan/SCHEMA.md\n\n${md}` }] };
    },
  );

  server.tool(
    'plan_api_map',
    'Maps all API endpoints, Edge Functions, and server actions. Returns API_MAP.md.',
    projectRootSchema,
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
    projectRootSchema,
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
    projectRootSchema,
    async ({ projectRoot }) => {
      const features = detectFeatures(projectRoot);
      const always = ['STACK', 'FEATURES', 'CLAUDE.md', 'COMPETITORS', 'ARCHITECTURE', 'EXECUTIVE_SUMMARY', 'RISK_MATRIX', 'DEPENDENCY_GRAPH'];
      const conditional: string[] = [];
      if (features.hasDatabase) conditional.push('SCHEMA');
      if (features.hasApiRoutes) conditional.push('API_MAP');
      if (features.hasDesignSystem) conditional.push('DESIGN_TOKENS');
      if (features.isProduct) conditional.push('MONETIZATION');
      if (features.hasMobileApp) conditional.push('ASO_KEYWORDS');

      const lines = [
        '# Feature Detection',
        '',
        '## Always Generated',
        ...always.map(a => `- ${a}`),
        '',
        '## Conditional (detected)',
        ...(conditional.length > 0 ? conditional.map(a => `- ${a}`) : ['(none detected)']),
        '',
        '## Detection Results',
        `- Database: ${features.hasDatabase ? `yes (${features.databaseType})` : 'no'}`,
        `- API routes: ${features.hasApiRoutes ? 'yes' : 'no'}`,
        `- Mobile app: ${features.hasMobileApp ? 'yes' : 'no'}`,
        `- Design system: ${features.hasDesignSystem ? 'yes' : 'no'}`,
        `- Is product: ${features.isProduct ? 'yes' : 'no'}`,
        '',
        `**Total outputs: ${always.length + conditional.length}**`,
      ];

      const md = lines.join('\n');
      const planDir = path.join(projectRoot, '.plan');
      if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'FEATURES.md'), md, 'utf-8');

      return {
        content: [{
          type: 'text' as const,
          text: `Written to .plan/FEATURES.md\n\n${md}`,
        }],
      };
    },
  );

  // --- New analytical tools ---

  server.tool(
    'plan_competitors',
    'Competitive analysis. Without content: returns project context and template for web_search research. With content: writes COMPETITORS.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeCompetitors(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectCompetitorContext(projectRoot);
      const template = generateCompetitorTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_architecture',
    'Architecture review. Without content: returns codebase analysis and template. With content: writes ARCHITECTURE.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeArchitecture(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectArchitectureContext(projectRoot);
      const template = generateArchitectureTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_executive_summary',
    'Executive summary. Without content: reads all .plan/ files and returns synthesis template. With content: writes EXECUTIVE_SUMMARY.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeExecutiveSummary(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectExecutiveSummaryContext(projectRoot);
      const template = generateExecutiveSummaryTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_risk_matrix',
    'Risk matrix. Without content: extracts risks from architecture and competitor analysis. With content: writes RISK_MATRIX.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeRiskMatrix(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectRiskMatrixContext(projectRoot);
      const template = generateRiskMatrixTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_dependency_graph',
    'Dependency graph. Without content: extracts action items from executive summary. With content: writes DEPENDENCY_GRAPH.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeDependencyGraph(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectDependencyGraphContext(projectRoot);
      const template = generateDependencyGraphTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_monetization',
    'Monetization analysis (products only). Without content: returns pricing context and template. With content: writes MONETIZATION.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeMonetization(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectMonetizationContext(projectRoot);
      const template = generateMonetizationTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );

  server.tool(
    'plan_aso',
    'App Store Optimization keywords (mobile apps only). Without content: returns app context and template. With content: writes ASO_KEYWORDS.md.',
    twoModeSchema,
    async ({ projectRoot, content }) => {
      if (content) {
        const filePath = writeAso(projectRoot, content);
        return { content: [{ type: 'text' as const, text: `Written to ${filePath}` }] };
      }
      const ctx = collectAsoContext(projectRoot);
      const template = generateAsoTemplate(ctx);
      return { content: [{ type: 'text' as const, text: template }] };
    },
  );
}
