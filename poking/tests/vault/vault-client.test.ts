import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VaultClient } from '../../src/vault/vault-client.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('VaultClient', () => {
  let client: VaultClient;

  beforeEach(() => {
    client = new VaultClient({ repoOwner: 'test', repoName: 'vault' });
    client.clearCache();
    mockFetch.mockReset();
  });

  describe('getIndex', () => {
    it('fetches and returns component index from GitHub', async () => {
      const mockIndex = [
        { name: 'hero', author: 'alice', description: 'A hero', framework: 'react', styling: 'tailwind', tags: ['hero'], designSystem: null, downloads: 10, stars: 5 },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIndex,
      });

      const result = await client.getIndex();
      expect(result.source).toBe('github');
      expect(result.data.length).toBe(1);
      expect(result.data[0]!.name).toBe('hero');
      expect(result.message).toBeNull();
    });

    it('falls back to bundled components on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await client.getIndex();
      expect(result.source).toBe('bundled');
      expect(result.data.length).toBeGreaterThanOrEqual(10);
      expect(result.message).toContain('not reachable');
    });

    it('falls back to bundled components on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await client.getIndex();
      expect(result.source).toBe('bundled');
      expect(result.data.length).toBeGreaterThanOrEqual(10);
      expect(result.message).toContain('offline');
    });

    it('never returns empty data', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS failed'));
      const result = await client.getIndex();
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('caches the GitHub index', async () => {
      const mockIndex = [{ name: 'hero', author: 'alice', description: 'A hero', framework: 'react', styling: 'tailwind', tags: [], designSystem: null, downloads: 0, stars: 0 }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockIndex });

      await client.getIndex();
      await client.getIndex();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      // Simulate offline: use bundled components
      mockFetch.mockRejectedValue(new Error('offline'));
    });

    it('searches bundled components by query', async () => {
      const result = await client.search({ query: 'hero' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(c => c.name.includes('hero'))).toBe(true);
    });

    it('searches bundled components by tags', async () => {
      const result = await client.search({ tags: ['pricing'] });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns message when no results match', async () => {
      const result = await client.search({ query: 'xyznonexistent' });
      expect(result.data.length).toBe(0);
      expect(result.message).toContain('No components match');
    });

    it('returns all bundled on empty search', async () => {
      const result = await client.search({});
      expect(result.data.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('download', () => {
    it('downloads a component package', async () => {
      const mockComponent = {
        name: 'hero-split',
        author: 'alice',
        description: 'Split hero',
        code: { 'Hero.tsx': 'export function Hero() {}' },
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockComponent });

      const result = await client.download('hero-split');
      expect(result.data).not.toBeNull();
      expect(result.data!.name).toBe('hero-split');
    });

    it('returns helpful message for missing component', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await client.download('nonexistent');
      expect(result.data).toBeNull();
      expect(result.message).toContain('not found');
      expect(result.message).toContain('vault search');
    });
  });
});
