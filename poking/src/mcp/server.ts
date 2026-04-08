import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerSheepTools } from './tools/sheep-tools.js';
import { registerPlanTools } from './tools/plan-tools.js';
import { registerPreflightTools } from './tools/preflight-tools.js';
import { registerDreamrollTools } from './tools/dreamroll-tools.js';

// v1.0 launch: plan, preflight, sheep, dreamroll.
// Poke, forge, vault, launchpad tools remain deferred.

async function main(): Promise<void> {
  const server = new McpServer({
    name: 'linkraft',
    version: '1.0.0',
  });

  registerPlanTools(server);
  registerPreflightTools(server);
  registerSheepTools(server);
  registerDreamrollTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[linkraft] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
