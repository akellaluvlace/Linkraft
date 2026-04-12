// Tests for the two production-gap fixes:
//   1. RESPONSIVE + CSS ARCHITECTURE prompt blocks (genome.ts)
//   2. Mobile score on each judge (judges.ts + types.ts + MCP tool)

import { describe, it, expect } from 'vitest';
import {
  parseJudgeResponse,
  calculateVerdict,
  buildJudgeEvaluationPrompt,
} from '../../src/dreamroll/judges.js';
import { genomeToPrompt, type StyleGenome } from '../../src/dreamroll/genome.js';
import type { JudgeScore } from '../../src/dreamroll/types.js';

function makeGenome(overrides: Partial<StyleGenome> = {}): StyleGenome {
  return {
    genre: 'cyberpunk',
    colorPalette: 'neon-on-dark',
    harmonyBaseHue: 200,
    typography: 'space-mono-inter',
    typeScale: 'major-third',
    layoutArchetype: 'asymmetric-golden',
    density: 'dense',
    mood: 'techy-hacker',
    era: 'far-future',
    animation: 'glitch-digital',
    imagery: 'noise-texture',
    borderRadius: 'sharp-zero',
    shadows: 'no-shadows',
    ctaStyle: 'brutalist-block',
    wildcard: 'use-unacceptable-color',
    mutation: 'pure',
    copyAngle: 'bold-claim',
    sectionVariation: 'uniform',
    temperature: 0.9,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// CSS ARCHITECTURE block
// ──────────────────────────────────────────────────────────────────────────

describe('CSS ARCHITECTURE prompt block', () => {
  it('appears in every generated prompt', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('CSS ARCHITECTURE');
    expect(prompt).toContain('design tokens in :root');
  });

  it('lists required color tokens', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    for (const token of ['--bg', '--text', '--muted', '--surface', '--border', '--accent', '--accent-fg']) {
      expect(prompt, `missing color token ${token}`).toContain(token);
    }
  });

  it('lists required font tokens', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('--font-heading');
    expect(prompt).toContain('--font-body');
  });

  it('lists the 8px-multiple spacing tokens', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    for (const token of ['--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl']) {
      expect(prompt).toContain(token);
    }
  });

  it('lists radius, shadow, and motion tokens', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('--radius-sm');
    expect(prompt).toContain('--radius-md');
    expect(prompt).toContain('--radius-lg');
    expect(prompt).toContain('--shadow-sm');
    expect(prompt).toContain('--shadow-md');
    expect(prompt).toContain('--ease');
    expect(prompt).toContain('--duration');
  });

  it('instructs that every repeated value must use var(--name)', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('var(--name)');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// RESPONSIVE block
// ──────────────────────────────────────────────────────────────────────────

describe('RESPONSIVE prompt block', () => {
  it('appears in every generated prompt', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('RESPONSIVE');
    expect(prompt).toContain('375px');
  });

  it('mandates the mobile media query', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('@media (max-width: 375px)');
  });

  it('requires CTA above the fold at 667px viewport height', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('above the fold');
    expect(prompt).toContain('667');
  });

  it('mandates 44x44 minimum touch targets', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('44');
  });

  it('mandates 14px minimum text on mobile', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('14px');
  });

  it('forbids horizontal scroll at 375px', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt.toLowerCase()).toContain('horizontal scroll');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Judge prompt includes mobile criteria
// ──────────────────────────────────────────────────────────────────────────

describe('buildJudgeEvaluationPrompt with mobile criteria', () => {
  it('asks for both desktop Score and Mobile score', () => {
    const prompt = buildJudgeEvaluationPrompt('You are BRUTUS.', 'Variation v1.html', 'brutus');
    expect(prompt).toContain('Score: [1-10]');
    expect(prompt).toContain('Mobile score: [1-10]');
    expect(prompt).toContain('Mobile comment:');
  });

  it('uses the BRUTUS mobile lens', () => {
    const prompt = buildJudgeEvaluationPrompt('brutus', 'X', 'brutus');
    expect(prompt).toContain('ABOVE the fold');
  });

  it('uses the VENUS mobile lens', () => {
    const prompt = buildJudgeEvaluationPrompt('venus', 'X', 'venus');
    expect(prompt.toLowerCase()).toContain('designed at mobile');
  });

  it('uses the MERCURY mobile lens', () => {
    const prompt = buildJudgeEvaluationPrompt('mercury', 'X', 'mercury');
    expect(prompt.toLowerCase()).toContain('thumb');
    expect(prompt).toContain('44');
  });

  it('warns that mobile counts toward the gem threshold', () => {
    const prompt = buildJudgeEvaluationPrompt('BRUTUS', 'X', 'brutus');
    expect(prompt.toLowerCase()).toContain('will not become a gem');
  });

  it('legacy two-argument form still works (backward compat)', () => {
    const prompt = buildJudgeEvaluationPrompt('personality', 'X');
    expect(prompt).toContain('Mobile score');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// parseJudgeResponse understands mobile scores
// ──────────────────────────────────────────────────────────────────────────

describe('parseJudgeResponse', () => {
  it('parses the legacy desktop-only format', () => {
    const result = parseJudgeResponse('Score: 7\nComment: Good hero, weak CTA.');
    expect(result.score).toBe(7);
    expect(result.comment).toBe('Good hero, weak CTA.');
    expect(result.mobileScore).toBeUndefined();
    expect(result.mobileComment).toBeUndefined();
  });

  it('parses the new desktop + mobile format', () => {
    const raw = [
      'Score: 8',
      'Comment: Clean hero, good hierarchy.',
      'Mobile score: 5',
      'Mobile comment: CTA drops below the fold at 667px.',
    ].join('\n');
    const result = parseJudgeResponse(raw);
    expect(result.score).toBe(8);
    expect(result.comment).toBe('Clean hero, good hierarchy.');
    expect(result.mobileScore).toBe(5);
    expect(result.mobileComment).toBe('CTA drops below the fold at 667px.');
  });

  it('desktop comment does not leak the mobile block', () => {
    const raw = 'Score: 9\nComment: pristine\nMobile score: 3\nMobile comment: trash';
    const result = parseJudgeResponse(raw);
    expect(result.comment).toBe('pristine');
    expect(result.comment).not.toContain('Mobile');
  });

  it('clamps mobile score to 1..10', () => {
    const raw = 'Score: 7\nComment: fine\nMobile score: 99\nMobile comment: -';
    expect(parseJudgeResponse(raw).mobileScore).toBe(10);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// calculateVerdict with mobile
// ──────────────────────────────────────────────────────────────────────────

function makeScores(desktop: number[], mobile?: number[]): JudgeScore[] {
  const judges: Array<JudgeScore['judge']> = ['brutus', 'venus', 'mercury'];
  return desktop.map((d, i) => ({
    judge: judges[i]!,
    score: d,
    comment: '',
    ...(mobile ? { mobileScore: mobile[i]!, mobileComment: '' } : {}),
  }));
}

describe('calculateVerdict with mobile scores', () => {
  it('desktop-only still works (backward compat)', () => {
    const v = calculateVerdict(makeScores([8, 7, 9]));
    expect(v.averageScore).toBe(8);
    expect(v.verdict).toBe('gem');
  });

  it('averages desktop + mobile equally when mobile is provided', () => {
    // Six numbers: 8 + 7 + 9 + 4 + 5 + 4 = 37 / 6 = 6.17 -> 6.2
    const v = calculateVerdict(makeScores([8, 7, 9], [4, 5, 4]));
    expect(v.averageScore).toBeCloseTo(6.2, 1);
    expect(v.verdict).toBe('iterate');
  });

  it('drops a would-be gem to iterate when mobile scores are bad', () => {
    // Desktop-only average would be 9.0 (gem). With bad mobile the blend is
    // (9+9+9+3+3+3)/6 = 6.0 which is still above 5.0 -> iterate, not gem.
    const v = calculateVerdict(makeScores([9, 9, 9], [3, 3, 3]));
    expect(v.verdict).toBe('iterate');
    expect(v.averageScore).toBe(6);
  });

  it('a single desktop 10 still hits hasInstantKeep even if mobile is mediocre', () => {
    const v = calculateVerdict(makeScores([10, 6, 6], [6, 6, 6]));
    expect(v.hasInstantKeep).toBe(true);
    expect(v.verdict).toBe('gem');
  });

  it('a single mobile 10 also triggers hasInstantKeep', () => {
    const v = calculateVerdict(makeScores([6, 6, 6], [10, 6, 6]));
    expect(v.hasInstantKeep).toBe(true);
  });

  it('mixed: some judges have mobile, others do not', () => {
    const scores: JudgeScore[] = [
      { judge: 'brutus', score: 8, comment: '', mobileScore: 6, mobileComment: '' },
      { judge: 'venus', score: 7, comment: '' }, // no mobile
      { judge: 'mercury', score: 9, comment: '', mobileScore: 5, mobileComment: '' },
    ];
    const v = calculateVerdict(scores);
    // 8 + 6 + 7 + 9 + 5 = 35 / 5 = 7.0
    expect(v.averageScore).toBe(7);
  });
});
