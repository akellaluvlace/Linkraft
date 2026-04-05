import type { SourceInfo } from '../shared/types';

const MAX_SELECTOR_DEPTH = 8;

function buildSelectorPath(element: HTMLElement): string {
  const segments: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && segments.length < MAX_SELECTOR_DEPTH) {
    const tag = current.tagName.toLowerCase();

    if (current.id) {
      segments.unshift(`${tag}#${current.id}`);
    } else if (current.classList.length > 0) {
      const firstClass = current.classList[0];
      segments.unshift(`${tag}.${firstClass}`);
    } else {
      segments.unshift(tag);
    }

    current = current.parentElement;
  }

  // Always start with body
  if (segments.length > 0 && !segments[0]?.startsWith('body')) {
    segments.unshift('body');
  }

  return segments.join(' > ');
}

export function resolveGeneric(element: HTMLElement): SourceInfo {
  const selectorPath = buildSelectorPath(element);

  // Collect search hints: meaningful attributes that help locate the element
  const searchHints: string[] = [];

  if (element.className && typeof element.className === 'string') {
    searchHints.push(element.className);
  }

  if (element.id) {
    searchHints.push(`#${element.id}`);
  }

  const testId = element.getAttribute('data-testid');
  if (testId) {
    searchHints.push(`[data-testid="${testId}"]`);
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    searchHints.push(`[aria-label="${ariaLabel}"]`);
  }

  return {
    component: null,
    file: null,
    line: null,
    column: null,
    framework: 'html',
    selectorPath,
    searchHints: searchHints.length > 0 ? searchHints : undefined,
  };
}
