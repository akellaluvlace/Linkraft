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

import * as fs from 'fs';
import * as path from 'path';
import type { ClaudeMdConfig, FileMapEntry, EnvVar } from './types.js';
import { analyzeStack, detectConventions } from './stack-analyzer.js';
import {
  loadPlanDocs,
  hasPlanDocs,
  extractSection,
  extractBullets,
  extractTableRows,
  extractLeadParagraph,
  extractCommands,
  type PlanDocs,
} from './plan-reader.js';

/**
 * Scans a project and builds the config needed to generate CLAUDE.md.
 */
export function scanProject(projectRoot: string): ClaudeMdConfig {
  const pkgPath = path.join(projectRoot, 'package.json');
  let projectName = path.basename(projectRoot);
  let projectDescription = '';

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      if (typeof pkg['name'] === 'string') projectName = pkg['name'];
      if (typeof pkg['description'] === 'string') projectDescription = pkg['description'];
    } catch {}
  }

  const stack = analyzeStack(projectRoot);
  const conventions = detectConventions(projectRoot);
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
export function generateClaudeMd(config: ClaudeMdConfig): string {
  const s: string[] = [];

  s.push(`# ${config.projectName}`);
  if (config.projectDescription) s.push('', config.projectDescription);

  // Tech Stack
  s.push('', '## Tech Stack', '');
  const stackEntries: Array<[string, string | null]> = [
    ['Language', config.stack.language],
    ['Framework', config.stack.framework],
    ['Styling', config.stack.styling],
    ['Database', config.stack.database],
    ['Auth', config.stack.auth],
    ['Testing', config.stack.testing],
    ['Deployment', config.stack.deployment],
  ];
  for (const [label, value] of stackEntries) {
    if (value) s.push(`- ${label}: ${value}`);
  }

  // Commands
  s.push('', '## Commands', '');
  const cmds: Array<[string, string | null]> = [
    ['Dev', config.devCommand], ['Build', config.buildCommand],
    ['Test', config.testCommand], ['Lint', config.lintCommand],
  ];
  for (const [label, cmd] of cmds) {
    if (cmd) s.push(`- ${label}: \`${cmd}\``);
  }

  // Directory Structure
  if (config.directoryStructure) {
    s.push('', '## Directory Structure', '', '```', config.directoryStructure, '```');
  }

  // Key Files
  if (config.fileMap.length > 0) {
    s.push('', '## Key Files', '');
    for (const entry of config.fileMap) s.push(`- \`${entry.path}\`: ${entry.purpose}`);
  }

  // Coding Standards
  s.push('', '## Coding Standards', '');
  s.push(`- Indentation: ${config.conventions.indentation}`);
  s.push(`- Quotes: ${config.conventions.quotes}`);
  s.push(`- Semicolons: ${config.conventions.semicolons ? 'yes' : 'no'}`);
  s.push(`- Naming: ${config.conventions.namingStyle}`);
  s.push(`- Imports: ${config.conventions.importStyle}`);
  if (config.conventions.stateManagement) s.push(`- State management: ${config.conventions.stateManagement}`);

  // Hard Constraints
  if (config.hardConstraints.length > 0) {
    s.push('', '## Hard Constraints', '');
    for (const c of config.hardConstraints) s.push(`- ${c}`);
  }

  // Key Patterns
  if (config.knownPatterns.length > 0) {
    s.push('', '## Key Patterns', '');
    for (const p of config.knownPatterns) s.push(`- ${p}`);
  }

  // Architecture
  if (config.architecture) s.push('', '## Architecture', '', config.architecture);

  // Environment Variables
  if (config.envVars.length > 0) {
    s.push('', '## Environment Variables', '');
    s.push('| Variable | Purpose | Source |');
    s.push('|----------|---------|--------|');
    for (const v of config.envVars) s.push(`| ${v.name} | ${v.purpose} | ${v.file} |`);
  }

  // Never Touch
  if (config.neverTouch.length > 0) {
    s.push('', '## Never Touch', '');
    for (const n of config.neverTouch) s.push(`- ${n}`);
  }

  // Session Protocol
  s.push('', '## Session Protocol', '');
  s.push('1. Read this CLAUDE.md');
  s.push('2. Check git status and recent commits');
  if (config.testCommand) s.push(`3. Run tests: \`${config.testCommand}\``);
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
export function generateClaudeMdFromPlan(projectRoot: string, docs: PlanDocs): string {
  const s: string[] = [];

  // Project name + description: derived from package.json, NOT the plan docs
  // (plan docs don't reliably carry the identifier we want in the h1).
  let projectName = path.basename(projectRoot);
  let projectDescription = '';
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      if (typeof pkg['name'] === 'string') projectName = pkg['name'];
      if (typeof pkg['description'] === 'string') projectDescription = pkg['description'];
    } catch {}
  }

  s.push(`# ${projectName}`);
  if (projectDescription) s.push('', projectDescription);
  s.push('', '> Synthesized from `.plan/` documents. Distillation, not duplication — read the source docs for full detail.');

  // ── Project Overview (from executive summary) ──────────────────────────
  if (docs.executiveSummary) {
    const overview = extractLeadParagraph(docs.executiveSummary, 600);
    const currentState =
      extractSection(docs.executiveSummary, 'Current State') ||
      extractSection(docs.executiveSummary, 'State') ||
      extractSection(docs.executiveSummary, 'What It Is');
    if (overview || currentState) {
      s.push('', '## Project Overview', '');
      if (overview) s.push(overview);
      if (currentState && currentState !== overview) {
        const paragraph = extractLeadParagraph(currentState, 500);
        if (paragraph) s.push('', paragraph);
      }
    }
  }

  // ── Tech Stack (from STACK.md) ─────────────────────────────────────────
  if (docs.stack) {
    const stackSection =
      extractSection(docs.stack, 'Tech Stack') ||
      extractSection(docs.stack, 'Stack') ||
      extractSection(docs.stack, 'Detected Stack');
    if (stackSection) {
      const bullets = extractBullets(stackSection, 12);
      const rows = extractTableRows(stackSection, 12);
      if (rows.length > 0) {
        s.push('', '## Tech Stack', '', ...rows);
      } else if (bullets.length > 0) {
        s.push('', '## Tech Stack', '', ...bullets.map(b => `- ${b}`));
      }
    }
  }

  // ── Commands (from STACK.md or wherever) ───────────────────────────────
  const commandSource = docs.stack ?? '';
  const commands = extractCommands(commandSource, 8);
  if (commands.length > 0) {
    s.push('', '## Commands', '');
    for (const cmd of commands) s.push(`- \`${cmd}\``);
  }

  // ── Directory Structure (from STACK.md if provided) ────────────────────
  if (docs.stack) {
    const structure =
      extractSection(docs.stack, 'File Organization') ||
      extractSection(docs.stack, 'Directory Structure') ||
      extractSection(docs.stack, 'Project Structure');
    if (structure) {
      // Try to pull a code block first; fall back to bullet list
      const codeBlock = /```[\w-]*\n([\s\S]*?)```/m.exec(structure);
      if (codeBlock?.[1]) {
        s.push('', '## Directory Structure', '', '```', codeBlock[1].trim(), '```');
      } else {
        const bullets = extractBullets(structure, 15);
        if (bullets.length > 0) {
          s.push('', '## Directory Structure', '', ...bullets.map(b => `- ${b}`));
        }
      }
    }
  }

  // ── Database (from SCHEMA.md, condensed) ───────────────────────────────
  if (docs.schema) {
    const lines: string[] = [];

    const tables =
      extractSection(docs.schema, 'Tables') ||
      extractSection(docs.schema, 'Schema') ||
      extractSection(docs.schema, 'Database Tables');
    if (tables) {
      const tableRows = extractTableRows(tables, 10);
      const tableBullets = extractBullets(tables, 10);
      if (tableRows.length > 0) {
        lines.push(...tableRows);
      } else if (tableBullets.length > 0) {
        lines.push(...tableBullets.map(b => `- ${b}`));
      }
    }

    const rls = extractSection(docs.schema, 'RLS');
    if (rls) {
      const rlsBullets = extractBullets(rls, 4);
      if (rlsBullets.length > 0) {
        lines.push('', '**Row Level Security:**');
        lines.push(...rlsBullets.map(b => `- ${b}`));
      }
    }

    const rpc =
      extractSection(docs.schema, 'RPC') ||
      extractSection(docs.schema, 'Functions') ||
      extractSection(docs.schema, 'Stored Procedures');
    if (rpc) {
      const rpcBullets = extractBullets(rpc, 6);
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
    const endpoints =
      extractSection(docs.apiMap, 'Endpoints') ||
      extractSection(docs.apiMap, 'Routes') ||
      extractSection(docs.apiMap, 'API');
    const source = endpoints || docs.apiMap;
    const tableRows = extractTableRows(source, 15);
    if (tableRows.length > 0) {
      s.push('', '## API Endpoints', '', ...tableRows);
    } else {
      const bullets = extractBullets(source, 15);
      if (bullets.length > 0) {
        s.push('', '## API Endpoints', '', ...bullets.map(b => `- ${b}`));
      }
    }
  }

  // ── Design System (from DESIGN_TOKENS.md) ──────────────────────────────
  if (docs.tokens) {
    const lines: string[] = [];

    const colors =
      extractSection(docs.tokens, 'Colors') ||
      extractSection(docs.tokens, 'Color');
    if (colors) {
      const bullets = extractBullets(colors, 8);
      if (bullets.length > 0) {
        lines.push('**Colors:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    const typography =
      extractSection(docs.tokens, 'Typography') ||
      extractSection(docs.tokens, 'Fonts') ||
      extractSection(docs.tokens, 'Type');
    if (typography) {
      const bullets = extractBullets(typography, 6);
      if (bullets.length > 0) {
        if (lines.length > 0) lines.push('');
        lines.push('**Typography:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    const banned =
      extractSection(docs.tokens, 'Banned') ||
      extractSection(docs.tokens, 'Never') ||
      extractSection(docs.tokens, 'Forbidden') ||
      extractSection(docs.tokens, 'Anti-Patterns');
    if (banned) {
      const bullets = extractBullets(banned, 8);
      if (bullets.length > 0) {
        if (lines.length > 0) lines.push('');
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
    const lines: string[] = [];

    const strengths = extractSection(docs.architecture, 'Strengths');
    if (strengths) {
      const bullets = extractBullets(strengths, 6);
      if (bullets.length > 0) {
        lines.push('**Strengths:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    const weaknesses =
      extractSection(docs.architecture, 'Weaknesses') ||
      extractSection(docs.architecture, 'Issues') ||
      extractSection(docs.architecture, 'Problems');
    if (weaknesses) {
      const bullets = extractBullets(weaknesses, 6);
      if (bullets.length > 0) {
        if (lines.length > 0) lines.push('');
        lines.push('**Weaknesses:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    const flow =
      extractSection(docs.architecture, 'Request Flow') ||
      extractSection(docs.architecture, 'Data Flow') ||
      extractSection(docs.architecture, 'Architecture');
    if (flow && lines.length === 0) {
      // Only use generic architecture summary if we couldn't find strengths/weaknesses
      const paragraph = extractLeadParagraph(flow, 400);
      if (paragraph) lines.push(paragraph);
    }

    if (lines.length > 0) {
      s.push('', '## Architecture Notes', '', ...lines);
    }
  }

  // ── Critical Risks (from RISK_MATRIX.md, critical+high only) ───────────
  if (docs.riskMatrix) {
    const lines: string[] = [];

    const critical = extractSection(docs.riskMatrix, 'Critical');
    if (critical) {
      const bullets = extractBullets(critical, 6);
      if (bullets.length > 0) {
        lines.push('**Critical:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    const high = extractSection(docs.riskMatrix, 'High');
    if (high) {
      const bullets = extractBullets(high, 6);
      if (bullets.length > 0) {
        if (lines.length > 0) lines.push('');
        lines.push('**High:**');
        lines.push(...bullets.map(b => `- ${b}`));
      }
    }

    if (lines.length > 0) {
      s.push('', '## Critical Risks', '', ...lines);
    }
  }

  // ── Hard Constraints (from conventions + banned patterns + git rules) ──
  const constraints: string[] = [];
  if (docs.stack) {
    const conv =
      extractSection(docs.stack, 'Conventions') ||
      extractSection(docs.stack, 'Coding Standards') ||
      extractSection(docs.stack, 'Style');
    if (conv) {
      constraints.push(...extractBullets(conv, 6));
    }
  }
  if (docs.tokens) {
    const banned =
      extractSection(docs.tokens, 'Banned') ||
      extractSection(docs.tokens, 'Never');
    if (banned) {
      const bullets = extractBullets(banned, 4);
      for (const b of bullets) if (!constraints.includes(b)) constraints.push(b);
    }
  }
  // Always include git/env hard rules
  if (fs.existsSync(path.join(projectRoot, '.env')) || fs.existsSync(path.join(projectRoot, '.env.local'))) {
    const envRule = 'Environment variables in use. Never hardcode secrets. Never commit .env files.';
    if (!constraints.includes(envRule)) constraints.push(envRule);
  }
  if (fs.existsSync(path.join(projectRoot, 'supabase', 'migrations')) || fs.existsSync(path.join(projectRoot, 'prisma', 'migrations'))) {
    const migRule = 'Never edit existing migrations. Always create new ones.';
    if (!constraints.includes(migRule)) constraints.push(migRule);
  }
  if (constraints.length > 0) {
    s.push('', '## Hard Constraints', '');
    for (const c of constraints.slice(0, 10)) s.push(`- ${c}`);
  }

  // ── Known Issues (from FEATURES.md gaps section) ───────────────────────
  if (docs.features) {
    const gaps =
      extractSection(docs.features, 'Gaps') ||
      extractSection(docs.features, 'Missing') ||
      extractSection(docs.features, 'Known Issues') ||
      extractSection(docs.features, 'Incomplete');
    if (gaps) {
      const bullets = extractBullets(gaps, 8);
      if (bullets.length > 0) {
        s.push('', '## Known Issues', '');
        for (const b of bullets) s.push(`- ${b}`);
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
export function diffClaudeMd(existing: string, generated: string): {
  newSections: string[];
  updatedSections: string[];
  mergedContent: string;
} {
  const existingSections = parseSections(existing);
  const generatedSections = parseSections(generated);

  const newSections: string[] = [];
  const updatedSections: string[] = [];

  for (const [heading] of generatedSections) {
    const existingContent = existingSections.get(heading);
    if (!existingContent) {
      newSections.push(heading);
    } else {
      const genContent = generatedSections.get(heading);
      if (genContent && existingContent.trim() !== genContent.trim()) {
        updatedSections.push(heading);
      }
    }
  }

  let merged = existing;
  for (const heading of newSections) {
    const content = generatedSections.get(heading);
    if (content) merged += `\n\n## ${heading}\n${content}`;
  }

  return { newSections, updatedSections, mergedContent: merged };
}

/**
 * Writes CLAUDE.md to the project root.
 */
export function writeClaudeMd(projectRoot: string, content: string): string {
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
export function generateAndWriteClaudeMd(projectRoot: string): {
  path: string;
  content: string;
  mergedContent: string;
  existed: boolean;
  hasChanges: boolean;
  newSections: string[];
  updatedSections: string[];
  source: 'plan' | 'scan';
} {
  const planDocs = loadPlanDocs(projectRoot);
  const usePlan = hasPlanDocs(planDocs);

  const generated = usePlan
    ? generateClaudeMdFromPlan(projectRoot, planDocs)
    : generateClaudeMd(scanProject(projectRoot));
  const source: 'plan' | 'scan' = usePlan ? 'plan' : 'scan';

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

function findCommands(projectRoot: string): { build: string | null; test: string | null; lint: string | null; dev: string | null } {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return { build: null, test: null, lint: null, dev: null };
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (!scripts) return { build: null, test: null, lint: null, dev: null };
    const r = getRunner(projectRoot);
    return {
      build: scripts['build'] ? `${r} run build` : null,
      test: scripts['test'] && !scripts['test'].includes('no test specified') ? `${r} test` : null,
      lint: scripts['lint'] ? `${r} run lint` : null,
      dev: scripts['dev'] ? `${r} run dev` : (scripts['start'] ? `${r} start` : null),
    };
  } catch { return { build: null, test: null, lint: null, dev: null }; }
}

function getRunner(projectRoot: string): string {
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function generateFileMap(projectRoot: string): FileMapEntry[] {
  const entries: FileMapEntry[] = [];
  const checks: Array<[string, string]> = [
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
    if (fs.existsSync(path.join(projectRoot, file))) entries.push({ path: file, purpose });
  }
  return entries;
}

function detectEnvVars(projectRoot: string): EnvVar[] {
  const vars: EnvVar[] = [];
  const seen = new Set<string>();
  for (const envFile of ['.env.example', '.env.template', '.env.local', '.env']) {
    const envPath = path.join(projectRoot, envFile);
    if (!fs.existsSync(envPath)) continue;
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
    } catch {}
  }
  return vars;
}

function guessEnvPurpose(name: string): string {
  const l = name.toLowerCase();
  if (l.includes('supabase') && l.includes('url')) return 'Supabase project URL';
  if (l.includes('supabase') && l.includes('anon')) return 'Supabase anonymous key';
  if (l.includes('supabase') && l.includes('service')) return 'Supabase service role key';
  if (l.includes('database') && l.includes('url')) return 'Database connection string';
  if (l.includes('next_public')) return 'Client-side env var';
  if (l.includes('stripe')) return 'Stripe payment';
  if (l.includes('openai') || l.includes('anthropic')) return 'AI/LLM API key';
  if (l.includes('auth') || l.includes('secret') || l.includes('jwt')) return 'Auth secret';
  if (l.includes('sentry')) return 'Error tracking';
  if (l.includes('resend') || l.includes('smtp')) return 'Email service';
  if (l.includes('clerk')) return 'Clerk auth';
  return 'Configuration';
}

function detectHardConstraints(projectRoot: string, stack: { styling: string | null; framework: string | null }): string[] {
  const constraints: string[] = [];
  if (stack.styling === 'tailwind') constraints.push('Uses Tailwind CSS. Never write raw CSS, CSS modules, or inline styles.');
  if (stack.framework === 'nextjs') constraints.push('Next.js App Router. Server Components by default, "use client" only when needed.');
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
          if (clean && !constraints.includes(clean)) constraints.push(clean);
        }
      }
    } catch {}
  }
  return constraints;
}

function detectPatterns(projectRoot: string, stack: { framework: string | null; database: string | null }): string[] {
  const patterns: string[] = [];
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

function detectNeverTouch(projectRoot: string): string[] {
  const nt: string[] = [];
  const checks: Array<[string, string]> = [
    ['supabase/migrations/', 'Database migrations (never edit existing, create new)'],
    ['prisma/migrations/', 'Database migrations (never edit existing, create new)'],
    ['.env.local', 'Local secrets (never read values, never commit)'],
  ];
  for (const [pattern, reason] of checks) {
    if (fs.existsSync(path.join(projectRoot, pattern))) nt.push(`\`${pattern}\`: ${reason}`);
  }
  return nt;
}

function generateDirectoryStructure(projectRoot: string): string {
  const lines: string[] = [];
  function walk(dir: string, prefix: string, depth: number): void {
    if (depth >= 3) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== '.next')
        .sort((a, b) => (a.isDirectory() === b.isDirectory()) ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1);
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]!;
        const last = i === entries.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${e.name}${e.isDirectory() ? '/' : ''}`);
        if (e.isDirectory()) walk(path.join(dir, e.name), prefix + (last ? '    ' : '│   '), depth + 1);
      }
    } catch {}
  }
  lines.push(`${path.basename(projectRoot)}/`);
  walk(projectRoot, '', 0);
  return lines.join('\n');
}

function generateArchitectureSummary(projectRoot: string, stack: { framework: string | null }): string {
  const parts: string[] = [];
  const appDir = fs.existsSync(path.join(projectRoot, 'src', 'app')) ? 'src/app' :
                 fs.existsSync(path.join(projectRoot, 'app')) ? 'app' : null;
  if (appDir) parts.push(`App Router (${appDir}/).`);
  else if (fs.existsSync(path.join(projectRoot, 'src', 'pages')) || fs.existsSync(path.join(projectRoot, 'pages'))) {
    parts.push('Pages Router.');
  }
  if (appDir && fs.existsSync(path.join(projectRoot, appDir, 'api'))) parts.push(`API routes in ${appDir}/api/.`);
  if (fs.existsSync(path.join(projectRoot, 'supabase', 'functions'))) parts.push('Supabase Edge Functions.');
  if (parts.length === 0) parts.push(`${stack.framework ?? 'Standard'} project structure.`);
  return parts.join(' ');
}

function findFileWithPattern(projectRoot: string, pattern: RegExp): boolean {
  for (const d of ['src', 'app', 'lib'].map(d => path.join(projectRoot, d))) {
    if (!fs.existsSync(d)) continue;
    try {
      for (const f of fs.readdirSync(d).filter(f => /\.(ts|tsx|js|jsx)$/.test(f)).slice(0, 10)) {
        if (pattern.test(fs.readFileSync(path.join(d, f), 'utf-8'))) return true;
      }
    } catch {}
  }
  return false;
}

function parseSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  for (const part of markdown.split(/^## /m).slice(1)) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    sections.set(part.slice(0, nl).trim(), part.slice(nl + 1).trim());
  }
  return sections;
}
