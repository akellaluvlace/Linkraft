import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, RateLimitError } from '../src/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      requestsPerMinute: 5,
      requestsPerDay: 100,
      retryOnRateLimit: false,
      retryMaxAttempts: 0,
      retryBackoffMs: 0,
    });
  });

  it('allows requests within limits', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(limiter.acquire()).resolves.toBeUndefined();
    }
  });

  it('throws RateLimitError when minute limit exceeded', async () => {
    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }
    await expect(limiter.acquire()).rejects.toThrow(RateLimitError);
  });

  it('reports stats accurately', async () => {
    await limiter.acquire();
    await limiter.acquire();

    const stats = limiter.getStats();
    expect(stats.requestsInWindow).toBe(2);
    expect(stats.requestsToday).toBe(2);
  });

  it('resets counters', async () => {
    await limiter.acquire();
    await limiter.acquire();
    limiter.reset();

    const stats = limiter.getStats();
    expect(stats.requestsInWindow).toBe(0);
    expect(stats.requestsToday).toBe(0);
  });

  it('allows zero limit to mean unlimited', async () => {
    const unlimited = new RateLimiter({
      requestsPerMinute: 0,
      requestsPerDay: 0,
      retryOnRateLimit: false,
      retryMaxAttempts: 0,
      retryBackoffMs: 0,
    });

    for (let i = 0; i < 100; i++) {
      await expect(unlimited.acquire()).resolves.toBeUndefined();
    }
  });
});
