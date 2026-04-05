import type { RateLimitConfig, RateLimitStats } from './types.js';

export class RateLimiter {
  private windowRequests: number[] = [];
  private dayRequests: number[] = [];
  private readonly windowMs = 60_000;
  private dayStartMs: number;

  constructor(private readonly config: RateLimitConfig) {
    this.dayStartMs = this.getStartOfDay();
  }

  async acquire(endpoint?: string): Promise<void> {
    void endpoint; // reserved for per-endpoint limits
    this.pruneExpired();

    if (this.isDayExhausted()) {
      throw new RateLimitError(this.getStats(), false);
    }

    if (this.isMinuteExhausted()) {
      if (!this.config.retryOnRateLimit) {
        throw new RateLimitError(this.getStats(), true);
      }
      await this.waitForSlot();
    }

    const now = Date.now();
    this.windowRequests.push(now);
    this.dayRequests.push(now);
  }

  getStats(): RateLimitStats {
    this.pruneExpired();
    const now = Date.now();
    return {
      requestsInWindow: this.windowRequests.length,
      requestsToday: this.dayRequests.length,
      windowResetAt: this.windowRequests.length > 0
        ? (this.windowRequests[0] ?? now) + this.windowMs
        : now,
      dayResetAt: this.dayStartMs + 86_400_000,
    };
  }

  reset(): void {
    this.windowRequests = [];
    this.dayRequests = [];
    this.dayStartMs = this.getStartOfDay();
  }

  private isMinuteExhausted(): boolean {
    return this.config.requestsPerMinute > 0 &&
      this.windowRequests.length >= this.config.requestsPerMinute;
  }

  private isDayExhausted(): boolean {
    return this.config.requestsPerDay > 0 &&
      this.dayRequests.length >= this.config.requestsPerDay;
  }

  private pruneExpired(): void {
    const now = Date.now();
    const windowCutoff = now - this.windowMs;
    this.windowRequests = this.windowRequests.filter((t) => t > windowCutoff);

    const currentDayStart = this.getStartOfDay();
    if (currentDayStart !== this.dayStartMs) {
      this.dayStartMs = currentDayStart;
      this.dayRequests = [];
    } else {
      this.dayRequests = this.dayRequests.filter((t) => t > this.dayStartMs);
    }
  }

  private async waitForSlot(): Promise<void> {
    for (let attempt = 0; attempt < this.config.retryMaxAttempts; attempt++) {
      const waitMs = this.calculateWaitTime();
      if (waitMs <= 0) return;

      await sleep(Math.min(waitMs, 60_000));
      this.pruneExpired();

      if (!this.isMinuteExhausted() && !this.isDayExhausted()) {
        return;
      }
    }

    throw new RateLimitError(this.getStats());
  }

  private calculateWaitTime(): number {
    if (this.isDayExhausted()) {
      return this.dayStartMs + 86_400_000 - Date.now();
    }

    if (this.isMinuteExhausted() && this.windowRequests.length > 0) {
      return (this.windowRequests[0] ?? Date.now()) + this.windowMs - Date.now();
    }

    return 0;
  }

  private getStartOfDay(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly stats: RateLimitStats,
    public readonly retryable: boolean = true,
  ) {
    const reason = retryable ? 'minute limit' : 'daily limit';
    super(
      `Rate limit exceeded (${reason}): ${stats.requestsInWindow} requests in window, ` +
      `${stats.requestsToday} requests today`,
    );
    this.name = 'RateLimitError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
