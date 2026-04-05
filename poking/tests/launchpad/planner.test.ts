import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  writePlanningFiles,
  generateBrief,
  generateDefaultWireframe,
  generateSEOConfig,
  generateDefaultCopy,
} from '../../src/launchpad/planner.js';
import type { LaunchBrief } from '../../src/launchpad/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launchpad-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const testBrief: LaunchBrief = {
  productName: 'Linkraft',
  productDescription: 'Connect Claude Code to any service via MCP servers',
  targetAudience: 'Developers using Claude Code who want service integrations',
  uniqueValue: 'One-click MCP integrations for every service',
  tone: 'technical but approachable',
};

describe('generateBrief', () => {
  it('produces markdown with product name', () => {
    const md = generateBrief(testBrief);
    expect(md).toContain('Linkraft');
    expect(md).toContain('Connect Claude Code');
  });
});

describe('generateDefaultWireframe', () => {
  it('produces sections in order', () => {
    const wireframe = generateDefaultWireframe();
    expect(wireframe.sections.length).toBeGreaterThanOrEqual(5);
    expect(wireframe.sections[0]!.type).toBe('hero');
    expect(wireframe.sections[wireframe.sections.length - 1]!.type).toBe('footer');
  });
});

describe('generateSEOConfig', () => {
  it('generates title from product name and value prop', () => {
    const seo = generateSEOConfig(testBrief);
    expect(seo.title).toContain('Linkraft');
    expect(seo.ogTitle).toBe(seo.title);
    expect(seo.schema).not.toBeNull();
  });
});

describe('generateDefaultCopy', () => {
  it('generates headline, features, and CTA', () => {
    const copy = generateDefaultCopy(testBrief);
    expect(copy.headline).toBeTruthy();
    expect(copy.features.length).toBeGreaterThanOrEqual(3);
    expect(copy.ctaPrimary).toBeTruthy();
  });
});

describe('writePlanningFiles', () => {
  it('creates all planning files in .launchpad/', () => {
    const result = writePlanningFiles(tmpDir, testBrief);
    expect(result.files).toContain('brief.md');
    expect(result.files).toContain('wireframe.json');
    expect(result.files).toContain('seo.json');
    expect(result.files).toContain('copy.json');

    // Verify files exist on disk
    for (const file of result.files) {
      const filePath = path.join(result.dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('creates .launchpad directory if it does not exist', () => {
    const launchpadDir = path.join(tmpDir, '.launchpad');
    expect(fs.existsSync(launchpadDir)).toBe(false);
    writePlanningFiles(tmpDir, testBrief);
    expect(fs.existsSync(launchpadDir)).toBe(true);
  });
});
