import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { createLinkedInOAuth } from './auth/oauth.js';
import { getPostTools } from './tools/posts.js';
import { getProfileTools } from './tools/profile.js';
import { getOrganizationTools } from './tools/organizations.js';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'linkedin',
  version: '0.1.0',
  auth: { type: 'oauth2' },
  rateLimits: {
    requestsPerMinute: 100,
    requestsPerDay: 100000,
    retryOnRateLimit: true,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
  },
};

export async function createServer(): Promise<McpServer> {
  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);

  const oauth = createLinkedInOAuth(config.auth, config.auth.tokenStorePath);

  if (!oauth.isAuthenticated()) {
    const { url, state } = oauth.generateAuthUrl();
    process.stderr.write(`[linkraft/linkedin] Not authenticated. Open this URL to authorize:\n${url}\n`);
    await oauth.startCallbackServer(state);
    process.stderr.write('[linkraft/linkedin] Authentication successful.\n');
  }

  const http = new HttpClient({
    baseUrl: LINKEDIN_API_BASE,
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => oauth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-linkedin',
    version: config.version,
  });

  const toolGroups = [
    getPostTools(http),
    getProfileTools(http),
    getOrganizationTools(http),
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
  process.stderr.write('[linkraft/linkedin] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[linkraft/linkedin] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
