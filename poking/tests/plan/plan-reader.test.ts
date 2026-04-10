import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadPlanDocs,
  hasPlanDocs,
  extractSection,
  extractBullets,
  extractTableRows,
  extractLeadParagraph,
  extractCommands,
} from '../../src/plan/plan-reader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-reader-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writePlanDoc(name: string, content: string): void {
  const planDir = path.join(tmpDir, '.plan');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, name), content, 'utf-8');
}

describe('loadPlanDocs', () => {
  it('returns empty object when .plan/ is missing', () => {
    expect(loadPlanDocs(tmpDir)).toEqual({});
    expect(hasPlanDocs(loadPlanDocs(tmpDir))).toBe(false);
  });

  it('loads any present plan docs', () => {
    writePlanDoc('STACK.md', '# Stack\n\nNext.js');
    writePlanDoc('SCHEMA.md', '# Schema\n\nusers table');
    const docs = loadPlanDocs(tmpDir);
    expect(docs.stack).toContain('Next.js');
    expect(docs.schema).toContain('users table');
    expect(docs.apiMap).toBeUndefined();
    expect(hasPlanDocs(docs)).toBe(true);
  });

  it('tolerates .plan/ with unknown files mixed in', () => {
    writePlanDoc('STACK.md', 'stack content');
    writePlanDoc('OTHER.md', 'not a known plan doc');
    const docs = loadPlanDocs(tmpDir);
    expect(docs.stack).toBe('stack content');
  });
});

describe('extractSection', () => {
  const md = `# Title

## Tech Stack

- Language: TypeScript
- Framework: Next.js

## Commands

\`npm run build\`

### Sub section under commands

details

## Next section

ignore me
`;

  it('finds a section by heading substring', () => {
    const section = extractSection(md, 'Tech Stack');
    expect(section).toContain('Language: TypeScript');
    expect(section).toContain('Framework: Next.js');
    expect(section).not.toContain('Commands');
  });

  it('is case insensitive', () => {
    expect(extractSection(md, 'tech stack')).toContain('TypeScript');
    expect(extractSection(md, 'TECH STACK')).toContain('TypeScript');
  });

  it('matches substring of heading', () => {
    expect(extractSection('## Tech Stack & Dependencies\n\n- a', 'Tech Stack')).toContain('- a');
  });

  it('includes nested headings (lower level) until next same-or-higher heading', () => {
    const section = extractSection(md, 'Commands');
    expect(section).toContain('Sub section');
    expect(section).toContain('details');
    expect(section).not.toContain('Next section');
  });

  it('returns null when not found', () => {
    expect(extractSection(md, 'Nonexistent')).toBeNull();
  });

  it('returns null for empty sections', () => {
    expect(extractSection('## Empty\n\n## Next\n\ncontent', 'Empty')).toBeNull();
  });
});

describe('extractBullets', () => {
  it('pulls dash bullets', () => {
    expect(extractBullets('- one\n- two\n- three')).toEqual(['one', 'two', 'three']);
  });

  it('pulls mixed bullet markers', () => {
    expect(extractBullets('- a\n* b\n+ c')).toEqual(['a', 'b', 'c']);
  });

  it('pulls numbered lists', () => {
    expect(extractBullets('1. first\n2. second\n3. third')).toEqual(['first', 'second', 'third']);
  });

  it('respects max count', () => {
    expect(extractBullets('- a\n- b\n- c\n- d', 2)).toEqual(['a', 'b']);
  });

  it('ignores non-bullet lines', () => {
    expect(extractBullets('heading text\n\n- only bullet\n\ntext')).toEqual(['only bullet']);
  });

  it('handles indented bullets', () => {
    expect(extractBullets('  - indented')).toEqual(['indented']);
  });
});

describe('extractTableRows', () => {
  const md = `## Endpoints

Lead text.

| Path | Method | Auth |
|------|--------|------|
| /api/users | GET | yes |
| /api/posts | POST | yes |

Next paragraph.
`;

  it('extracts header, separator, and data rows', () => {
    const rows = extractTableRows(md);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows[0]).toContain('Path');
    expect(rows[1]).toMatch(/\|[\s|:-]+\|/);
    expect(rows[2]).toContain('/api/users');
  });

  it('respects maxDataRows', () => {
    const big = `| a | b |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |`;
    const rows = extractTableRows(big, 2);
    const dataRows = rows.filter(r => !/\|[\s|:-]+\|/.test(r) && !r.includes('a | b'));
    expect(dataRows.length).toBeLessThanOrEqual(2);
  });

  it('returns empty when no table present', () => {
    expect(extractTableRows('just text no table')).toEqual([]);
  });
});

describe('extractLeadParagraph', () => {
  it('returns the first non-heading paragraph', () => {
    const md = '# Title\n\nFirst para here.\n\nSecond para.';
    expect(extractLeadParagraph(md)).toBe('First para here.');
  });

  it('skips table and code block paragraphs', () => {
    const md = '| a |\n| b |\n\n```\ncode\n```\n\nReal paragraph.';
    expect(extractLeadParagraph(md)).toBe('Real paragraph.');
  });

  it('truncates at word boundary when exceeding max', () => {
    const long = 'word '.repeat(200).trim();
    const result = extractLeadParagraph(long, 50);
    expect(result).toMatch(/\.\.\.$/);
    expect(result!.length).toBeLessThanOrEqual(54);
  });

  it('returns null when no paragraph found', () => {
    expect(extractLeadParagraph('# Only a heading')).toBeNull();
  });
});

describe('extractCommands', () => {
  it('pulls recognized shell commands from code spans', () => {
    const md = 'Use `npm run build` and `pnpm test` to verify.';
    expect(extractCommands(md)).toEqual(['npm run build', 'pnpm test']);
  });

  it('deduplicates commands', () => {
    const md = '`npm run build` then `npm run build` again';
    expect(extractCommands(md)).toEqual(['npm run build']);
  });

  it('ignores non-command inline code', () => {
    const md = 'The `users` table contains `id` fields.';
    expect(extractCommands(md)).toEqual([]);
  });

  it('respects max count', () => {
    const md = '`npm test` `pnpm build` `yarn lint` `bun run dev`';
    expect(extractCommands(md, 2)).toHaveLength(2);
  });
});
