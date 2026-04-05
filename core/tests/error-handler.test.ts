import { describe, it, expect, vi } from 'vitest';
import {
  normalizeError,
  HttpApiError,
  withRetry,
  toMcpToolError,
} from '../src/error-handler.js';

describe('normalizeError', () => {
  it('normalizes HttpApiError', () => {
    const err = HttpApiError.fromStatus(429);
    const normalized = normalizeError(err);
    expect(normalized.code).toBe('HTTP_429');
    expect(normalized.retryable).toBe(true);
    expect(normalized.status).toBe(429);
  });

  it('normalizes timeout errors', () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    const normalized = normalizeError(err);
    expect(normalized.code).toBe('TIMEOUT');
    expect(normalized.retryable).toBe(true);
  });

  it('normalizes network errors', () => {
    const err = new Error('fetch failed: ECONNREFUSED');
    const normalized = normalizeError(err);
    expect(normalized.code).toBe('NETWORK_ERROR');
    expect(normalized.retryable).toBe(true);
  });

  it('normalizes unknown errors', () => {
    const normalized = normalizeError('string error');
    expect(normalized.code).toBe('UNKNOWN_ERROR');
    expect(normalized.message).toBe('string error');
    expect(normalized.retryable).toBe(false);
  });
});

describe('HttpApiError', () => {
  it('creates from status with body message', () => {
    const err = HttpApiError.fromStatus(400, { message: 'bad input' });
    expect(err.message).toBe('Bad Request: bad input');
    expect(err.retryable).toBe(false);
    expect(err.status).toBe(400);
  });

  it('marks 429 as retryable', () => {
    const err = HttpApiError.fromStatus(429);
    expect(err.retryable).toBe(true);
  });

  it('marks 500+ as retryable', () => {
    const err = HttpApiError.fromStatus(503);
    expect(err.retryable).toBe(true);
  });

  it('marks 401 as not retryable', () => {
    const err = HttpApiError.fromStatus(401);
    expect(err.retryable).toBe(false);
  });
});

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, backoffMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(HttpApiError.fromStatus(500))
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, { maxAttempts: 3, backoffMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(HttpApiError.fromStatus(401));

    await expect(
      withRetry(fn, { maxAttempts: 3, backoffMs: 10 }),
    ).rejects.toThrow(HttpApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(HttpApiError.fromStatus(500));

    await expect(
      withRetry(fn, { maxAttempts: 2, backoffMs: 10 }),
    ).rejects.toThrow(HttpApiError);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry callback', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(HttpApiError.fromStatus(500))
      .mockResolvedValueOnce('ok');

    await withRetry(fn, { maxAttempts: 3, backoffMs: 10, onRetry });
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onRetry).toHaveBeenCalledWith(1, expect.objectContaining({ code: 'HTTP_500' }));
  });
});

describe('toMcpToolError', () => {
  it('formats error for MCP response', () => {
    const err = HttpApiError.fromStatus(404, { message: 'not found' });
    const result = toMcpToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('HTTP_404');
    expect(result.content[0]?.text).toContain('Not Found: not found');
  });
});
