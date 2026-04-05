import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, ConfigValidationError } from '../src/config.js';

const TEST_DIR = join(import.meta.dirname, '.tmp-config-test');

function writeConfig(config: Record<string, unknown>): void {
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(join(TEST_DIR, 'mcpkit.config.json'), JSON.stringify(config));
}

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env['LINKRAFT_AUTH_TYPE'];
  delete process.env['LINKRAFT_API_KEY'];
  delete process.env['LINKRAFT_BOT_TOKEN'];
  delete process.env['LINKRAFT_LOG_LEVEL'];
});

describe('loadConfig', () => {
  it('loads config from file', () => {
    writeConfig({
      name: 'test-pack',
      version: '2.0.0',
      auth: { type: 'api-key', apiKey: 'test-key' },
    });

    const config = loadConfig(TEST_DIR);
    expect(config.name).toBe('test-pack');
    expect(config.version).toBe('2.0.0');
    expect(config.auth.type).toBe('api-key');
    expect(config.auth.apiKey).toBe('test-key');
  });

  it('applies defaults when no config file exists', () => {
    const config = loadConfig(TEST_DIR, { name: 'default-name', version: '1.0.0' });
    expect(config.name).toBe('default-name');
    expect(config.rateLimits.requestsPerMinute).toBe(60);
    expect(config.transport.type).toBe('stdio');
    expect(config.logging.level).toBe('info');
  });

  it('file config overrides defaults', () => {
    writeConfig({
      name: 'file-name',
      version: '1.0.0',
      rateLimits: { requestsPerMinute: 30 },
    });

    const config = loadConfig(TEST_DIR, { name: 'default-name', version: '1.0.0' });
    expect(config.name).toBe('file-name');
    expect(config.rateLimits.requestsPerMinute).toBe(30);
    // Other rate limit fields should still be defaults
    expect(config.rateLimits.requestsPerDay).toBe(10000);
  });

  it('env vars override file config', () => {
    writeConfig({
      name: 'test',
      version: '1.0.0',
      auth: { type: 'api-key' },
      logging: { level: 'info' },
    });

    process.env['LINKRAFT_API_KEY'] = 'env-key';
    process.env['LINKRAFT_LOG_LEVEL'] = 'debug';

    const config = loadConfig(TEST_DIR);
    expect(config.auth.apiKey).toBe('env-key');
    expect(config.logging.level).toBe('debug');
  });

  it('env bot token sets auth type to bot-token', () => {
    writeConfig({ name: 'test', version: '1.0.0' });
    process.env['LINKRAFT_BOT_TOKEN'] = 'bot123';

    const config = loadConfig(TEST_DIR);
    expect(config.auth.type).toBe('bot-token');
    expect(config.auth.botToken).toBe('bot123');
  });
});

describe('config validation', () => {
  it('throws on empty name', () => {
    writeConfig({ name: '', version: '1.0.0' });
    expect(() => loadConfig(TEST_DIR)).toThrow(ConfigValidationError);
  });

  it('throws on invalid auth type', () => {
    writeConfig({ name: 'test', version: '1.0.0', auth: { type: 'invalid' } });
    expect(() => loadConfig(TEST_DIR)).toThrow(ConfigValidationError);
  });

  it('throws on negative rate limit values', () => {
    writeConfig({
      name: 'test',
      version: '1.0.0',
      rateLimits: { requestsPerMinute: -1 },
    });
    expect(() => loadConfig(TEST_DIR)).toThrow(ConfigValidationError);
  });

  it('throws on invalid port', () => {
    writeConfig({
      name: 'test',
      version: '1.0.0',
      transport: { type: 'http', port: 99999 },
    });
    expect(() => loadConfig(TEST_DIR)).toThrow(ConfigValidationError);
  });

  it('throws on invalid log level', () => {
    writeConfig({
      name: 'test',
      version: '1.0.0',
      logging: { level: 'verbose' },
    });
    expect(() => loadConfig(TEST_DIR)).toThrow(ConfigValidationError);
  });
});
