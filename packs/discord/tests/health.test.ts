import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DiscordBotAuth } from '../src/auth/bot-token.js';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');
const VALID_TOKEN = 'dGVzdC10b2tlbi1mb3ItdW5pdC10.GABcDE.test-fake-token-value-not-real00';

function createAuth(token?: string): DiscordBotAuth {
  const storePath = join(TMP_DIR, `token-${Date.now()}-${Math.random()}.json`);
  return new DiscordBotAuth(token, storePath);
}

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['DISCORD_BOT_TOKEN'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['DISCORD_BOT_TOKEN'];
});

describe('DiscordBotAuth', () => {
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

  it('reads token from DISCORD_BOT_TOKEN env var', () => {
    process.env['DISCORD_BOT_TOKEN'] = VALID_TOKEN;
    const auth = createAuth(undefined);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
  });

  it('returns Bot-prefixed auth header', async () => {
    const auth = createAuth(VALID_TOKEN);
    const header = await auth.getAuthHeader();
    expect(header).toBe(`Bot ${VALID_TOKEN}`);
  });

  it('prefers constructor token over env var', () => {
    process.env['DISCORD_BOT_TOKEN'] = 'TWVhc3VyZW1lbnRJZA.GaBcDe.abcdefghijklmnopqrstuvwxyz99999';
    const auth = createAuth(VALID_TOKEN);
    const token = auth.getBotToken();
    expect(token).toBe(VALID_TOKEN);
  });
});
