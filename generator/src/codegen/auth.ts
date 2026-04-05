import type { ParsedSpec } from '../types.js';

export function generateAuthFile(
  packName: string,
  authType: 'oauth2' | 'api-key' | 'bearer',
  spec: ParsedSpec,
): string {
  if (authType === 'oauth2') {
    return generateOAuth2File(packName, spec);
  }
  return generateTokenAuthFile(packName, authType);
}

function generateOAuth2File(packName: string, spec: ParsedSpec): string {
  const pascal = toPascalCase(packName);
  const envPrefix = packName.toUpperCase().replace(/-/g, '_');
  const oauthSpec = spec.auth.find(a => a.type === 'oauth2');
  const authUrl = oauthSpec?.flows?.authorizationUrl ?? 'https://example.com/oauth/authorize';
  const tokenUrl = oauthSpec?.flows?.tokenUrl ?? 'https://example.com/oauth/token';
  const scopes = oauthSpec?.flows?.scopes ? Object.keys(oauthSpec.flows.scopes) : [];
  const scopeList = scopes.length > 0
    ? scopes.map(s => `  '${s}',`).join('\n')
    : "  'read',";

  return `import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const AUTH_URL = '${authUrl}';
const TOKEN_URL = '${tokenUrl}';

const DEFAULT_SCOPES = [
${scopeList}
];

export function create${pascal}OAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['${envPrefix}_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['${envPrefix}_CLIENT_SECRET'],
    authorizeUrl: AUTH_URL,
    tokenUrl: TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: '${packName}',
    tokenStorePath,
    usePKCE: true,
  });
}
`;
}

function generateTokenAuthFile(packName: string, authType: 'api-key' | 'bearer'): string {
  const pascal = toPascalCase(packName);
  const envVar = `${packName.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  const headerPrefix = authType === 'bearer' ? 'Bearer' : 'Bearer';

  return `import { BotTokenAuth } from '@linkraft/core';

export class ${pascal}Auth extends BotTokenAuth {
  constructor(apiKey?: string, tokenStorePath?: string) {
    const token = apiKey ?? process.env['${envVar}'];
    super('${packName}', token, tokenStorePath);
  }

  validateToken(): { valid: boolean; error?: string } {
    const token = this.getBotToken();
    if (!token) {
      return { valid: false, error: 'No API key configured. Set ${envVar} or add it to mcpkit.config.json' };
    }
    return { valid: true };
  }

  async getAuthHeader(): Promise<string> {
    const token = this.getBotToken();
    return '${headerPrefix} ' + (token ?? '');
  }
}
`;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s/g, '');
}
