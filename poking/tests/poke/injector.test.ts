import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectFramework, generateInjection, generateBookmarklet } from '../../src/poke/injector.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'injector-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writePackageJson(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'test-project',
    dependencies: deps,
    devDependencies: devDeps,
  }), 'utf-8');
}

describe('detectFramework', () => {
  it('detects Vite from config file', () => {
    writePackageJson();
    fs.writeFileSync(path.join(tmpDir, 'vite.config.ts'), 'export default {}');
    expect(detectFramework(tmpDir)).toBe('vite');
  });

  it('detects Next.js from config file', () => {
    writePackageJson();
    fs.writeFileSync(path.join(tmpDir, 'next.config.js'), 'module.exports = {}');
    expect(detectFramework(tmpDir)).toBe('nextjs');
  });

  it('detects Vite from dependencies', () => {
    writePackageJson({ vite: '^5.0.0' });
    expect(detectFramework(tmpDir)).toBe('vite');
  });

  it('detects Next.js from dependencies', () => {
    writePackageJson({ next: '^14.0.0' });
    expect(detectFramework(tmpDir)).toBe('nextjs');
  });

  it('detects CRA from react-scripts', () => {
    writePackageJson({ 'react-scripts': '^5.0.0' });
    expect(detectFramework(tmpDir)).toBe('cra');
  });

  it('returns unknown for unrecognized project', () => {
    writePackageJson({ express: '^4.0.0' });
    expect(detectFramework(tmpDir)).toBe('unknown');
  });

  it('returns unknown when no package.json', () => {
    expect(detectFramework(tmpDir)).toBe('unknown');
  });
});

describe('generateInjection', () => {
  it('returns middleware method for Vite projects', () => {
    writePackageJson();
    fs.writeFileSync(path.join(tmpDir, 'vite.config.ts'), 'export default {}');
    const result = generateInjection(tmpDir, '/fake/plugin');
    expect(result.method).toBe('middleware');
    expect(result.framework).toBe('vite');
    expect(result.configPatch).toContain('poke-overlay');
    expect(result.bookmarklet).toBeTruthy();
  });

  it('returns middleware method for Next.js projects', () => {
    writePackageJson();
    fs.writeFileSync(path.join(tmpDir, 'next.config.js'), 'module.exports = {}');
    const result = generateInjection(tmpDir, '/fake/plugin');
    expect(result.method).toBe('middleware');
    expect(result.framework).toBe('nextjs');
    expect(result.configPatch).toContain('layout');
  });

  it('returns bookmarklet method for unknown frameworks', () => {
    writePackageJson({ express: '^4.0.0' });
    const result = generateInjection(tmpDir, '/fake/plugin');
    expect(result.method).toBe('bookmarklet');
    expect(result.bookmarklet).toContain('javascript:');
  });

  it('always provides a bookmarklet regardless of framework', () => {
    writePackageJson();
    fs.writeFileSync(path.join(tmpDir, 'vite.config.ts'), '');
    const result = generateInjection(tmpDir, '/fake/plugin');
    expect(result.bookmarklet).toBeTruthy();
  });
});

describe('generateBookmarklet', () => {
  it('returns a javascript: URL', () => {
    const bm = generateBookmarklet('http://localhost/overlay.js');
    expect(bm).toMatch(/^javascript:/);
  });

  it('contains the overlay URL', () => {
    const bm = generateBookmarklet('http://localhost:9999/overlay.js');
    expect(decodeURIComponent(bm)).toContain('localhost:9999/overlay.js');
  });

  it('contains PokeOverlay.init()', () => {
    const bm = generateBookmarklet('http://localhost/overlay.js');
    expect(decodeURIComponent(bm)).toContain('PokeOverlay.init()');
  });
});
