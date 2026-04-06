import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanProject, generateClaudeMd, generateAndWriteClaudeMd } from '../../src/plan/claude-md-gen.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-md-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupNextProject(): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'my-saas-app',
    description: 'A SaaS application for team management',
    dependencies: { next: '^14.0.0', tailwindcss: '^3.0.0', '@supabase/supabase-js': '^2.0.0' },
    devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0' },
    scripts: { build: 'next build', test: 'vitest run', lint: 'eslint .' },
  }), 'utf-8');

  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
  fs.writeFileSync(path.join(tmpDir, 'tailwind.config.ts'), 'export default {}');

  const srcApp = path.join(tmpDir, 'src', 'app');
  fs.mkdirSync(srcApp, { recursive: true });
  fs.writeFileSync(path.join(srcApp, 'layout.tsx'), `export default function Layout({ children }) { return <html><body>{children}</body></html>; }`);
  fs.writeFileSync(path.join(srcApp, 'page.tsx'), `export default function Home() { return <div>Hello</div>; }`);
}

describe('scanProject', () => {
  it('detects Next.js + Tailwind + Supabase stack', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.projectName).toBe('my-saas-app');
    expect(config.stack.framework).toBe('nextjs');
    expect(config.stack.styling).toBe('tailwind');
    expect(config.stack.database).toBe('supabase');
    expect(config.stack.language).toBe('typescript');
  });

  it('finds build, test, and lint commands', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.buildCommand).toBeTruthy();
    expect(config.testCommand).toBeTruthy();
    expect(config.lintCommand).toBeTruthy();
  });

  it('detects file map entries', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.fileMap.some(f => f.path === 'package.json')).toBe(true);
    expect(config.fileMap.some(f => f.path === 'tsconfig.json')).toBe(true);
  });

  it('generates hard constraints for Tailwind', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.hardConstraints.some(c => c.includes('Tailwind'))).toBe(true);
  });
});

describe('generateClaudeMd', () => {
  it('produces markdown with all sections', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    const md = generateClaudeMd(config);

    expect(md).toContain('# my-saas-app');
    expect(md).toContain('## Tech Stack');
    expect(md).toContain('nextjs');
    expect(md).toContain('## Commands');
    expect(md).toContain('npm run build');
    expect(md).toContain('## Coding Standards');
    expect(md).toContain('## Key Files');
    expect(md).toContain('## Hard Constraints');
    expect(md).toContain('Tailwind');
  });

  it('handles minimal project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'minimal' }));
    const config = scanProject(tmpDir);
    const md = generateClaudeMd(config);
    expect(md).toContain('# minimal');
    expect(md).toContain('## Tech Stack');
  });
});

describe('generateAndWriteClaudeMd', () => {
  it('writes CLAUDE.md to project root', () => {
    setupNextProject();
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(fs.existsSync(result.path)).toBe(true);
    const content = fs.readFileSync(result.path, 'utf-8');
    expect(content).toContain('# my-saas-app');
    expect(content).toContain('nextjs');
  });
});
