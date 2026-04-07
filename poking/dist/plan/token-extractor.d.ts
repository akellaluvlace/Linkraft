import type { DesignTokens } from './types.js';
/**
 * Extracts design tokens from the project's config files.
 */
export declare function extractDesignTokens(projectRoot: string): DesignTokens | null;
/**
 * Generates DESIGN_TOKENS.md from extracted tokens.
 */
export declare function formatDesignTokens(tokens: DesignTokens): string;
