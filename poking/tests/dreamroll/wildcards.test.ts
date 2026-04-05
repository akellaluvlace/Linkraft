import { describe, it, expect } from 'vitest';
import { WILDCARDS, getRandomWildcard, getRandomWildcardByCategory } from '../../src/dreamroll/wildcards.js';

describe('WILDCARDS', () => {
  it('has at least 50 wildcards', () => {
    expect(WILDCARDS.length).toBeGreaterThanOrEqual(50);
  });

  it('has unique IDs', () => {
    const ids = WILDCARDS.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has unique prompts', () => {
    const prompts = WILDCARDS.map(w => w.prompt);
    const uniquePrompts = new Set(prompts);
    expect(uniquePrompts.size).toBe(prompts.length);
  });

  it('every wildcard has id, prompt, and category', () => {
    for (const w of WILDCARDS) {
      expect(w.id).toBeTruthy();
      expect(w.prompt).toBeTruthy();
      expect(w.category).toBeTruthy();
    }
  });

  it('covers multiple categories', () => {
    const categories = new Set(WILDCARDS.map(w => w.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});

describe('getRandomWildcard', () => {
  it('returns a valid wildcard', () => {
    const w = getRandomWildcard();
    expect(w.id).toBeTruthy();
    expect(w.prompt).toBeTruthy();
  });
});

describe('getRandomWildcardByCategory', () => {
  it('returns a wildcard from the specified category', () => {
    const w = getRandomWildcardByCategory('era');
    expect(w).not.toBeNull();
    expect(w!.category).toBe('era');
  });

  it('returns null for nonexistent category', () => {
    const w = getRandomWildcardByCategory('nonexistent');
    expect(w).toBeNull();
  });
});
