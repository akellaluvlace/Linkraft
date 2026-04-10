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
import { generateHardeningMd, writeHardeningMd } from '../../plan/hardening-gen.js';
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
    'plan_generate_hardening',
    'Step 13 of /linkraft plan. Reads all .plan/*.md documents and synthesizes prioritized action items into .plan/HARDENING.md. Categorizes findings into must-fix (security, data loss, correctness), should-fix (architecture weaknesses, incomplete features, UX), and nice-to-have (polish). Each item is tagged with category, source, and effort estimate. Must run AFTER steps 1-12 and BEFORE step 14 (claude-md).',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = generateHardeningMd(projectRoot);
      if (!result) {
        return {
          content: [{
            type: 'text' as const,
            text: 'No .plan/ documents found. Run /linkraft plan first to generate STACK.md, SCHEMA.md, ARCHITECTURE.md, RISK_MATRIX.md, etc.',
          }],
        };
      }
      const filePath = writeHardeningMd(projectRoot, result.content);
      const { report } = result;
      const summary = [
        `HARDENING.md written to: ${filePath}`,
        '',
        `Total action items: ${report.totalItems}`,
        `  Must Fix:     ${report.mustFix.length}  (blocks launch)`,
        `  Should Fix:   ${report.shouldFix.length}  (improves quality)`,
        `  Nice to Have: ${report.niceToHave.length}  (polish)`,
        '',
        'Next: run plan_generate_claude_md (step 14) to fold the top items into CLAUDE.md.',
      ].join('\n');
      return {
        content: [{ type: 'text' as const, text: `${summary}\n\n---\n\n${result.content}` }],
      };
    },
  );

  server.tool(
    'plan_generate_claude_md',
    'Step 14 of /linkraft plan. Generates CLAUDE.md. Prefers distilling .plan/*.md docs when they exist (post-/linkraft plan); falls back to direct project scan otherwise. Surfaces the top items from HARDENING.md in the Known Issues section. If CLAUDE.md already exists, reports diff for merge review.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = generateAndWriteClaudeMd(projectRoot);
      const sourceNote = result.source === 'plan'
        ? 'Source: distilled from `.plan/*.md` documents.'
        : 'Source: direct project scan (no `.plan/` docs found — run /linkraft plan for richer output).';

      // Case 1: No CLAUDE.md existed, generated and written
      if (!result.existed) {
        return { content: [{ type: 'text' as const, text: `CLAUDE.md generated and written to: ${result.path}\n${sourceNote}\n\n---\n\n${result.content}` }] };
      }

      // Case 3: CLAUDE.md exists and is comprehensive, nothing to add
      if (!result.hasChanges) {
        return { content: [{ type: 'text' as const, text: `Existing CLAUDE.md is comprehensive. No new sections or updates detected.\n${sourceNote}` }] };
      }

      // Case 2: CLAUDE.md exists but is stale/incomplete, propose merge
      const lines = [
        'Existing CLAUDE.md found with gaps.',
        sourceNote,
        '',
        `New sections to add (${result.newSections.length}): ${result.newSections.join(', ')}`,
        `Sections with updates (${result.updatedSections.length}): ${result.updatedSections.join(', ')}`,
        '',
        'Proposed merged CLAUDE.md:',
        '---',
        result.mergedContent,
        '---',
        '',
        'To apply, call plan_write_claude_md with the merged content above.',
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
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
