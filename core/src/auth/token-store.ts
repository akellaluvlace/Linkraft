import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { TokenData } from '../types.js';

const TOKEN_DIR = join(homedir(), '.linkraft', 'tokens');
const EXPIRY_BUFFER_MS = 60_000;

export class TokenStore {
  private readonly filePath: string;
  private cached: TokenData | undefined;

  constructor(
    private readonly name: string,
    customPath?: string,
  ) {
    this.filePath = customPath ?? join(TOKEN_DIR, `${name}.json`);
  }

  load(): TokenData | undefined {
    if (this.cached) return this.cached;

    if (!existsSync(this.filePath)) return undefined;

    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      this.cached = JSON.parse(raw) as TokenData;
      return this.cached;
    } catch {
      return undefined;
    }
  }

  save(token: TokenData): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.filePath, JSON.stringify(token, null, 2), 'utf-8');
    this.cached = token;
  }

  isExpired(): boolean {
    const token = this.load();
    if (!token) return true;
    if (token.expiresAt == null) return false;
    return Date.now() >= token.expiresAt - EXPIRY_BUFFER_MS;
  }

  needsRefresh(): boolean {
    const token = this.load();
    if (!token) return true;
    if (token.expiresAt == null) return false;
    return Date.now() >= token.expiresAt - EXPIRY_BUFFER_MS;
  }

  getAccessToken(): string | undefined {
    const token = this.load();
    return token?.accessToken;
  }

  getRefreshToken(): string | undefined {
    const token = this.load();
    return token?.refreshToken;
  }

  clear(): void {
    this.cached = undefined;
    if (existsSync(this.filePath)) {
      unlinkSync(this.filePath);
    }
  }

  getName(): string {
    return this.name;
  }
}
