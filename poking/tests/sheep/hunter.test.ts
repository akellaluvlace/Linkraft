import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { initSession, getNextArea, recordCycleResult, completeHunt, getReport } from '../../src/sheep/hunter.js';
import { loadStats } from '../../src/sheep/stats.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheep-hunt-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'test-project',
    dependencies: { next: '^14.0.0' },
    devDependencies: { vitest: '^2.0.0' },
    scripts: { build: 'next build', test: 'vitest run' },
  }), 'utf-8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('initSession', () => {
  it('creates .sheep directory with all files', () => {
    const session = initSession(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.sheep', 'QA_PLAN.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.sheep', 'stats.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.sheep', 'story.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.sheep', 'human-review.md'))).toBe(true);
    expect(session.config.stack.framework).toBe('nextjs');
    expect(session.resumed).toBe(false);
  });

  it('resumes existing running session', () => {
    initSession(tmpDir);
    const session2 = initSession(tmpDir);
    expect(session2.resumed).toBe(true);
  });

  it('generates QA plan', () => {
    const session = initSession(tmpDir);
    expect(session.qaPlan).toContain('SheepCalledShip QA Plan');
  });
});

describe('getNextArea', () => {
  it('returns first area after init', () => {
    initSession(tmpDir);
    const next = getNextArea(tmpDir);
    expect(next).not.toBeNull();
    expect(next!.cycleNumber).toBe(1);
    expect(next!.area).toBeTruthy();
  });

  it('returns null when no session exists', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheep-empty-'));
    expect(getNextArea(emptyDir)).toBeNull();
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
});

describe('recordCycleResult', () => {
  it('records a cycle with bugs and updates stats', () => {
    initSession(tmpDir);
    const result = recordCycleResult(tmpDir, {
      area: 'Authentication',
      target: 'Auth middleware null checks',
      filesScanned: ['src/auth/middleware.ts'],
      bugsFound: [
        { id: 'BUG-001', file: 'src/auth/middleware.ts', line: 15, severity: 'high', category: 'null-check', description: 'Missing null check on session', fix: 'Added if (!session) return', autoFixed: true, whyNotFixed: null },
        { id: 'BUG-002', file: 'src/auth/middleware.ts', line: 30, severity: 'critical', category: 'security', description: 'Token not validated', fix: null, autoFixed: false, whyNotFixed: 'Requires architectural decision' },
      ],
      bugsFixed: [{ id: 'BUG-001', file: 'src/auth/middleware.ts', line: 15, severity: 'high', category: 'null-check', description: 'Missing null check', fix: 'Added check', autoFixed: true, whyNotFixed: null }],
      bugsLogged: [{ id: 'BUG-002', file: 'src/auth/middleware.ts', line: 30, severity: 'critical', category: 'security', description: 'Token not validated', fix: null, autoFixed: false, whyNotFixed: 'Architectural decision' }],
      buildPassed: true,
      testsPassed: true,
      testCount: 42,
      commitHash: 'abc1234',
    });

    expect(result.cycleNumber).toBe(1);
    expect(result.marthaMessage).toBeTruthy();
    expect(result.deezeebalzRoast).toBeTruthy();
    expect(result.sheepMonologue).toBeTruthy();

    const stats = loadStats(tmpDir);
    expect(stats!.cycleCount).toBe(1);
    expect(stats!.bugs.discovered).toBe(2);
    expect(stats!.bugs.autoFixed).toBe(1);
    expect(stats!.bugs.logged).toBe(1);
    expect(stats!.commits).toBe(1);
    expect(stats!.areas.tested).toContain('Authentication');
    expect(stats!.worstBug).not.toBeNull();
    expect(stats!.worstBug!.severity).toBe('critical');
  });

  it('writes to story.md', () => {
    initSession(tmpDir);
    recordCycleResult(tmpDir, {
      area: 'API Routes',
      target: 'Error handling',
      filesScanned: ['src/api/route.ts'],
      bugsFound: [],
      bugsFixed: [],
      bugsLogged: [],
      buildPassed: true,
      testsPassed: true,
      testCount: 10,
      commitHash: null,
    });

    const story = fs.readFileSync(path.join(tmpDir, '.sheep', 'story.md'), 'utf-8');
    expect(story).toContain('Cycle 1');
    expect(story).toContain('API Routes');
    expect(story).toContain('Clean sweep');
  });

  it('writes logged bugs to human-review.md', () => {
    initSession(tmpDir);
    recordCycleResult(tmpDir, {
      area: 'Auth',
      target: 'Session handling',
      filesScanned: ['src/auth.ts'],
      bugsFound: [{ id: 'SEC-001', file: 'src/auth.ts', line: 10, severity: 'critical', category: 'security', description: 'Token exposed', fix: null, autoFixed: false, whyNotFixed: 'Needs architecture review' }],
      bugsFixed: [],
      bugsLogged: [{ id: 'SEC-001', file: 'src/auth.ts', line: 10, severity: 'critical', category: 'security', description: 'Token exposed', fix: null, autoFixed: false, whyNotFixed: 'Needs architecture review' }],
      buildPassed: true,
      testsPassed: true,
      testCount: 10,
      commitHash: null,
    });

    const review = fs.readFileSync(path.join(tmpDir, '.sheep', 'human-review.md'), 'utf-8');
    expect(review).toContain('SEC-001');
    expect(review).toContain('Token exposed');
    expect(review).toContain('architecture review');
  });
});

describe('completeHunt', () => {
  it('generates content pack and writes epilogue', () => {
    initSession(tmpDir);
    recordCycleResult(tmpDir, {
      area: 'General',
      target: 'Code quality',
      filesScanned: ['src/index.ts'],
      bugsFound: [],
      bugsFixed: [],
      bugsLogged: [],
      buildPassed: true,
      testsPassed: true,
      testCount: 5,
      commitHash: null,
    });

    const { stats, contentPackPath } = completeHunt(tmpDir);
    expect(stats.status).toBe('completed');
    expect(fs.existsSync(contentPackPath)).toBe(true);

    const story = fs.readFileSync(path.join(tmpDir, '.sheep', 'story.md'), 'utf-8');
    expect(story).toContain('Epilogue');
    expect(story).toContain('Final Stats');
  });
});

describe('getReport', () => {
  it('returns helpful message when no session', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheep-e-'));
    expect(getReport(emptyDir)).toContain('No Sheep session');
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('returns live stats during session', () => {
    initSession(tmpDir);
    const report = getReport(tmpDir);
    expect(report).toContain('SHEEPCALLEDSHIP');
    expect(report).toContain('Cycles: 0');
    expect(report).toContain('running');
  });
});
