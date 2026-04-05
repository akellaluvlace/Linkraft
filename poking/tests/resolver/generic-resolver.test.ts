// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveGeneric } from '../../src/resolver/generic-resolver';

describe('resolveGeneric', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should build a correct selector path', () => {
    const root = document.createElement('div');
    root.id = 'root';

    const main = document.createElement('main');

    const section = document.createElement('section');
    section.className = 'hero';

    const button = document.createElement('button');
    button.className = 'cta';

    section.appendChild(button);
    main.appendChild(section);
    root.appendChild(main);
    document.body.appendChild(root);

    const result = resolveGeneric(button);

    expect(result.selectorPath).toBe(
      'body > div#root > main > section.hero > button.cta',
    );
  });

  it('should include className in search hints', () => {
    const element = document.createElement('div');
    element.className = 'card primary';
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.searchHints).toBeDefined();
    expect(result.searchHints).toContain('card primary');
  });

  it('should include id in search hints', () => {
    const element = document.createElement('div');
    element.id = 'main-content';
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.searchHints).toBeDefined();
    expect(result.searchHints).toContain('#main-content');
  });

  it('should include data-testid in search hints', () => {
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'submit-button');
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.searchHints).toBeDefined();
    expect(result.searchHints).toContain('[data-testid="submit-button"]');
  });

  it('should include aria-label in search hints', () => {
    const element = document.createElement('button');
    element.setAttribute('aria-label', 'Close dialog');
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.searchHints).toBeDefined();
    expect(result.searchHints).toContain('[aria-label="Close dialog"]');
  });

  it('should set framework to html', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.framework).toBe('html');
  });

  it('should set component and file to null', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.component).toBeNull();
    expect(result.file).toBeNull();
    expect(result.line).toBeNull();
    expect(result.column).toBeNull();
  });

  it('should have no search hints when element has no identifying attributes', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const result = resolveGeneric(element);

    expect(result.searchHints).toBeUndefined();
  });

  it('should limit selector path depth to 8 segments', () => {
    // Build a deeply nested DOM: body > div > div > ... > div (10 levels)
    let current = document.body;
    for (let i = 0; i < 12; i++) {
      const child = document.createElement('div');
      current.appendChild(child);
      current = child;
    }

    const result = resolveGeneric(current);

    // Count segments: split by ' > '
    const segments = result.selectorPath?.split(' > ') ?? [];
    // 8 collected segments + 'body' prefix = 9 max
    expect(segments.length).toBeLessThanOrEqual(9);
  });
});
