import { describe, it, expect } from 'vitest';
import { generateReport, formatReport } from '../../src/dreamroll/reporter.js';
import type { DreamrollState, Variation } from '../../src/dreamroll/types.js';

function makeGem(id: number, avgScore: number): Variation {
  return {
    id,
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
      wildcard: 'all-sharp-corners',
    },
    verdict: {
      scores: [
        { judge: 'brutus', score: avgScore, comment: 'Clean.' },
        { judge: 'venus', score: avgScore, comment: 'Beautiful.' },
        { judge: 'mercury', score: avgScore, comment: 'Converts.' },
      ],
      averageScore: avgScore,
      verdict: 'gem',
      hasInstantKeep: false,
    },
    screenshotPath: `.dreamroll/gems/v${id}/screenshot.png`,
    filesPath: null,
    createdAt: new Date().toISOString(),
  };
}

function makeDiscard(id: number): Variation {
  return {
    id,
    seed: {
      colorPalette: 'cool',
      typography: 'mono-sans',
      layoutArchetype: 'centered',
      genre: 'glass',
      density: 'sparse',
      mood: 'playful',
      era: '1990s-grunge',
      animation: 'none',
      imagery: 'no-images-pure-type',
      temperature: 1.1,
      wildcard: 'no-borders',
    },
    verdict: {
      scores: [
        { judge: 'brutus', score: 2, comment: 'Awful.' },
        { judge: 'venus', score: 3, comment: 'Ugly.' },
        { judge: 'mercury', score: 2, comment: 'No CTA.' },
      ],
      averageScore: 2.3,
      verdict: 'discard',
      hasInstantKeep: false,
    },
    screenshotPath: null,
    filesPath: null,
    createdAt: new Date().toISOString(),
  };
}

function makeState(): DreamrollState {
  return {
    config: { basePage: 'landing.tsx', targetVariations: 20, budgetHours: 4, projectRoot: '/tmp' },
    currentVariation: 20,
    variations: [
      makeGem(1, 8.5),
      makeGem(5, 9.0),
      makeGem(10, 7.5),
      makeDiscard(2),
      makeDiscard(3),
      makeDiscard(4),
    ],
    gems: [1, 5, 10],
    evolutionAdjustments: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    elapsedMs: 3_600_000, // 1 hour
    status: 'completed',
  };
}

describe('generateReport', () => {
  it('produces correct counts', () => {
    const report = generateReport(makeState());
    expect(report.gemCount).toBe(3);
    expect(report.discardedCount).toBe(3);
    expect(report.totalVariations).toBe(6);
  });

  it('sorts top gems by score descending', () => {
    const report = generateReport(makeState());
    expect(report.topGems.length).toBeGreaterThan(0);
    expect(report.topGems[0]!.averageScore).toBe(9.0);
    expect(report.topGems[1]!.averageScore).toBe(8.5);
  });

  it('formats duration correctly', () => {
    const report = generateReport(makeState());
    expect(report.duration).toBe('1h 0m');
  });

  it('includes wildcard discoveries from gems', () => {
    const report = generateReport(makeState());
    expect(report.wildcardDiscoveries.length).toBeGreaterThan(0);
  });
});

describe('formatReport', () => {
  it('includes DREAMROLL COMPLETE header', () => {
    const report = generateReport(makeState());
    const formatted = formatReport(report);
    expect(formatted).toContain('DREAMROLL COMPLETE');
  });

  it('includes gem count and stats', () => {
    const report = generateReport(makeState());
    const formatted = formatReport(report);
    expect(formatted).toContain('Gems saved: 3');
    expect(formatted).toContain('Discarded: 3');
  });

  it('includes top gems with scores', () => {
    const report = generateReport(makeState());
    const formatted = formatReport(report);
    expect(formatted).toContain('TOP GEMS');
    expect(formatted).toContain('9/10');
    expect(formatted).toContain('BRUTUS');
    expect(formatted).toContain('VENUS');
    expect(formatted).toContain('MERCURY');
  });

  it('includes screenshot paths', () => {
    const report = generateReport(makeState());
    const formatted = formatReport(report);
    expect(formatted).toContain('.dreamroll/gems/');
  });
});
