// Architecture Generator: analyzes codebase structure, deps, and infra for architecture review.
// Collects heavy local context so Claude can produce a detailed ARCHITECTURE.md.

import * as fs from 'fs';
import * as path from 'path';

export interface ArchitectureContext {
  projectName: string;
  directoryTree: string;
  dependencies: { name: string; purpose: string }[];
  hasDocker: boolean;
  hasCICD: boolean;
  cicdPlatform: string | null;
  existingPlanFiles: { name: string; content: string }[];
  entryPoints: string[];
  middlewareFiles: string[];
  configFiles: string[];
}

export function collectArchitectureContext(projectRoot: string): ArchitectureContext {
  let projectName = 'unknown';
  const deps: { name: string; purpose: string }[] = [];

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      projectName = (pkg['name'] as string) ?? 'unknown';
      const d = pkg['dependencies'] as Record<string, string> | undefined;
      if (d) {
        for (const name of Object.keys(d)) {
          deps.push({ name, purpose: categorizeDep(name) });
        }
      }
    } catch {}
  }

  const directoryTree = buildTree(projectRoot, '', 0, 3);

  const hasDocker = fs.existsSync(path.join(projectRoot, 'Dockerfile')) ||
    fs.existsSync(path.join(projectRoot, 'docker-compose.yml')) ||
    fs.existsSync(path.join(projectRoot, 'docker-compose.yaml'));

  const cicdPlatform = detectCICD(projectRoot);

  const existingPlanFiles: { name: string; content: string }[] = [];
  const planDir = path.join(projectRoot, '.plan');
  if (fs.existsSync(planDir)) {
    try {
      for (const f of fs.readdirSync(planDir)) {
        if (f.endsWith('.md')) {
          try {
            existingPlanFiles.push({ name: f, content: fs.readFileSync(path.join(planDir, f), 'utf-8') });
          } catch {}
        }
      }
    } catch {}
  }

  const entryPoints = findFiles(projectRoot, [
    'src/index.ts', 'src/index.tsx', 'src/main.ts', 'src/main.tsx',
    'src/app.ts', 'src/server.ts', 'app/layout.tsx', 'app/page.tsx',
    'pages/_app.tsx', 'pages/index.tsx', 'index.ts', 'index.tsx',
  ]);

  const middlewareFiles = findFiles(projectRoot, [
    'middleware.ts', 'middleware.tsx', 'src/middleware.ts',
    'src/middleware/index.ts', 'server/middleware.ts',
  ]);

  const configFiles = findFiles(projectRoot, [
    'next.config.js', 'next.config.mjs', 'next.config.ts',
    'vite.config.ts', 'nuxt.config.ts', 'astro.config.mjs',
    'vercel.json', 'vercel.ts', 'netlify.toml',
    'tailwind.config.ts', 'tailwind.config.js',
    'tsconfig.json', '.eslintrc.json', '.eslintrc.js',
  ]);

  return {
    projectName, directoryTree, dependencies: deps, hasDocker,
    hasCICD: cicdPlatform !== null, cicdPlatform,
    existingPlanFiles, entryPoints, middlewareFiles, configFiles,
  };
}

function categorizeDep(name: string): string {
  if (['next', 'nuxt', '@sveltejs/kit', 'astro', 'express', 'fastify', 'hono'].includes(name)) return 'framework';
  if (name.includes('supabase') || name.includes('prisma') || name.includes('drizzle') || name.includes('mongoose')) return 'database';
  if (name.includes('auth') || name.includes('clerk') || name.includes('lucia')) return 'auth';
  if (name.includes('stripe') || name.includes('lemonsqueezy')) return 'payments';
  if (name.includes('sentry') || name.includes('datadog')) return 'monitoring';
  if (name.includes('redis') || name.includes('ioredis')) return 'caching';
  if (name.includes('zod') || name.includes('yup') || name.includes('joi')) return 'validation';
  if (name.includes('react') || name.includes('vue') || name.includes('svelte')) return 'ui';
  return 'utility';
}

function detectCICD(projectRoot: string): string | null {
  if (fs.existsSync(path.join(projectRoot, '.github', 'workflows'))) return 'github-actions';
  if (fs.existsSync(path.join(projectRoot, '.gitlab-ci.yml'))) return 'gitlab-ci';
  if (fs.existsSync(path.join(projectRoot, '.circleci'))) return 'circleci';
  if (fs.existsSync(path.join(projectRoot, 'Jenkinsfile'))) return 'jenkins';
  return null;
}

function buildTree(dir: string, prefix: string, depth: number, maxDepth: number): string {
  if (depth >= maxDepth) return '';
  const lines: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => !['node_modules', '.git', '.next', 'dist', '.plan', '.turbo', '.cache'].includes(e.name))
      .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));

    for (const entry of entries.slice(0, 30)) {
      lines.push(`${prefix}${entry.name}${entry.isDirectory() ? '/' : ''}`);
      if (entry.isDirectory()) {
        lines.push(buildTree(path.join(dir, entry.name), prefix + '  ', depth + 1, maxDepth));
      }
    }
  } catch {}
  return lines.filter(Boolean).join('\n');
}

function findFiles(projectRoot: string, candidates: string[]): string[] {
  return candidates.filter(f => fs.existsSync(path.join(projectRoot, f)));
}

export function generateArchitectureTemplate(ctx: ArchitectureContext): string {
  const planSummary = ctx.existingPlanFiles.map(f => `### ${f.name}\n${f.content.slice(0, 500)}${f.content.length > 500 ? '\n...(truncated)' : ''}`).join('\n\n');

  const lines = [
    `# Architecture Review: ${ctx.projectName}`,
    '',
    '## Local Context (auto-detected)',
    '',
    '### Directory Structure',
    '```',
    ctx.directoryTree || '(empty project)',
    '```',
    '',
    '### Dependencies',
    '| Package | Purpose |',
    '|---------|---------|',
    ...ctx.dependencies.slice(0, 30).map(d => `| ${d.name} | ${d.purpose} |`),
    '',
    `### Infrastructure: Docker=${ctx.hasDocker}, CI/CD=${ctx.cicdPlatform ?? 'none'}`,
    `### Entry points: ${ctx.entryPoints.join(', ') || 'none detected'}`,
    `### Middleware: ${ctx.middlewareFiles.join(', ') || 'none detected'}`,
    `### Config files: ${ctx.configFiles.join(', ')}`,
    '',
    ctx.existingPlanFiles.length > 0 ? '### Existing Plan Outputs\n\n' + planSummary : '',
    '',
    '## Template: Complete the analysis below',
    '',
    '### System Architecture Overview',
    '(Describe the high-level system design: layers, services, data stores)',
    '',
    '### Request Flow',
    '```',
    'Client -> [Framework] -> [Middleware] -> [Route Handler] -> [Database/External API]',
    '```',
    '(Expand with actual framework and middleware detected above)',
    '',
    '### Data Flow',
    '```',
    'User Input -> Validation -> Business Logic -> Persistence -> Response',
    '```',
    '(Expand with actual data patterns)',
    '',
    '### Strengths',
    '| # | Strength | Why it matters |',
    '|---|----------|----------------|',
    '| 1 | | |',
    '',
    '### Weaknesses',
    '| # | Weakness | Severity (critical/high/medium/low) | Recommendation |',
    '|---|----------|--------------------------------------|----------------|',
    '| 1 | | | |',
    '',
    '### Scalability Analysis',
    '| DAU | Infra needed | Est. monthly cost | Bottleneck |',
    '|-----|-------------|-------------------|------------|',
    '| 1K | | | |',
    '| 10K | | | |',
    '| 100K | | | |',
    '',
    '### Security Posture',
    '| Area | Status | Finding | Severity |',
    '|------|--------|---------|----------|',
    '| Authentication | | | |',
    '| Authorization | | | |',
    '| Input validation | | | |',
    '| Data encryption | | | |',
    '| Secrets management | | | |',
    '| CORS/CSP | | | |',
    '',
    '### Database Design Review',
    '(Review schema from .plan/SCHEMA.md if available. Comment on normalization, indexing, relationships.)',
    '',
  ];

  return lines.join('\n');
}

export function writeArchitecture(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'ARCHITECTURE.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
