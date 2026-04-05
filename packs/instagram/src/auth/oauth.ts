import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';

const DEFAULT_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
];

export function createInstagramOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['INSTAGRAM_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['INSTAGRAM_CLIENT_SECRET'],
    authorizeUrl: FACEBOOK_AUTH_URL,
    tokenUrl: FACEBOOK_TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: 'instagram',
    tokenStorePath,
    usePKCE: false,
  });
}
