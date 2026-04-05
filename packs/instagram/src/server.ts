import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { createInstagramOAuth } from './auth/oauth.js';
import { getMediaTools } from './tools/media.js';
import { getCommentTools } from './tools/comments.js';
import { getInsightTools } from './tools/insights.js';

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v21.0';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'instagram',
  version: '0.1.0',
  auth: { type: 'oauth2' },
  rateLimits: {
    requestsPerMinute: 200,
    requestsPerDay: 100000,
    retryOnRateLimit: true,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
  },
};

export async function createServer(): Promise<McpServer> {
  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);

  const oauth = createInstagramOAuth(config.auth, config.auth.tokenStorePath);

  if (!oauth.isAuthenticated()) {
    const { url, state } = oauth.generateAuthUrl();
    process.stderr.write(`[linkraft/instagram] Not authenticated. Open this URL to authorize:\n${url}\n`);
    await oauth.startCallbackServer(state);
    process.stderr.write('[linkraft/instagram] Authentication successful.\n');
  }

  const http = new HttpClient({
    baseUrl: INSTAGRAM_API_BASE,
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => oauth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-instagram',
    version: config.version,
  });

  const toolGroups = [
    getMediaTools(http),
    getCommentTools(http),
    getInsightTools(http),
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
  process.stderr.write('[linkraft/instagram] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft/instagram] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
