import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInstagramOAuth } from '../src/auth/oauth.js';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['INSTAGRAM_CLIENT_ID'];
  delete process.env['INSTAGRAM_CLIENT_SECRET'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['INSTAGRAM_CLIENT_ID'];
  delete process.env['INSTAGRAM_CLIENT_SECRET'];
});

describe('Instagram OAuth', () => {
  it('creates OAuth client with config', () => {
    const oauth = createInstagramOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth).toBeDefined();
  });

  it('generates auth URL pointing to facebook.com', () => {
    const oauth = createInstagramOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    const { url, state } = oauth.generateAuthUrl();
    expect(url).toContain('facebook.com/v21.0/dialog/oauth');
    expect(url).toContain('client_id=test-id');
    expect(state).toBeTypeOf('string');
  });

  it('does not include PKCE parameters in auth URL', () => {
    const oauth = createInstagramOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).not.toContain('code_challenge');
    expect(url).not.toContain('code_challenge_method');
  });

  it('reports not authenticated when no token stored', () => {
    const oauth = createInstagramOAuth({
      type: 'oauth2',
      clientId: 'test-id',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth.isAuthenticated()).toBe(false);
  });

  it('reads client ID from env var', () => {
    process.env['INSTAGRAM_CLIENT_ID'] = 'env-id';
    const oauth = createInstagramOAuth({
      type: 'oauth2',
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('client_id=env-id');
  });

  it('includes required scopes in auth URL', () => {
    const oauth = createInstagramOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      scopes: ['instagram_basic', 'instagram_content_publish'],
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('scope=instagram_basic+instagram_content_publish');
  });
});
