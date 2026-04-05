import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

const DEFAULT_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'like.read',
  'like.write',
  'bookmark.read',
  'bookmark.write',
  'offline.access',
];

export function createTwitterOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['TWITTER_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['TWITTER_CLIENT_SECRET'],
    authorizeUrl: TWITTER_AUTH_URL,
    tokenUrl: TWITTER_TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: 'twitter-x',
    tokenStorePath,
    usePKCE: true,
  });
}
