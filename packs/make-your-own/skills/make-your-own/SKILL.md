---
name: make-your-own
description: Guide for building a custom Linkraft MCP server pack from any API. Covers both the generator CLI and manual creation.
---

# Make Your Own Linkraft Pack

Build a custom MCP server pack that connects Claude Code to any API. Two approaches: automatic (from an API spec) or manual (from scratch).

## Option 1: Generate from an API Spec (Fastest)

If the API has an OpenAPI or Swagger spec:

```bash
# Clone Linkraft
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft && npm install && npm run build

# Generate from a spec URL
node generator/dist/cli.js generate https://petstore.swagger.io/v2/swagger.json --name petstore --output ./packs

# Generate from a local file
node generator/dist/cli.js generate ./my-api.yaml --name my-api

# With options
node generator/dist/cli.js generate <spec> --name my-api --auth oauth2 --description "My API integration"
```

The generator creates a complete pack with server, tools, auth, config, plugin metadata, SKILL.md, README, and SETUP.md.

After generating:
```bash
cd packs/my-api
npm install && npm run build
```

## Option 2: Build from Scratch

### Step 1: Create the Directory Structure

```
packs/my-api/
  .claude-plugin/
    plugin.json
  skills/
    my-api/
      SKILL.md
  src/
    auth/
    tools/
    server.ts
  tests/
  package.json
  tsconfig.json
  config.example.json
  .mcp.json
  README.md
  SETUP.md
```

### Step 2: Choose Your Auth Type

**API Key / Bearer Token** (simplest):
```typescript
// src/auth/auth.ts
import { BotTokenAuth } from '@linkraft/core';

export class MyApiAuth extends BotTokenAuth {
  constructor(apiKey?: string, tokenStorePath?: string) {
    const token = apiKey ?? process.env['MY_API_KEY'];
    super('my-api', token, tokenStorePath);
  }

  validateToken(): { valid: boolean; error?: string } {
    const token = this.getBotToken();
    if (!token) {
      return { valid: false, error: 'No API key. Set MY_API_KEY env var.' };
    }
    return { valid: true };
  }

  async getAuthHeader(): Promise<string> {
    return 'Bearer ' + (this.getBotToken() ?? '');
  }
}
```

**OAuth 2.0** (for APIs like Google, Twitter, Slack):
```typescript
// src/auth/oauth.ts
import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

export function createMyApiOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['MY_API_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['MY_API_CLIENT_SECRET'],
    authorizeUrl: 'https://api.example.com/oauth/authorize',
    tokenUrl: 'https://api.example.com/oauth/token',
    scopes: authConfig.scopes ?? ['read', 'write'],
    callbackPort: 8585,
    tokenStoreName: 'my-api',
    tokenStorePath,
    usePKCE: false,
  });
}
```

### Step 3: Define Your Tools

One file per resource group in `src/tools/`:

```typescript
// src/tools/items.ts
import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListItemsSchema = z.object({
  limit: z.number().optional().describe('Max items to return (1-100)'),
  offset: z.number().optional().describe('Pagination offset'),
});

const CreateItemSchema = z.object({
  name: z.string().describe('Item name'),
  description: z.string().optional().describe('Item description'),
});

export function getItemTools(http: HttpClient) {
  return {
    my_api_list_items: {
      description: 'List all items with optional pagination.',
      schema: ListItemsSchema,
      handler: async (params: z.infer<typeof ListItemsSchema>) => {
        const query = new URLSearchParams();
        if (params.limit) query.set('limit', String(params.limit));
        if (params.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        const response = await http.get(`/items${qs ? '?' + qs : ''}`);
        return response.data;
      },
    },
    my_api_create_item: {
      description: 'Create a new item.',
      schema: CreateItemSchema,
      handler: async (params: z.infer<typeof CreateItemSchema>) => {
        const response = await http.post('/items', params);
        return response.data;
      },
    },
  };
}
```

### Step 4: Wire Up the Server

```typescript
// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';
import type { LinkraftConfig } from '@linkraft/core';
import { MyApiAuth } from './auth/auth.js';
import { getItemTools } from './tools/items.js';

const PACK_DEFAULTS: Partial<LinkraftConfig> = {
  name: 'my-api',
  version: '0.1.0',
  auth: { type: 'api-key' },
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerDay: 100000,
    retryOnRateLimit: true,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
  },
};

export async function createServer(): Promise<McpServer> {
  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);
  const auth = new MyApiAuth(config.auth.apiKey, config.auth.tokenStorePath);

  const http = new HttpClient({
    baseUrl: 'https://api.example.com/v1',
    rateLimits: config.rateLimits,
    retryMaxAttempts: config.rateLimits.retryMaxAttempts,
    retryBackoffMs: config.rateLimits.retryBackoffMs,
    getAuthHeader: () => auth.getAuthHeader(),
  });

  const server = new McpServer({
    name: 'linkraft-my-api',
    version: config.version,
  });

  const toolGroups = [getItemTools(http)];

  for (const group of toolGroups) {
    for (const [name, tool] of Object.entries(group)) {
      server.tool(
        name,
        tool.description,
        tool.schema.shape,
        async (params: Record<string, unknown>) => {
          try {
            const result = await tool.handler(
              params as Parameters<typeof tool.handler>[0]
            );
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              }],
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
  process.stderr.write('[linkraft/my-api] MCP server running on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(
    '[linkraft/my-api] Fatal: ' +
    (error instanceof Error ? error.message : String(error)) + '\n'
  );
  process.exit(1);
});
```

### Step 5: Add Config Files

**package.json:**
```json
{
  "name": "@linkraft/my-api",
  "version": "0.1.0",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@linkraft/core": "*",
    "@modelcontextprotocol/sdk": "^1.12.0"
  }
}
```

**tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**.mcp.json:**
```json
{
  "mcpServers": {
    "linkraft-my-api": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": { "MY_API_KEY": "" }
    }
  }
}
```

### Step 6: Write Tests

```typescript
// tests/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getItemTools } from '../src/tools/items.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    // ... other methods
  } as unknown as HttpClient;
}

describe('Item tools', () => {
  let http: HttpClient;
  beforeEach(() => { http = createMockHttp(); });

  it('list_items calls GET /items', async () => {
    const tools = getItemTools(http);
    await tools.my_api_list_items.handler({});
    expect(http.get).toHaveBeenCalledWith('/items');
  });
});
```

### Step 7: Build and Use

```bash
npm install && npm run build && npm test
```

Add to Claude Code by putting the .mcp.json path in your settings, or by adding the pack to the Linkraft marketplace.json.

## Tool Naming Convention

All tools: `{prefix}_{resource}_{action}` in snake_case.

Examples: `my_api_list_items`, `my_api_create_item`, `my_api_get_item`

## Rules

- No `console.log` in production code (breaks stdio transport, use `process.stderr.write`)
- No hardcoded credentials
- Every Zod schema field needs `.describe()` for LLM context
- TypeScript strict mode, no `any`
- All API calls through the shared HttpClient (handles rate limiting and retries)

## Reference Packs

- Simple bot token auth: `packs/telegram/`, `packs/discord/`
- OAuth 2.0: `packs/twitter-x/`, `packs/gmail/`
- Bearer token: `packs/notion/`
