import { OAuth2Client } from '@linkraft/core';
import type { AuthConfig } from '@linkraft/core';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export function createGoogleCalendarOAuth(authConfig: AuthConfig, tokenStorePath?: string): OAuth2Client {
  return new OAuth2Client({
    clientId: authConfig.clientId ?? process.env['GOOGLE_CALENDAR_CLIENT_ID'] ?? '',
    clientSecret: authConfig.clientSecret ?? process.env['GOOGLE_CALENDAR_CLIENT_SECRET'],
    authorizeUrl: GOOGLE_AUTH_URL,
    tokenUrl: GOOGLE_TOKEN_URL,
    scopes: authConfig.scopes ?? DEFAULT_SCOPES,
    callbackPort: authConfig.callbackPort ?? 8585,
    tokenStoreName: 'google-calendar',
    tokenStorePath,
    usePKCE: false,
  });
}
