// Vault Client: reads the vault GitHub repo for component browsing.
// V2: read-only access. Uses GitHub raw content URLs (no API key needed for public repos).

import type { VaultComponent, VaultComponentMeta, VaultSearchOptions } from './types.js';

export interface VaultClientOptions {
  repoOwner?: string;
  repoName?: string;
}

export class VaultClient {
  private rawBase: string;
  private indexCache: VaultComponentMeta[] | null = null;
  private indexCacheTime = 0;

  constructor(options?: VaultClientOptions) {
    const owner = options?.repoOwner ?? 'akellainmotion';
    const name = options?.repoName ?? 'poking-vault';
    this.rawBase = `https://raw.githubusercontent.com/${owner}/${name}/main`;
  }

  /**
   * Fetches the vault index (component metadata list).
   * Cached for 5 minutes.
   */
  async getIndex(): Promise<VaultComponentMeta[]> {
    const CACHE_TTL = 5 * 60 * 1000;
    if (this.indexCache && Date.now() - this.indexCacheTime < CACHE_TTL) {
      return this.indexCache;
    }

    try {
      const response = await fetch(`${this.rawBase}/index.json`);
      if (!response.ok) {
        process.stderr.write(`[vault] Failed to fetch index: ${response.status}\n`);
        return [];
      }
      const data = await response.json() as VaultComponentMeta[];
      this.indexCache = data;
      this.indexCacheTime = Date.now();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[vault] Error fetching index: ${msg}\n`);
      return [];
    }
  }

  /**
   * Browse all available components.
   */
  async browse(): Promise<VaultComponentMeta[]> {
    return this.getIndex();
  }

  /**
   * Search components by query, tags, framework, or design system.
   */
  async search(options: VaultSearchOptions): Promise<VaultComponentMeta[]> {
    const index = await this.getIndex();
    let results = [...index];

    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)),
      );
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(c =>
        options.tags!.some(t => c.tags.includes(t)),
      );
    }

    if (options.framework) {
      results = results.filter(c => c.framework === options.framework);
    }

    if (options.styling) {
      results = results.filter(c => c.styling === options.styling);
    }

    if (options.designSystem) {
      results = results.filter(c => c.designSystem === options.designSystem);
    }

    return results;
  }

  /**
   * Download a full component package by name.
   */
  async download(componentName: string): Promise<VaultComponent | null> {
    try {
      const response = await fetch(`${this.rawBase}/components/${componentName}/package.json`);
      if (!response.ok) {
        process.stderr.write(`[vault] Component "${componentName}" not found: ${response.status}\n`);
        return null;
      }
      const data = await response.json() as VaultComponent;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[vault] Error downloading "${componentName}": ${msg}\n`);
      return null;
    }
  }

  /**
   * Clears the cached index.
   */
  clearCache(): void {
    this.indexCache = null;
    this.indexCacheTime = 0;
  }
}

// Default singleton
export const vaultClient = new VaultClient();
