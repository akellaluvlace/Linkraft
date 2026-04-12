import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createState,
  loadState,
  saveState,
  addVariation,
  canResume,
  stopRun,
  completeRun,
} from '../../src/dreamroll/state.js';
import type { DreamrollConfig, Variation } from '../../src/dreamroll/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dreamroll-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const testConfig: DreamrollConfig = {
  basePage: 'landing.tsx',
  targetVariations: 50,
  budgetHours: 8,
  projectRoot: '',
  brief: 'test brief',
};

function configWithRoot(): DreamrollConfig {
  return { ...testConfig, projectRoot: tmpDir };
}

describe('createState', () => {
  it('creates initial state', () => {
    const state = createState(configWithRoot());
    expect(state.currentVariation).toBe(0);
    expect(state.variations).toEqual([]);
    expect(state.gems).toEqual([]);
    expect(state.status).toBe('running');
  });
});

describe('saveState / loadState', () => {
  it('round-trips state through JSON', () => {
    const state = createState(configWithRoot());
    saveState(tmpDir, state);
    const loaded = loadState(tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.config.basePage).toBe('landing.tsx');
    expect(loaded!.status).toBe('running');
  });

  it('returns null for missing state', () => {
    const loaded = loadState(tmpDir);
    expect(loaded).toBeNull();
  });

  it('returns null for corrupted state', () => {
    const dir = path.join(tmpDir, '.dreamroll');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'state.json'), 'not json', 'utf-8');
    const loaded = loadState(tmpDir);
    expect(loaded).toBeNull();
  });

  it('returns null for state missing required fields', () => {
    const dir = path.join(tmpDir, '.dreamroll');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'state.json'), '{"hello": "world"}', 'utf-8');
    const loaded = loadState(tmpDir);
    expect(loaded).toBeNull();
  });
});

describe('addVariation', () => {
  it('adds a variation and updates state', () => {
    const state = createState(configWithRoot());
    saveState(tmpDir, state);

    const variation: Variation = {
      id: 1,
      seed: {
        colorPalette: 'warm',
        typography: 'serif-sans',
        layoutArchetype: 'split',
        genre: 'brutalism',
        density: 'balanced',
        mood: 'serious',
        era: '2020s-modern',
        animation: 'none',
        imagery: 'geometric-shapes',
        temperature: 0.8,
        wildcard: 'one-font-only',
      },
      verdict: { scores: [{ judge: 'brutus', score: 8, comment: 'Good' }], averageScore: 8, verdict: 'gem', hasInstantKeep: false },
      filesPath: null,
      createdAt: new Date().toISOString(),
    };

    addVariation(tmpDir, state, variation);
    expect(state.variations.length).toBe(1);
    expect(state.gems).toContain(1);

    // Verify persistence
    const loaded = loadState(tmpDir);
    expect(loaded!.variations.length).toBe(1);
    expect(loaded!.gems).toContain(1);
  });
});

describe('canResume', () => {
  it('returns false when no state exists', () => {
    expect(canResume(tmpDir)).toBe(false);
  });

  it('returns true for running state', () => {
    const state = createState(configWithRoot());
    saveState(tmpDir, state);
    expect(canResume(tmpDir)).toBe(true);
  });

  it('returns false for completed state', () => {
    const state = createState(configWithRoot());
    saveState(tmpDir, state);
    completeRun(tmpDir, state);
    expect(canResume(tmpDir)).toBe(false);
  });

  it('returns false for stopped state', () => {
    const state = createState(configWithRoot());
    saveState(tmpDir, state);
    stopRun(tmpDir, state);
    expect(canResume(tmpDir)).toBe(false);
  });
});
