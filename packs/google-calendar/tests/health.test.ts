import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGoogleCalendarOAuth } from '../src/auth/oauth.js';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['GOOGLE_CALENDAR_CLIENT_ID'];
  delete process.env['GOOGLE_CALENDAR_CLIENT_SECRET'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['GOOGLE_CALENDAR_CLIENT_ID'];
  delete process.env['GOOGLE_CALENDAR_CLIENT_SECRET'];
});

describe('Google Calendar OAuth', () => {
  it('creates OAuth client with config', () => {
    const oauth = createGoogleCalendarOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth).toBeDefined();
  });

  it('generates auth URL without PKCE', () => {
    const oauth = createGoogleCalendarOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    const { url, state } = oauth.generateAuthUrl();
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=test-id');
    expect(url).not.toContain('code_challenge');
    expect(url).not.toContain('code_challenge_method');
    expect(state).toBeTypeOf('string');
  });

  it('reports not authenticated when no token stored', () => {
    const oauth = createGoogleCalendarOAuth({
      type: 'oauth2',
      clientId: 'test-id',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth.isAuthenticated()).toBe(false);
  });

  it('reads client ID from env var', () => {
    process.env['GOOGLE_CALENDAR_CLIENT_ID'] = 'env-id';
    const oauth = createGoogleCalendarOAuth({
      type: 'oauth2',
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('client_id=env-id');
  });

  it('includes required scopes in auth URL', () => {
    const oauth = createGoogleCalendarOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      scopes: ['https://www.googleapis.com/auth/calendar'],
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('scope=');
    expect(url).toContain('auth%2Fcalendar');
  });
});
