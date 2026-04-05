import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerNavigationTools(server: McpServer): void {
  server.tool(
    'poke_navigate',
    'Navigate the preview panel to a URL.',
    {
      url: z.string().describe('The URL to navigate to (e.g. "http://localhost:3000/about")'),
    },
    async (_params) => {
      return {
        content: [{ type: 'text' as const, text: 'Navigation command sent. Use the preview panel to navigate.' }],
      };
    },
  );

  server.tool(
    'poke_scroll_to',
    'Scroll the preview to bring a specific element into view. V2 feature.',
    {
      selector: z.string().describe('CSS selector of the element to scroll to (e.g. "#footer", ".section-3")'),
    },
    async (_params) => {
      return {
        content: [{ type: 'text' as const, text: 'Scroll command coming in V2.' }],
      };
    },
  );
}
