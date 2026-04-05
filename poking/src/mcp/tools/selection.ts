import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentSelection, getFormattedSelection } from '../server.js';

export function registerSelectionTools(server: McpServer): void {
  server.tool(
    'poke_get_selected_element',
    'Returns the full context of the currently selected element: DOM info, source file/line, computed styles, layout, props, and state.',
    {},
    async () => {
      return {
        content: [{ type: 'text' as const, text: getFormattedSelection() }],
      };
    },
  );

  server.tool(
    'poke_get_parent',
    'Returns the parent element info (tag, classes, component name, file) from the current selection.',
    {},
    async () => {
      const selection = getCurrentSelection();
      if (!selection) {
        return {
          content: [{ type: 'text' as const, text: 'No element selected. Click an element in the preview first.' }],
        };
      }

      const layout = selection.layout;
      const parentClasses = layout.parentClasses.length > 0
        ? ` .${layout.parentClasses.join('.')}`
        : '';
      const parentComp = layout.parentComponent ? ` (${layout.parentComponent})` : '';
      const parentFile = layout.parentFile ? `\nFile: ${layout.parentFile}` : '';

      const text = [
        'Parent Element:',
        `  Tag: <${layout.parentTag}>${parentClasses}${parentComp}`,
        parentFile ? `  File: ${layout.parentFile}` : null,
        `  Children: ${layout.siblingCount}`,
        `  Selected child index: ${layout.siblingIndex + 1} of ${layout.siblingCount}`,
      ].filter((line): line is string => line !== null).join('\n');

      return {
        content: [{ type: 'text' as const, text }],
      };
    },
  );

  server.tool(
    'poke_get_siblings',
    'Returns the list of sibling elements of the currently selected element.',
    {},
    async () => {
      const selection = getCurrentSelection();
      if (!selection) {
        return {
          content: [{ type: 'text' as const, text: 'No element selected. Click an element in the preview first.' }],
        };
      }

      const layout = selection.layout;
      if (layout.siblings.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No siblings found. This element is the only child of its parent.' }],
        };
      }

      const lines: string[] = [
        `Siblings (${layout.siblings.length} total):`,
        `Selected element is child ${layout.siblingIndex + 1} of ${layout.siblingCount}`,
        '',
      ];

      for (let i = 0; i < layout.siblings.length; i++) {
        const s = layout.siblings[i];
        if (!s) continue;
        const sClasses = s.classes.length > 0 ? ` .${s.classes[0]}` : '';
        const sText = s.textContent ? ` "${s.textContent.slice(0, 40)}"` : '';
        const marker = i === layout.siblingIndex ? ' <-- selected' : '';
        lines.push(`  ${i + 1}. <${s.tag}>${sClasses}${sText}${marker}`);
      }

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    },
  );

  server.tool(
    'poke_get_children',
    'Returns information about children of the selected element. Optionally filter by CSS selector.',
    { selector: z.string().optional().describe('CSS selector to filter children (e.g. "div", ".card", "#header")') },
    async (_params) => {
      const selection = getCurrentSelection();
      if (!selection) {
        return {
          content: [{ type: 'text' as const, text: 'Select an element first.' }],
        };
      }

      const text = [
        `Selected element: <${selection.dom.tag}>`,
        `Children count (from layout): ${selection.layout.siblingCount} siblings in parent`,
        '',
        'Direct children inspection coming in V2.',
        'Use poke_get_selected_element to see full context of the current selection.',
      ].join('\n');

      return {
        content: [{ type: 'text' as const, text }],
      };
    },
  );
}
