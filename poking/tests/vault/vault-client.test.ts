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
    it('fetches and returns component index', async () => {
      const mockIndex = [
        { name: 'hero', author: 'alice', description: 'A hero', framework: 'react', styling: 'tailwind', tags: ['hero'], designSystem: null, downloads: 10, stars: 5 },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIndex,
      });

      const result = await client.getIndex();
      expect(result.length).toBe(1);
      expect(result[0]!.name).toBe('hero');
    });

    it('returns empty array on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await client.getIndex();
      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await client.getIndex();
      expect(result).toEqual([]);
    });

    it('caches the index', async () => {
      const mockIndex = [{ name: 'hero', author: 'alice', description: 'A hero', framework: 'react', styling: 'tailwind', tags: [], designSystem: null, downloads: 0, stars: 0 }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockIndex });

      await client.getIndex();
      await client.getIndex();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      const mockIndex = [
        { name: 'hero-split', author: 'alice', description: 'Split hero section', framework: 'react', styling: 'tailwind', tags: ['hero', 'landing'], designSystem: 'neo-brutalism', downloads: 50, stars: 10 },
        { name: 'card-basic', author: 'bob', description: 'Basic card component', framework: 'vue', styling: 'css', tags: ['card', 'ui'], designSystem: null, downloads: 20, stars: 3 },
        { name: 'footer-simple', author: 'alice', description: 'Simple footer', framework: 'react', styling: 'tailwind', tags: ['footer', 'layout'], designSystem: null, downloads: 5, stars: 1 },
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockIndex });
    });

    it('searches by query', async () => {
      const results = await client.search({ query: 'hero' });
      expect(results.length).toBe(1);
      expect(results[0]!.name).toBe('hero-split');
    });

    it('searches by tags', async () => {
      const results = await client.search({ tags: ['card'] });
      expect(results.length).toBe(1);
      expect(results[0]!.name).toBe('card-basic');
    });

    it('filters by framework', async () => {
      const results = await client.search({ framework: 'vue' });
      expect(results.length).toBe(1);
      expect(results[0]!.name).toBe('card-basic');
    });

    it('filters by design system', async () => {
      const results = await client.search({ designSystem: 'neo-brutalism' });
      expect(results.length).toBe(1);
      expect(results[0]!.name).toBe('hero-split');
    });

    it('returns all on empty search', async () => {
      const results = await client.search({});
      expect(results.length).toBe(3);
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
      expect(result).not.toBeNull();
      expect(result!.name).toBe('hero-split');
    });

    it('returns null for missing component', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await client.download('nonexistent');
      expect(result).toBeNull();
    });
  });
});
