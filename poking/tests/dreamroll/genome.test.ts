import { describe, it, expect } from 'vitest';
import { genomeToPrompt, serializeGenomeAsComment, genomeSummary } from '../../src/dreamroll/genome.js';
import { rollParams } from '../../src/dreamroll/params.js';
import type { StyleGenome } from '../../src/dreamroll/genome.js';

function makeGenome(overrides: Partial<StyleGenome> = {}): StyleGenome {
  return {
    genre: 'glassmorphism',
    colorPalette: 'jewel-tones',
    harmonyBaseHue: 270,
    typography: 'cormorant-proza',
    typeScale: 'golden-ratio',
    layoutArchetype: 'stacked-panels',
    density: 'sparse',
    mood: 'premium-luxury',
    era: '2020s-modern',
    animation: 'cinematic-reveal',
    imagery: 'abstract-blobs',
    borderRadius: 'rounded-large',
    shadows: 'soft-neumorphic',
    ctaStyle: 'pill-glow',
    wildcard: 'glass-everything',
    mutation: 'pure',
    temperature: 0.9,
    ...overrides,
  };
}

describe('genomeToPrompt', () => {
  it('includes all 15 dimensions in the full genome block', () => {
    const genome = makeGenome({ mutation: 'pure' });
    const prompt = genomeToPrompt(genome, 'AI study app for students', 7, '/tmp/v007.html');
    expect(prompt).toContain('Style archetype:  glassmorphism');
    expect(prompt).toContain('jewel-tones');
    expect(prompt).toContain('Typography:       cormorant-proza');
    expect(prompt).toContain('Type scale:       golden-ratio');
    expect(prompt).toContain('Layout pattern:   stacked-panels');
    expect(prompt).toContain('Density:          sparse');
    expect(prompt).toContain('Mood:             premium-luxury');
    expect(prompt).toContain('Era influence:    2020s-modern');
    expect(prompt).toContain('Animation:        cinematic-reveal');
    expect(prompt).toContain('Imagery:          abstract-blobs');
    expect(prompt).toContain('Border radius:    rounded-large');
    expect(prompt).toContain('Shadow system:    soft-neumorphic');
    expect(prompt).toContain('CTA style:        pill-glow');
    expect(prompt).toContain('Oblique constraint: glass-everything');
    expect(prompt).toContain('Style mutation:   pure');
  });

  it('leads with VISUAL IDENTITY section as the most important part', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('VISUAL IDENTITY (this is the most important part)');
    // VISUAL IDENTITY must appear before the FULL GENOME block
    const idPos = prompt.indexOf('VISUAL IDENTITY');
    const genomePos = prompt.indexOf('FULL GENOME');
    expect(idPos).toBeGreaterThan(0);
    expect(idPos).toBeLessThan(genomePos);
  });

  it('includes THIS PAGE MUST NOT LOOK LIKE section', () => {
    const prompt = genomeToPrompt(makeGenome({ genre: 'neo-brutalism' }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('THIS PAGE MUST NOT LOOK LIKE');
    // Neo-brutalism anti-patterns
    expect(prompt).toContain('rounded corners');
    expect(prompt).toContain('gradient backgrounds');
  });

  it('repeats the constraint 3 times', () => {
    const prompt = genomeToPrompt(makeGenome({ wildcard: 'one-font-only' }), 'X', 1, '/tmp/x.html');
    const matches = prompt.match(/CONSTRAINT \(mandatory/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(3);
  });

  it('ends with the failure warning about obvious style', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('you have failed');
    expect(prompt).toContain('OBVIOUS within 2 seconds');
  });

  it('lists required distinctive CSS declarations', () => {
    const prompt = genomeToPrompt(makeGenome({ genre: 'neo-brutalism' }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('REQUIRED CSS DECLARATIONS');
    expect(prompt).toContain('border: 3px solid #000');
    expect(prompt).toContain('box-shadow:');
  });

  it('includes the brief and output path', () => {
    const prompt = genomeToPrompt(makeGenome(), 'Custom brief', 3, '/path/to/v003.html');
    expect(prompt).toContain('Custom brief');
    expect(prompt).toContain('/path/to/v003.html');
    expect(prompt).toContain('#003');
  });

  it('includes the CSS signature for the chosen style', () => {
    const prompt = genomeToPrompt(makeGenome({ genre: 'neo-brutalism' }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('border: 3px solid #000');
  });

  it('includes Google Fonts link with correct fonts', () => {
    const prompt = genomeToPrompt(makeGenome({ typography: 'bebas-heebo' }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('Bebas+Neue');
    expect(prompt).toContain('Heebo');
  });

  it('includes algorithmic palette with base hue', () => {
    const prompt = genomeToPrompt(makeGenome({ colorPalette: 'triadic', harmonyBaseHue: 100 }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('base hue 100°');
    expect(prompt).toContain('hsl(');
  });

  it('includes preset palette for curated harmonies', () => {
    const prompt = genomeToPrompt(makeGenome({ colorPalette: 'jewel-tones' }), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('#7B2D8E');
  });

  it('includes the 9-section page content template', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('Navigation');
    expect(prompt).toContain('Hero');
    expect(prompt).toContain('Trust bar');
    expect(prompt).toContain('Value props');
    expect(prompt).toContain('Feature');
    expect(prompt).toContain('Social proof');
    expect(prompt).toContain('How it works');
    expect(prompt).toContain('CTA section');
    expect(prompt).toContain('Footer');
  });

  it('includes CSS quality rules', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('60-30-10');
    expect(prompt).toContain('WCAG AA');
    expect(prompt).toContain('8px grid');
    expect(prompt).toContain('prefers-reduced-motion');
  });

  it('includes the HTML comment header template', () => {
    const prompt = genomeToPrompt(makeGenome(), 'X', 5, '/tmp/x.html');
    expect(prompt).toContain('DREAMROLL VARIATION #005');
    expect(prompt).toContain('GENOME:');
  });

  it('works with rolled params (no manual overrides)', () => {
    const rolled = rollParams();
    rolled.mutation = 'pure'; // force pure for the assertion
    const prompt = genomeToPrompt(rolled, 'Brief', 1, '/tmp/x.html');
    expect(prompt.length).toBeGreaterThan(500);
    expect(prompt).toContain('VISUAL IDENTITY');
    expect(prompt).toContain('FULL GENOME');
    expect(prompt).toContain(`STYLE: ${rolled.genre}`);
  });

  it('mutation: pure produces VISUAL IDENTITY and REQUIRED CSS sections', () => {
    const genome = makeGenome({ mutation: 'pure' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('VISUAL IDENTITY');
    expect(prompt).toContain('REQUIRED CSS DECLARATIONS');
    expect(prompt).not.toContain('STYLE MUTATION:');
  });

  it('mutation: mashup prepends STYLE MUTATION banner and shows secondary', () => {
    const genome = makeGenome({ mutation: 'mashup', mutationSecondary: 'bauhaus' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('STYLE MUTATION: MASHUP');
    expect(prompt).toContain('SECONDARY ARCHETYPE: bauhaus');
    expect(prompt).toContain('circles + triangles + squares');
    expect(prompt).toContain('experimental STYLE MUTATION');
  });

  it('mutation: franken shows three archetypes', () => {
    const genome = makeGenome({
      mutation: 'franken',
      mutationSecondary: 'synthwave',
      mutationTertiary: 'de-stijl',
    });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('STYLE MUTATION: FRANKEN');
    expect(prompt).toContain('SECONDARY ARCHETYPE: synthwave');
    expect(prompt).toContain('TERTIARY ARCHETYPE: de-stijl');
  });

  it('mutation: invert flips the archetype rules', () => {
    const genome = makeGenome({ genre: 'neo-brutalism', mutation: 'invert' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('STYLE MUTATION: INVERT');
    expect(prompt).toContain('OPPOSITE');
    expect(prompt).toContain('ANTI-PATTERNS');
    expect(prompt).not.toContain('THIS PAGE MUST NOT LOOK LIKE');
  });

  it('mutation: material-swap shows material', () => {
    const genome = makeGenome({ mutation: 'material-swap', mutationMaterial: 'concrete' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('STYLE MUTATION: MATERIAL-SWAP');
    expect(prompt).toContain('MATERIAL: concrete');
  });

  it('non-pure mutations skip the REQUIRED CSS strict check', () => {
    const genome = makeGenome({ mutation: 'maximum' });
    const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
    expect(prompt).toContain('REFERENCE CSS');
    expect(prompt).not.toContain('REQUIRED CSS DECLARATIONS (must appear');
  });

  it('all mutations keep the constraint repeated 3 times', () => {
    for (const m of ['pure', 'mashup', 'invert', 'era-clash', 'material-swap', 'maximum', 'minimum', 'franken']) {
      const genome = makeGenome({
        mutation: m,
        mutationSecondary: 'bauhaus',
        mutationTertiary: 'synthwave',
        mutationMaterial: 'silk',
      });
      const prompt = genomeToPrompt(genome, 'X', 1, '/tmp/x.html');
      const matches = prompt.match(/CONSTRAINT \(mandatory/g);
      expect(matches?.length, `mutation=${m} should have 3 CONSTRAINT blocks`).toBe(3);
    }
  });
});

describe('serializeGenomeAsComment', () => {
  it('produces a multi-line HTML comment', () => {
    const comment = serializeGenomeAsComment(makeGenome(), 14);
    expect(comment).toMatch(/^<!--/);
    expect(comment).toMatch(/-->$/);
    expect(comment).toContain('VARIATION #014');
  });

  it('includes all 14 genome fields', () => {
    const comment = serializeGenomeAsComment(makeGenome(), 1);
    expect(comment).toContain('style:');
    expect(comment).toContain('harmony:');
    expect(comment).toContain('typography:');
    expect(comment).toContain('scale:');
    expect(comment).toContain('layout:');
    expect(comment).toContain('density:');
    expect(comment).toContain('mood:');
    expect(comment).toContain('era:');
    expect(comment).toContain('animation:');
    expect(comment).toContain('imagery:');
    expect(comment).toContain('radius:');
    expect(comment).toContain('shadows:');
    expect(comment).toContain('cta:');
    expect(comment).toContain('constraint:');
  });

  it('includes base hue when present', () => {
    const comment = serializeGenomeAsComment(makeGenome({ harmonyBaseHue: 195 }), 1);
    expect(comment).toContain('base hue: 195');
  });
});

describe('genomeSummary', () => {
  it('produces a single-line summary with key fields', () => {
    const summary = genomeSummary(makeGenome());
    expect(summary).toContain('style=glassmorphism');
    expect(summary).toContain('harmony=jewel-tones');
    expect(summary).toContain('layout=stacked-panels');
    expect(summary).toContain('mood=premium-luxury');
    expect(summary).toContain('wildcard=glass-everything');
    expect(summary.split('\n').length).toBe(1);
  });
});
