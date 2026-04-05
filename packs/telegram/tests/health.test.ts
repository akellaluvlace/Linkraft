import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { TelegramBotAuth } from '../src/auth/bot-token.js';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');
const VALID_TOKEN = '123456789:ABCDefGHIJKlmnop_qRSTUVWxyz-1234567';

function createAuth(token?: string): TelegramBotAuth {
  const storePath = join(TMP_DIR, `token-${Date.now()}-${Math.random()}.json`);
  return new TelegramBotAuth(token, storePath);
}

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['TELEGRAM_BOT_TOKEN'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['TELEGRAM_BOT_TOKEN'];
});

describe('TelegramBotAuth', () => {
  it('validates a correct bot token format', () => {
    const auth = createAuth(VALID_TOKEN);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects missing token', () => {
    const auth = createAuth(undefined);
    const result = auth.validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No bot token');
  });

  it('rejects malformed token', () => {
    const auth = createAuth('not-a-valid-token');
    const result = auth.validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid bot token format');
  });

  it('reads token from TELEGRAM_BOT_TOKEN env var', () => {
    process.env['TELEGRAM_BOT_TOKEN'] = VALID_TOKEN;
    const auth = createAuth(undefined);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
  });

  it('builds correct API base URL without token', () => {
    const auth = createAuth(VALID_TOKEN);
    const url = auth.getApiBaseUrl();
    expect(url).toBe('https://api.telegram.org');
    expect(url).not.toContain(VALID_TOKEN);
  });

  it('builds path prefix with token', () => {
    const auth = createAuth(VALID_TOKEN);
    const prefix = auth.getPathPrefix();
    expect(prefix).toBe(`/bot${VALID_TOKEN}`);
  });

  it('prefers constructor token over env var', () => {
    process.env['TELEGRAM_BOT_TOKEN'] = '000000:envtoken_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const auth = createAuth(VALID_TOKEN);
    const prefix = auth.getPathPrefix();
    expect(prefix).toContain(VALID_TOKEN);
  });
});
