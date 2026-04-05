import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { NotionBearerAuth } from '../src/auth/bearer-token.js';

const TMP_DIR = join(import.meta.dirname, '.tmp-health-test');
const VALID_TOKEN_SECRET = 'secret_abc123def456ghi789jkl012mno345pqr678';
const VALID_TOKEN_NTN = 'ntn_abc123def456ghi789jkl012mno345pqr678';

function createAuth(token?: string): NotionBearerAuth {
  const storePath = join(TMP_DIR, `token-${Date.now()}-${Math.random()}.json`);
  return new NotionBearerAuth(token, storePath);
}

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
  delete process.env['NOTION_API_KEY'];
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env['NOTION_API_KEY'];
});

describe('NotionBearerAuth', () => {
  it('validates a token starting with secret_', () => {
    const auth = createAuth(VALID_TOKEN_SECRET);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('validates a token starting with ntn_', () => {
    const auth = createAuth(VALID_TOKEN_NTN);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects missing token', () => {
    const auth = createAuth(undefined);
    const result = auth.validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No API key');
  });

  it('rejects token with wrong prefix', () => {
    const auth = createAuth('invalid_token_format');
    const result = auth.validateToken();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid token format');
  });

  it('reads token from NOTION_API_KEY env var', () => {
    process.env['NOTION_API_KEY'] = VALID_TOKEN_SECRET;
    const auth = createAuth(undefined);
    const result = auth.validateToken();
    expect(result.valid).toBe(true);
  });

  it('returns Bearer-prefixed auth header', async () => {
    const auth = createAuth(VALID_TOKEN_SECRET);
    const header = await auth.getAuthHeader();
    expect(header).toBe(`Bearer ${VALID_TOKEN_SECRET}`);
  });

  it('returns correct Notion-Version', () => {
    const auth = createAuth(VALID_TOKEN_SECRET);
    expect(auth.getNotionVersion()).toBe('2022-06-28');
  });

  it('prefers constructor token over env var', () => {
    process.env['NOTION_API_KEY'] = 'secret_env_token_value';
    const auth = createAuth(VALID_TOKEN_SECRET);
    const token = auth.getBotToken();
    expect(token).toBe(VALID_TOKEN_SECRET);
  });
});
