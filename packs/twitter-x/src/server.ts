import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { createTwitterOAuth } from './auth/oauth.js';
import { getTweetTools } from './tools/tweets.js';
import { getUserTools } from './tools/users.js';
import { getEngagementTools } from './tools/engagement.js';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'twitter-x',
  version: '0.1.0',
  auth: { type: 'oauth2' },
  rateLimits: {
    requestsPerMinute: 15,
    requestsPerDay: 50000,
    retryOnRateLimit: true,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
  },
};

export async function createServer(): Promise<McpServer> {
  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);

  const oauth = createTwitterOAuth(config.auth, config.auth.tokenStorePath);

  if (!oauth.isAuthenticated()) {
    const { url, codeVerifier, state } = oauth.generateAuthUrl();
    process.stderr.write(`[linkraft/twitter-x] Not authenticated. Open this URL to authorize:\n${url}\n`);
    await oauth.startCallbackServer(state, codeVerifier);
    process.stderr.write('[linkraft/twitter-x] Authentication successful.\n');
  }

  const http = new HttpClient({
    baseUrl: TWITTER_API_BASE,
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => oauth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-twitter-x',
    version: config.version,
  });

  const toolGroups = [
    getTweetTools(http),
    getUserTools(http),
    getEngagementTools(http),
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
  process.stderr.write('[linkraft/twitter-x] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft/twitter-x] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
