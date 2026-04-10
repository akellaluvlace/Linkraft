// End-to-end integration test for the dreamroll pipeline.
// Exercises the full skill-driven loop without going through MCP stdio:
// init -> roll -> build prompt -> record verdict -> advance -> resume.
//
// This catches wiring bugs between params.ts, genome.ts, state.ts,
// evolution.ts, and the dreamroll_start tool semantics.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createState, loadState, saveState } from '../../src/dreamroll/state.js';
import { rollSeedParameters } from '../../src/dreamroll/generator.js';
import { genomeToPrompt, serializeGenomeAsComment } from '../../src/dreamroll/genome.js';
import { calculateVerdict } from '../../src/dreamroll/judges.js';
import { maybeEvolve } from '../../src/dreamroll/evolution.js';
import { generateReport, formatReport } from '../../src/dreamroll/reporter.js';
import type { DreamrollConfig, Variation } from '../../src/dreamroll/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dreamroll-e2e-'));
  // Simulate a real project
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'studyflow',
    description: 'AI study platform for neurodivergent students',
  }), 'utf-8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function mkConfig(): DreamrollConfig {
  return {
    basePage: '',
    targetVariations: null,
    budgetHours: 24,
    projectRoot: tmpDir,
    brief: 'AI study platform for neurodivergent students',
  };
}

/** Simulates one full cycle of the skill-driven loop. */
function simulateCycle(
  state: ReturnType<typeof loadState>,
  variationId: number,
  mockScores: { brutus: number; venus: number; mercury: number },
): { filePath: string; prompt: string; variation: Variation } {
  if (!state) throw new Error('state required');

  // 1. Roll genome
  const seed = rollSeedParameters(state);
  const filePath = path.join(tmpDir, '.dreamroll', 'variations', `variation_${String(variationId).padStart(3, '0')}.html`);

  // 2. Build the prompt the skill would receive
  const prompt = genomeToPrompt(seed, state.config.brief ?? '', variationId, filePath);

  // 3. Skill would generate HTML here. Simulate writing a minimal file.
  const variationsDir = path.dirname(filePath);
  if (!fs.existsSync(variationsDir)) fs.mkdirSync(variationsDir, { recursive: true });
  const header = serializeGenomeAsComment(seed, variationId);
  fs.writeFileSync(filePath, `${header}\n<!DOCTYPE html>\n<html><head><title>v${variationId}</title></head><body><h1>${state.config.brief}</h1></body></html>\n`, 'utf-8');

  // 4. Calculate verdict from mock scores
  const verdict = calculateVerdict([
    { judge: 'brutus', score: mockScores.brutus, comment: 'test' },
    { judge: 'venus', score: mockScores.venus, comment: 'test' },
    { judge: 'mercury', score: mockScores.mercury, comment: 'test' },
  ]);

  const variation: Variation = {
    id: variationId,
    seed,
    verdict,
    screenshotPath: null,
    filesPath: filePath,
    createdAt: new Date().toISOString(),
  };

  // 5. Append to state
  state.variations.push(variation);
  state.currentVariation = variationId;
  if (verdict.verdict === 'gem' && !state.gems.includes(variationId)) {
    state.gems.push(variationId);
  }
  const adjustments = maybeEvolve(state);
  if (adjustments.length > 0) state.evolutionAdjustments.push(...adjustments);
  saveState(tmpDir, state);

  return { filePath, prompt, variation };
}

describe('dreamroll e2e: full skill-driven loop', () => {
  it('runs init -> 3 cycles -> report without errors', () => {
    // Init
    const state = createState(mkConfig());
    saveState(tmpDir, state);

    // 3 cycles with varied mock scores (one gem, one decent, one weak)
    const cycle1 = simulateCycle(state, 1, { brutus: 8, venus: 8, mercury: 7 }); // gem (avg 7.7)
    const cycle2 = simulateCycle(state, 2, { brutus: 6, venus: 5, mercury: 6 }); // iterate (avg 5.7)
    const cycle3 = simulateCycle(state, 3, { brutus: 3, venus: 4, mercury: 3 }); // discard (avg 3.3)

    // Verify state persisted
    const reloaded = loadState(tmpDir);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.currentVariation).toBe(3);
    expect(reloaded!.variations).toHaveLength(3);
    expect(reloaded!.gems).toEqual([1]);

    // Verify HTML files exist on disk
    expect(fs.existsSync(cycle1.filePath)).toBe(true);
    expect(fs.existsSync(cycle2.filePath)).toBe(true);
    expect(fs.existsSync(cycle3.filePath)).toBe(true);

    // Verify each HTML file has a valid genome comment header
    for (const c of [cycle1, cycle2, cycle3]) {
      const contents = fs.readFileSync(c.filePath, 'utf-8');
      expect(contents).toMatch(/^<!--\n\s+DREAMROLL VARIATION/);
      expect(contents).toContain('style:');
      expect(contents).toContain('harmony:');
      expect(contents).toContain('constraint:');
    }

    // Verify the prompt passed to the skill contains all the critical bits
    expect(cycle1.prompt).toContain('VISUAL IDENTITY');
    expect(cycle1.prompt).toContain('FULL GENOME');
    expect(cycle1.prompt).toContain('THIS PAGE MUST NOT LOOK LIKE');
    expect(cycle1.prompt).toContain('REQUIRED CSS DECLARATIONS');
    expect(cycle1.prompt).toContain('CSS signature:');
    expect(cycle1.prompt).toContain('GOOGLE FONTS');
    expect(cycle1.prompt).toContain('PAGE STRUCTURE');
    expect(cycle1.prompt).toContain('CSS QUALITY RULES');
    expect(cycle1.prompt).toContain('AI study platform for neurodivergent students');
    expect(cycle1.prompt).toContain('OBVIOUS within 2 seconds');

    // Generate morning report
    const report = formatReport(generateReport(reloaded!));
    expect(report).toContain('DREAMROLL MORNING REPORT');
    expect(report).toContain('1 gems');
    expect(report).toContain('1 weak');
    expect(report).toContain('variation_001.html');
  });

  it('resumes after simulated session restart', () => {
    // Session 1: 2 variations
    const state = createState(mkConfig());
    saveState(tmpDir, state);
    simulateCycle(state, 1, { brutus: 7, venus: 8, mercury: 7 });
    simulateCycle(state, 2, { brutus: 8, venus: 9, mercury: 8 });

    // "Session ends" — we drop all in-memory references and reload
    const resumed = loadState(tmpDir);
    expect(resumed).not.toBeNull();
    expect(resumed!.currentVariation).toBe(2);
    expect(resumed!.gems).toHaveLength(2);

    // Session 2: continue from variation 3
    const cycle3 = simulateCycle(resumed!, 3, { brutus: 6, venus: 6, mercury: 6 });
    expect(cycle3.variation.id).toBe(3);

    const final = loadState(tmpDir);
    expect(final!.currentVariation).toBe(3);
    expect(final!.variations).toHaveLength(3);
  });

  it('evolution kicks in at variation 5 and populates weights', () => {
    const state = createState(mkConfig());
    saveState(tmpDir, state);

    // Generate 5 variations, all gems with the same style genre forced
    for (let i = 1; i <= 5; i++) {
      const seed = rollSeedParameters(state);
      seed.genre = 'neo-brutalism'; // force so evolution detects the pattern
      const variation: Variation = {
        id: i,
        seed,
        verdict: {
          scores: [
            { judge: 'brutus', score: 8, comment: '' },
            { judge: 'venus', score: 8, comment: '' },
            { judge: 'mercury', score: 8, comment: '' },
          ],
          averageScore: 8.0,
          verdict: 'gem',
          hasInstantKeep: false,
        },
        screenshotPath: null,
        filesPath: null,
        createdAt: new Date().toISOString(),
      };
      state.variations.push(variation);
      state.currentVariation = i;
      state.gems.push(i);
    }

    const adjustments = maybeEvolve(state);
    expect(adjustments.length).toBeGreaterThan(0);
    expect(adjustments.some(a => a.direction.includes('neo-brutalism'))).toBe(true);
    expect(state.paramWeights).toBeDefined();
    expect(state.paramWeights!['style']?.['neo-brutalism']).toBeGreaterThan(1);
  });

  it('every rolled genome produces a complete 14-dim prompt with weighted style lead', () => {
    const state = createState(mkConfig());
    for (let i = 0; i < 20; i++) {
      const seed = rollSeedParameters(state);
      const prompt = genomeToPrompt(seed, 'test brief', i + 1, '/tmp/x.html');
      // Style is weighted as the dominating concern
      expect(prompt).toContain('VISUAL IDENTITY');
      expect(prompt).toContain(`STYLE: ${seed.genre}`);
      expect(prompt).toContain('THIS PAGE MUST NOT LOOK LIKE');
      expect(prompt).toContain('REQUIRED CSS DECLARATIONS');
      // Constraint repeated 3 times
      const matches = prompt.match(/CONSTRAINT \(mandatory/g);
      expect(matches?.length).toBe(3);
      // All 14 dimensions still listed in the full genome block
      for (const label of [
        'Style archetype:', 'Color harmony:', 'Typography:', 'Type scale:',
        'Layout pattern:', 'Density:', 'Mood:', 'Era influence:',
        'Animation:', 'Imagery:', 'Border radius:',
        'Shadow system:', 'CTA style:', 'Oblique constraint:',
      ]) {
        expect(prompt, `variation ${i + 1} missing "${label}"`).toContain(label);
      }
    }
  });
});
