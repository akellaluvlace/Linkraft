import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  getOverlayScript,
  generateInjectionCode,
  generatePollCode,
  generateEnableCode,
  generateDisableCode,
  generateRemoveCode,
  generatePersistenceCode,
  parsePollResult,
} from '../../src/poke/cdp-injector.js';

const PLUGIN_ROOT = path.resolve(__dirname, '../..');

describe('getOverlayScript', () => {
  it('reads the built overlay.js', () => {
    const script = getOverlayScript(PLUGIN_ROOT);
    expect(script).toContain('PokeOverlay');
    expect(script.length).toBeGreaterThan(1000);
  });

  it('throws for missing overlay', () => {
    expect(() => getOverlayScript('/nonexistent')).toThrow('not found');
  });
});

describe('generateInjectionCode', () => {
  it('wraps overlay in IIFE with guard', () => {
    const code = generateInjectionCode('var PokeOverlay = {};');
    expect(code).toContain('__POKE_OVERLAY__');
    expect(code).toContain('PokeOverlay.init()');
    expect(code).toContain('enablePokeMode');
  });

  it('returns already_injected on double inject', () => {
    const code = generateInjectionCode('var x = 1;');
    expect(code).toContain('already_injected');
  });
});

describe('generatePollCode', () => {
  it('reads and clears __POKE_SELECTED__', () => {
    const code = generatePollCode();
    expect(code).toContain('__POKE_SELECTED__');
    expect(code).toContain('null');
    expect(code).toContain('JSON.stringify');
  });
});

describe('generateEnableCode', () => {
  it('calls PokeOverlay.enablePokeMode', () => {
    const code = generateEnableCode();
    expect(code).toContain('enablePokeMode');
  });
});

describe('generateDisableCode', () => {
  it('calls PokeOverlay.disablePokeMode', () => {
    const code = generateDisableCode();
    expect(code).toContain('disablePokeMode');
  });
});

describe('generateRemoveCode', () => {
  it('removes overlay root and clears globals', () => {
    const code = generateRemoveCode();
    expect(code).toContain('poke-overlay-root');
    expect(code).toContain('__POKE_OVERLAY__');
    expect(code).toContain('remove');
  });
});

describe('generatePersistenceCode', () => {
  it('sets up MutationObserver for hot reload', () => {
    const code = generatePersistenceCode('var x = 1;');
    expect(code).toContain('MutationObserver');
    expect(code).toContain('__POKE_PERSISTENCE__');
    expect(code).toContain('poke-overlay-root');
  });
});

describe('parsePollResult', () => {
  it('parses valid PokeContext JSON', () => {
    const context = {
      dom: { tag: 'button', id: null, classes: ['bg-blue-500'], attributes: {}, textContent: 'Click' },
      source: { component: 'Button', file: 'src/Button.tsx', line: 10, column: 3, framework: 'react' },
      styles: { tailwindClasses: 'bg-blue-500 px-4', cssModules: null, inlineStyles: {}, computed: {} },
      layout: { parentTag: 'div', parentClasses: [], parentComponent: null, parentFile: null, siblingCount: 1, siblingIndex: 0, siblings: [] },
      componentData: null,
      screenshot: null,
      boundingBox: { x: 100, y: 200, width: 120, height: 40 },
      timestamp: '2026-04-07T00:00:00.000Z',
      pageUrl: 'http://localhost:3000',
      viewportWidth: 1440,
      viewportHeight: 900,
    };
    const result = parsePollResult(JSON.stringify(context));
    expect(result).not.toBeNull();
    expect(result!.dom.tag).toBe('button');
    expect(result!.source!.file).toBe('src/Button.tsx');
  });

  it('returns null for null input', () => {
    expect(parsePollResult(null)).toBeNull();
  });

  it('returns null for "null" string', () => {
    expect(parsePollResult('null')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parsePollResult('not json')).toBeNull();
  });
});
