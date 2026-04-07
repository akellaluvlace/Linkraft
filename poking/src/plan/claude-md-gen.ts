// CLAUDE.md Generator: THE KEY FEATURE of Plan mode.
// Scans a project and generates a complete, project-specific CLAUDE.md.
// Not a template. A CLAUDE.md synthesized from everything it learned.
// Handles merge with existing CLAUDE.md intelligently.

import * as fs from 'fs';
import * as path from 'path';
import type { ClaudeMdConfig, FileMapEntry, EnvVar } from './types.js';
import { analyzeStack, detectConventions } from './stack-analyzer.js';

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
 * Full pipeline: scan + generate + write (or detect existing for merge).
 */
export function generateAndWriteClaudeMd(projectRoot: string): {
  path: string;
  content: string;
  merged: boolean;
  newSections: string[];
  updatedSections: string[];
} {
  const config = scanProject(projectRoot);
  const generated = generateClaudeMd(config);

  const existingPath = path.join(projectRoot, 'CLAUDE.md');
  if (fs.existsSync(existingPath)) {
    const existing = fs.readFileSync(existingPath, 'utf-8');
    const diff = diffClaudeMd(existing, generated);
    return {
      path: existingPath,
      content: generated,
      merged: true,
      newSections: diff.newSections,
      updatedSections: diff.updatedSections,
    };
  }

  const filePath = writeClaudeMd(projectRoot, generated);
  return { path: filePath, content: generated, merged: false, newSections: [], updatedSections: [] };
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
