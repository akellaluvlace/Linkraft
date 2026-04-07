import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateInjection, generateBookmarklet } from '../../poke/injector.js';
import {
  getOverlayScript,
  generateInjectionCode,
  generatePollCode,
  generateEnableCode,
  generateDisableCode,
  generateRemoveCode,
  generatePersistenceCode,
  parsePollResult,
} from '../../poke/cdp-injector.js';
import { setCurrentSelection } from '../server.js';

export function registerPokeInjectionTools(server: McpServer): void {

  // PRIMARY: CDP injection via chrome-devtools-mcp
  server.tool(
    'poke_inject',
    'Injects the poke overlay into the current browser page via CDP. Returns the JavaScript code to execute via chrome-devtools-mcp evaluate_script. This is the primary injection method.',
    {
      pluginRoot: z.string().describe('Linkraft plugin root directory (where dist/overlay.js lives)'),
    },
    async ({ pluginRoot }) => {
      try {
        const overlayScript = getOverlayScript(pluginRoot);
        const injectionCode = generateInjectionCode(overlayScript);
        return {
          content: [{
            type: 'text' as const,
            text: [
              'Execute this via chrome-devtools-mcp evaluate_script to inject the overlay:',
              '',
              '```javascript',
              injectionCode,
              '```',
              '',
              'After injection, the overlay is active. Users can click any element.',
              'Call poke_poll to check for selections.',
            ].join('\n'),
          }],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text' as const, text: `Injection failed: ${msg}` }] };
      }
    },
  );

  server.tool(
    'poke_inject_code',
    'Returns the raw JavaScript injection code for the overlay. Use with chrome-devtools-mcp evaluate_script tool directly.',
    {
      pluginRoot: z.string().describe('Linkraft plugin root directory'),
    },
    async ({ pluginRoot }) => {
      try {
        const overlayScript = getOverlayScript(pluginRoot);
        return { content: [{ type: 'text' as const, text: generateInjectionCode(overlayScript) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
      }
    },
  );

  server.tool(
    'poke_poll',
    'Returns the JavaScript code to poll for element selections. Execute via chrome-devtools-mcp evaluate_script. Returns the selected element context as JSON, or null if nothing selected yet.',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: generatePollCode() }] };
    },
  );

  server.tool(
    'poke_receive_selection',
    'Receives element selection data from CDP polling. Parses the JSON and stores it as the current selection for other poke tools to use.',
    {
      selectionJson: z.string().describe('JSON string of the PokeContext from the browser'),
    },
    async ({ selectionJson }) => {
      const context = parsePollResult(selectionJson);
      if (!context) {
        return { content: [{ type: 'text' as const, text: 'No valid selection data received.' }] };
      }

      setCurrentSelection(context);

      const lines: string[] = [
        `Selected: <${context.dom.tag}>${context.dom.id ? ` #${context.dom.id}` : ''}`,
      ];

      if (context.source?.file) {
        lines.push(`File: ${context.source.file}${context.source.line ? `:${context.source.line}` : ''}`);
      }
      if (context.source?.component) {
        lines.push(`Component: ${context.source.component}`);
      }
      if (context.styles.tailwindClasses) {
        lines.push(`Classes: ${context.styles.tailwindClasses}`);
      }
      if (context.componentData?.props) {
        const propKeys = Object.keys(context.componentData.props);
        if (propKeys.length > 0) {
          lines.push(`Props: { ${propKeys.join(', ')} }`);
        }
      }
      lines.push(`Layout: ${context.layout.parentTag} > ${context.dom.tag} (${context.layout.siblingIndex + 1}/${context.layout.siblingCount})`);

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'poke_enable',
    'Returns JavaScript to re-enable poke mode (if overlay is already injected). Use after navigating.',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: generateEnableCode() }] };
    },
  );

  server.tool(
    'poke_disable',
    'Returns JavaScript to disable poke mode without removing the overlay.',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: generateDisableCode() }] };
    },
  );

  server.tool(
    'poke_remove',
    'Returns JavaScript to completely remove the poke overlay from the page.',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: generateRemoveCode() }] };
    },
  );

  server.tool(
    'poke_persist',
    'Returns JavaScript to set up hot-reload persistence. Re-injects the overlay automatically when the dev server hot-reloads.',
    {
      pluginRoot: z.string().describe('Linkraft plugin root directory'),
    },
    async ({ pluginRoot }) => {
      try {
        const overlayScript = getOverlayScript(pluginRoot);
        return { content: [{ type: 'text' as const, text: generatePersistenceCode(overlayScript) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
      }
    },
  );

  // FALLBACK: framework detection + bookmarklet
  server.tool(
    'poke_setup',
    'Detects the project framework and generates the best overlay injection approach. Use as fallback when chrome-devtools-mcp is not available.',
    {
      projectRoot: z.string().describe('Project root directory'),
      pluginRoot: z.string().describe('Linkraft plugin root directory'),
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
    'Generates a bookmarklet for injecting the poke overlay into any localhost page. Zero-config fallback.',
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
            'Click it on any localhost page to enable poke mode.',
          ].join('\n'),
        }],
      };
    },
  );
}
