import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

const DEFAULT_SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
];

export function createLinkedInOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['LINKEDIN_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['LINKEDIN_CLIENT_SECRET'],
    authorizeUrl: LINKEDIN_AUTH_URL,
    tokenUrl: LINKEDIN_TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: 'linkedin',
    tokenStorePath,
    usePKCE: false,
  });
}
