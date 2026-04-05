import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  loadJudgePrompt,
  parseJudgeResponse,
  calculateVerdict,
  judgeVariation,
} from '../../src/dreamroll/judges.js';

const AGENTS_DIR = path.resolve(__dirname, '../../agents');

describe('loadJudgePrompt', () => {
  it('loads brutus prompt', () => {
    const prompt = loadJudgePrompt('brutus', AGENTS_DIR);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('BRUTUS');
    expect(prompt).toContain('Minimalist');
  });

  it('loads venus prompt', () => {
    const prompt = loadJudgePrompt('venus', AGENTS_DIR);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('VENUS');
    expect(prompt).toContain('Beauty');
  });

  it('loads mercury prompt', () => {
    const prompt = loadJudgePrompt('mercury', AGENTS_DIR);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('MERCURY');
    expect(prompt).toContain('Conversion');
  });

  it('returns null for missing judge', () => {
    const prompt = loadJudgePrompt('brutus', '/nonexistent/path');
    expect(prompt).toBeNull();
  });
});

describe('parseJudgeResponse', () => {
  it('parses score and comment', () => {
    const response = 'Score: 8\nComment: Clean hierarchy. The whitespace sings.';
    const parsed = parseJudgeResponse(response);
    expect(parsed.score).toBe(8);
    expect(parsed.comment).toContain('whitespace');
  });

  it('clamps score to 1-10', () => {
    expect(parseJudgeResponse('Score: 15\nComment: x').score).toBe(10);
    expect(parseJudgeResponse('Score: 0\nComment: x').score).toBe(1);
  });

  it('defaults to 5 if no score found', () => {
    const parsed = parseJudgeResponse('This design is mediocre');
    expect(parsed.score).toBe(5);
  });
});

describe('calculateVerdict', () => {
  it('gem: average >= 7', () => {
    const scores = [
      { judge: 'brutus' as const, score: 8, comment: '' },
      { judge: 'venus' as const, score: 7, comment: '' },
      { judge: 'mercury' as const, score: 7, comment: '' },
    ];
    const verdict = calculateVerdict(scores);
    expect(verdict.verdict).toBe('gem');
    expect(verdict.averageScore).toBeCloseTo(7.3, 1);
  });

  it('iterate: average >= 5 and < 7', () => {
    const scores = [
      { judge: 'brutus' as const, score: 6, comment: '' },
      { judge: 'venus' as const, score: 5, comment: '' },
      { judge: 'mercury' as const, score: 6, comment: '' },
    ];
    const verdict = calculateVerdict(scores);
    expect(verdict.verdict).toBe('iterate');
  });

  it('discard: average < 5', () => {
    const scores = [
      { judge: 'brutus' as const, score: 3, comment: '' },
      { judge: 'venus' as const, score: 2, comment: '' },
      { judge: 'mercury' as const, score: 4, comment: '' },
    ];
    const verdict = calculateVerdict(scores);
    expect(verdict.verdict).toBe('discard');
  });

  it('instant keep: any single 10', () => {
    const scores = [
      { judge: 'brutus' as const, score: 10, comment: '' },
      { judge: 'venus' as const, score: 3, comment: '' },
      { judge: 'mercury' as const, score: 2, comment: '' },
    ];
    const verdict = calculateVerdict(scores);
    expect(verdict.verdict).toBe('gem');
    expect(verdict.hasInstantKeep).toBe(true);
  });

  it('handles empty scores', () => {
    const verdict = calculateVerdict([]);
    expect(verdict.verdict).toBe('discard');
    expect(verdict.averageScore).toBe(0);
  });
});

describe('judgeVariation', () => {
  it('returns mock scores when no caller provided', async () => {
    const verdict = await judgeVariation('test variation', AGENTS_DIR, null);
    expect(verdict.scores.length).toBe(3);
    expect(verdict.scores.every(s => s.score >= 1 && s.score <= 10)).toBe(true);
    expect(verdict.scores.every(s => s.comment.includes('Mock'))).toBe(true);
  });

  it('uses caller when provided', async () => {
    const mockCaller = async (_system: string, _user: string) => 'Score: 9\nComment: Magnificent.';
    const verdict = await judgeVariation('test', AGENTS_DIR, mockCaller);
    expect(verdict.scores.length).toBe(3);
    expect(verdict.scores.every(s => s.score === 9)).toBe(true);
    expect(verdict.averageScore).toBe(9);
    expect(verdict.verdict).toBe('gem');
  });

  it('handles caller errors gracefully', async () => {
    const failingCaller = async () => { throw new Error('API down'); };
    const verdict = await judgeVariation('test', AGENTS_DIR, failingCaller);
    expect(verdict.scores.length).toBe(3);
    expect(verdict.scores.every(s => s.score === 5)).toBe(true);
  });
});
