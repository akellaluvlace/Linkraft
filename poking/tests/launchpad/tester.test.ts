import { describe, it, expect } from 'vitest';
import { runTests, formatTestResults } from '../../src/launchpad/tester.js';

describe('runTests', () => {
  it('returns test results structure', async () => {
    const results = await runTests('http://localhost:3000');
    expect(results.screenshots.length).toBe(4);
    expect(results.ctaVisibility.length).toBe(4);
    expect(Array.isArray(results.issues)).toBe(true);
  });

  it('reports lighthouse as unavailable', async () => {
    const results = await runTests('http://localhost:3000');
    expect(results.lighthouseScores).toBeNull();
    expect(results.issues.some(i => i.includes('Lighthouse'))).toBe(true);
  });

  it('includes all viewport widths', async () => {
    const results = await runTests('http://localhost:3000');
    const widths = results.screenshots.map(s => s.width);
    expect(widths).toContain(375);
    expect(widths).toContain(768);
    expect(widths).toContain(1024);
    expect(widths).toContain(1440);
  });
});

describe('formatTestResults', () => {
  it('formats results as readable string', () => {
    const results = {
      lighthouseScores: null,
      screenshots: [{ width: 375, path: null }, { width: 1440, path: null }],
      ctaVisibility: [{ width: 375, visible: true }, { width: 1440, visible: true }],
      issues: ['Lighthouse not available'],
    };
    const formatted = formatTestResults(results);
    expect(formatted).toContain('LAUNCHPAD TEST RESULTS');
    expect(formatted).toContain('375px');
    expect(formatted).toContain('1440px');
    expect(formatted).toContain('VISIBLE');
  });
});
