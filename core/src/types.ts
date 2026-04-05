export interface AuthConfig {
  type: 'oauth2' | 'api-key' | 'bearer' | 'bot-token';
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  tokenStorePath?: string;
  callbackPort?: number;
  apiKey?: string;
  botToken?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  retryOnRateLimit: boolean;
  retryMaxAttempts: number;
  retryBackoffMs: number;
}

export interface TransportConfig {
  type: 'stdio' | 'http';
  port?: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
}

export interface LinkraftConfig {
  name: string;
  version: string;
  auth: AuthConfig;
  rateLimits: RateLimitConfig;
  transport: TransportConfig;
  endpoints: {
    enabled: string[];
    disabled: string[];
  };
  logging: LoggingConfig;
}

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

export interface NormalizedError {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
  originalError?: unknown;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
  scopes?: string[];
}

export interface RateLimitStats {
  requestsInWindow: number;
  requestsToday: number;
  windowResetAt: number;
  dayResetAt: number;
}
