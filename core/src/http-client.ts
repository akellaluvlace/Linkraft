import type { HttpRequestOptions, HttpResponse } from './types.js';
import { HttpApiError, withRetry } from './error-handler.js';
import { RateLimiter } from './rate-limiter.js';
import type { RateLimitConfig } from './types.js';

export interface HttpClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  rateLimits?: RateLimitConfig;
  retryMaxAttempts?: number;
  retryBackoffMs?: number;
  getAuthHeader?: () => Promise<string | undefined>;
  pathPrefix?: string;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly rateLimiter: RateLimiter | undefined;
  private readonly retryMaxAttempts: number;
  private readonly retryBackoffMs: number;
  private readonly getAuthHeader?: () => Promise<string | undefined>;
  private readonly pathPrefix: string;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.pathPrefix = options.pathPrefix ?? '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.defaultHeaders,
    };
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retryMaxAttempts = options.retryMaxAttempts ?? 3;
    this.retryBackoffMs = options.retryBackoffMs ?? 1000;
    this.getAuthHeader = options.getAuthHeader;

    if (options.rateLimits) {
      this.rateLimiter = new RateLimiter(options.rateLimits);
    }
  }

  async request<T = unknown>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const prefixedPath = this.pathPrefix
      ? `${this.pathPrefix}${options.url.startsWith('/') ? '' : '/'}${options.url}`
      : options.url;
    const url = prefixedPath.startsWith('http')
      ? prefixedPath
      : `${this.baseUrl}${prefixedPath.startsWith('/') ? '' : '/'}${prefixedPath}`;

    return withRetry(
      async () => {
        if (this.rateLimiter) {
          await this.rateLimiter.acquire(url);
        }

        const headers: Record<string, string> = { ...this.defaultHeaders, ...options.headers };

        if (this.getAuthHeader) {
          const authHeader = await this.getAuthHeader();
          if (authHeader) {
            headers['Authorization'] = authHeader;
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          options.timeoutMs ?? this.timeoutMs,
        );

        try {
          const response = await fetch(url, {
            method: options.method,
            headers,
            body: options.body != null ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
          });

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          let data: T;
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            data = await response.json() as T;
          } else {
            data = await response.text() as T;
          }

          if (!response.ok) {
            throw HttpApiError.fromStatus(response.status, data);
          }

          return { status: response.status, headers: responseHeaders, data };
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        maxAttempts: this.retryMaxAttempts,
        backoffMs: this.retryBackoffMs,
      },
    );
  }

  async get<T = unknown>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url: path, headers });
  }

  async post<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url: path, body, headers });
  }

  async put<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url: path, body, headers });
  }

  async patch<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url: path, body, headers });
  }

  async delete<T = unknown>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url: path, headers });
  }
}
