// CLAUDE.md Generator: THE KEY FEATURE of Plan mode.
// Scans a project and generates a complete, project-specific CLAUDE.md.
// Not a template. A CLAUDE.md that knows your stack, conventions, commands, and patterns.

import * as fs from 'fs';
import * as path from 'path';
import type { ClaudeMdConfig, FileMapEntry } from './types.js';
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

  return {
    projectName,
    projectDescription,
    stack,
    buildCommand: commands.build,
    testCommand: commands.test,
    lintCommand: commands.lint,
    fileMap,
    conventions,
    hardConstraints,
    architecture: generateArchitectureSummary(projectRoot, stack),
  };
}

/**
 * Generates a complete CLAUDE.md from a scanned project config.
 */
export function generateClaudeMd(config: ClaudeMdConfig): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${config.projectName}`);
  if (config.projectDescription) {
    sections.push('', config.projectDescription);
  }

  // Tech Stack
  sections.push('', '## Tech Stack', '');
  sections.push(`- Language: ${config.stack.language}`);
  if (config.stack.framework) sections.push(`- Framework: ${config.stack.framework}`);
  if (config.stack.styling) sections.push(`- Styling: ${config.stack.styling}`);
  if (config.stack.database) sections.push(`- Database: ${config.stack.database}`);
  if (config.stack.auth) sections.push(`- Auth: ${config.stack.auth}`);
  if (config.stack.testing) sections.push(`- Testing: ${config.stack.testing}`);
  if (config.stack.deployment) sections.push(`- Deployment: ${config.stack.deployment}`);

  // Commands
  sections.push('', '## Commands', '');
  if (config.buildCommand) sections.push(`- Build: \`${config.buildCommand}\``);
  if (config.testCommand) sections.push(`- Test: \`${config.testCommand}\``);
  if (config.lintCommand) sections.push(`- Lint: \`${config.lintCommand}\``);

  // Coding Standards
  sections.push('', '## Coding Standards', '');
  sections.push(`- Indentation: ${config.conventions.indentation}`);
  sections.push(`- Quotes: ${config.conventions.quotes}`);
  sections.push(`- Semicolons: ${config.conventions.semicolons ? 'yes' : 'no'}`);
  sections.push(`- Naming: ${config.conventions.namingStyle}`);
  if (config.conventions.stateManagement) {
    sections.push(`- State management: ${config.conventions.stateManagement}`);
  }

  // Hard Constraints
  if (config.hardConstraints.length > 0) {
    sections.push('', '## Hard Constraints', '');
    for (const constraint of config.hardConstraints) {
      sections.push(`- ${constraint}`);
    }
  }

  // File Map
  if (config.fileMap.length > 0) {
    sections.push('', '## Key Files', '');
    for (const entry of config.fileMap) {
      sections.push(`- \`${entry.path}\`: ${entry.purpose}`);
    }
  }

  // Architecture
  if (config.architecture) {
    sections.push('', '## Architecture', '', config.architecture);
  }

  return sections.join('\n');
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
 * Full pipeline: scan + generate + write.
 */
export function generateAndWriteClaudeMd(projectRoot: string): { path: string; content: string } {
  const config = scanProject(projectRoot);
  const content = generateClaudeMd(config);
  const filePath = writeClaudeMd(projectRoot, content);
  return { path: filePath, content };
}

// --- Internal helpers ---

function findCommands(projectRoot: string): { build: string | null; test: string | null; lint: string | null } {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return { build: null, test: null, lint: null };

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (!scripts) return { build: null, test: null, lint: null };

    return {
      build: scripts['build'] ? `npm run build` : null,
      test: scripts['test'] && !scripts['test'].includes('no test specified') ? `npm test` : null,
      lint: scripts['lint'] ? `npm run lint` : null,
    };
  } catch {
    return { build: null, test: null, lint: null };
  }
}

function generateFileMap(projectRoot: string): FileMapEntry[] {
  const entries: FileMapEntry[] = [];

  const checks: Array<[string, string]> = [
    ['package.json', 'Dependencies and scripts'],
    ['tsconfig.json', 'TypeScript configuration'],
    ['tailwind.config.ts', 'Tailwind CSS configuration'],
    ['tailwind.config.js', 'Tailwind CSS configuration'],
    ['next.config.js', 'Next.js configuration'],
    ['next.config.ts', 'Next.js configuration'],
    ['next.config.mjs', 'Next.js configuration'],
    ['vite.config.ts', 'Vite configuration'],
    ['.env.local', 'Local environment variables (DO NOT commit)'],
    ['.env', 'Environment variables template'],
    ['prisma/schema.prisma', 'Database schema'],
    ['drizzle.config.ts', 'Drizzle ORM configuration'],
    ['src/app/layout.tsx', 'Root layout (Next.js App Router)'],
    ['src/app/page.tsx', 'Home page'],
    ['src/middleware.ts', 'Middleware (auth, routing)'],
    ['supabase/config.toml', 'Supabase project config'],
  ];

  for (const [file, purpose] of checks) {
    if (fs.existsSync(path.join(projectRoot, file))) {
      entries.push({ path: file, purpose });
    }
  }

  return entries;
}

function detectHardConstraints(projectRoot: string, stack: { styling: string | null; framework: string | null }): string[] {
  const constraints: string[] = [];

  if (stack.styling === 'tailwind') {
    constraints.push('Uses Tailwind CSS. Never write CSS modules or inline styles.');
  }

  if (stack.framework === 'nextjs') {
    constraints.push('Next.js App Router. Use Server Components by default, Client Components only when needed.');
  }

  // Check for existing CLAUDE.md constraints
  const existingClaudeMd = path.join(projectRoot, 'CLAUDE.md');
  if (fs.existsSync(existingClaudeMd)) {
    constraints.push('Existing CLAUDE.md found. Review before overwriting.');
  }

  // Check for .env files
  if (fs.existsSync(path.join(projectRoot, '.env')) || fs.existsSync(path.join(projectRoot, '.env.local'))) {
    constraints.push('Environment variables in use. Never hardcode secrets. Use env vars.');
  }

  return constraints;
}

function generateArchitectureSummary(projectRoot: string, stack: { framework: string | null }): string {
  const parts: string[] = [];

  // Detect route patterns
  const appDir = path.join(projectRoot, 'src', 'app');
  const pagesDir = path.join(projectRoot, 'src', 'pages');

  if (fs.existsSync(appDir)) {
    parts.push('Uses App Router pattern (src/app/).');
  } else if (fs.existsSync(pagesDir)) {
    parts.push('Uses Pages Router pattern (src/pages/).');
  }

  // Detect API routes
  const apiDir = path.join(projectRoot, 'src', 'app', 'api');
  if (fs.existsSync(apiDir)) {
    parts.push('API routes in src/app/api/.');
  }

  if (parts.length === 0) {
    parts.push(`${stack.framework ?? 'Standard'} project structure.`);
  }

  return parts.join(' ');
}
