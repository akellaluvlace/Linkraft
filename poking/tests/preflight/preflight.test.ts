import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanSecurity } from '../../src/preflight/security-scanner.js';
import { scanHealth } from '../../src/preflight/health-scanner.js';
import { scanReadiness } from '../../src/preflight/readiness-scanner.js';
import { runPreflight, formatReport, writeReport } from '../../src/preflight/runner.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupProject(opts: {
  name?: string;
  deps?: Record<string, string>;
  apiRoute?: boolean;
  apiRouteAuth?: boolean;
  consoleLogs?: boolean;
  anyTypes?: boolean;
  tests?: boolean;
  notFound?: boolean;
  envExample?: boolean;
  hardcodedSecret?: boolean;
  failOpen?: boolean;
  dangerousHtml?: boolean;
  todos?: number;
} = {}): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: opts.name ?? 'test-app',
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      ...(opts.deps ?? {}),
    },
    devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0' },
    scripts: { build: 'next build', test: 'vitest run', dev: 'next dev' },
  }), 'utf-8');

  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });

  // Main source file
  let mainContent = 'export function main() { return "hello"; }\n';
  if (opts.consoleLogs) mainContent += 'console.log("debug");\nconsole.log("debug2");\n';
  if (opts.anyTypes) mainContent += 'const x: any = 1;\nconst y: any = 2;\nconst z: any = 3;\n';
  if (opts.dangerousHtml) mainContent += '<div dangerouslySetInnerHTML={{ __html: input }} />\n';
  if (opts.todos) {
    for (let i = 0; i < opts.todos; i++) mainContent += `// TODO: fix this ${i}\n`;
  }
  fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), mainContent);

  if (opts.hardcodedSecret) {
    fs.writeFileSync(path.join(tmpDir, 'src', 'config.ts'),
      'const key = "sk_live_abc123def456ghi789";\nexport default key;\n');
  }

  if (opts.apiRoute) {
    const apiDir = path.join(tmpDir, 'src', 'app', 'api', 'users');
    fs.mkdirSync(apiDir, { recursive: true });
    let routeContent = '';
    if (opts.apiRouteAuth) {
      routeContent = 'export async function GET() {\n  const session = await getSession();\n  try { return Response.json({}); } catch(e) { return Response.json({error: e}, {status: 500}); }\n}\n';
    } else {
      routeContent = 'export async function GET() { return Response.json({}); }\n';
    }
    if (opts.failOpen) {
      routeContent += 'export async function POST() {\n  try { doStuff(); } catch(e) { return Response.json({ok: true}); }\n}\n';
    }
    fs.writeFileSync(path.join(apiDir, 'route.ts'), routeContent);
  }

  if (opts.tests) {
    const testDir = path.join(tmpDir, 'src', '__tests__');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'main.test.ts'), 'import { test } from "vitest";\ntest("works", () => {});\n');
  }

  if (opts.notFound) {
    const appDir = path.join(tmpDir, 'app');
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(path.join(appDir, 'not-found.tsx'), 'export default function NotFound() { return <div>404</div>; }');
  }

  if (opts.envExample) {
    fs.writeFileSync(path.join(tmpDir, '.env.example'), 'DATABASE_URL=\nNEXT_PUBLIC_URL=\n');
  }
}

// --- Security Scanner ---

describe('security-scanner', () => {
  it('detects hardcoded secrets', () => {
    setupProject({ hardcodedSecret: true });
    const report = scanSecurity(tmpDir);
    expect(report.critical.length).toBeGreaterThan(0);
    expect(report.critical.some(f => f.category === 'secrets')).toBe(true);
    expect(report.score).toBeLessThan(10);
  });

  it('detects API routes without auth', () => {
    setupProject({ apiRoute: true, apiRouteAuth: false });
    const report = scanSecurity(tmpDir);
    expect(report.warnings.some(f => f.category === 'auth')).toBe(true);
  });

  it('passes when API routes have auth', () => {
    setupProject({ apiRoute: true, apiRouteAuth: true });
    const report = scanSecurity(tmpDir);
    expect(report.warnings.filter(f => f.category === 'auth').length).toBe(0);
    expect(report.passed.some(p => p.includes('auth'))).toBe(true);
  });

  it('detects dangerouslySetInnerHTML', () => {
    setupProject({ dangerousHtml: true });
    const report = scanSecurity(tmpDir);
    const xss = [...report.critical, ...report.warnings].filter(f => f.category === 'xss');
    expect(xss.length).toBeGreaterThan(0);
  });

  it('gives perfect score on clean project', () => {
    setupProject();
    const report = scanSecurity(tmpDir);
    expect(report.score).toBe(10);
  });

  it('detects fail-open patterns', () => {
    setupProject({ apiRoute: true, failOpen: true });
    const report = scanSecurity(tmpDir);
    const failOpen = [...report.critical, ...report.warnings].filter(f => f.category === 'fail-open');
    expect(failOpen.length).toBeGreaterThan(0);
  });
});

// --- Health Scanner ---

describe('health-scanner', () => {
  it('counts console.logs', () => {
    setupProject({ consoleLogs: true });
    const report = scanHealth(tmpDir);
    const metric = report.metrics.find(m => m.name === 'Console.logs');
    expect(metric).toBeDefined();
    expect(metric!.value).toBeGreaterThanOrEqual(2);
    expect(metric!.status).not.toBe('PASS');
  });

  it('counts TypeScript any', () => {
    setupProject({ anyTypes: true });
    const report = scanHealth(tmpDir);
    const metric = report.metrics.find(m => m.name === 'TypeScript any');
    expect(metric).toBeDefined();
    expect(metric!.value).toBeGreaterThanOrEqual(3);
  });

  it('detects test files', () => {
    setupProject({ tests: true });
    const report = scanHealth(tmpDir);
    const metric = report.metrics.find(m => m.name === 'Test count');
    expect(metric).toBeDefined();
    expect(metric!.value).toBeGreaterThanOrEqual(1);
  });

  it('counts TODOs', () => {
    setupProject({ todos: 8 });
    const report = scanHealth(tmpDir);
    const metric = report.metrics.find(m => m.name === 'TODOs');
    expect(metric).toBeDefined();
    expect(metric!.value).toBe(8);
    expect(metric!.status).toBe('WARN');
  });

  it('gives high score for clean project', () => {
    setupProject();
    const report = scanHealth(tmpDir);
    expect(report.score).toBeGreaterThanOrEqual(50);
  });

  it('reports source file count', () => {
    setupProject();
    const report = scanHealth(tmpDir);
    const metric = report.metrics.find(m => m.name === 'Source files');
    expect(metric).toBeDefined();
    expect(metric!.value).toBeGreaterThanOrEqual(1);
  });
});

// --- Readiness Scanner ---

describe('readiness-scanner', () => {
  it('detects missing 404 page', () => {
    setupProject();
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === '404 page');
    expect(check).toBeDefined();
    expect(check!.passed).toBe(false);
  });

  it('detects present 404 page', () => {
    setupProject({ notFound: true });
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === '404 page');
    expect(check!.passed).toBe(true);
  });

  it('detects missing env docs', () => {
    setupProject();
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === 'Env vars documented');
    expect(check!.passed).toBe(false);
  });

  it('detects present env docs', () => {
    setupProject({ envExample: true });
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === 'Env vars documented');
    expect(check!.passed).toBe(true);
  });

  it('detects API routes without error handling', () => {
    setupProject({ apiRoute: true });
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === 'Error handling on API routes');
    expect(check).toBeDefined();
    expect(check!.status).toContain('missing');
  });

  it('passes API routes with error handling', () => {
    setupProject({ apiRoute: true, apiRouteAuth: true });
    const report = scanReadiness(tmpDir);
    const check = report.checks.find(c => c.name === 'Error handling on API routes');
    expect(check!.passed).toBe(true);
  });

  it('calculates percentage', () => {
    setupProject({ notFound: true, envExample: true, tests: true });
    const report = scanReadiness(tmpDir);
    expect(report.percentage).toBeGreaterThan(0);
    expect(report.percentage).toBeLessThanOrEqual(100);
  });
});

// --- Runner ---

describe('preflight-runner', () => {
  it('runs full preflight scan', () => {
    setupProject({ apiRoute: true, tests: true, notFound: true });
    const report = runPreflight(tmpDir);
    expect(report.projectName).toBe('test-app');
    expect(report.scanTimeMs).toBeGreaterThanOrEqual(0);
    expect(report.security.score).toBeDefined();
    expect(report.health.score).toBeDefined();
    expect(report.readiness.percentage).toBeDefined();
  });

  it('formats report as markdown', () => {
    setupProject();
    const report = runPreflight(tmpDir);
    const md = formatReport(report);
    expect(md).toContain('PREFLIGHT REPORT');
    expect(md).toContain('SECURITY');
    expect(md).toContain('HEALTH');
    expect(md).toContain('SHIP READINESS');
    expect(md).toContain('NEXT STEPS');
  });

  it('writes report to .preflight/', () => {
    setupProject();
    const report = runPreflight(tmpDir);
    const reportPath = writeReport(tmpDir, report);
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.preflight', 'report.json'))).toBe(true);

    const json = JSON.parse(fs.readFileSync(path.join(tmpDir, '.preflight', 'report.json'), 'utf-8'));
    expect(json.projectName).toBe('test-app');
  });

  it('detects multiple issues in messy project', () => {
    setupProject({
      hardcodedSecret: true,
      apiRoute: true,
      failOpen: true,
      consoleLogs: true,
      anyTypes: true,
      todos: 10,
    });
    const report = runPreflight(tmpDir);
    expect(report.security.score).toBeLessThan(8);
    expect(report.health.score).toBeLessThan(80);
    const md = formatReport(report);
    expect(md).toContain('FAIL');
  });

  it('gives good scores for clean project', () => {
    setupProject({
      apiRoute: true,
      apiRouteAuth: true,
      tests: true,
      notFound: true,
      envExample: true,
    });
    const report = runPreflight(tmpDir);
    expect(report.security.score).toBeGreaterThanOrEqual(7);
  });
});
