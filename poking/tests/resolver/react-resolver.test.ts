// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveReact, extractReactComponentData } from '../../src/resolver/react-resolver';

interface MockFiber {
  type: { name?: string; displayName?: string } | string;
  memoizedProps: Record<string, unknown>;
  memoizedState: unknown;
  return: MockFiber | null;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
}

function createMockElement(overrides?: Partial<HTMLElement>): HTMLElement {
  const element = document.createElement('div');
  if (overrides) {
    Object.assign(element, overrides);
  }
  return element;
}

function attachFiber(element: HTMLElement, fiber: MockFiber): void {
  const key = '__reactFiber$test123';
  (element as unknown as Record<string, unknown>)[key] = fiber;
}

function createMockFiber(overrides?: Partial<MockFiber>): MockFiber {
  return {
    type: { name: 'Button', displayName: undefined },
    memoizedProps: { onClick: (): void => {}, label: 'Click me' },
    memoizedState: null,
    return: null,
    ...overrides,
  };
}

describe('resolveReact', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract component name from fiber.type.name', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'MyComponent' },
    });
    attachFiber(element, fiber);

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.component).toBe('MyComponent');
    expect(result?.framework).toBe('react');
  });

  it('should prefer displayName over name', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'Internal', displayName: 'PublicButton' },
    });
    attachFiber(element, fiber);

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.component).toBe('PublicButton');
  });

  it('should extract _debugSource file and line', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'Card' },
      _debugSource: {
        fileName: '/src/components/Card.tsx',
        lineNumber: 42,
        columnNumber: 5,
      },
    });
    attachFiber(element, fiber);

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.file).toBe('/src/components/Card.tsx');
    expect(result?.line).toBe(42);
    expect(result?.column).toBe(5);
    expect(result?.framework).toBe('react');
  });

  it('should walk up fiber tree to find nearest component', () => {
    const element = createMockElement();
    const parentFiber = createMockFiber({
      type: { name: 'ParentComponent' },
      _debugSource: {
        fileName: '/src/Parent.tsx',
        lineNumber: 10,
      },
    });
    // The element fiber is a host component ('div'), not a user component
    const hostFiber = createMockFiber({
      type: 'div',
      return: parentFiber,
    });
    attachFiber(element, hostFiber);

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.component).toBe('ParentComponent');
    expect(result?.file).toBe('/src/Parent.tsx');
    expect(result?.line).toBe(10);
  });

  it('should fallback to data-poke-file and data-poke-line attributes', () => {
    const element = createMockElement();
    element.setAttribute('data-poke-file', '/src/App.tsx');
    element.setAttribute('data-poke-line', '25');
    element.setAttribute('data-poke-column', '8');

    // Attach fiber without _debugSource (React 19+ scenario)
    const fiber = createMockFiber({
      type: { name: 'App' },
      _debugSource: undefined,
    });
    attachFiber(element, fiber);

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.component).toBe('App');
    expect(result?.file).toBe('/src/App.tsx');
    expect(result?.line).toBe(25);
    expect(result?.column).toBe(8);
  });

  it('should walk up DOM to find data-poke-* on ancestor', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-poke-file', '/src/Layout.tsx');
    parent.setAttribute('data-poke-line', '15');

    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    // No fiber on the child, but data-poke-* on parent
    const result = resolveReact(child);

    expect(result).not.toBeNull();
    expect(result?.file).toBe('/src/Layout.tsx');
    expect(result?.line).toBe(15);
  });

  it('should return null when no React fiber and no data-poke-* found', () => {
    const element = createMockElement();

    const result = resolveReact(element);

    expect(result).toBeNull();
  });

  it('should handle fiber with __reactInternalInstance$ key', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'LegacyComponent' },
    });
    const key = '__reactInternalInstance$legacy';
    (element as unknown as Record<string, unknown>)[key] = fiber;

    const result = resolveReact(element);

    expect(result).not.toBeNull();
    expect(result?.component).toBe('LegacyComponent');
  });
});

describe('extractReactComponentData', () => {
  it('should extract props from fiber, filtering functions', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'Button' },
      memoizedProps: {
        label: 'Submit',
        disabled: false,
        onClick: (): void => {},
        children: 'text',
      },
    });
    attachFiber(element, fiber);

    const result = extractReactComponentData(element);

    expect(result).not.toBeNull();
    expect(result?.props).toEqual({
      label: 'Submit',
      disabled: false,
      onClick: '[function]',
    });
    // children should be filtered out
    expect(result?.props?.['children']).toBeUndefined();
  });

  it('should extract state values', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'Counter' },
      memoizedProps: { initial: 0 },
      memoizedState: {
        memoizedState: 42,
        next: {
          memoizedState: 'hello',
          next: null,
        },
      },
    });
    attachFiber(element, fiber);

    const result = extractReactComponentData(element);

    expect(result).not.toBeNull();
    expect(result?.state).toEqual({
      state_0: 42,
      state_1: 'hello',
    });
  });

  it('should return null when no fiber is found', () => {
    const element = createMockElement();

    const result = extractReactComponentData(element);

    expect(result).toBeNull();
  });

  it('should return null when no props and no state exist', () => {
    const element = createMockElement();
    const fiber = createMockFiber({
      type: { name: 'Empty' },
      memoizedProps: {},
      memoizedState: null,
    });
    attachFiber(element, fiber);

    const result = extractReactComponentData(element);

    expect(result).toBeNull();
  });

  it('should truncate long string prop values', () => {
    const element = createMockElement();
    const longString = 'x'.repeat(300);
    const fiber = createMockFiber({
      type: { name: 'TextArea' },
      memoizedProps: { content: longString },
    });
    attachFiber(element, fiber);

    const result = extractReactComponentData(element);

    expect(result).not.toBeNull();
    const content = result?.props?.['content'] as string;
    expect(content.length).toBeLessThan(longString.length);
    expect(content.endsWith('...')).toBe(true);
  });
});
