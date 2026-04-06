import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectStack, findBuildCommand, findTestCommand, identifyHighRiskAreas, autoConfig, generateQAPlan } from '../../src/sheep/auto-config.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheep-config-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writePkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}, scripts: Record<string, string> = {}): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'test-project',
    dependencies: deps,
    devDependencies: devDeps,
    scripts,
  }), 'utf-8');
}

describe('detectStack', () => {
  it('detects Next.js + Tailwind + TypeScript', () => {
    writePkg({ next: '^14.0.0', tailwindcss: '^3.0.0' }, { typescript: '^5.0.0' });
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
    const stack = detectStack(tmpDir);
    expect(stack.framework).toBe('nextjs');
    expect(stack.styling).toBe('tailwind');
    expect(stack.language).toBe('typescript');
  });

  it('detects Vite + vitest', () => {
    writePkg({ vite: '^5.0.0' }, { vitest: '^2.0.0' });
    const stack = detectStack(tmpDir);
    expect(stack.framework).toBe('vite');
    expect(stack.testing).toBe('vitest');
  });

  it('detects Supabase database', () => {
    writePkg({ '@supabase/supabase-js': '^2.0.0' });
    const stack = detectStack(tmpDir);
    expect(stack.database).toBe('supabase');
  });

  it('detects package manager from lockfiles', () => {
    writePkg();
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    const stack = detectStack(tmpDir);
    expect(stack.packageManager).toBe('pnpm');
  });

  it('returns defaults for empty project', () => {
    const stack = detectStack(tmpDir);
    expect(stack.framework).toBeNull();
    expect(stack.language).toBe('javascript');
  });
});

describe('findBuildCommand', () => {
  it('finds build script', () => {
    writePkg({}, {}, { build: 'next build' });
    expect(findBuildCommand(tmpDir)).toContain('build');
  });

  it('returns null when no build script', () => {
    writePkg({}, {}, { start: 'node server.js' });
    expect(findBuildCommand(tmpDir)).toBeNull();
  });
});

describe('findTestCommand', () => {
  it('finds test script', () => {
    writePkg({}, {}, { test: 'vitest run' });
    expect(findTestCommand(tmpDir)).toContain('test');
  });

  it('falls back to vitest dep detection', () => {
    writePkg({}, { vitest: '^2.0.0' }, {});
    expect(findTestCommand(tmpDir)).toContain('vitest');
  });

  it('returns null when no test available', () => {
    writePkg({}, {}, { test: 'echo \"Error: no test specified\" && exit 1' });
    expect(findTestCommand(tmpDir)).toBeNull();
  });
});

describe('identifyHighRiskAreas', () => {
  it('finds auth files', () => {
    const authDir = path.join(tmpDir, 'src', 'auth');
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, 'login.ts'), 'export function login() {}');
    writePkg();

    const areas = identifyHighRiskAreas(tmpDir);
    expect(areas.some(a => a.area.includes('Auth'))).toBe(true);
  });

  it('returns generic area for empty project', () => {
    writePkg();
    const areas = identifyHighRiskAreas(tmpDir);
    expect(areas.length).toBeGreaterThan(0);
  });
});

describe('autoConfig', () => {
  it('returns complete config', () => {
    writePkg({ next: '^14.0.0' }, { vitest: '^2.0.0' }, { build: 'next build', test: 'vitest run' });
    const config = autoConfig(tmpDir);
    expect(config.stack.framework).toBe('nextjs');
    expect(config.buildCommand).toBeTruthy();
    expect(config.testCommand).toBeTruthy();
    expect(config.maxCycles).toBe(20);
  });
});

describe('generateQAPlan', () => {
  it('generates markdown QA plan', () => {
    writePkg({ next: '^14.0.0' }, {}, { build: 'next build' });
    const config = autoConfig(tmpDir);
    const plan = generateQAPlan(config);
    expect(plan).toContain('SheepCalledShip QA Plan');
    expect(plan).toContain('Priority Areas');
  });
});
