import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentSelection } from '../../poke/state.js';

export function registerScreenshotTools(server: McpServer): void {
  server.tool(
    'poke_screenshot_element',
    'Returns a screenshot of the currently selected element.',
    {},
    async () => {
      const selection = getCurrentSelection();
      if (!selection) {
        return {
          content: [{ type: 'text' as const, text: 'No element selected. Click an element in the preview first.' }],
        };
      }

      if (!selection.screenshot) {
        return {
          content: [{ type: 'text' as const, text: 'No screenshot available for the selected element.' }],
        };
      }

      return {
        content: [
          { type: 'text' as const, text: 'Screenshot captured.' },
          {
            type: 'image' as const,
            data: selection.screenshot,
            mimeType: 'image/png' as const,
          },
        ],
      };
    },
  );

  server.tool(
    'poke_screenshot_page',
    'Captures a screenshot of the entire page. V2 feature.',
    {},
    async () => {
      return {
        content: [{ type: 'text' as const, text: 'Page screenshot coming in V2.' }],
      };
    },
  );
}
