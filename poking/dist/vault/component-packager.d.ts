import type { VaultComponent } from './types.js';
export interface PackageInput {
    entryFile: string;
    entryContent: string;
    localFiles: Record<string, string>;
    author: string;
    description: string;
    framework: 'react' | 'vue' | 'svelte' | 'html';
    styling: 'tailwind' | 'css-modules' | 'css' | 'styled-components';
    tags: string[];
    designSystem: string | null;
}
/**
 * Extracts local import paths from file content.
 */
export declare function extractLocalImports(content: string): string[];
/**
 * Extracts npm package imports from file content.
 */
export declare function extractNpmDependencies(content: string): string[];
/**
 * Extracts prop types from a React component.
 * Simple regex-based extraction for TypeScript interfaces/types.
 */
export declare function extractProps(content: string): Record<string, string>;
/**
 * Packages a component and its local dependencies into a VaultComponent.
 */
export declare function packageComponent(input: PackageInput): VaultComponent;
