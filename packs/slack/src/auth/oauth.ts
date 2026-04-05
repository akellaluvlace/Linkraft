import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';

const DEFAULT_SCOPES = [
  'chat:write',
  'channels:read',
  'channels:history',
  'users:read',
  'reactions:write',
  'files:write',
  'pins:write',
];

export function createSlackOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['SLACK_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['SLACK_CLIENT_SECRET'],
    authorizeUrl: SLACK_AUTH_URL,
    tokenUrl: SLACK_TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: 'slack',
    tokenStorePath,
    usePKCE: false,
  });
}
