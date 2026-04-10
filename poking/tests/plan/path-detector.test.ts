import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectPlanPath, findIdeaFile } from '../../src/plan/path-detector.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'path-detector-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function write(name: string, content = '# placeholder\n'): void {
  fs.writeFileSync(path.join(tmpDir, name), content, 'utf-8');
}

describe('detectPlanPath', () => {
  it('returns Path A when package.json exists', () => {
    write('package.json', '{}');
    const result = detectPlanPath(tmpDir);
    expect(result.path).toBe('a');
    expect(result.ideaFile).toBeUndefined();
    expect(result.reason).toMatch(/package\.json/);
  });

  it('returns Path A even if an idea .md is also present', () => {
    write('package.json', '{}');
    write('PLAN.md');
    expect(detectPlanPath(tmpDir).path).toBe('a');
  });

  it('returns Path B when only PLAN.md exists', () => {
    write('PLAN.md', '# MyApp\n\nA great idea.\n');
    const result = detectPlanPath(tmpDir);
    expect(result.path).toBe('b');
    expect(result.ideaFile).toBe('PLAN.md');
  });

  it('returns Path B when only IDEA.md exists', () => {
    write('IDEA.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('IDEA.md');
  });

  it('returns Path B when only BRIEF.md exists', () => {
    write('BRIEF.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('BRIEF.md');
  });

  it('returns Path B when only SPEC.md exists', () => {
    write('SPEC.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('SPEC.md');
  });

  it('returns Path B when only README.md exists', () => {
    write('README.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('README.md');
  });

  it('falls back to any other .md file at the root', () => {
    write('notes.md');
    const result = detectPlanPath(tmpDir);
    expect(result.path).toBe('b');
    expect(result.ideaFile).toBe('notes.md');
  });

  it('ignores CLAUDE.md, CHANGELOG.md, LICENSE.md, CONTRIBUTING.md', () => {
    write('CLAUDE.md');
    write('CHANGELOG.md');
    write('LICENSE.md');
    write('CONTRIBUTING.md');
    const result = detectPlanPath(tmpDir);
    expect(result.path).toBe('missing');
    expect(result.ideaFile).toBeUndefined();
  });

  it('prefers PLAN.md over README.md', () => {
    write('README.md');
    write('PLAN.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('PLAN.md');
  });

  it('prefers IDEA.md over README.md and notes.md', () => {
    write('README.md');
    write('notes.md');
    write('IDEA.md');
    expect(detectPlanPath(tmpDir).ideaFile).toBe('IDEA.md');
  });

  it('returns missing when the directory has nothing planable', () => {
    const result = detectPlanPath(tmpDir);
    expect(result.path).toBe('missing');
    expect(result.reason).toMatch(/No project found/i);
  });

  it('returns missing when projectRoot does not exist', () => {
    const result = detectPlanPath(path.join(tmpDir, 'does-not-exist'));
    expect(result.path).toBe('missing');
  });
});

describe('findIdeaFile', () => {
  it('returns undefined for empty directory', () => {
    expect(findIdeaFile(tmpDir)).toBeUndefined();
  });

  it('picks the first candidate in preference order', () => {
    write('notes.md');
    write('BRIEF.md');
    write('IDEA.md');
    // IDEA.md comes before BRIEF.md in the candidate list
    expect(findIdeaFile(tmpDir)).toBe('IDEA.md');
  });

  it('case sensitive exact match then falls back to any .md', () => {
    write('idea.md');
    expect(findIdeaFile(tmpDir)).toBe('idea.md');
  });
});
