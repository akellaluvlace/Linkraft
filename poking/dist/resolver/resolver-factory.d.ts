import type { SourceInfo, ComponentData } from '../shared/types';
type Framework = 'react' | 'vue' | 'svelte' | 'html';
export declare function detectFramework(): Framework;
export declare function resolveElement(element: HTMLElement): {
    source: SourceInfo;
    componentData: ComponentData | null;
};
export declare function resolveSource(element: HTMLElement): SourceInfo;
export declare function resolveComponentData(element: HTMLElement): ComponentData | null;
export {};
