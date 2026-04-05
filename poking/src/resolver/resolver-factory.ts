import type { SourceInfo, ComponentData } from '../shared/types';
import { resolveReact, extractReactComponentData } from './react-resolver';
import { resolveGeneric } from './generic-resolver';

type Framework = 'react' | 'vue' | 'svelte' | 'html';

interface ReactDevtoolsHook {
  renderers?: { size: number };
}

export function detectFramework(): Framework {
  const win = window as unknown as Record<string, unknown>;

  // Check React DevTools hook
  const hook = win['__REACT_DEVTOOLS_GLOBAL_HOOK__'] as
    | ReactDevtoolsHook
    | undefined;
  if (hook && hook.renderers && hook.renderers.size > 0) {
    return 'react';
  }

  // Check for React fiber keys on any element in the document
  const rootElement = document.getElementById('root') ?? document.body;
  if (rootElement) {
    const keys = Object.keys(rootElement);
    const hasFiber = keys.some(
      (key) =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$'),
    );
    if (hasFiber) {
      return 'react';
    }
  }

  // Check for Vue (data-v- scoped style attributes)
  const vueElement = document.querySelector('[data-v-]');
  if (vueElement) {
    return 'vue';
  }

  // Check for Svelte (class names with svelte- hash)
  const svelteElement = document.querySelector('[class*="svelte-"]');
  if (svelteElement) {
    return 'svelte';
  }

  return 'html';
}

export function resolveElement(element: HTMLElement): { source: SourceInfo; componentData: ComponentData | null } {
  const framework = detectFramework();
  return {
    source: resolveSourceFor(element, framework),
    componentData: resolveComponentDataFor(element, framework),
  };
}

export function resolveSource(element: HTMLElement): SourceInfo {
  return resolveSourceFor(element, detectFramework());
}

export function resolveComponentData(element: HTMLElement): ComponentData | null {
  return resolveComponentDataFor(element, detectFramework());
}

function resolveSourceFor(element: HTMLElement, framework: Framework): SourceInfo {
  switch (framework) {
    case 'react': {
      const result = resolveReact(element);
      if (result) return result;
      return resolveGeneric(element);
    }
    case 'vue':
    case 'svelte':
      return resolveGeneric(element);
    case 'html':
    default:
      return resolveGeneric(element);
  }
}

function resolveComponentDataFor(element: HTMLElement, framework: Framework): ComponentData | null {
  switch (framework) {
    case 'react':
      return extractReactComponentData(element);
    case 'vue':
    case 'svelte':
    case 'html':
    default:
      return null;
  }
}
