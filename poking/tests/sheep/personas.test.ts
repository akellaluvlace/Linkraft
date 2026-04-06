import { describe, it, expect } from 'vitest';
import { generateDeezeebalzRoast, generateMarthaMessage, generateSheepMonologue } from '../../src/sheep/personas.js';
import type { BugReport } from '../../src/sheep/types.js';

describe('generateDeezeebalzRoast', () => {
  it('generates roast for critical bug', () => {
    const bug: BugReport = { id: '1', file: 'auth.ts', line: 10, severity: 'critical', category: 'security', description: 'SQL injection', fix: null, autoFixed: false };
    const roast = generateDeezeebalzRoast(bug);
    expect(roast.length).toBeGreaterThan(10);
  });

  it('generates roast for medium bug', () => {
    const bug: BugReport = { id: '2', file: 'utils.ts', line: 5, severity: 'medium', category: 'quality', description: 'unused variable', fix: null, autoFixed: true };
    const roast = generateDeezeebalzRoast(bug);
    expect(roast.length).toBeGreaterThan(10);
  });
});

describe('generateMarthaMessage', () => {
  it('generates form-related message', () => {
    const msg = generateMarthaMessage('Form Validation');
    expect(msg).toContain('"');
  });

  it('generates auth-related message', () => {
    const msg = generateMarthaMessage('Authentication');
    expect(msg).toContain('"');
  });

  it('generates generic message for unknown area', () => {
    const msg = generateMarthaMessage('Database Schema');
    expect(msg).toContain('"');
  });

  it('includes UX issue when provided', () => {
    const msg = generateMarthaMessage('Form', 'missing inline validation');
    expect(msg).toContain('Martha exposed');
  });
});

describe('generateSheepMonologue', () => {
  it('generates first cycle monologue', () => {
    const mono = generateSheepMonologue(1, 2, 'Auth');
    expect(mono.length).toBeGreaterThan(20);
  });

  it('generates clean area monologue', () => {
    const mono = generateSheepMonologue(5, 0, 'Utils');
    expect(mono.length).toBeGreaterThan(20);
  });

  it('generates high-bug monologue', () => {
    const mono = generateSheepMonologue(3, 5, 'API Routes');
    expect(mono.length).toBeGreaterThan(20);
  });
});
