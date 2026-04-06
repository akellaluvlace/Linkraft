import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateInjection, generateBookmarklet } from '../../poke/injector.js';

export function registerPokeInjectionTools(server: McpServer): void {
  server.tool(
    'poke_setup',
    'Detects the project framework and generates the best overlay injection approach. Returns instructions for auto-injection or a bookmarklet fallback. Call this when the user first runs /linkraft poke.',
    {
      projectRoot: z.string().describe('Project root directory'),
      pluginRoot: z.string().describe('Linkraft plugin root directory (where dist/overlay.js lives)'),
    },
    async ({ projectRoot, pluginRoot }) => {
      const result = generateInjection(projectRoot, pluginRoot);
      const lines: string[] = [
        `Framework detected: **${result.framework}**`,
        `Injection method: **${result.method}**`,
        '',
        result.instructions,
      ];

      if (result.configPatch) {
        lines.push('', '---', '', 'Config patch:', '```', result.configPatch, '```');
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'poke_bookmarklet',
    'Generates a bookmarklet URL for injecting the poke overlay into any localhost page. Works on any framework.',
    {
      pluginRoot: z.string().describe('Linkraft plugin root directory'),
    },
    async ({ pluginRoot }) => {
      const overlayUrl = `file:///${pluginRoot.replace(/\\/g, '/')}/dist/overlay.js`;
      const bookmarklet = generateBookmarklet(overlayUrl);
      return {
        content: [{
          type: 'text' as const,
          text: [
            'Drag this bookmarklet to your bookmarks bar:',
            '',
            bookmarklet,
            '',
            'Then click it on any localhost page to enable poke mode.',
            'Click again to re-enable after page navigation.',
          ].join('\n'),
        }],
      };
    },
  );
}
