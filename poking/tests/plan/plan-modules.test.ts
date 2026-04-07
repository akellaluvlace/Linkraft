import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { extractSchema, formatSchema } from '../../src/plan/schema-extractor.js';
import { mapApiEndpoints, formatApiMap } from '../../src/plan/api-mapper.js';
import { extractDesignTokens, formatDesignTokens } from '../../src/plan/token-extractor.js';
import { detectFeatures } from '../../src/plan/feature-detector.js';
import { scanProject, generateClaudeMd, diffClaudeMd } from '../../src/plan/claude-md-gen.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-modules-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupProject(opts: { prisma?: boolean; supabase?: boolean; nextApi?: boolean; tailwind?: boolean; env?: boolean } = {}): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'test-app',
    description: 'A test application',
    dependencies: {
      next: '^14.0.0',
      ...(opts.prisma ? { '@prisma/client': '^5.0.0' } : {}),
      ...(opts.supabase ? { '@supabase/supabase-js': '^2.0.0' } : {}),
    },
    devDependencies: {
      typescript: '^5.0.0',
      ...(opts.tailwind ? { tailwindcss: '^3.0.0' } : {}),
      vitest: '^2.0.0',
    },
    scripts: { build: 'next build', test: 'vitest run', dev: 'next dev', lint: 'eslint .' },
  }), 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');

  if (opts.prisma) {
    const prismaDir = path.join(tmpDir, 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });
    fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), `
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String?
  posts Post[]
}

model Post {
  id      String @id @default(uuid())
  title   String
  content String?
  author  User   @relation(fields: [authorId], references: [id])
  authorId String
}`);
  }

  if (opts.nextApi) {
    const apiDir = path.join(tmpDir, 'src', 'app', 'api', 'users');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'route.ts'), `
export async function GET(request: Request) {
  const session = await getSession();
  return Response.json({ users: [] });
}

export async function POST(request: Request) {
  return Response.json({ created: true });
}`);
  }

  if (opts.tailwind) {
    fs.writeFileSync(path.join(tmpDir, 'tailwind.config.ts'), `
export default {
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'secondary': '#10b981',
      },
      fontFamily: {
        'heading': 'Inter',
      },
      borderRadius: {
        'DEFAULT': '8px',
      },
    }
  }
}`);
  }

  if (opts.env) {
    fs.writeFileSync(path.join(tmpDir, '.env.example'), `
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
DATABASE_URL=
`);
  }
}

describe('schema-extractor', () => {
  it('extracts Prisma schema', () => {
    setupProject({ prisma: true });
    const result = extractSchema(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.tables.length).toBe(2);
    expect(result!.tables[0]!.name).toBe('User');
    expect(result!.tables[0]!.columns.some(c => c.name === 'email')).toBe(true);
  });

  it('returns null when no schema found', () => {
    setupProject();
    expect(extractSchema(tmpDir)).toBeNull();
  });

  it('formats schema as markdown', () => {
    setupProject({ prisma: true });
    const result = extractSchema(tmpDir)!;
    const md = formatSchema(result.tables, result.source);
    expect(md).toContain('User');
    expect(md).toContain('email');
    expect(md).toContain('Post');
  });
});

describe('api-mapper', () => {
  it('maps Next.js App Router API routes', () => {
    setupProject({ nextApi: true });
    const endpoints = mapApiEndpoints(tmpDir);
    expect(endpoints.length).toBeGreaterThanOrEqual(2);
    expect(endpoints.some(e => e.method === 'GET')).toBe(true);
    expect(endpoints.some(e => e.method === 'POST')).toBe(true);
  });

  it('detects auth in routes', () => {
    setupProject({ nextApi: true });
    const endpoints = mapApiEndpoints(tmpDir);
    const getRoute = endpoints.find(e => e.method === 'GET');
    expect(getRoute!.auth).toBe('required'); // has getSession()
  });

  it('formats API map as markdown', () => {
    setupProject({ nextApi: true });
    const endpoints = mapApiEndpoints(tmpDir);
    const md = formatApiMap(endpoints);
    expect(md).toContain('API Routes');
    expect(md).toContain('/api/users');
  });

  it('returns empty message when no routes found', () => {
    setupProject();
    const md = formatApiMap([]);
    expect(md).toContain('No API endpoints');
  });
});

describe('token-extractor', () => {
  it('extracts tokens from tailwind.config', () => {
    setupProject({ tailwind: true });
    const tokens = extractDesignTokens(tmpDir);
    expect(tokens).not.toBeNull();
    expect(tokens!.colors['primary']).toBe('#4f46e5');
  });

  it('returns null when no design system', () => {
    setupProject();
    expect(extractDesignTokens(tmpDir)).toBeNull();
  });

  it('formats tokens as markdown', () => {
    setupProject({ tailwind: true });
    const tokens = extractDesignTokens(tmpDir)!;
    const md = formatDesignTokens(tokens);
    expect(md).toContain('Colors');
    expect(md).toContain('#4f46e5');
  });
});

describe('feature-detector', () => {
  it('detects database from Prisma', () => {
    setupProject({ prisma: true });
    const features = detectFeatures(tmpDir);
    expect(features.hasDatabase).toBe(true);
    expect(features.databaseType).toBe('prisma');
  });

  it('detects API routes', () => {
    setupProject({ nextApi: true });
    const features = detectFeatures(tmpDir);
    expect(features.hasApiRoutes).toBe(true);
  });

  it('detects design system', () => {
    setupProject({ tailwind: true });
    const features = detectFeatures(tmpDir);
    expect(features.hasDesignSystem).toBe(true);
  });

  it('handles empty project', () => {
    const features = detectFeatures(tmpDir);
    expect(features.hasDatabase).toBe(false);
    expect(features.hasApiRoutes).toBe(false);
    expect(features.isProduct).toBe(false);
  });
});

describe('claude-md-gen upgrade', () => {
  it('generates CLAUDE.md with env vars', () => {
    setupProject({ env: true });
    const config = scanProject(tmpDir);
    expect(config.envVars.length).toBeGreaterThanOrEqual(3);
    expect(config.envVars.some(v => v.name === 'STRIPE_SECRET_KEY')).toBe(true);

    const md = generateClaudeMd(config);
    expect(md).toContain('Environment Variables');
    expect(md).toContain('STRIPE_SECRET_KEY');
  });

  it('generates CLAUDE.md with dev command', () => {
    setupProject();
    const config = scanProject(tmpDir);
    expect(config.devCommand).toContain('dev');

    const md = generateClaudeMd(config);
    expect(md).toContain('Dev:');
  });

  it('generates directory structure', () => {
    setupProject({ nextApi: true });
    const config = scanProject(tmpDir);
    expect(config.directoryStructure).toContain('src/');

    const md = generateClaudeMd(config);
    expect(md).toContain('Directory Structure');
  });

  it('detects never-touch areas', () => {
    setupProject({ prisma: true });
    const prismaMigDir = path.join(tmpDir, 'prisma', 'migrations');
    fs.mkdirSync(prismaMigDir, { recursive: true });
    fs.writeFileSync(path.join(prismaMigDir, '001.sql'), 'CREATE TABLE x;');

    const config = scanProject(tmpDir);
    expect(config.neverTouch.length).toBeGreaterThan(0);
  });

  it('diffs against existing CLAUDE.md', () => {
    setupProject();
    const existing = '# test-app\n\n## Tech Stack\n\n- Language: typescript\n\n## Custom Section\n\nUser content here.';
    const config = scanProject(tmpDir);
    const generated = generateClaudeMd(config);

    const diff = diffClaudeMd(existing, generated);
    // Should find new sections not in existing
    expect(diff.newSections.length).toBeGreaterThan(0);
    // Merged should preserve Custom Section
    expect(diff.mergedContent).toContain('Custom Section');
    expect(diff.mergedContent).toContain('User content here');
  });
});
