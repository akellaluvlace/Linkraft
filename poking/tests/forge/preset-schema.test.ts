import { describe, it, expect } from 'vitest';
import { validatePreset, parsePreset } from '../../src/forge/preset-schema.js';
import * as fs from 'fs';
import * as path from 'path';

// Helper: a minimal valid preset for testing
function validPreset(): Record<string, unknown> {
  return {
    name: 'Test Preset',
    id: 'test-preset',
    author: 'test',
    description: 'A test preset',
    tokens: {
      colors: {
        primary: '#000000',
        secondary: '#FF5733',
        background: '#FFFFFF',
        accent: '#3B82F6',
        surface: '#F5F5F5',
      },
      typography: {
        heading: { family: 'Inter', weight: '700' },
        body: { family: 'Inter', weight: '400' },
        mono: { family: 'Fira Code', weight: '400' },
      },
      spacing: { unit: '8px', scale: [0, 4, 8, 16, 32] },
      borders: { width: '1px', style: 'solid', color: '#000000', radius: '4px' },
      shadows: { default: '0 2px 4px rgba(0,0,0,0.1)', hover: '0 4px 8px rgba(0,0,0,0.2)' },
      animations: { style: 'ease 200ms', hover: 'translateY(-2px)' },
    },
    componentOverrides: {
      button: 'rounded-md font-bold px-4 py-2',
      card: 'rounded-md border p-4',
    },
    forbiddenPatterns: ['rounded-full', 'blur-'],
    requiredFonts: ['Inter', 'Fira Code'],
    shadcnTheme: null,
  };
}

describe('validatePreset', () => {
  it('accepts a valid preset with zero errors', () => {
    const errors = validatePreset(validPreset());
    expect(errors).toEqual([]);
  });

  it('rejects non-object input', () => {
    const errors = validatePreset('not an object');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]!.field).toBe('(root)');
  });

  it('reports missing required string fields', () => {
    const preset = validPreset();
    delete preset['name'];
    delete preset['id'];
    const errors = validatePreset(preset);
    const fields = errors.map(e => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('id');
  });

  it('rejects invalid id format', () => {
    const preset = validPreset();
    preset['id'] = 'Neo Brutalism';
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field === 'id' && e.message.includes('lowercase'))).toBe(true);
  });

  it('rejects invalid hex colors', () => {
    const preset = validPreset();
    (preset['tokens'] as Record<string, unknown>)['colors'] = {
      primary: 'not-a-color',
      secondary: '#FF5733',
      background: '#FFFFFF',
      accent: '#3B82F6',
      surface: '#F5F5F5',
    };
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field === 'tokens.colors.primary')).toBe(true);
  });

  it('rejects missing typography roles', () => {
    const preset = validPreset();
    (preset['tokens'] as Record<string, unknown>)['typography'] = {
      heading: { family: 'Inter', weight: '700' },
      // missing body and mono
    };
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field.includes('typography.body'))).toBe(true);
    expect(errors.some(e => e.field.includes('typography.mono'))).toBe(true);
  });

  it('rejects invalid spacing unit', () => {
    const preset = validPreset();
    (preset['tokens'] as Record<string, unknown>)['spacing'] = {
      unit: 'invalid',
      scale: [0, 4, 8],
    };
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field === 'tokens.spacing.unit')).toBe(true);
  });

  it('detects contradictions between overrides and forbidden patterns', () => {
    const preset = validPreset();
    preset['componentOverrides'] = {
      button: 'rounded-full bg-blue-500',
    };
    preset['forbiddenPatterns'] = ['rounded-full'];
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field === 'componentOverrides.button' && e.message.includes('rounded-full'))).toBe(true);
  });

  it('accepts shadcnTheme as string or null', () => {
    const preset1 = validPreset();
    preset1['shadcnTheme'] = 'neo-brutalism';
    expect(validatePreset(preset1)).toEqual([]);

    const preset2 = validPreset();
    preset2['shadcnTheme'] = null;
    expect(validatePreset(preset2)).toEqual([]);
  });

  it('rejects shadcnTheme as number', () => {
    const preset = validPreset();
    preset['shadcnTheme'] = 42;
    const errors = validatePreset(preset);
    expect(errors.some(e => e.field === 'shadcnTheme')).toBe(true);
  });
});

describe('parsePreset', () => {
  it('returns typed preset for valid input', () => {
    const result = parsePreset(validPreset());
    expect(result.id).toBe('test-preset');
    expect(result.tokens.colors.primary).toBe('#000000');
  });

  it('throws with detailed message for invalid input', () => {
    expect(() => parsePreset({})).toThrow('Invalid preset');
  });
});

describe('built-in presets', () => {
  const presetsDir = path.resolve(__dirname, '../../presets');
  const presetFiles = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));

  it('has at least 3 built-in presets', () => {
    expect(presetFiles.length).toBeGreaterThanOrEqual(3);
  });

  for (const file of presetFiles) {
    it(`validates ${file}`, () => {
      const raw = fs.readFileSync(path.join(presetsDir, file), 'utf-8');
      const data: unknown = JSON.parse(raw);
      const errors = validatePreset(data);
      expect(errors).toEqual([]);
    });

    it(`parses ${file} into typed preset`, () => {
      const raw = fs.readFileSync(path.join(presetsDir, file), 'utf-8');
      const data: unknown = JSON.parse(raw);
      const preset = parsePreset(data);
      expect(preset.id).toBeTruthy();
      expect(preset.tokens.colors.primary).toBeTruthy();
    });
  }
});
