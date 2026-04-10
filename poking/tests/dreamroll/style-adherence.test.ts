import { describe, it, expect } from 'vitest';
import { checkDistinctiveCSS, getStyleArchetype, STYLE_ARCHETYPES } from '../../src/dreamroll/params.js';
import { applyStyleAdherenceDeduction } from '../../src/dreamroll/judges.js';

describe('all 30 archetypes have distinctive metadata', () => {
  it('every archetype has distinctive, distinctiveCSS, and notLikeThis', () => {
    expect(STYLE_ARCHETYPES).toHaveLength(30);
    for (const a of STYLE_ARCHETYPES) {
      expect(a.distinctive, `${a.id} missing distinctive description`).toBeTruthy();
      expect(a.distinctive.length, `${a.id} distinctive too short`).toBeGreaterThan(50);
      expect(a.distinctiveCSS, `${a.id} missing distinctiveCSS`).toBeDefined();
      expect(a.distinctiveCSS.length, `${a.id} needs >= 2 required CSS strings`).toBeGreaterThanOrEqual(2);
      expect(a.notLikeThis, `${a.id} missing notLikeThis`).toBeDefined();
      expect(a.notLikeThis.length, `${a.id} needs >= 3 anti-patterns`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('checkDistinctiveCSS', () => {
  it('detects all required strings when present', () => {
    const html = `
      <style>
        .card { backdrop-filter: blur(10px); background: rgba(255,255,255,0.15); border: 1px solid rgba(0,0,0,0.2); }
      </style>
    `;
    const result = checkDistinctiveCSS(html, 'glassmorphism');
    expect(result.missing).toEqual([]);
    expect(result.present.length).toBeGreaterThanOrEqual(3);
  });

  it('detects missing strings', () => {
    const html = `<style>.card { background: #fff; border: 1px solid #ccc; }</style>`;
    const result = checkDistinctiveCSS(html, 'glassmorphism');
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing).toContain('backdrop-filter: blur(');
  });

  it('returns empty for unknown style', () => {
    const result = checkDistinctiveCSS('<html></html>', 'nonexistent-style');
    expect(result).toEqual({ required: [], present: [], missing: [] });
  });

  it('detects neo-brutalism signature', () => {
    const good = `
      <style>
        .card { border: 3px solid #000; box-shadow: 6px 6px 0 #000; background: #FF6B6B; }
      </style>
    `;
    const bad = `<style>.card { border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }</style>`;
    expect(checkDistinctiveCSS(good, 'neo-brutalism').missing).toEqual([]);
    expect(checkDistinctiveCSS(bad, 'neo-brutalism').missing.length).toBeGreaterThan(0);
  });
});

describe('applyStyleAdherenceDeduction', () => {
  const baseScores = [
    { judge: 'brutus' as const, score: 8, comment: 'clean' },
    { judge: 'venus' as const, score: 7, comment: 'pretty' },
    { judge: 'mercury' as const, score: 7, comment: 'converts' },
  ];

  it('deducts 2 BRUTUS points when distinctive CSS is missing', () => {
    const badHtml = '<html><style>.x { color: red; }</style></html>';
    const result = applyStyleAdherenceDeduction(baseScores, badHtml, 'neo-brutalism');
    expect(result.deducted).toBe(true);
    expect(result.missing.length).toBeGreaterThan(0);
    const brutus = result.scores.find(s => s.judge === 'brutus')!;
    expect(brutus.score).toBe(6); // 8 - 2
    expect(brutus.comment).toContain('auto: -2');
  });

  it('leaves scores untouched when all distinctive CSS present', () => {
    const goodHtml = `
      <style>
        .card { border: 3px solid #000; box-shadow: 6px 6px 0 #000; background: #FF6B6B; }
      </style>
    `;
    const result = applyStyleAdherenceDeduction(baseScores, goodHtml, 'neo-brutalism');
    expect(result.deducted).toBe(false);
    expect(result.missing).toEqual([]);
    const brutus = result.scores.find(s => s.judge === 'brutus')!;
    expect(brutus.score).toBe(8);
  });

  it('does not deduct below 1', () => {
    const lowScores = [
      { judge: 'brutus' as const, score: 2, comment: 'weak' },
      { judge: 'venus' as const, score: 3, comment: 'ugly' },
      { judge: 'mercury' as const, score: 2, comment: 'no conversion' },
    ];
    const result = applyStyleAdherenceDeduction(lowScores, '<html></html>', 'neo-brutalism');
    const brutus = result.scores.find(s => s.judge === 'brutus')!;
    expect(brutus.score).toBeGreaterThanOrEqual(1);
  });

  it('only deducts from BRUTUS, not VENUS or MERCURY', () => {
    const result = applyStyleAdherenceDeduction(baseScores, '<html></html>', 'neo-brutalism');
    const venus = result.scores.find(s => s.judge === 'venus')!;
    const mercury = result.scores.find(s => s.judge === 'mercury')!;
    expect(venus.score).toBe(7);
    expect(mercury.score).toBe(7);
  });

  it('getStyleArchetype returns full metadata', () => {
    const arch = getStyleArchetype('glassmorphism');
    expect(arch).toBeDefined();
    expect(arch!.distinctive).toContain('translucent');
    expect(arch!.distinctiveCSS).toContain('backdrop-filter: blur(');
    expect(arch!.notLikeThis.length).toBeGreaterThan(0);
  });
});
