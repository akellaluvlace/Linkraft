"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlanTools = registerPlanTools;
const zod_1 = require("zod");
const stack_analyzer_js_1 = require("../../plan/stack-analyzer.js");
const claude_md_gen_js_1 = require("../../plan/claude-md-gen.js");
const schema_extractor_js_1 = require("../../plan/schema-extractor.js");
const api_mapper_js_1 = require("../../plan/api-mapper.js");
const token_extractor_js_1 = require("../../plan/token-extractor.js");
const feature_detector_js_1 = require("../../plan/feature-detector.js");
const competitors_gen_js_1 = require("../../plan/competitors-gen.js");
const architecture_gen_js_1 = require("../../plan/architecture-gen.js");
const executive_summary_gen_js_1 = require("../../plan/executive-summary-gen.js");
const risk_matrix_gen_js_1 = require("../../plan/risk-matrix-gen.js");
const dependency_graph_gen_js_1 = require("../../plan/dependency-graph-gen.js");
const monetization_gen_js_1 = require("../../plan/monetization-gen.js");
const aso_gen_js_1 = require("../../plan/aso-gen.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const projectRootSchema = { projectRoot: zod_1.z.string().describe('Project root directory') };
const twoModeSchema = {
    projectRoot: zod_1.z.string().describe('Project root directory'),
    content: zod_1.z.string().optional().describe('Completed analysis to write. If omitted, returns local context and template.'),
};
function registerPlanTools(server) {
    server.tool('plan_analyze_stack', 'Detects tech stack, coding conventions, and project features.', projectRootSchema, async ({ projectRoot }) => {
        const stack = (0, stack_analyzer_js_1.analyzeStack)(projectRoot);
        const conventions = (0, stack_analyzer_js_1.detectConventions)(projectRoot);
        const features = (0, feature_detector_js_1.detectFeatures)(projectRoot);
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
        if (!fs.existsSync(planDir))
            fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(path.join(planDir, 'STACK.md'), md, 'utf-8');
        return { content: [{ type: 'text', text: `Written to .plan/STACK.md\n\n${md}` }] };
    });
    server.tool('plan_generate_claude_md', 'Generates a complete CLAUDE.md from scanning the project. If one exists, reports diff for merge review.', projectRootSchema, async ({ projectRoot }) => {
        const result = (0, claude_md_gen_js_1.generateAndWriteClaudeMd)(projectRoot);
        // Case 1: No CLAUDE.md existed, generated and written
        if (!result.existed) {
            return { content: [{ type: 'text', text: `CLAUDE.md generated and written to: ${result.path}\n\n---\n\n${result.content}` }] };
        }
        // Case 3: CLAUDE.md exists and is comprehensive, nothing to add
        if (!result.hasChanges) {
            return { content: [{ type: 'text', text: 'Existing CLAUDE.md is comprehensive. No new sections or updates detected from scan. Skipping.' }] };
        }
        // Case 2: CLAUDE.md exists but is stale/incomplete, propose merge
        const lines = [
            'Existing CLAUDE.md found with gaps.',
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
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('plan_write_claude_md', 'Writes the provided CLAUDE.md content to the project root. Use after reviewing the generated content.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        content: zod_1.z.string().describe('CLAUDE.md content to write'),
    }, async ({ projectRoot, content }) => {
        const filePath = (0, claude_md_gen_js_1.writeClaudeMd)(projectRoot, content);
        return { content: [{ type: 'text', text: `Written to: ${filePath}` }] };
    });
    server.tool('plan_preview_claude_md', 'Previews generated CLAUDE.md without writing it.', projectRootSchema, async ({ projectRoot }) => {
        const config = (0, claude_md_gen_js_1.scanProject)(projectRoot);
        const content = (0, claude_md_gen_js_1.generateClaudeMd)(config);
        return { content: [{ type: 'text', text: `Preview:\n\n${content}` }] };
    });
    server.tool('plan_schema', 'Extracts database schema from migrations, Prisma, or Drizzle. Returns SCHEMA.md content.', projectRootSchema, async ({ projectRoot }) => {
        const result = (0, schema_extractor_js_1.extractSchema)(projectRoot);
        if (!result) {
            return { content: [{ type: 'text', text: 'No database schema detected. Checked: prisma/, supabase/migrations/, drizzle/, migrations/' }] };
        }
        const md = (0, schema_extractor_js_1.formatSchema)(result.tables, result.source);
        const planDir = path.join(projectRoot, '.plan');
        if (!fs.existsSync(planDir))
            fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(path.join(planDir, 'SCHEMA.md'), md, 'utf-8');
        return { content: [{ type: 'text', text: `Written to .plan/SCHEMA.md\n\n${md}` }] };
    });
    server.tool('plan_api_map', 'Maps all API endpoints, Edge Functions, and server actions. Returns API_MAP.md.', projectRootSchema, async ({ projectRoot }) => {
        const endpoints = (0, api_mapper_js_1.mapApiEndpoints)(projectRoot);
        const md = (0, api_mapper_js_1.formatApiMap)(endpoints);
        const planDir = path.join(projectRoot, '.plan');
        if (!fs.existsSync(planDir))
            fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(path.join(planDir, 'API_MAP.md'), md, 'utf-8');
        return { content: [{ type: 'text', text: `Written to .plan/API_MAP.md (${endpoints.length} endpoints)\n\n${md}` }] };
    });
    server.tool('plan_tokens', 'Extracts design tokens from tailwind.config or CSS variables. Returns DESIGN_TOKENS.md.', projectRootSchema, async ({ projectRoot }) => {
        const tokens = (0, token_extractor_js_1.extractDesignTokens)(projectRoot);
        if (!tokens) {
            return { content: [{ type: 'text', text: 'No design system detected. Checked: tailwind.config, globals.css' }] };
        }
        const md = (0, token_extractor_js_1.formatDesignTokens)(tokens);
        const planDir = path.join(projectRoot, '.plan');
        if (!fs.existsSync(planDir))
            fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(path.join(planDir, 'DESIGN_TOKENS.md'), md, 'utf-8');
        return { content: [{ type: 'text', text: `Written to .plan/DESIGN_TOKENS.md\n\n${md}` }] };
    });
    server.tool('plan_features', 'Detects project features: database, API routes, mobile app, design system, product vs tool.', projectRootSchema, async ({ projectRoot }) => {
        const features = (0, feature_detector_js_1.detectFeatures)(projectRoot);
        const always = ['STACK', 'FEATURES', 'CLAUDE.md', 'COMPETITORS', 'ARCHITECTURE', 'EXECUTIVE_SUMMARY', 'RISK_MATRIX', 'DEPENDENCY_GRAPH'];
        const conditional = [];
        if (features.hasDatabase)
            conditional.push('SCHEMA');
        if (features.hasApiRoutes)
            conditional.push('API_MAP');
        if (features.hasDesignSystem)
            conditional.push('DESIGN_TOKENS');
        if (features.isProduct)
            conditional.push('MONETIZATION');
        if (features.hasMobileApp)
            conditional.push('ASO_KEYWORDS');
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
        if (!fs.existsSync(planDir))
            fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(path.join(planDir, 'FEATURES.md'), md, 'utf-8');
        return {
            content: [{
                    type: 'text',
                    text: `Written to .plan/FEATURES.md\n\n${md}`,
                }],
        };
    });
    // --- New analytical tools ---
    server.tool('plan_competitors', 'Competitive analysis. Without content: returns project context and template for web_search research. With content: writes COMPETITORS.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, competitors_gen_js_1.writeCompetitors)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, competitors_gen_js_1.collectCompetitorContext)(projectRoot);
        const template = (0, competitors_gen_js_1.generateCompetitorTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_architecture', 'Architecture review. Without content: returns codebase analysis and template. With content: writes ARCHITECTURE.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, architecture_gen_js_1.writeArchitecture)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, architecture_gen_js_1.collectArchitectureContext)(projectRoot);
        const template = (0, architecture_gen_js_1.generateArchitectureTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_executive_summary', 'Executive summary. Without content: reads all .plan/ files and returns synthesis template. With content: writes EXECUTIVE_SUMMARY.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, executive_summary_gen_js_1.writeExecutiveSummary)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, executive_summary_gen_js_1.collectExecutiveSummaryContext)(projectRoot);
        const template = (0, executive_summary_gen_js_1.generateExecutiveSummaryTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_risk_matrix', 'Risk matrix. Without content: extracts risks from architecture and competitor analysis. With content: writes RISK_MATRIX.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, risk_matrix_gen_js_1.writeRiskMatrix)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, risk_matrix_gen_js_1.collectRiskMatrixContext)(projectRoot);
        const template = (0, risk_matrix_gen_js_1.generateRiskMatrixTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_dependency_graph', 'Dependency graph. Without content: extracts action items from executive summary. With content: writes DEPENDENCY_GRAPH.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, dependency_graph_gen_js_1.writeDependencyGraph)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, dependency_graph_gen_js_1.collectDependencyGraphContext)(projectRoot);
        const template = (0, dependency_graph_gen_js_1.generateDependencyGraphTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_monetization', 'Monetization analysis (products only). Without content: returns pricing context and template. With content: writes MONETIZATION.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, monetization_gen_js_1.writeMonetization)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, monetization_gen_js_1.collectMonetizationContext)(projectRoot);
        const template = (0, monetization_gen_js_1.generateMonetizationTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
    server.tool('plan_aso', 'App Store Optimization keywords (mobile apps only). Without content: returns app context and template. With content: writes ASO_KEYWORDS.md.', twoModeSchema, async ({ projectRoot, content }) => {
        if (content) {
            const filePath = (0, aso_gen_js_1.writeAso)(projectRoot, content);
            return { content: [{ type: 'text', text: `Written to ${filePath}` }] };
        }
        const ctx = (0, aso_gen_js_1.collectAsoContext)(projectRoot);
        const template = (0, aso_gen_js_1.generateAsoTemplate)(ctx);
        return { content: [{ type: 'text', text: template }] };
    });
}
//# sourceMappingURL=plan-tools.js.map