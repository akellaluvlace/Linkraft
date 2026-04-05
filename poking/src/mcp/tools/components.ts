import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerComponentTools(server: McpServer): void {
  server.tool(
    'poke_list_components',
    'List all components on the current page. V2 feature.',
    {},
    async () => {
      return {
        content: [{ type: 'text' as const, text: 'Component listing coming in V2. Use poke_get_selected_element to inspect individual components.' }],
      };
    },
  );

  server.tool(
    'poke_get_component_tree',
    'Returns the full component tree of the current page. V2 feature.',
    {},
    async () => {
      return {
        content: [{ type: 'text' as const, text: 'Component tree coming in V2.' }],
      };
    },
  );
}
