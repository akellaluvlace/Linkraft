import { describe, it, expect } from 'vitest';
import { extractTokens, updateToken, generateConfigSnippet } from '../../src/forge/token-editor.js';

const SAMPLE_CONFIG = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'secondary': '#10b981',
        'background': '#ffffff',
        'accent': '#f59e0b',
        'surface': '#f8fafc'
      },
      fontFamily: {
        'heading': 'Inter',
        'body': 'Inter',
        'mono': 'Fira Code'
      },
      borderRadius: {
        'DEFAULT': '12px',
        'lg': '16px'
      },
      boxShadow: {
        'DEFAULT': '0 2px 4px rgba(0,0,0,0.1)',
        'hover': '0 4px 8px rgba(0,0,0,0.15)'
      }
    }
  }
}`;

describe('extractTokens', () => {
  it('extracts color tokens', () => {
    const tokens = extractTokens(SAMPLE_CONFIG);
    expect(tokens.colors['primary']).toBe('#4f46e5');
    expect(tokens.colors['secondary']).toBe('#10b981');
    expect(tokens.colors['background']).toBe('#ffffff');
    expect(tokens.colors['accent']).toBe('#f59e0b');
    expect(tokens.colors['surface']).toBe('#f8fafc');
  });

  it('extracts font family tokens', () => {
    const tokens = extractTokens(SAMPLE_CONFIG);
    expect(tokens.fontFamily['heading']).toBe('Inter');
    expect(tokens.fontFamily['mono']).toBe('Fira Code');
  });

  it('extracts border radius tokens', () => {
    const tokens = extractTokens(SAMPLE_CONFIG);
    expect(tokens.borderRadius['DEFAULT']).toBe('12px');
    expect(tokens.borderRadius['lg']).toBe('16px');
  });

  it('extracts box shadow tokens', () => {
    const tokens = extractTokens(SAMPLE_CONFIG);
    expect(tokens.boxShadow['DEFAULT']).toBe('0 2px 4px rgba(0,0,0,0.1)');
    expect(tokens.boxShadow['hover']).toBe('0 4px 8px rgba(0,0,0,0.15)');
  });

  it('preserves the raw config content', () => {
    const tokens = extractTokens(SAMPLE_CONFIG);
    expect(tokens.raw).toBe(SAMPLE_CONFIG);
  });

  it('returns empty objects for missing sections', () => {
    const tokens = extractTokens('module.exports = {}');
    expect(Object.keys(tokens.colors).length).toBe(0);
    expect(Object.keys(tokens.fontFamily).length).toBe(0);
  });
});

describe('updateToken', () => {
  it('updates a color value', () => {
    const updated = updateToken(SAMPLE_CONFIG, 'colors', 'primary', '#000000');
    expect(updated).toContain("'primary': '#000000'");
    expect(updated).not.toContain('#4f46e5');
  });

  it('updates a border radius value', () => {
    const updated = updateToken(SAMPLE_CONFIG, 'borderRadius', 'DEFAULT', '0px');
    expect(updated).toContain("'DEFAULT': '0px'");
  });

  it('returns original config if key not found', () => {
    const updated = updateToken(SAMPLE_CONFIG, 'colors', 'nonexistent', '#000');
    expect(updated).toBe(SAMPLE_CONFIG);
  });

  it('preserves other values when updating one', () => {
    const updated = updateToken(SAMPLE_CONFIG, 'colors', 'primary', '#FF0000');
    expect(updated).toContain("'secondary': '#10b981'");
    expect(updated).toContain("'background': '#ffffff'");
  });
});

describe('generateConfigSnippet', () => {
  it('generates a valid theme extend snippet', () => {
    const snippet = generateConfigSnippet({
      colors: { primary: '#000', secondary: '#FFF' },
      fontFamily: { heading: 'Space Grotesk' },
    });
    expect(snippet).toContain('colors:');
    expect(snippet).toContain("'primary': '#000'");
    expect(snippet).toContain('fontFamily:');
    expect(snippet).toContain("'heading': 'Space Grotesk'");
  });

  it('skips empty sections', () => {
    const snippet = generateConfigSnippet({
      colors: { primary: '#000' },
      fontFamily: {},
    });
    expect(snippet).toContain('colors:');
    expect(snippet).not.toContain('fontFamily:');
  });
});
