import { describe, it, expect } from 'vitest';
import { formatPokeContext } from '../../src/shared/format.js';
import type { PokeContext } from '../../src/shared/types.js';

function createMockContext(overrides?: Partial<PokeContext>): PokeContext {
  const base: PokeContext = {
    dom: {
      tag: 'button',
      id: 'cta-hero',
      classes: ['bg-indigo-600', 'text-white', 'font-bold', 'py-3', 'px-8'],
      attributes: { type: 'button', 'data-testid': 'cta-hero' },
      textContent: 'Get Started Free',
      innerHTML: 'Get Started Free',
    },
    source: {
      component: 'HeroCTA',
      file: 'src/components/hero/HeroCTA.tsx',
      line: 23,
      column: 8,
      framework: 'react',
    },
    styles: {
      tailwindClasses: 'bg-indigo-600 text-white font-bold py-3 px-8',
      cssModules: null,
      inlineStyles: {},
      computed: {
        width: '210px',
        height: '52px',
        fontSize: '18px',
        fontWeight: '700',
        color: '#ffffff',
        backgroundColor: '#4f46e5',
        padding: '12px 32px',
        margin: '0px',
        borderRadius: '12px',
        display: 'inline-flex',
        position: 'static',
        gap: null,
      },
    },
    layout: {
      parentTag: 'div',
      parentClasses: ['hero-actions', 'flex', 'gap-4'],
      parentComponent: 'HeroActions',
      parentFile: 'src/components/hero/HeroActions.tsx',
      siblingCount: 2,
      siblingIndex: 0,
      siblings: [
        { tag: 'a', classes: ['hero-secondary-link'], textContent: 'Watch Demo' },
      ],
    },
    componentData: {
      props: { variant: 'primary', size: 'lg', onClick: () => {} },
      state: null,
    },
    screenshot: null,
    boundingBox: { x: 500, y: 400, width: 210, height: 52 },
    timestamp: '2026-04-05T10:00:00Z',
    pageUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
  };
  return { ...base, ...overrides };
}

describe('formatPokeContext', () => {
  it('includes DOM tag and text', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('<button>');
    expect(output).toContain('Get Started Free');
  });

  it('includes element ID', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('ID: cta-hero');
  });

  it('includes classes as string', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('bg-indigo-600 text-white');
  });

  it('includes source file and line', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('Component: HeroCTA');
    expect(output).toContain('File: src/components/hero/HeroCTA.tsx');
    expect(output).toContain('Line: 23');
  });

  it('includes computed styles', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('width: 210px');
    expect(output).toContain('font-size: 18px');
    expect(output).toContain('background: #4f46e5');
  });

  it('includes Tailwind classes', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('Tailwind: "bg-indigo-600');
  });

  it('includes layout info', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('Parent: <div>');
    expect(output).toContain('hero-actions');
    expect(output).toContain('Watch Demo');
  });

  it('formats function props as [function]', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('onClick: [function]');
  });

  it('ends with ready message', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).toContain('Ready for instructions');
  });

  it('omits source section when null', () => {
    const ctx = createMockContext({ source: null });
    const output = formatPokeContext(ctx);
    expect(output).not.toContain('Component:');
    expect(output).not.toContain('File:');
  });

  it('omits ID when null', () => {
    const ctx = createMockContext();
    ctx.dom.id = null;
    const output = formatPokeContext(ctx);
    expect(output).not.toContain('ID:');
  });

  it('omits gap when null', () => {
    const output = formatPokeContext(createMockContext());
    expect(output).not.toContain('gap:');
  });
});
