import { describe, it, expect } from 'vitest';
import {
  generateTailwindChanges,
  scanFileForOverrides,
  scanForForbiddenPatterns,
  generateChangeset,
} from '../../src/forge/preset-applicator.js';
import { parsePreset, DesignPreset } from '../../src/forge/preset-schema.js';
import * as fs from 'fs';
import * as path from 'path';

function loadNeoBrutalism(): DesignPreset {
  const raw = fs.readFileSync(
    path.resolve(__dirname, '../../presets/neo-brutalism.json'),
    'utf-8',
  );
  return parsePreset(JSON.parse(raw));
}

describe('generateTailwindChanges', () => {
  it('produces color changes for all preset colors', () => {
    const preset = loadNeoBrutalism();
    const changes = generateTailwindChanges(preset);
    const colorChanges = changes.filter(c => c.section === 'colors');
    expect(colorChanges.length).toBeGreaterThanOrEqual(5);
    expect(colorChanges.find(c => c.key === 'primary')?.value).toBe('#000000');
    expect(colorChanges.find(c => c.key === 'background')?.value).toBe('#FFFBE6');
  });

  it('produces font family changes', () => {
    const preset = loadNeoBrutalism();
    const changes = generateTailwindChanges(preset);
    const fontChanges = changes.filter(c => c.section === 'fontFamily');
    expect(fontChanges.find(c => c.key === 'heading')?.value).toBe('Space Grotesk');
  });

  it('produces border radius change', () => {
    const preset = loadNeoBrutalism();
    const changes = generateTailwindChanges(preset);
    const radiusChange = changes.find(c => c.section === 'borderRadius' && c.key === 'DEFAULT');
    expect(radiusChange?.value).toBe('0px');
  });

  it('produces shadow changes', () => {
    const preset = loadNeoBrutalism();
    const changes = generateTailwindChanges(preset);
    const shadowDefault = changes.find(c => c.section === 'boxShadow' && c.key === 'DEFAULT');
    expect(shadowDefault?.value).toBe('4px 4px 0px #000000');
  });
});

describe('scanFileForOverrides', () => {
  it('detects button components with className', () => {
    const preset = loadNeoBrutalism();
    const content = `
export function Page() {
  return (
    <button className="bg-blue-500 rounded-lg px-4 py-2">Click me</button>
  );
}`;
    const replacements = scanFileForOverrides('page.tsx', content, preset);
    expect(replacements.length).toBe(1);
    expect(replacements[0]!.component).toBe('button');
    expect(replacements[0]!.oldClasses).toBe('bg-blue-500 rounded-lg px-4 py-2');
    expect(replacements[0]!.newClasses).toContain('border-3');
    expect(replacements[0]!.newClasses).toContain('rounded-none');
  });

  it('detects input components', () => {
    const preset = loadNeoBrutalism();
    const content = `<input className="border rounded-lg p-2" />`;
    const replacements = scanFileForOverrides('form.tsx', content, preset);
    expect(replacements.length).toBe(1);
    expect(replacements[0]!.component).toBe('input');
  });

  it('detects link/anchor components', () => {
    const preset = loadNeoBrutalism();
    const content = `<a className="text-blue-500 underline" href="/">Home</a>`;
    const replacements = scanFileForOverrides('nav.tsx', content, preset);
    expect(replacements.length).toBe(1);
    expect(replacements[0]!.component).toBe('link');
  });

  it('returns empty for non-matching content', () => {
    const preset = loadNeoBrutalism();
    const content = `<div className="flex gap-4"><p>Hello</p></div>`;
    const replacements = scanFileForOverrides('page.tsx', content, preset);
    expect(replacements.length).toBe(0);
  });
});

describe('scanForForbiddenPatterns', () => {
  it('detects forbidden patterns in file content', () => {
    const content = `<div className="rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-purple-500">`;
    const violations = scanForForbiddenPatterns(
      'hero.tsx',
      content,
      ['rounded-lg', 'shadow-md', 'bg-gradient-to-'],
    );
    expect(violations.length).toBe(3);
    expect(violations.map(v => v.pattern)).toContain('rounded-lg');
    expect(violations.map(v => v.pattern)).toContain('shadow-md');
    expect(violations.map(v => v.pattern)).toContain('bg-gradient-to-');
  });

  it('returns empty for clean content', () => {
    const content = `<button className="border-3 border-black rounded-none font-bold">OK</button>`;
    const violations = scanForForbiddenPatterns(
      'button.tsx',
      content,
      ['rounded-lg', 'shadow-md'],
    );
    expect(violations.length).toBe(0);
  });

  it('reports correct line numbers', () => {
    const content = `line one\nline two\n<div className="rounded-lg">\nline four`;
    const violations = scanForForbiddenPatterns('test.tsx', content, ['rounded-lg']);
    expect(violations.length).toBe(1);
    expect(violations[0]!.line).toBe(3);
  });
});

describe('generateChangeset', () => {
  it('produces a complete changeset from preset + project files', () => {
    const preset = loadNeoBrutalism();
    const files = [
      {
        path: 'src/components/hero.tsx',
        content: `<button className="bg-blue-500 rounded-lg px-4">Sign Up</button>`,
      },
      {
        path: 'src/app/page.tsx',
        content: `<div className="shadow-md rounded-xl p-4">Card</div>`,
      },
      {
        path: 'README.md',
        content: `# Project\nrounded-lg is used everywhere`,
      },
    ];

    const changeset = generateChangeset(preset, files);

    expect(changeset.presetId).toBe('neo-brutalism');
    expect(changeset.tailwindChanges.length).toBeGreaterThan(0);
    expect(changeset.classReplacements.length).toBe(1); // button in hero.tsx
    expect(changeset.forbiddenViolations.length).toBeGreaterThan(0); // rounded-lg + shadow-md + rounded-xl
    expect(changeset.fontsToInstall).toContain('Space Grotesk');
    expect(changeset.shadcnTheme).toBe('neo-brutalism');
    // README.md should not be scanned (not tsx/jsx/html)
    expect(changeset.forbiddenViolations.every(v => v.file !== 'README.md')).toBe(true);
  });
});
