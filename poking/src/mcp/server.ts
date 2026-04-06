import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { PokeContext } from '../shared/types.js';
import { formatPokeContext } from '../shared/format.js';
import { registerSelectionTools } from './tools/selection.js';
import { registerInspectionTools } from './tools/inspection.js';
import { registerScreenshotTools } from './tools/screenshot.js';
import { registerNavigationTools } from './tools/navigation.js';
import { registerComponentTools } from './tools/components.js';
import { registerForgeTools } from './tools/forge-tools.js';
import { registerMcpancakeTools } from './tools/mcpancake.js';
import { registerVaultTools } from './tools/vault-tools.js';
import { registerDreamrollTools } from './tools/dreamroll-tools.js';
import { registerLaunchpadTools } from './tools/launchpad-tools.js';
import { registerPokeInjectionTools } from './tools/poke-injection.js';
import { registerSheepTools } from './tools/sheep-tools.js';

// Shared state - updated when the extension sends element selection data
let currentSelection: PokeContext | null = null;

export function setCurrentSelection(ctx: PokeContext): void {
  currentSelection = ctx;
}

export function getCurrentSelection(): PokeContext | null {
  return currentSelection;
}

export function getFormattedSelection(): string {
  if (!currentSelection) return 'No element selected. Click an element in the preview first.';
  return formatPokeContext(currentSelection);
}

async function main(): Promise<void> {
  const server = new McpServer({
    name: 'poking-is-new-coding',
    version: '0.1.0',
  });

  registerSelectionTools(server);
  registerInspectionTools(server);
  registerScreenshotTools(server);
  registerNavigationTools(server);
  registerComponentTools(server);
  registerForgeTools(server);
  registerMcpancakeTools(server);
  registerVaultTools(server);
  registerDreamrollTools(server);
  registerLaunchpadTools(server);
  registerPokeInjectionTools(server);
  registerSheepTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[poking] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[poking] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
