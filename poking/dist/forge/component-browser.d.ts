import type { ComponentResult } from '../shared/mcpancake-router.js';
export interface BrowseOptions {
    query: string;
    tags?: string[];
    source?: string;
    framework?: string;
}
export interface BrowseResult {
    results: ComponentResult[];
    sources: string[];
    totalCount: number;
}
/**
 * Searches for components across all available MCP sources.
 * Filters results by optional criteria.
 */
export declare function browseComponents(options: BrowseOptions): Promise<BrowseResult>;
/**
 * Gets documentation for a specific component.
 */
export declare function getComponentDocs(component: string, library: string): Promise<string | null>;
/**
 * Formats browse results as a readable string for Claude to present.
 */
export declare function formatBrowseResults(result: BrowseResult): string;
