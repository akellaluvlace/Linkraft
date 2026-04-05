// Component Browser: searches components across all available MCPs via MCPancake.
// Returns unified results with consistent metadata.

import { mcpancake } from '../shared/mcpancake-router.js';
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
export async function browseComponents(options: BrowseOptions): Promise<BrowseResult> {
  let results = await mcpancake.findComponent(options.query);

  // Filter by source if specified
  if (options.source) {
    results = results.filter(r => r.source === options.source);
  }

  // Filter by tags if specified
  if (options.tags && options.tags.length > 0) {
    results = results.filter(r =>
      options.tags!.some(tag => r.tags.includes(tag)),
    );
  }

  // Collect unique sources
  const sources = [...new Set(results.map(r => r.source))];

  return {
    results,
    sources,
    totalCount: results.length,
  };
}

/**
 * Gets documentation for a specific component.
 */
export async function getComponentDocs(
  component: string,
  library: string,
): Promise<string | null> {
  const docs = await mcpancake.getDocs(component, library);
  return docs?.content ?? null;
}

/**
 * Formats browse results as a readable string for Claude to present.
 */
export function formatBrowseResults(result: BrowseResult): string {
  if (result.totalCount === 0) {
    return 'No components found matching your query.';
  }

  const lines: string[] = [
    `Found ${result.totalCount} component(s) from ${result.sources.join(', ')}:`,
    '',
  ];

  for (const comp of result.results) {
    lines.push(`**${comp.name}** (${comp.source})`);
    lines.push(`  ${comp.description}`);
    if (comp.installCommand) {
      lines.push(`  Install: \`${comp.installCommand}\``);
    }
    if (comp.tags.length > 0) {
      lines.push(`  Tags: ${comp.tags.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
