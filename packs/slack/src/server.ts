import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { createSlackOAuth } from './auth/oauth.js';
import { getMessageTools } from './tools/messages.js';
import { getChannelTools } from './tools/channels.js';
import { getReactionTools } from './tools/reactions.js';

const SLACK_API_BASE = 'https://slack.com/api';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'slack',
  version: '0.1.0',
  auth: { type: 'oauth2' },
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

  const oauth = createSlackOAuth(config.auth, config.auth.tokenStorePath);

  if (!oauth.isAuthenticated()) {
    const { url, state } = oauth.generateAuthUrl();
    process.stderr.write(`[linkraft/slack] Not authenticated. Open this URL to authorize:\n${url}\n`);
    await oauth.startCallbackServer(state);
    process.stderr.write('[linkraft/slack] Authentication successful.\n');
  }

  const http = new HttpClient({
    baseUrl: SLACK_API_BASE,
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => oauth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-slack',
    version: config.version,
  });

  const toolGroups = [
    getMessageTools(http),
    getChannelTools(http),
    getReactionTools(http),
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
  process.stderr.write('[linkraft/slack] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft/slack] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
