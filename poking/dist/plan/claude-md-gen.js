"use strict";
// CLAUDE.md Generator: THE KEY FEATURE of Plan mode.
//
// Two paths:
//   1. PLAN-AWARE (preferred): reads .plan/*.md docs produced by the other
//      plan_* generators and distills them into a CLAUDE.md cheat sheet.
//      This runs when /linkraft plan has completed its pipeline before
//      calling plan_generate_claude_md.
//   2. DIRECT SCAN (fallback): if no .plan/ docs exist, scans the project
//      directly (package.json, file structure, source files) and produces
//      a CLAUDE.md from that. This is what runs when the user calls
//      /linkraft plan claude-md on its own.
//
// Both paths produce the same shape of markdown and go through the same
// diff/merge logic so existing CLAUDE.md files are respected.
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
exports.scanProject = scanProject;
exports.generateClaudeMd = generateClaudeMd;
exports.generateClaudeMdFromPlan = generateClaudeMdFromPlan;
exports.diffClaudeMd = diffClaudeMd;
exports.writeClaudeMd = writeClaudeMd;
exports.generateAndWriteClaudeMd = generateAndWriteClaudeMd;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stack_analyzer_js_1 = require("./stack-analyzer.js");
const plan_reader_js_1 = require("./plan-reader.js");
const hardening_gen_js_1 = require("./hardening-gen.js");
/**
 * Scans a project and builds the config needed to generate CLAUDE.md.
 */
function scanProject(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    let projectName = path.basename(projectRoot);
    let projectDescription = '';
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (typeof pkg['name'] === 'string')
                projectName = pkg['name'];
            if (typeof pkg['description'] === 'string')
                projectDescription = pkg['description'];
        }
        catch { }
    }
    const stack = (0, stack_analyzer_js_1.analyzeStack)(projectRoot);
    const conventions = (0, stack_analyzer_js_1.detectConventions)(projectRoot);
    const fileMap = generateFileMap(projectRoot);
    const commands = findCommands(projectRoot);
    const hardConstraints = detectHardConstraints(projectRoot, stack);
    const envVars = detectEnvVars(projectRoot);
    const knownPatterns = detectPatterns(projectRoot, stack);
    const neverTouch = detectNeverTouch(projectRoot);
    const directoryStructure = generateDirectoryStructure(projectRoot);
    return {
        projectName,
        projectDescription,
        stack,
        buildCommand: commands.build,
        testCommand: commands.test,
        lintCommand: commands.lint,
        devCommand: commands.dev,
        fileMap,
        directoryStructure,
        conventions,
        hardConstraints,
        architecture: generateArchitectureSummary(projectRoot, stack),
        envVars,
        knownPatterns,
        neverTouch,
    };
}
/**
 * Generates a complete CLAUDE.md from a scanned project config.
 */
function generateClaudeMd(config) {
    const s = [];
    s.push(`# ${config.projectName}`);
    if (config.projectDescription)
        s.push('', config.projectDescription);
    // Tech Stack
    s.push('', '## Tech Stack', '');
    const stackEntries = [
        ['Language', config.stack.language],
        ['Framework', config.stack.framework],
        ['Styling', config.stack.styling],
        ['Database', config.stack.database],
        ['Auth', config.stack.auth],
        ['Testing', config.stack.testing],
        ['Deployment', config.stack.deployment],
    ];
    for (const [label, value] of stackEntries) {
        if (value)
            s.push(`- ${label}: ${value}`);
    }
    // Commands
    s.push('', '## Commands', '');
    const cmds = [
        ['Dev', config.devCommand], ['Build', config.buildCommand],
        ['Test', config.testCommand], ['Lint', config.lintCommand],
    ];
    for (const [label, cmd] of cmds) {
        if (cmd)
            s.push(`- ${label}: \`${cmd}\``);
    }
    // Directory Structure
    if (config.directoryStructure) {
        s.push('', '## Directory Structure', '', '```', config.directoryStructure, '```');
    }
    // Key Files
    if (config.fileMap.length > 0) {
        s.push('', '## Key Files', '');
        for (const entry of config.fileMap)
            s.push(`- \`${entry.path}\`: ${entry.purpose}`);
    }
    // Coding Standards
    s.push('', '## Coding Standards', '');
    s.push(`- Indentation: ${config.conventions.indentation}`);
    s.push(`- Quotes: ${config.conventions.quotes}`);
    s.push(`- Semicolons: ${config.conventions.semicolons ? 'yes' : 'no'}`);
    s.push(`- Naming: ${config.conventions.namingStyle}`);
    s.push(`- Imports: ${config.conventions.importStyle}`);
    if (config.conventions.stateManagement)
        s.push(`- State management: ${config.conventions.stateManagement}`);
    // Hard Constraints
    if (config.hardConstraints.length > 0) {
        s.push('', '## Hard Constraints', '');
        for (const c of config.hardConstraints)
            s.push(`- ${c}`);
    }
    // Key Patterns
    if (config.knownPatterns.length > 0) {
        s.push('', '## Key Patterns', '');
        for (const p of config.knownPatterns)
            s.push(`- ${p}`);
    }
    // Architecture
    if (config.architecture)
        s.push('', '## Architecture', '', config.architecture);
    // Environment Variables
    if (config.envVars.length > 0) {
        s.push('', '## Environment Variables', '');
        s.push('| Variable | Purpose | Source |');
        s.push('|----------|---------|--------|');
        for (const v of config.envVars)
            s.push(`| ${v.name} | ${v.purpose} | ${v.file} |`);
    }
    // Never Touch
    if (config.neverTouch.length > 0) {
        s.push('', '## Never Touch', '');
        for (const n of config.neverTouch)
            s.push(`- ${n}`);
    }
    // Session Protocol
    s.push('', '## Session Protocol', '');
    s.push('1. Read this CLAUDE.md');
    s.push('2. Check git status and recent commits');
    if (config.testCommand)
        s.push(`3. Run tests: \`${config.testCommand}\``);
    s.push(`${config.testCommand ? '4' : '3'}. Ask what to work on`);
    return s.join('\n');
}
/**
 * Generates a CLAUDE.md by distilling the .plan/*.md documents.
 *
 * This is the preferred path when the full /linkraft plan pipeline has run
 * and produced the research + analysis outputs. The resulting CLAUDE.md is a
 * cheat sheet (~2000-3000 tokens) — not a copy of the plan docs. Sections are
 * intentionally short bullet lists so future Claude sessions can load the
 * whole file into context cheaply.
 *
 * Unknown or missing docs are tolerated — each section is emitted only when
 * the corresponding source is available and parseable.
 */
function generateClaudeMdFromPlan(projectRoot, docs) {
    const s = [];
    // Project name + description: derived from package.json, NOT the plan docs
    // (plan docs don't reliably carry the identifier we want in the h1).
    let projectName = path.basename(projectRoot);
    let projectDescription = '';
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (typeof pkg['name'] === 'string')
                projectName = pkg['name'];
            if (typeof pkg['description'] === 'string')
                projectDescription = pkg['description'];
        }
        catch { }
    }
    s.push(`# ${projectName}`);
    if (projectDescription)
        s.push('', projectDescription);
    s.push('', '> Synthesized from `.plan/` documents. Distillation, not duplication — read the source docs for full detail.');
    // ── Project Overview (from executive summary) ──────────────────────────
    if (docs.executiveSummary) {
        const overview = (0, plan_reader_js_1.extractLeadParagraph)(docs.executiveSummary, 600);
        const currentState = (0, plan_reader_js_1.extractSection)(docs.executiveSummary, 'Current State') ||
            (0, plan_reader_js_1.extractSection)(docs.executiveSummary, 'State') ||
            (0, plan_reader_js_1.extractSection)(docs.executiveSummary, 'What It Is');
        if (overview || currentState) {
            s.push('', '## Project Overview', '');
            if (overview)
                s.push(overview);
            if (currentState && currentState !== overview) {
                const paragraph = (0, plan_reader_js_1.extractLeadParagraph)(currentState, 500);
                if (paragraph)
                    s.push('', paragraph);
            }
        }
    }
    // ── Tech Stack (from STACK.md) ─────────────────────────────────────────
    if (docs.stack) {
        const stackSection = (0, plan_reader_js_1.extractSection)(docs.stack, 'Tech Stack') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Stack') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Detected Stack');
        if (stackSection) {
            const bullets = (0, plan_reader_js_1.extractBullets)(stackSection, 12);
            const rows = (0, plan_reader_js_1.extractTableRows)(stackSection, 12);
            if (rows.length > 0) {
                s.push('', '## Tech Stack', '', ...rows);
            }
            else if (bullets.length > 0) {
                s.push('', '## Tech Stack', '', ...bullets.map(b => `- ${b}`));
            }
        }
    }
    // ── Commands (from STACK.md or wherever) ───────────────────────────────
    const commandSource = docs.stack ?? '';
    const commands = (0, plan_reader_js_1.extractCommands)(commandSource, 8);
    if (commands.length > 0) {
        s.push('', '## Commands', '');
        for (const cmd of commands)
            s.push(`- \`${cmd}\``);
    }
    // ── Directory Structure (from STACK.md if provided) ────────────────────
    if (docs.stack) {
        const structure = (0, plan_reader_js_1.extractSection)(docs.stack, 'File Organization') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Directory Structure') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Project Structure');
        if (structure) {
            // Try to pull a code block first; fall back to bullet list
            const codeBlock = /```[\w-]*\n([\s\S]*?)```/m.exec(structure);
            if (codeBlock?.[1]) {
                s.push('', '## Directory Structure', '', '```', codeBlock[1].trim(), '```');
            }
            else {
                const bullets = (0, plan_reader_js_1.extractBullets)(structure, 15);
                if (bullets.length > 0) {
                    s.push('', '## Directory Structure', '', ...bullets.map(b => `- ${b}`));
                }
            }
        }
    }
    // ── Database (from SCHEMA.md, condensed) ───────────────────────────────
    if (docs.schema) {
        const lines = [];
        const tables = (0, plan_reader_js_1.extractSection)(docs.schema, 'Tables') ||
            (0, plan_reader_js_1.extractSection)(docs.schema, 'Schema') ||
            (0, plan_reader_js_1.extractSection)(docs.schema, 'Database Tables');
        if (tables) {
            const tableRows = (0, plan_reader_js_1.extractTableRows)(tables, 10);
            const tableBullets = (0, plan_reader_js_1.extractBullets)(tables, 10);
            if (tableRows.length > 0) {
                lines.push(...tableRows);
            }
            else if (tableBullets.length > 0) {
                lines.push(...tableBullets.map(b => `- ${b}`));
            }
        }
        const rls = (0, plan_reader_js_1.extractSection)(docs.schema, 'RLS');
        if (rls) {
            const rlsBullets = (0, plan_reader_js_1.extractBullets)(rls, 4);
            if (rlsBullets.length > 0) {
                lines.push('', '**Row Level Security:**');
                lines.push(...rlsBullets.map(b => `- ${b}`));
            }
        }
        const rpc = (0, plan_reader_js_1.extractSection)(docs.schema, 'RPC') ||
            (0, plan_reader_js_1.extractSection)(docs.schema, 'Functions') ||
            (0, plan_reader_js_1.extractSection)(docs.schema, 'Stored Procedures');
        if (rpc) {
            const rpcBullets = (0, plan_reader_js_1.extractBullets)(rpc, 6);
            if (rpcBullets.length > 0) {
                lines.push('', '**Key RPC functions:**');
                lines.push(...rpcBullets.map(b => `- ${b}`));
            }
        }
        if (lines.length > 0) {
            s.push('', '## Database', '', ...lines);
        }
    }
    // ── API Endpoints (from API_MAP.md, table format) ──────────────────────
    if (docs.apiMap) {
        const endpoints = (0, plan_reader_js_1.extractSection)(docs.apiMap, 'Endpoints') ||
            (0, plan_reader_js_1.extractSection)(docs.apiMap, 'Routes') ||
            (0, plan_reader_js_1.extractSection)(docs.apiMap, 'API');
        const source = endpoints || docs.apiMap;
        const tableRows = (0, plan_reader_js_1.extractTableRows)(source, 15);
        if (tableRows.length > 0) {
            s.push('', '## API Endpoints', '', ...tableRows);
        }
        else {
            const bullets = (0, plan_reader_js_1.extractBullets)(source, 15);
            if (bullets.length > 0) {
                s.push('', '## API Endpoints', '', ...bullets.map(b => `- ${b}`));
            }
        }
    }
    // ── Design System (from DESIGN_TOKENS.md) ──────────────────────────────
    if (docs.tokens) {
        const lines = [];
        const colors = (0, plan_reader_js_1.extractSection)(docs.tokens, 'Colors') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Color');
        if (colors) {
            const bullets = (0, plan_reader_js_1.extractBullets)(colors, 8);
            if (bullets.length > 0) {
                lines.push('**Colors:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        const typography = (0, plan_reader_js_1.extractSection)(docs.tokens, 'Typography') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Fonts') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Type');
        if (typography) {
            const bullets = (0, plan_reader_js_1.extractBullets)(typography, 6);
            if (bullets.length > 0) {
                if (lines.length > 0)
                    lines.push('');
                lines.push('**Typography:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        const banned = (0, plan_reader_js_1.extractSection)(docs.tokens, 'Banned') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Never') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Forbidden') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Anti-Patterns');
        if (banned) {
            const bullets = (0, plan_reader_js_1.extractBullets)(banned, 8);
            if (bullets.length > 0) {
                if (lines.length > 0)
                    lines.push('');
                lines.push('**Banned patterns:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        if (lines.length > 0) {
            s.push('', '## Design System', '', ...lines);
        }
    }
    // ── Architecture Notes (from ARCHITECTURE.md) ──────────────────────────
    if (docs.architecture) {
        const lines = [];
        const strengths = (0, plan_reader_js_1.extractSection)(docs.architecture, 'Strengths');
        if (strengths) {
            const bullets = (0, plan_reader_js_1.extractBullets)(strengths, 6);
            if (bullets.length > 0) {
                lines.push('**Strengths:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        const weaknesses = (0, plan_reader_js_1.extractSection)(docs.architecture, 'Weaknesses') ||
            (0, plan_reader_js_1.extractSection)(docs.architecture, 'Issues') ||
            (0, plan_reader_js_1.extractSection)(docs.architecture, 'Problems');
        if (weaknesses) {
            const bullets = (0, plan_reader_js_1.extractBullets)(weaknesses, 6);
            if (bullets.length > 0) {
                if (lines.length > 0)
                    lines.push('');
                lines.push('**Weaknesses:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        const flow = (0, plan_reader_js_1.extractSection)(docs.architecture, 'Request Flow') ||
            (0, plan_reader_js_1.extractSection)(docs.architecture, 'Data Flow') ||
            (0, plan_reader_js_1.extractSection)(docs.architecture, 'Architecture');
        if (flow && lines.length === 0) {
            // Only use generic architecture summary if we couldn't find strengths/weaknesses
            const paragraph = (0, plan_reader_js_1.extractLeadParagraph)(flow, 400);
            if (paragraph)
                lines.push(paragraph);
        }
        if (lines.length > 0) {
            s.push('', '## Architecture Notes', '', ...lines);
        }
    }
    // ── Critical Risks (from RISK_MATRIX.md, critical+high only) ───────────
    if (docs.riskMatrix) {
        const lines = [];
        const critical = (0, plan_reader_js_1.extractSection)(docs.riskMatrix, 'Critical');
        if (critical) {
            const bullets = (0, plan_reader_js_1.extractBullets)(critical, 6);
            if (bullets.length > 0) {
                lines.push('**Critical:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        const high = (0, plan_reader_js_1.extractSection)(docs.riskMatrix, 'High');
        if (high) {
            const bullets = (0, plan_reader_js_1.extractBullets)(high, 6);
            if (bullets.length > 0) {
                if (lines.length > 0)
                    lines.push('');
                lines.push('**High:**');
                lines.push(...bullets.map(b => `- ${b}`));
            }
        }
        if (lines.length > 0) {
            s.push('', '## Critical Risks', '', ...lines);
        }
    }
    // ── Hard Constraints (from conventions + banned patterns + git rules) ──
    const constraints = [];
    if (docs.stack) {
        const conv = (0, plan_reader_js_1.extractSection)(docs.stack, 'Conventions') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Coding Standards') ||
            (0, plan_reader_js_1.extractSection)(docs.stack, 'Style');
        if (conv) {
            constraints.push(...(0, plan_reader_js_1.extractBullets)(conv, 6));
        }
    }
    if (docs.tokens) {
        const banned = (0, plan_reader_js_1.extractSection)(docs.tokens, 'Banned') ||
            (0, plan_reader_js_1.extractSection)(docs.tokens, 'Never');
        if (banned) {
            const bullets = (0, plan_reader_js_1.extractBullets)(banned, 4);
            for (const b of bullets)
                if (!constraints.includes(b))
                    constraints.push(b);
        }
    }
    // Always include git/env hard rules
    if (fs.existsSync(path.join(projectRoot, '.env')) || fs.existsSync(path.join(projectRoot, '.env.local'))) {
        const envRule = 'Environment variables in use. Never hardcode secrets. Never commit .env files.';
        if (!constraints.includes(envRule))
            constraints.push(envRule);
    }
    if (fs.existsSync(path.join(projectRoot, 'supabase', 'migrations')) || fs.existsSync(path.join(projectRoot, 'prisma', 'migrations'))) {
        const migRule = 'Never edit existing migrations. Always create new ones.';
        if (!constraints.includes(migRule))
            constraints.push(migRule);
    }
    if (constraints.length > 0) {
        s.push('', '## Hard Constraints', '');
        for (const c of constraints.slice(0, 10))
            s.push(`- ${c}`);
    }
    // ── Known Issues + Priorities ──────────────────────────────────────────
    // Preferred source: HARDENING.md (step 13 output), top 10 items.
    // Fallback: FEATURES.md gaps section when HARDENING.md isn't present.
    const parsed = (0, hardening_gen_js_1.parseHardeningMd)(projectRoot);
    if (parsed.totalItems > 0) {
        const top = (0, hardening_gen_js_1.topHardeningItems)(parsed, 10);
        s.push('', '## Known Issues', '');
        s.push(`Top priorities from \`.plan/HARDENING.md\` (${parsed.mustFix.length} must-fix, ${parsed.shouldFix.length} should-fix, ${parsed.niceToHave.length} nice-to-have):`);
        s.push('');
        for (const item of top) {
            const badge = item.priority === 'must-fix' ? '**MUST**'
                : item.priority === 'should-fix' ? '**SHOULD**'
                    : 'nice';
            s.push(`- ${badge} \`${item.category}\` (${item.effort}): ${item.description}`);
        }
        s.push('');
        s.push('See `.plan/HARDENING.md` for the full prioritized list.');
    }
    else if (docs.features) {
        // Fallback: pull gaps from FEATURES.md when hardening hasn't run yet
        const gaps = (0, plan_reader_js_1.extractSection)(docs.features, 'Gaps') ||
            (0, plan_reader_js_1.extractSection)(docs.features, 'Missing') ||
            (0, plan_reader_js_1.extractSection)(docs.features, 'Known Issues') ||
            (0, plan_reader_js_1.extractSection)(docs.features, 'Incomplete');
        if (gaps) {
            const bullets = (0, plan_reader_js_1.extractBullets)(gaps, 8);
            if (bullets.length > 0) {
                s.push('', '## Known Issues', '');
                for (const b of bullets)
                    s.push(`- ${b}`);
            }
        }
    }
    // ── Session Protocol (always present, short) ───────────────────────────
    s.push('', '## Session Protocol', '');
    s.push('1. Read this CLAUDE.md');
    s.push('2. For deeper detail on any section, read the corresponding `.plan/*.md`');
    s.push('3. Check git status and recent commits');
    s.push('4. Ask what to work on');
    return s.join('\n');
}
/**
 * Compares generated CLAUDE.md with existing one.
 */
function diffClaudeMd(existing, generated) {
    const existingSections = parseSections(existing);
    const generatedSections = parseSections(generated);
    const newSections = [];
    const updatedSections = [];
    for (const [heading] of generatedSections) {
        const existingContent = existingSections.get(heading);
        if (!existingContent) {
            newSections.push(heading);
        }
        else {
            const genContent = generatedSections.get(heading);
            if (genContent && existingContent.trim() !== genContent.trim()) {
                updatedSections.push(heading);
            }
        }
    }
    let merged = existing;
    for (const heading of newSections) {
        const content = generatedSections.get(heading);
        if (content)
            merged += `\n\n## ${heading}\n${content}`;
    }
    return { newSections, updatedSections, mergedContent: merged };
}
/**
 * Writes CLAUDE.md to the project root.
 */
function writeClaudeMd(projectRoot, content) {
    const filePath = path.join(projectRoot, 'CLAUDE.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
/**
 * Full pipeline: generate CLAUDE.md and write it (or detect existing for merge).
 *
 * PRIMARY PATH: if `.plan/*.md` documents are present (produced by steps 1-12
 * of /linkraft plan), distill them into the CLAUDE.md. This gives the user a
 * cheat sheet synthesized from the full research + analysis pipeline.
 *
 * FALLBACK PATH: if no `.plan/` docs exist (e.g. user ran `plan claude-md`
 * standalone), scan the project directly and build CLAUDE.md from that.
 *
 * The return shape now includes a `source` field so callers can surface
 * whether the plan-aware or direct-scan path was used.
 */
function generateAndWriteClaudeMd(projectRoot) {
    const planDocs = (0, plan_reader_js_1.loadPlanDocs)(projectRoot);
    const usePlan = (0, plan_reader_js_1.hasPlanDocs)(planDocs);
    const generated = usePlan
        ? generateClaudeMdFromPlan(projectRoot, planDocs)
        : generateClaudeMd(scanProject(projectRoot));
    const source = usePlan ? 'plan' : 'scan';
    const existingPath = path.join(projectRoot, 'CLAUDE.md');
    if (fs.existsSync(existingPath)) {
        const existing = fs.readFileSync(existingPath, 'utf-8');
        const diff = diffClaudeMd(existing, generated);
        const hasChanges = diff.newSections.length > 0 || diff.updatedSections.length > 0;
        return {
            path: existingPath,
            content: generated,
            mergedContent: diff.mergedContent,
            existed: true,
            hasChanges,
            newSections: diff.newSections,
            updatedSections: diff.updatedSections,
            source,
        };
    }
    const filePath = writeClaudeMd(projectRoot, generated);
    return {
        path: filePath,
        content: generated,
        mergedContent: generated,
        existed: false,
        hasChanges: false,
        newSections: [],
        updatedSections: [],
        source,
    };
}
// --- Helpers ---
function findCommands(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return { build: null, test: null, lint: null, dev: null };
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg['scripts'];
        if (!scripts)
            return { build: null, test: null, lint: null, dev: null };
        const r = getRunner(projectRoot);
        return {
            build: scripts['build'] ? `${r} run build` : null,
            test: scripts['test'] && !scripts['test'].includes('no test specified') ? `${r} test` : null,
            lint: scripts['lint'] ? `${r} run lint` : null,
            dev: scripts['dev'] ? `${r} run dev` : (scripts['start'] ? `${r} start` : null),
        };
    }
    catch {
        return { build: null, test: null, lint: null, dev: null };
    }
}
function getRunner(projectRoot) {
    if (fs.existsSync(path.join(projectRoot, 'bun.lockb')))
        return 'bun';
    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml')))
        return 'pnpm';
    if (fs.existsSync(path.join(projectRoot, 'yarn.lock')))
        return 'yarn';
    return 'npm';
}
function generateFileMap(projectRoot) {
    const entries = [];
    const checks = [
        ['package.json', 'Dependencies, scripts, project metadata'],
        ['tsconfig.json', 'TypeScript configuration'],
        ['tailwind.config.ts', 'Tailwind CSS theme and plugins'],
        ['tailwind.config.js', 'Tailwind CSS theme and plugins'],
        ['next.config.js', 'Next.js configuration'],
        ['next.config.ts', 'Next.js configuration'],
        ['next.config.mjs', 'Next.js configuration'],
        ['vite.config.ts', 'Vite build configuration'],
        ['.env.example', 'Environment variable template (safe to read)'],
        ['.env.local', 'Local env vars (DO NOT commit, DO NOT read values)'],
        ['prisma/schema.prisma', 'Database schema (Prisma)'],
        ['drizzle.config.ts', 'Drizzle ORM configuration'],
        ['supabase/config.toml', 'Supabase project config'],
        ['src/app/layout.tsx', 'Root layout'],
        ['app/layout.tsx', 'Root layout'],
        ['src/middleware.ts', 'Middleware (auth, routing)'],
        ['middleware.ts', 'Middleware (auth, routing)'],
        ['app.json', 'Expo/React Native config'],
        ['eas.json', 'Expo Application Services'],
        ['Dockerfile', 'Container build'],
        ['vercel.json', 'Vercel deployment config'],
    ];
    for (const [file, purpose] of checks) {
        if (fs.existsSync(path.join(projectRoot, file)))
            entries.push({ path: file, purpose });
    }
    return entries;
}
function detectEnvVars(projectRoot) {
    const vars = [];
    const seen = new Set();
    for (const envFile of ['.env.example', '.env.template', '.env.local', '.env']) {
        const envPath = path.join(projectRoot, envFile);
        if (!fs.existsSync(envPath))
            continue;
        try {
            const content = fs.readFileSync(envPath, 'utf-8');
            for (const line of content.split('\n')) {
                const match = /^([A-Z][A-Z0-9_]+)\s*=/.exec(line.trim());
                if (match?.[1] && !seen.has(match[1])) {
                    seen.add(match[1]);
                    vars.push({
                        name: match[1],
                        purpose: guessEnvPurpose(match[1]),
                        file: envFile,
                        hasValue: envFile !== '.env.example' && envFile !== '.env.template',
                    });
                }
            }
        }
        catch { }
    }
    return vars;
}
function guessEnvPurpose(name) {
    const l = name.toLowerCase();
    if (l.includes('supabase') && l.includes('url'))
        return 'Supabase project URL';
    if (l.includes('supabase') && l.includes('anon'))
        return 'Supabase anonymous key';
    if (l.includes('supabase') && l.includes('service'))
        return 'Supabase service role key';
    if (l.includes('database') && l.includes('url'))
        return 'Database connection string';
    if (l.includes('next_public'))
        return 'Client-side env var';
    if (l.includes('stripe'))
        return 'Stripe payment';
    if (l.includes('openai') || l.includes('anthropic'))
        return 'AI/LLM API key';
    if (l.includes('auth') || l.includes('secret') || l.includes('jwt'))
        return 'Auth secret';
    if (l.includes('sentry'))
        return 'Error tracking';
    if (l.includes('resend') || l.includes('smtp'))
        return 'Email service';
    if (l.includes('clerk'))
        return 'Clerk auth';
    return 'Configuration';
}
function detectHardConstraints(projectRoot, stack) {
    const constraints = [];
    if (stack.styling === 'tailwind')
        constraints.push('Uses Tailwind CSS. Never write raw CSS, CSS modules, or inline styles.');
    if (stack.framework === 'nextjs')
        constraints.push('Next.js App Router. Server Components by default, "use client" only when needed.');
    if (fs.existsSync(path.join(projectRoot, '.env')) || fs.existsSync(path.join(projectRoot, '.env.local'))) {
        constraints.push('Environment variables in use. Never hardcode secrets.');
    }
    // Preserve constraints from existing CLAUDE.md
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
        try {
            const content = fs.readFileSync(claudeMdPath, 'utf-8');
            const section = /##\s*(?:Hard Constraints|What NOT To Do)\s*\n([\s\S]*?)(?=\n##|\n$)/i.exec(content);
            if (section?.[1]) {
                for (const line of section[1].split('\n')) {
                    const clean = line.replace(/^-\s*/, '').trim();
                    if (clean && !constraints.includes(clean))
                        constraints.push(clean);
                }
            }
        }
        catch { }
    }
    return constraints;
}
function detectPatterns(projectRoot, stack) {
    const patterns = [];
    if (stack.framework === 'nextjs') {
        if (fs.existsSync(path.join(projectRoot, 'src', 'app', 'api')) || fs.existsSync(path.join(projectRoot, 'app', 'api'))) {
            patterns.push('API routes use Route Handlers (app/api/)');
        }
        if (findFileWithPattern(projectRoot, /['"]use server['"]/)) {
            patterns.push('Server Actions in use. Prefer actions over API routes for mutations.');
        }
    }
    if (stack.database === 'supabase') {
        patterns.push('Supabase: use the client from lib/. Never create new clients inline.');
        if (fs.existsSync(path.join(projectRoot, 'supabase', 'functions'))) {
            patterns.push('Edge Functions in supabase/functions/. Deploy with supabase functions deploy.');
        }
    }
    if (stack.database === 'prisma') {
        patterns.push('Prisma: npx prisma generate after schema changes, prisma migrate dev for migrations.');
    }
    return patterns;
}
function detectNeverTouch(projectRoot) {
    const nt = [];
    const checks = [
        ['supabase/migrations/', 'Database migrations (never edit existing, create new)'],
        ['prisma/migrations/', 'Database migrations (never edit existing, create new)'],
        ['.env.local', 'Local secrets (never read values, never commit)'],
    ];
    for (const [pattern, reason] of checks) {
        if (fs.existsSync(path.join(projectRoot, pattern)))
            nt.push(`\`${pattern}\`: ${reason}`);
    }
    return nt;
}
function generateDirectoryStructure(projectRoot) {
    const lines = [];
    function walk(dir, prefix, depth) {
        if (depth >= 3)
            return;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
                .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== '.next')
                .sort((a, b) => (a.isDirectory() === b.isDirectory()) ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1);
            for (let i = 0; i < entries.length; i++) {
                const e = entries[i];
                const last = i === entries.length - 1;
                lines.push(`${prefix}${last ? '└── ' : '├── '}${e.name}${e.isDirectory() ? '/' : ''}`);
                if (e.isDirectory())
                    walk(path.join(dir, e.name), prefix + (last ? '    ' : '│   '), depth + 1);
            }
        }
        catch { }
    }
    lines.push(`${path.basename(projectRoot)}/`);
    walk(projectRoot, '', 0);
    return lines.join('\n');
}
function generateArchitectureSummary(projectRoot, stack) {
    const parts = [];
    const appDir = fs.existsSync(path.join(projectRoot, 'src', 'app')) ? 'src/app' :
        fs.existsSync(path.join(projectRoot, 'app')) ? 'app' : null;
    if (appDir)
        parts.push(`App Router (${appDir}/).`);
    else if (fs.existsSync(path.join(projectRoot, 'src', 'pages')) || fs.existsSync(path.join(projectRoot, 'pages'))) {
        parts.push('Pages Router.');
    }
    if (appDir && fs.existsSync(path.join(projectRoot, appDir, 'api')))
        parts.push(`API routes in ${appDir}/api/.`);
    if (fs.existsSync(path.join(projectRoot, 'supabase', 'functions')))
        parts.push('Supabase Edge Functions.');
    if (parts.length === 0)
        parts.push(`${stack.framework ?? 'Standard'} project structure.`);
    return parts.join(' ');
}
function findFileWithPattern(projectRoot, pattern) {
    for (const d of ['src', 'app', 'lib'].map(d => path.join(projectRoot, d))) {
        if (!fs.existsSync(d))
            continue;
        try {
            for (const f of fs.readdirSync(d).filter(f => /\.(ts|tsx|js|jsx)$/.test(f)).slice(0, 10)) {
                if (pattern.test(fs.readFileSync(path.join(d, f), 'utf-8')))
                    return true;
            }
        }
        catch { }
    }
    return false;
}
function parseSections(markdown) {
    const sections = new Map();
    for (const part of markdown.split(/^## /m).slice(1)) {
        const nl = part.indexOf('\n');
        if (nl === -1)
            continue;
        sections.set(part.slice(0, nl).trim(), part.slice(nl + 1).trim());
    }
    return sections;
}
//# sourceMappingURL=claude-md-gen.js.map