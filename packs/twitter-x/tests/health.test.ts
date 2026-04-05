import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTwitterOAuth } from '../src/auth/oauth.js';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['TWITTER_CLIENT_ID'];
  delete process.env['TWITTER_CLIENT_SECRET'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['TWITTER_CLIENT_ID'];
  delete process.env['TWITTER_CLIENT_SECRET'];
});

describe('Twitter OAuth', () => {
  it('creates OAuth client with config', () => {
    const oauth = createTwitterOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth).toBeDefined();
  });

  it('generates auth URL with PKCE', () => {
    const oauth = createTwitterOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      clientSecret: 'test-secret',
    }, join(TMP_DIR, 'token.json'));
    const { url, codeVerifier, state } = oauth.generateAuthUrl();
    expect(url).toContain('twitter.com/i/oauth2/authorize');
    expect(url).toContain('client_id=test-id');
    expect(url).toContain('code_challenge');
    expect(url).toContain('code_challenge_method=S256');
    expect(codeVerifier).toBeTypeOf('string');
    expect(state).toBeTypeOf('string');
  });

  it('reports not authenticated when no token stored', () => {
    const oauth = createTwitterOAuth({
      type: 'oauth2',
      clientId: 'test-id',
    }, join(TMP_DIR, 'token.json'));
    expect(oauth.isAuthenticated()).toBe(false);
  });

  it('reads client ID from env var', () => {
    process.env['TWITTER_CLIENT_ID'] = 'env-id';
    const oauth = createTwitterOAuth({
      type: 'oauth2',
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('client_id=env-id');
  });

  it('includes required scopes in auth URL', () => {
    const oauth = createTwitterOAuth({
      type: 'oauth2',
      clientId: 'test-id',
      scopes: ['tweet.read', 'tweet.write'],
    }, join(TMP_DIR, 'token.json'));
    const { url } = oauth.generateAuthUrl();
    expect(url).toContain('scope=tweet.read+tweet.write');
  });
});
