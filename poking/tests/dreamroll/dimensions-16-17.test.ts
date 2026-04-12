// Tests for the two new genome dimensions added in v1.2:
//   dimension 16 — COPY_ANGLE   (10 options, headline framing)
//   dimension 17 — SECTION_VARIATION (3 options, internal page rhythm)
// Plus the genomeFilename helper that names files using key genome bits.

import { describe, it, expect } from 'vitest';
import {
  COPY_ANGLE_POOL,
  COPY_ANGLE_SPECS,
  SECTION_VARIATION_POOL,
  SECTION_VARIATION_SPECS,
  rollParams,
  getCopyAngle,
  getSectionVariation,
} from '../../src/dreamroll/params.js';
import { genomeToPrompt, genomeFilename, genomeSummary, type StyleGenome } from '../../src/dreamroll/genome.js';

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
    copyAngle: 'pain-point-first',
    sectionVariation: 'subtle',
    temperature: 0.9,
    ...overrides,
  };
}

describe('COPY_ANGLE pool', () => {
  it('has the 10 spec values', () => {
    expect(COPY_ANGLE_POOL).toEqual([
      'pain-point-first',
      'outcome-first',
      'social-proof-first',
      'contrarian',
      'story',
      'data-driven',
      'question',
      'comparison',
      'minimal',
      'bold-claim',
    ]);
  });

  it('every spec has guidance text', () => {
    for (const spec of COPY_ANGLE_SPECS) {
      expect(spec.guidance.length).toBeGreaterThan(20);
    }
  });

  it('getCopyAngle returns the matching spec', () => {
    expect(getCopyAngle('contrarian')?.id).toBe('contrarian');
    expect(getCopyAngle('does-not-exist')).toBeUndefined();
  });

  it('rollParams always assigns a copyAngle from the pool', () => {
    for (let i = 0; i < 50; i++) {
      const seed = rollParams();
      expect(seed.copyAngle).toBeDefined();
      expect(COPY_ANGLE_POOL).toContain(seed.copyAngle!);
    }
  });
});

describe('SECTION_VARIATION pool', () => {
  it('has the 3 spec values', () => {
    expect(SECTION_VARIATION_POOL).toEqual(['uniform', 'subtle', 'dramatic']);
  });

  it('every spec has instructions text', () => {
    for (const spec of SECTION_VARIATION_SPECS) {
      expect(spec.instructions.length).toBeGreaterThan(20);
    }
  });

  it('getSectionVariation returns the matching spec', () => {
    expect(getSectionVariation('dramatic')?.id).toBe('dramatic');
    expect(getSectionVariation('nope')).toBeUndefined();
  });

  it('rollParams always assigns a sectionVariation from the pool', () => {
    for (let i = 0; i < 50; i++) {
      const seed = rollParams();
      expect(seed.sectionVariation).toBeDefined();
      expect(SECTION_VARIATION_POOL).toContain(seed.sectionVariation!);
    }
  });
});

describe('genomeToPrompt includes the new dimensions', () => {
  it('includes a COPY ANGLE block with the rolled angle and its guidance', () => {
    const genome = makeGenome({ copyAngle: 'contrarian' });
    const prompt = genomeToPrompt(genome, 'A SaaS thing', 1, '/tmp/x.html');
    expect(prompt).toContain('COPY ANGLE: contrarian');
    expect(prompt).toContain('challenging an assumption');
  });

  it('includes a SECTION RHYTHM block with the rolled variation', () => {
    const genome = makeGenome({ sectionVariation: 'dramatic' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('SECTION RHYTHM: dramatic');
    expect(prompt).toContain('rolls its own');
  });

  it('lists copy angle, section var, and image treatment in the priority tiers', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('PRIORITY TIERS');
    expect(prompt).toContain('Copy angle:');
    expect(prompt).toContain('Section var:');
    expect(prompt).toContain('Img treat:');
  });

  it('falls back to a default copyAngle when missing', () => {
    const prompt = genomeToPrompt(makeGenome({ copyAngle: undefined }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('COPY ANGLE: outcome-first');
  });

  it('falls back to uniform sectionVariation when missing', () => {
    const prompt = genomeToPrompt(makeGenome({ sectionVariation: undefined }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('SECTION RHYTHM: uniform');
  });

  it('genomeSummary surfaces copy angle and non-default section rhythm', () => {
    const summary = genomeSummary(makeGenome({ copyAngle: 'minimal', sectionVariation: 'dramatic' }));
    expect(summary).toContain('copy=minimal');
    expect(summary).toContain('section=dramatic');
  });

  it('genomeSummary omits section variation when uniform', () => {
    const summary = genomeSummary(makeGenome({ sectionVariation: 'uniform' }));
    expect(summary).not.toContain('section=');
  });
});

describe('genomeFilename', () => {
  it('encodes number, style, palette, and mutation', () => {
    expect(genomeFilename(1, makeGenome({ genre: 'cyberpunk', colorPalette: 'neon-on-dark', mutation: 'pure' })))
      .toBe('001_cyberpunk_neon-on-dark_pure.html');
  });

  it('zero-pads variation numbers to 3 digits', () => {
    expect(genomeFilename(7, makeGenome())).toMatch(/^007_/);
    expect(genomeFilename(150, makeGenome())).toMatch(/^150_/);
  });

  it('slugifies values with special characters', () => {
    expect(genomeFilename(2, makeGenome({ genre: 'Magazine Edit!', colorPalette: 'Earth Tones', mutation: 'mashup' })))
      .toBe('002_magazine-edit_earth-tones_mashup.html');
  });

  it('falls back to "pure" when mutation is undefined', () => {
    expect(genomeFilename(3, makeGenome({ mutation: undefined }))).toContain('_pure.html');
  });

  it('includes the right extension and a single delimiter style', () => {
    const name = genomeFilename(99, makeGenome());
    expect(name.endsWith('.html')).toBe(true);
    expect(name.split('_')).toHaveLength(4); // NNN, style, palette, mutation.html
  });
});
