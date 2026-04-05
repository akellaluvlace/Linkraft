import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateAllDrafts, generateDraft, writeDrafts } from '../../src/launchpad/distributor.js';
import type { LaunchBrief } from '../../src/launchpad/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launchpad-dist-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const testBrief: LaunchBrief = {
  productName: 'Linkraft',
  productDescription: 'Connect Claude Code to any service',
  targetAudience: 'Developers',
  uniqueValue: 'One-click MCP integrations',
  tone: 'technical',
};

describe('generateAllDrafts', () => {
  it('generates drafts for all platforms', () => {
    const drafts = generateAllDrafts(testBrief);
    expect(drafts.length).toBe(5);
    const platforms = drafts.map(d => d.platform);
    expect(platforms).toContain('linkedin');
    expect(platforms).toContain('twitter');
    expect(platforms).toContain('producthunt');
    expect(platforms).toContain('reddit');
    expect(platforms).toContain('email');
  });

  it('all drafts contain product name', () => {
    const drafts = generateAllDrafts(testBrief);
    for (const draft of drafts) {
      expect(draft.content).toContain('Linkraft');
    }
  });

  it('twitter draft is within character limit', () => {
    const drafts = generateAllDrafts(testBrief);
    const tweet = drafts.find(d => d.platform === 'twitter');
    expect(tweet!.content.length).toBeLessThanOrEqual(280);
  });
});

describe('generateDraft', () => {
  it('generates draft for specific platform', () => {
    const draft = generateDraft(testBrief, 'linkedin');
    expect(draft).not.toBeNull();
    expect(draft!.platform).toBe('linkedin');
  });

  it('returns null for unknown platform', () => {
    const draft = generateDraft(testBrief, 'tiktok');
    expect(draft).toBeNull();
  });
});

describe('writeDrafts', () => {
  it('writes all drafts to .launchpad/distribution/', () => {
    const drafts = generateAllDrafts(testBrief);
    const files = writeDrafts(tmpDir, drafts);
    expect(files.length).toBe(5);

    for (const file of files) {
      const filePath = path.join(tmpDir, '.launchpad', file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('creates distribution directory if needed', () => {
    const distDir = path.join(tmpDir, '.launchpad', 'distribution');
    expect(fs.existsSync(distDir)).toBe(false);
    writeDrafts(tmpDir, generateAllDrafts(testBrief));
    expect(fs.existsSync(distDir)).toBe(true);
  });
});
