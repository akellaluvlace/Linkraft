import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { buildScaffoldPlan, writeScaffold, formatScaffoldPreview } from '../../src/plan/scaffold-gen.js';
import { readIdeaFile } from '../../src/plan/idea-reader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-gen-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeIdea(name: string, content: string): void {
  fs.writeFileSync(path.join(tmpDir, name), content, 'utf-8');
}

describe('buildScaffoldPlan', () => {
  it('produces a Next.js plan for a generic web app', () => {
    writeIdea('PLAN.md', '# WebThing\n\nA SaaS dashboard built with Next.js.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);

    const paths = plan.files.map(f => f.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain('tsconfig.json');
    expect(paths).toContain('next.config.mjs');
    expect(paths).toContain('.env.example');
    expect(plan.directories).toContain('src/app');
  });

  it('produces an Expo plan for a mobile app', () => {
    writeIdea('PLAN.md', '# Runner\n\nA React Native fitness app for iOS and Android built with Expo.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);

    const paths = plan.files.map(f => f.path);
    expect(paths).toContain('app.json');
    expect(paths).toContain('babel.config.js');
    expect(plan.directories).toContain('app');
  });

  it('produces a backend plan for a FastAPI-mentioned backend', () => {
    writeIdea('PLAN.md', '# LogPipe\n\nA backend service for logs using Hono.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);

    const paths = plan.files.map(f => f.path);
    expect(paths).toContain('drizzle.config.ts');
    expect(plan.directories).toContain('src/routes');
  });

  it('produces a CLI plan when the idea mentions a command-line tool', () => {
    writeIdea('PLAN.md', '# dotctl\n\nA CLI for managing dotfiles on the command-line.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);

    const paths = plan.files.map(f => f.path);
    expect(paths).toContain('package.json');
    const pkgFile = plan.files.find(f => f.path === 'package.json')!;
    const pkg = JSON.parse(pkgFile.content);
    expect(pkg.bin).toBeDefined();
  });
});

describe('writeScaffold', () => {
  it('writes files and directories from the plan', () => {
    writeIdea('PLAN.md', '# X\n\nA Next.js web app.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);
    const result = writeScaffold(tmpDir, plan);

    expect(result.created).toContain('package.json');
    expect(result.created).toContain('tsconfig.json');
    expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src/app'))).toBe(true);
    expect(result.skipped).toEqual([]);
  });

  it('never overwrites existing files', () => {
    writeIdea('PLAN.md', '# X\n\nA Next.js web app.\n');
    // Pre-populate package.json with sentinel content
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"existing": true}', 'utf-8');

    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);
    const result = writeScaffold(tmpDir, plan);

    expect(result.skipped).toContain('package.json');
    const content = fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8');
    expect(content).toContain('"existing": true');
  });

  it('produces a valid JSON package.json', () => {
    writeIdea('PLAN.md', '# X\n\nA Next.js web app.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);
    writeScaffold(tmpDir, plan);

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBeTruthy();
    expect(pkg.scripts.dev).toBeTruthy();
  });
});

describe('formatScaffoldPreview', () => {
  it('lists files and directories in the preview', () => {
    writeIdea('PLAN.md', '# X\n\nA Next.js web app.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md')!;
    const plan = buildScaffoldPlan(ctx);
    const preview = formatScaffoldPreview(plan);

    expect(preview).toContain('# Scaffold Plan');
    expect(preview).toContain('package.json');
    expect(preview).toContain('src/app/');
  });
});
