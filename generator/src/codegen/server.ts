import type { ParsedSpec } from '../types.js';

export function generateServerFile(
  packName: string,
  spec: ParsedSpec,
  authType: 'oauth2' | 'api-key' | 'bearer',
  toolGroups: string[],
): string {
  const serverName = `linkraft-${packName}`;
  const lines: string[] = [];

  // Imports
  lines.push("import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';");
  lines.push("import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';");
  lines.push("import { HttpClient, loadConfig, toMcpToolError } from '@linkraft/core';");
  lines.push("import type { LinkraftConfig } from '@linkraft/core';");

  // Auth import
  if (authType === 'oauth2') {
    lines.push(`import { create${toPascalCase(packName)}OAuth } from './auth/oauth.js';`);
  } else {
    lines.push(`import { ${toPascalCase(packName)}Auth } from './auth/auth.js';`);
  }

  // Tool imports
  for (const group of toolGroups) {
    const fnName = `get${toPascalCase(group)}Tools`;
    lines.push(`import { ${fnName} } from './tools/${group}.js';`);
  }

  lines.push('');

  // API base
  lines.push(`const API_BASE = '${spec.baseUrl}';`);
  lines.push('');

  // Pack defaults
  lines.push(`const PACK_DEFAULTS: Partial<LinkraftConfig> = {`);
  lines.push(`  name: '${packName}',`);
  lines.push(`  version: '${spec.version}',`);
  lines.push(`  auth: { type: '${authType}' },`);
  lines.push('  rateLimits: {');
  lines.push('    requestsPerMinute: 60,');
  lines.push('    requestsPerDay: 100000,');
  lines.push('    retryOnRateLimit: true,');
  lines.push('    retryMaxAttempts: 3,');
  lines.push('    retryBackoffMs: 1000,');
  lines.push('  },');
  lines.push('};');
  lines.push('');

  // createServer function
  lines.push('export async function createServer(): Promise<McpServer> {');
  lines.push("  const config = loadConfig(__dirname + '/..', PACK_DEFAULTS);");
  lines.push('');

  // Auth setup
  if (authType === 'oauth2') {
    lines.push(`  const oauth = create${toPascalCase(packName)}OAuth(config.auth, config.auth.tokenStorePath);`);
    lines.push('');
    lines.push('  if (!oauth.isAuthenticated()) {');
    lines.push('    const { url, state } = oauth.generateAuthUrl();');
    lines.push(`    process.stderr.write('[${serverName}] Not authenticated. Open this URL:\\n' + url + '\\n');`);
    lines.push('    await oauth.startCallbackServer(state);');
    lines.push(`    process.stderr.write('[${serverName}] Authentication successful.\\n');`);
    lines.push('  }');
    lines.push('');
    lines.push('  const http = new HttpClient({');
    lines.push('    baseUrl: API_BASE,');
    lines.push('    rateLimits: config.rateLimits,');
    lines.push('    retryMaxAttempts: config.rateLimits.retryMaxAttempts,');
    lines.push('    retryBackoffMs: config.rateLimits.retryBackoffMs,');
    lines.push('    getAuthHeader: () => oauth.getAuthHeader(),');
    lines.push('  });');
  } else {
    const authClass = `${toPascalCase(packName)}Auth`;
    lines.push(`  const auth = new ${authClass}(config.auth.apiKey ?? config.auth.botToken, config.auth.tokenStorePath);`);
    lines.push('');
    lines.push('  const validation = auth.validateToken();');
    lines.push('  if (!validation.valid) {');
    lines.push(`    process.stderr.write('[${serverName}] Auth error: ' + (validation.error ?? 'unknown') + '\\n');`);
    lines.push('  }');
    lines.push('');
    lines.push('  const http = new HttpClient({');
    lines.push('    baseUrl: API_BASE,');
    lines.push('    rateLimits: config.rateLimits,');
    lines.push('    retryMaxAttempts: config.rateLimits.retryMaxAttempts,');
    lines.push('    retryBackoffMs: config.rateLimits.retryBackoffMs,');
    lines.push(`    getAuthHeader: () => auth.getAuthHeader(),`);
    lines.push('  });');
  }

  lines.push('');

  // Server setup
  lines.push('  const server = new McpServer({');
  lines.push(`    name: '${serverName}',`);
  lines.push('    version: config.version,');
  lines.push('  });');
  lines.push('');

  // Register tools
  lines.push('  const toolGroups = [');
  for (const group of toolGroups) {
    lines.push(`    get${toPascalCase(group)}Tools(http),`);
  }
  lines.push('  ];');
  lines.push('');
  lines.push('  for (const group of toolGroups) {');
  lines.push('    for (const [name, tool] of Object.entries(group)) {');
  lines.push('      server.tool(');
  lines.push('        name,');
  lines.push('        tool.description,');
  lines.push('        tool.schema.shape,');
  lines.push('        async (params: Record<string, unknown>) => {');
  lines.push('          try {');
  lines.push('            const result = await tool.handler(params as Parameters<typeof tool.handler>[0]);');
  lines.push('            return {');
  lines.push("              content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],");
  lines.push('            };');
  lines.push('          } catch (error) {');
  lines.push('            return toMcpToolError(error);');
  lines.push('          }');
  lines.push('        },');
  lines.push('      );');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  return server;');
  lines.push('}');
  lines.push('');

  // Main function
  lines.push('async function main(): Promise<void> {');
  lines.push('  const server = await createServer();');
  lines.push('  const transport = new StdioServerTransport();');
  lines.push('  await server.connect(transport);');
  lines.push(`  process.stderr.write('[${serverName}] MCP server running on stdio\\n');`);
  lines.push('}');
  lines.push('');
  lines.push('main().catch((error: unknown) => {');
  lines.push(`  process.stderr.write('[${serverName}] Fatal: ' + (error instanceof Error ? error.message : String(error)) + '\\n');`);
  lines.push('  process.exit(1);');
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s/g, '');
}
