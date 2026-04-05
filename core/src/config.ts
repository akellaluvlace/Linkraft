import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LinkraftConfig, AuthConfig, RateLimitConfig, TransportConfig, LoggingConfig } from './types.js';

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerDay: 10000,
  retryOnRateLimit: true,
  retryMaxAttempts: 3,
  retryBackoffMs: 1000,
};

const DEFAULT_TRANSPORT: TransportConfig = {
  type: 'stdio',
};

const DEFAULT_LOGGING: LoggingConfig = {
  level: 'info',
};

const DEFAULT_AUTH: AuthConfig = {
  type: 'api-key',
};

export class ConfigValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(`Config validation error [${field}]: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

function getEnvOverrides(): Partial<LinkraftConfig> {
  const overrides: Partial<LinkraftConfig> = {};

  const authType = process.env['LINKRAFT_AUTH_TYPE'];
  if (authType) {
    overrides.auth = {
      ...DEFAULT_AUTH,
      type: authType as AuthConfig['type'],
    };
  }

  const apiKey = process.env['LINKRAFT_API_KEY'];
  if (apiKey) {
    overrides.auth = {
      ...(overrides.auth ?? DEFAULT_AUTH),
      type: overrides.auth?.type ?? 'api-key',
      apiKey,
    };
  }

  const botToken = process.env['LINKRAFT_BOT_TOKEN'];
  if (botToken) {
    overrides.auth = {
      ...(overrides.auth ?? DEFAULT_AUTH),
      type: 'bot-token',
      botToken,
    };
  }

  const logLevel = process.env['LINKRAFT_LOG_LEVEL'];
  if (logLevel) {
    overrides.logging = {
      level: logLevel as LoggingConfig['level'],
    };
  }

  return overrides;
}

function validateConfig(config: LinkraftConfig): void {
  if (!config.name || typeof config.name !== 'string') {
    throw new ConfigValidationError('name', 'must be a non-empty string');
  }

  if (!config.version || typeof config.version !== 'string') {
    throw new ConfigValidationError('version', 'must be a non-empty string');
  }

  const validAuthTypes = ['oauth2', 'api-key', 'bearer', 'bot-token'];
  if (!validAuthTypes.includes(config.auth.type)) {
    throw new ConfigValidationError(
      'auth.type',
      `must be one of: ${validAuthTypes.join(', ')}`,
    );
  }

  if (config.rateLimits.requestsPerMinute < 0) {
    throw new ConfigValidationError('rateLimits.requestsPerMinute', 'must be non-negative');
  }

  if (config.rateLimits.requestsPerDay < 0) {
    throw new ConfigValidationError('rateLimits.requestsPerDay', 'must be non-negative');
  }

  if (config.rateLimits.retryMaxAttempts < 0) {
    throw new ConfigValidationError('rateLimits.retryMaxAttempts', 'must be non-negative');
  }

  if (config.rateLimits.retryBackoffMs < 0) {
    throw new ConfigValidationError('rateLimits.retryBackoffMs', 'must be non-negative');
  }

  const validTransports = ['stdio', 'http'];
  if (!validTransports.includes(config.transport.type)) {
    throw new ConfigValidationError(
      'transport.type',
      `must be one of: ${validTransports.join(', ')}`,
    );
  }

  if (config.transport.type === 'http' && config.transport.port != null) {
    if (config.transport.port < 1 || config.transport.port > 65535) {
      throw new ConfigValidationError('transport.port', 'must be between 1 and 65535');
    }
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logging.level)) {
    throw new ConfigValidationError(
      'logging.level',
      `must be one of: ${validLogLevels.join(', ')}`,
    );
  }
}

export function loadConfig(
  packDir: string,
  defaults?: Partial<LinkraftConfig>,
): LinkraftConfig {
  const configPath = resolve(packDir, 'mcpkit.config.json');

  let fileConfig: Partial<LinkraftConfig> = {};
  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, 'utf-8');
    fileConfig = JSON.parse(raw) as Partial<LinkraftConfig>;
  }

  const envOverrides = getEnvOverrides();

  const name = fileConfig.name ?? defaults?.name ?? '';
  const version = fileConfig.version ?? defaults?.version ?? '1.0.0';

  const config: LinkraftConfig = {
    name,
    version,
    auth: { ...DEFAULT_AUTH, ...defaults?.auth, ...fileConfig.auth, ...envOverrides.auth },
    rateLimits: {
      ...DEFAULT_RATE_LIMITS,
      ...defaults?.rateLimits,
      ...fileConfig.rateLimits,
    },
    transport: {
      ...DEFAULT_TRANSPORT,
      ...defaults?.transport,
      ...fileConfig.transport,
    },
    endpoints: {
      enabled: ['*'],
      disabled: [],
      ...defaults?.endpoints,
      ...fileConfig.endpoints,
    },
    logging: {
      ...DEFAULT_LOGGING,
      ...defaults?.logging,
      ...fileConfig.logging,
      ...envOverrides.logging,
    },
  };

  validateConfig(config);
  return config;
}

export { DEFAULT_RATE_LIMITS, DEFAULT_TRANSPORT, DEFAULT_LOGGING, DEFAULT_AUTH };
