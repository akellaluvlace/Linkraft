import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentSelection } from '../../poke/state.js';

export function registerInspectionTools(server: McpServer): void {
  server.tool(
    'poke_get_computed_styles',
    'Returns all computed styles of the currently selected element.',
    {},
    async () => {
      const selection = getCurrentSelection();
      if (!selection) {
        return {
          content: [{ type: 'text' as const, text: 'No element selected. Click an element in the preview first.' }],
        };
      }

      const computed = selection.styles.computed;
      const lines: string[] = [
        'Computed Styles:',
        '',
        `  width: ${computed.width}`,
        `  height: ${computed.height}`,
        `  font-size: ${computed.fontSize}`,
        `  font-weight: ${computed.fontWeight}`,
        `  color: ${computed.color}`,
        `  background-color: ${computed.backgroundColor}`,
        `  padding: ${computed.padding}`,
        `  margin: ${computed.margin}`,
        `  border-radius: ${computed.borderRadius}`,
        `  display: ${computed.display}`,
        `  position: ${computed.position}`,
      ];

      if (computed.gap) {
        lines.push(`  gap: ${computed.gap}`);
      }

      if (selection.styles.tailwindClasses) {
        lines.push('');
        lines.push(`Tailwind Classes: "${selection.styles.tailwindClasses}"`);
      }

      if (selection.styles.cssModules) {
        lines.push(`CSS Module: ${selection.styles.cssModules}`);
      }

      const inlineEntries = Object.entries(selection.styles.inlineStyles);
      if (inlineEntries.length > 0) {
        lines.push('');
        lines.push('Inline Styles:');
        for (const [key, value] of inlineEntries) {
          lines.push(`  ${key}: ${value}`);
        }
      }

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    },
  );

  server.tool(
    'poke_compare_elements',
    'Compare computed styles of two elements by CSS selector. V2 feature.',
    {
      element_a: z.string().describe('CSS selector for the first element (e.g. "#header", ".card:first-child")'),
      element_b: z.string().describe('CSS selector for the second element (e.g. "#footer", ".card:last-child")'),
    },
    async (_params) => {
      return {
        content: [{ type: 'text' as const, text: 'Comparison mode requires two poke selections. Coming in V2.' }],
      };
    },
  );

  server.tool(
    'poke_get_element_by_selector',
    'Look up an element by CSS selector and return its context. V2 feature.',
    {
      selector: z.string().describe('CSS selector to find the element (e.g. ".navbar", "#main-content")'),
    },
    async (_params) => {
      return {
        content: [{ type: 'text' as const, text: 'Element lookup by selector coming in V2.' }],
      };
    },
  );
}
