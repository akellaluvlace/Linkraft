import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { initSession, getReport } from '../../src/sheep/hunter.js';
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
    expect(session.config.stack.framework).toBe('nextjs');
  });

  it('generates QA plan content', () => {
    const session = initSession(tmpDir);
    expect(session.qaPlan).toContain('SheepCalledShip QA Plan');
    expect(session.qaPlan).toContain('Priority Areas');
  });

  it('creates initial stats', () => {
    initSession(tmpDir);
    const stats = loadStats(tmpDir);
    expect(stats).not.toBeNull();
    expect(stats!.status).toBe('running');
    expect(stats!.cycleCount).toBe(0);
  });

  it('initializes story with header', () => {
    initSession(tmpDir);
    const story = fs.readFileSync(path.join(tmpDir, '.sheep', 'story.md'), 'utf-8');
    expect(story).toContain('Field Report');
    expect(story).toContain('sheep walked into a codebase');
  });
});

describe('getReport', () => {
  it('returns helpful message when no session exists', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sheep-empty-'));
    const report = getReport(emptyDir);
    expect(report).toContain('No Sheep session');
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('returns stats when session exists', () => {
    initSession(tmpDir);
    const report = getReport(tmpDir);
    expect(report).toContain('SHEEPCALLEDSHIP');
    expect(report).toContain('Cycles: 0');
    expect(report).toContain('running');
  });
});
