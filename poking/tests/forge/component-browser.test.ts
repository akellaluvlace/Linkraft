import { describe, it, expect, vi, beforeEach } from 'vitest';
import { browseComponents, formatBrowseResults } from '../../src/forge/component-browser.js';
import { mcpancake } from '../../src/shared/mcpancake-router.js';

describe('browseComponents', () => {
  beforeEach(() => {
    mcpancake.resetCache();
  });

  it('returns empty results when no MCPs are available', async () => {
    // No caller set, so all MCPs unavailable
    const result = await browseComponents({ query: 'hero' });
    expect(result.totalCount).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.sources).toEqual([]);
  });

  it('returns results from available MCPs', async () => {
    const mockComponents = [
      {
        name: 'Hero Section',
        source: 'shadcn',
        description: 'Split hero with CTA',
        installCommand: 'npx shadcn add hero',
        previewUrl: null,
        tags: ['hero', 'landing'],
      },
    ];

    mcpancake.setCaller(async (mcp, tool) => {
      if (mcp === 'shadcn' && tool === 'ping') return true;
      if (mcp === 'shadcn' && tool === 'search') return mockComponents;
      throw new Error('MCP not available');
    });

    const result = await browseComponents({ query: 'hero' });
    expect(result.totalCount).toBe(1);
    expect(result.results[0]!.name).toBe('Hero Section');
    expect(result.sources).toContain('shadcn');
  });

  it('filters by source', async () => {
    const shadcnComp = {
      name: 'Button',
      source: 'shadcn',
      description: 'Basic button',
      installCommand: 'npx shadcn add button',
      previewUrl: null,
      tags: ['button'],
    };
    const magicComp = {
      name: 'Magic Button',
      source: 'magic-ui',
      description: 'Animated button',
      installCommand: null,
      previewUrl: null,
      tags: ['button'],
    };

    mcpancake.setCaller(async (mcp, tool) => {
      if (tool === 'ping') return true;
      if (mcp === 'shadcn' && tool === 'search') return [shadcnComp];
      if (mcp === 'magic-ui' && tool === 'search') return [magicComp];
      throw new Error('not available');
    });

    const result = await browseComponents({ query: 'button', source: 'shadcn' });
    expect(result.totalCount).toBe(1);
    expect(result.results[0]!.source).toBe('shadcn');
  });

  it('handles MCP errors gracefully', async () => {
    mcpancake.setCaller(async (mcp, tool) => {
      if (tool === 'ping') return true;
      throw new Error('Connection failed');
    });

    const result = await browseComponents({ query: 'hero' });
    expect(result.totalCount).toBe(0);
  });
});

describe('formatBrowseResults', () => {
  it('formats empty results', () => {
    const text = formatBrowseResults({ results: [], sources: [], totalCount: 0 });
    expect(text).toContain('No components found');
  });

  it('formats results with metadata', () => {
    const result = {
      results: [
        {
          name: 'Hero Section',
          source: 'shadcn',
          description: 'Split hero',
          installCommand: 'npx shadcn add hero',
          previewUrl: null,
          tags: ['hero', 'landing'],
        },
      ],
      sources: ['shadcn'],
      totalCount: 1,
    };
    const text = formatBrowseResults(result);
    expect(text).toContain('Hero Section');
    expect(text).toContain('shadcn');
    expect(text).toContain('npx shadcn add hero');
    expect(text).toContain('hero, landing');
  });
});
