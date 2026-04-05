import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpancake } from '../../shared/mcpancake-router.js';
import { browseComponents, formatBrowseResults } from '../../forge/component-browser.js';

export function registerMcpancakeTools(server: McpServer): void {
  server.tool(
    'mcpancake_search_components',
    'Searches for UI components across all available MCP sources (shadcn, Magic UI, Vault). Returns unified results with name, source, description, and install command.',
    {
      query: z.string().describe('Search query, e.g. "hero section" or "animated tabs"'),
      source: z.string().optional().describe('Filter by source: "shadcn", "magic-ui"'),
      tags: z.array(z.string()).optional().describe('Filter by tags, e.g. ["hero", "landing"]'),
    },
    async ({ query, source, tags }) => {
      const result = await browseComponents({ query, source, tags });
      return { content: [{ type: 'text' as const, text: formatBrowseResults(result) }] };
    },
  );

  server.tool(
    'mcpancake_get_docs',
    'Fetches documentation for a specific component from available doc sources (Context7).',
    {
      component: z.string().describe('Component name, e.g. "Button"'),
      library: z.string().describe('Library name, e.g. "shadcn"'),
    },
    async ({ component, library }) => {
      const docs = await mcpancake.getDocs(component, library);
      if (!docs) {
        return { content: [{ type: 'text' as const, text: `No documentation found for ${component} from ${library}.` }] };
      }
      return { content: [{ type: 'text' as const, text: docs.content }] };
    },
  );

  server.tool(
    'mcpancake_available_mcps',
    'Lists all known MCPs and whether they are currently available.',
    {},
    async () => {
      const mcps = await mcpancake.getAvailableMcps();
      const lines = mcps.map(m => `- **${m.name}**: ${m.available ? 'available' : 'not connected'}`);
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
