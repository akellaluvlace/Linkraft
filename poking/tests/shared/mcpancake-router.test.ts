import { describe, it, expect, beforeEach } from 'vitest';
import { MCPancakeRouter } from '../../src/shared/mcpancake-router.js';

describe('MCPancakeRouter', () => {
  let router: MCPancakeRouter;

  beforeEach(() => {
    router = new MCPancakeRouter();
  });

  describe('with no caller set', () => {
    it('hasMcp returns false for all MCPs', async () => {
      expect(await router.hasMcp('shadcn')).toBe(false);
      expect(await router.hasMcp('figma')).toBe(false);
    });

    it('callMcp returns null', async () => {
      const result = await router.callMcp('shadcn', 'search', { query: 'button' });
      expect(result).toBeNull();
    });

    it('findComponent returns empty array', async () => {
      const results = await router.findComponent('hero');
      expect(results).toEqual([]);
    });

    it('getDocs returns null', async () => {
      const result = await router.getDocs('Button', 'shadcn');
      expect(result).toBeNull();
    });

    it('getAvailableMcps returns all as unavailable', async () => {
      const mcps = await router.getAvailableMcps();
      expect(mcps.length).toBeGreaterThan(0);
      expect(mcps.every(m => !m.available)).toBe(true);
    });

    it('screenshot returns null', async () => {
      const result = await router.screenshot('http://localhost:3000');
      expect(result).toBeNull();
    });

    it('distribute returns false', async () => {
      const result = await router.distribute('twitter', { text: 'hello' });
      expect(result).toBe(false);
    });
  });

  describe('with one MCP available', () => {
    beforeEach(() => {
      router.setCaller(async (mcp, tool, args) => {
        if (mcp === 'shadcn') {
          if (tool === 'ping') return true;
          if (tool === 'search') {
            return [
              {
                name: 'Button',
                source: 'shadcn',
                description: 'A button',
                installCommand: 'npx shadcn add button',
                previewUrl: null,
                tags: ['button', 'ui'],
              },
            ];
          }
        }
        throw new Error('MCP not available');
      });
    });

    it('hasMcp returns true for shadcn', async () => {
      expect(await router.hasMcp('shadcn')).toBe(true);
    });

    it('hasMcp returns false for others', async () => {
      expect(await router.hasMcp('figma')).toBe(false);
      expect(await router.hasMcp('magic-ui')).toBe(false);
    });

    it('findComponent returns shadcn results', async () => {
      const results = await router.findComponent('button');
      expect(results.length).toBe(1);
      expect(results[0]!.source).toBe('shadcn');
    });

    it('caches MCP availability', async () => {
      let callCount = 0;
      router.setCaller(async (mcp, tool) => {
        if (tool === 'ping') {
          callCount++;
          return true;
        }
        return [];
      });

      await router.hasMcp('shadcn');
      await router.hasMcp('shadcn');
      await router.hasMcp('shadcn');
      expect(callCount).toBe(1); // Only pinged once
    });
  });

  describe('with multiple MCPs', () => {
    beforeEach(() => {
      router.setCaller(async (mcp, tool) => {
        if (tool === 'ping') return true;
        if (mcp === 'shadcn' && tool === 'search') {
          return [{ name: 'ShadcnButton', source: 'shadcn', description: 'Button', installCommand: null, previewUrl: null, tags: [] }];
        }
        if (mcp === 'magic-ui' && tool === 'search') {
          return [{ name: 'MagicButton', source: 'magic-ui', description: 'Magic', installCommand: null, previewUrl: null, tags: [] }];
        }
        return null;
      });
    });

    it('findComponent aggregates results from all MCPs', async () => {
      const results = await router.findComponent('button');
      expect(results.length).toBe(2);
      const sources = results.map(r => r.source);
      expect(sources).toContain('shadcn');
      expect(sources).toContain('magic-ui');
    });

    it('getAvailableMcps shows connected MCPs', async () => {
      const mcps = await router.getAvailableMcps();
      const available = mcps.filter(m => m.available);
      expect(available.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('handles MCP call errors gracefully', async () => {
      router.setCaller(async (mcp, tool) => {
        if (tool === 'ping') return true;
        throw new Error('Connection reset');
      });

      const result = await router.callMcp('shadcn', 'search', { query: 'x' });
      expect(result).toBeNull();
    });
  });

  describe('resetCache', () => {
    it('clears cached availability', async () => {
      let available = true;
      router.setCaller(async (_mcp, tool) => {
        if (tool === 'ping') {
          if (!available) throw new Error('down');
          return true;
        }
        return null;
      });

      expect(await router.hasMcp('shadcn')).toBe(true);
      available = false;
      // Still cached as true
      expect(await router.hasMcp('shadcn')).toBe(true);
      // After reset, checks again
      router.resetCache();
      expect(await router.hasMcp('shadcn')).toBe(false);
    });
  });
});
