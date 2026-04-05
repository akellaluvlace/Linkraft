import type { NormalizedError } from './types.js';

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof HttpApiError) {
    return {
      code: `HTTP_${error.status}`,
      message: error.message,
      status: error.status,
      retryable: error.retryable,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    const isNetwork = error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('fetch failed');

    return {
      code: isTimeout ? 'TIMEOUT' : isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      message: error.message,
      retryable: isTimeout || isNetwork,
      originalError: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    retryable: false,
    originalError: error,
  };
}

export class HttpApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryable: boolean,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = 'HttpApiError';
  }

  static fromStatus(status: number, body?: unknown): HttpApiError {
    const retryable = status === 429 || status >= 500;
    const message = getStatusMessage(status, body);
    return new HttpApiError(status, message, retryable, body);
  }
}

function getStatusMessage(status: number, body?: unknown): string {
  const bodyMsg = typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)['message'] ?? (body as Record<string, unknown>)['error']
    : undefined;

  const detail = typeof bodyMsg === 'string' ? `: ${bodyMsg}` : '';

  switch (status) {
    case 400: return `Bad Request${detail}`;
    case 401: return `Unauthorized${detail}`;
    case 403: return `Forbidden${detail}`;
    case 404: return `Not Found${detail}`;
    case 429: return `Rate Limited${detail}`;
    default:
      if (status >= 500) return `Server Error (${status})${detail}`;
      return `HTTP Error ${status}${detail}`;
  }
}

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  onRetry?: (attempt: number, error: NormalizedError) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: NormalizedError | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = normalizeError(err);

      if (!lastError.retryable || attempt === options.maxAttempts) {
        throw err;
      }

      options.onRetry?.(attempt, lastError);

      const delay = options.backoffMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError?.originalError ?? new Error('Retry failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toMcpToolError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  const normalized = normalizeError(error);
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error [${normalized.code}]: ${normalized.message}`,
      },
    ],
    isError: true,
  };
}
