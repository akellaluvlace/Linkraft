import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectStack, findBuildCommand, findTestCommand, identifyHighRiskAreas, autoConfig, generateQAPlan, readPreflightReport } from '../../src/sheep/auto-config.js';

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

describe('readPreflightReport', () => {
  it('returns null when no report exists', () => {
    expect(readPreflightReport(tmpDir)).toBeNull();
  });

  it('parses preflight report and extracts flagged files', () => {
    const preflightDir = path.join(tmpDir, '.preflight');
    fs.mkdirSync(preflightDir, { recursive: true });
    fs.writeFileSync(path.join(preflightDir, 'report.json'), JSON.stringify({
      security: {
        score: 6,
        critical: [{ file: 'src/auth/login.ts', line: 10, description: 'Hardcoded secret', severity: 'critical', category: 'secrets' }],
        warnings: [{ file: 'src/api/route.ts', line: 5, description: 'Missing rate limit', severity: 'medium', category: 'rate-limit' }],
        passed: [],
      },
      health: { score: 70, metrics: [{ name: 'Console.logs', value: 15, status: 'WARN', detail: null }] },
      readiness: { percentage: 60, checks: [{ name: 'Error handling', status: 'missing', passed: false }] },
    }));

    const findings = readPreflightReport(tmpDir);
    expect(findings).not.toBeNull();
    expect(findings!.flaggedFiles.has('src/auth/login.ts')).toBe(true);
    expect(findings!.flaggedFiles.has('src/api/route.ts')).toBe(true);
    expect(findings!.hasCritical).toBe(true);
    expect(findings!.failingChecks.has('console.logs')).toBe(true);
    expect(findings!.failingChecks.has('error handling')).toBe(true);
  });

  it('returns null for invalid JSON', () => {
    const preflightDir = path.join(tmpDir, '.preflight');
    fs.mkdirSync(preflightDir, { recursive: true });
    fs.writeFileSync(path.join(preflightDir, 'report.json'), 'not json');
    expect(readPreflightReport(tmpDir)).toBeNull();
  });
});

describe('identifyHighRiskAreas with preflight', () => {
  it('boosts areas where preflight found issues', () => {
    writePkg();
    const authDir = path.join(tmpDir, 'src', 'auth');
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, 'login.ts'), 'export function login() {}');

    const apiDir = path.join(tmpDir, 'src', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'route.ts'), 'export function GET() {}');

    // Without preflight: get baseline priorities
    const baseline = identifyHighRiskAreas(tmpDir);
    const authBaseline = baseline.find(a => a.area.includes('Auth'));
    const apiBaseline = baseline.find(a => a.area.includes('API'));
    expect(authBaseline).toBeDefined();
    expect(apiBaseline).toBeDefined();

    // Add preflight report with auth issues only
    const preflightDir = path.join(tmpDir, '.preflight');
    fs.mkdirSync(preflightDir, { recursive: true });
    fs.writeFileSync(path.join(preflightDir, 'report.json'), JSON.stringify({
      security: {
        score: 5,
        critical: [{ file: 'src/auth/login.ts', line: 10, description: 'Secret', severity: 'critical', category: 'secrets' }],
        warnings: [],
        passed: [],
      },
      health: { score: 80, metrics: [] },
      readiness: { percentage: 70, checks: [] },
    }));

    const boosted = identifyHighRiskAreas(tmpDir);
    const authBoosted = boosted.find(a => a.area.includes('Auth'));
    const apiBoosted = boosted.find(a => a.area.includes('API'));
    expect(authBoosted!.description).toContain('[preflight: issues detected]');
    expect(apiBoosted!.description).toContain('[preflight: clean]');
  });
});
