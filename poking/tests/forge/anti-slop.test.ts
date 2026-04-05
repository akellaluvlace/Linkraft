import { describe, it, expect } from 'vitest';
import { detectViolations, generateSlopReport, formatSlopReport } from '../../src/forge/anti-slop.js';

describe('detectViolations', () => {
  it('detects forbidden patterns in code', () => {
    const content = `<div className="rounded-lg shadow-md p-4">
  <button className="bg-gradient-to-r from-blue-500 to-purple-500">Click</button>
</div>`;
    const violations = detectViolations(
      'page.tsx',
      content,
      ['rounded-lg', 'shadow-md', 'bg-gradient-to-'],
    );
    expect(violations.length).toBe(3);
  });

  it('reports correct line numbers', () => {
    const content = `line 1
line 2
<div className="rounded-lg">
line 4
<span className="shadow-md">`;
    const violations = detectViolations('test.tsx', content, ['rounded-lg', 'shadow-md']);
    expect(violations.length).toBe(2);
    expect(violations[0]!.line).toBe(3);
    expect(violations[0]!.pattern).toBe('rounded-lg');
    expect(violations[1]!.line).toBe(5);
    expect(violations[1]!.pattern).toBe('shadow-md');
  });

  it('skips comment lines', () => {
    const content = `// rounded-lg is not allowed
/* shadow-md also forbidden */
* rounded-full in JSDoc
<div className="rounded-lg">real violation</div>`;
    const violations = detectViolations('test.tsx', content, ['rounded-lg', 'shadow-md', 'rounded-full']);
    expect(violations.length).toBe(1);
    expect(violations[0]!.line).toBe(4);
  });

  it('provides suggestions for known patterns', () => {
    const content = `<div className="rounded-lg">`;
    const violations = detectViolations('test.tsx', content, ['rounded-lg']);
    expect(violations[0]!.suggestion).toContain('border radius');
  });

  it('provides default suggestion for unknown patterns', () => {
    const content = `<div className="custom-forbidden-thing">`;
    const violations = detectViolations('test.tsx', content, ['custom-forbidden-thing']);
    expect(violations[0]!.suggestion).toContain('Remove or replace');
  });

  it('returns empty for clean content', () => {
    const content = `<button className="border-3 border-black rounded-none">OK</button>`;
    const violations = detectViolations('test.tsx', content, ['rounded-lg', 'shadow-md']);
    expect(violations.length).toBe(0);
  });

  it('includes trimmed context line', () => {
    const content = `    <div className="rounded-lg p-4">    `;
    const violations = detectViolations('test.tsx', content, ['rounded-lg']);
    expect(violations[0]!.context).toBe('<div className="rounded-lg p-4">');
  });
});

describe('generateSlopReport', () => {
  it('generates correct counts', () => {
    const violations = [
      { file: 'a.tsx', line: 1, pattern: 'rounded-lg', context: '', suggestion: '' },
      { file: 'a.tsx', line: 5, pattern: 'shadow-md', context: '', suggestion: '' },
      { file: 'b.tsx', line: 3, pattern: 'rounded-lg', context: '', suggestion: '' },
    ];
    const report = generateSlopReport(violations);
    expect(report.totalViolations).toBe(3);
    expect(report.fileCount).toBe(2);
    expect(report.byPattern['rounded-lg']).toBe(2);
    expect(report.byPattern['shadow-md']).toBe(1);
    expect(report.byFile['a.tsx']).toBe(2);
    expect(report.byFile['b.tsx']).toBe(1);
  });

  it('handles empty violations', () => {
    const report = generateSlopReport([]);
    expect(report.totalViolations).toBe(0);
    expect(report.fileCount).toBe(0);
  });
});

describe('formatSlopReport', () => {
  it('returns clean message for zero violations', () => {
    const report = generateSlopReport([]);
    const formatted = formatSlopReport(report);
    expect(formatted).toContain('No forbidden pattern violations');
  });

  it('includes violation details for non-empty report', () => {
    const violations = [
      { file: 'hero.tsx', line: 10, pattern: 'rounded-lg', context: '<div className="rounded-lg">', suggestion: 'Use rounded-none' },
    ];
    const report = generateSlopReport(violations);
    const formatted = formatSlopReport(report);
    expect(formatted).toContain('1 violation');
    expect(formatted).toContain('hero.tsx');
    expect(formatted).toContain('L10');
    expect(formatted).toContain('rounded-lg');
  });
});
