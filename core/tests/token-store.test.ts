import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { TokenStore } from '../src/auth/token-store.js';

const TEST_DIR = join(import.meta.dirname, '.tmp-token-test');

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('TokenStore', () => {
  it('returns undefined when no token exists', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    expect(store.load()).toBeUndefined();
    expect(store.getAccessToken()).toBeUndefined();
  });

  it('saves and loads a token', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({
      accessToken: 'abc123',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600_000,
    });

    const loaded = store.load();
    expect(loaded?.accessToken).toBe('abc123');
    expect(loaded?.tokenType).toBe('Bearer');
  });

  it('reports not expired for valid token', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({
      accessToken: 'abc123',
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3600_000,
    });

    expect(store.isExpired()).toBe(false);
  });

  it('reports expired for past token', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({
      accessToken: 'abc123',
      tokenType: 'Bearer',
      expiresAt: Date.now() - 1000,
    });

    expect(store.isExpired()).toBe(true);
  });

  it('reports not expired when no expiresAt', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({
      accessToken: 'abc123',
      tokenType: 'Bearer',
    });

    expect(store.isExpired()).toBe(false);
  });

  it('clears the token', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({ accessToken: 'abc123', tokenType: 'Bearer' });
    store.clear();
    expect(store.getAccessToken()).toBeUndefined();
  });

  it('gets refresh token', () => {
    const store = new TokenStore('test', join(TEST_DIR, 'test.json'));
    store.save({
      accessToken: 'abc',
      refreshToken: 'refresh123',
      tokenType: 'Bearer',
    });

    expect(store.getRefreshToken()).toBe('refresh123');
  });

  it('returns the name', () => {
    const store = new TokenStore('my-pack', join(TEST_DIR, 'my-pack.json'));
    expect(store.getName()).toBe('my-pack');
  });
});
