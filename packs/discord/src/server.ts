import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { DiscordBotAuth } from './auth/bot-token.js';
import { getMessageTools } from './tools/messages.js';
import { getChannelTools } from './tools/channels.js';
import { getGuildTools } from './tools/guilds.js';
import { getMemberTools } from './tools/members.js';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'discord',
  version: '0.1.0',
  auth: { type: 'bot-token' },
  rateLimits: {
    requestsPerMinute: 50,
    requestsPerDay: 100000,
    retryOnRateLimit: true,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
  },
};

export async function createServer(): Promise<McpServer> {
  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);

  const auth = new DiscordBotAuth(
    config.auth.botToken,
    config.auth.tokenStorePath,
  );

  const validation = auth.validateToken();
  if (!validation.valid) {
    process.stderr.write(`[linkraft/discord] Auth error: ${validation.error}\n`);
  }

  const http = new HttpClient({
    baseUrl: DISCORD_API_BASE,
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => auth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-discord',
    version: config.version,
  });

  const toolGroups = [
    getMessageTools(http),
    getChannelTools(http),
    getGuildTools(http),
    getMemberTools(http),
  ];

  for (const group of toolGroups) {
    for (const [name, tool] of Object.entries(group)) {
      server.tool(
        name,
        tool.description,
        tool.schema.shape,
        async (params: Record<string, unknown>) => {
          try {
            const result = await tool.handler(params as Parameters<typeof tool.handler>[0]);
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
          } catch (error) {
            return toMcpToolError(error);
          }
        },
      );
    }
  }

  return server;
}

async function main(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[linkraft/discord] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft/discord] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
