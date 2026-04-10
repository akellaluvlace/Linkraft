import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  categorize,
  isLaunchBlocker,
  estimateEffort,
  extractHardeningItems,
  formatHardeningMd,
  generateHardeningMd,
  writeHardeningMd,
  parseHardeningMd,
  topHardeningItems,
} from '../../src/plan/hardening-gen.js';
import { loadPlanDocs } from '../../src/plan/plan-reader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hardening-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writePlanDoc(name: string, content: string): void {
  const planDir = path.join(tmpDir, '.plan');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, name), content, 'utf-8');
}

// ============================================================================
// Heuristics
// ============================================================================

describe('categorize', () => {
  it('identifies security issues', () => {
    expect(categorize('Missing auth on /api/users')).toBe('security');
    expect(categorize('Hardcoded JWT token')).toBe('security');
    expect(categorize('RLS disabled on sessions table')).toBe('security');
    expect(categorize('SQL injection risk in query builder')).toBe('security');
  });

  it('identifies data issues', () => {
    expect(categorize('Schema migration drops user data')).toBe('data');
    expect(categorize('Missing foreign key constraint')).toBe('data');
  });

  it('identifies performance issues', () => {
    expect(categorize('Slow query on dashboard')).toBe('performance');
    expect(categorize('N+1 query in feed loader')).toBe('performance');
    expect(categorize('Bundle size over 500KB')).toBe('performance');
  });

  it('identifies UX issues', () => {
    expect(categorize('Contrast below WCAG AA on buttons')).toBe('ux');
    expect(categorize('Accessibility: keyboard navigation broken')).toBe('ux');
  });

  it('identifies API issues', () => {
    expect(categorize('REST endpoint returns wrong status')).toBe('api');
    expect(categorize('GraphQL resolver caches stale')).toBe('api');
  });

  it('falls back to general', () => {
    expect(categorize('Rewrite the logo')).toBe('general');
  });
});

describe('isLaunchBlocker', () => {
  it('flags security and data issues', () => {
    expect(isLaunchBlocker('Missing auth check')).toBe(true);
    expect(isLaunchBlocker('Data loss on migration')).toBe(true);
    expect(isLaunchBlocker('RLS disabled')).toBe(true);
  });

  it('does not flag performance or UX', () => {
    expect(isLaunchBlocker('Slow page load')).toBe(false);
    expect(isLaunchBlocker('Buttons are purple')).toBe(false);
  });
});

describe('estimateEffort', () => {
  it('returns S for short items and audit/review language', () => {
    expect(estimateEffort('Fix typo')).toBe('S');
    expect(estimateEffort('Review the auth flow')).toBe('S');
    expect(estimateEffort('Audit database indexes')).toBe('S');
  });

  it('returns M for medium-length items', () => {
    // Careful: avoid "review/audit/document/verify/check" which force S,
    // and "refactor/migrate/rewrite/redesign" which force L.
    const medium = 'Add rate limiting to all public endpoints so anonymous traffic cannot exhaust our quota before paying users.';
    expect(estimateEffort(medium)).toBe('M');
  });

  it('returns L for refactor/migrate/rewrite language', () => {
    expect(estimateEffort('Migrate to new auth provider')).toBe('L');
    expect(estimateEffort('Refactor billing module')).toBe('L');
    expect(estimateEffort('Rewrite the weekly cron job')).toBe('L');
  });
});

// ============================================================================
// Extraction from individual .plan/ docs
// ============================================================================

describe('extractHardeningItems', () => {
  it('returns empty report for empty docs', () => {
    const report = extractHardeningItems({});
    expect(report.totalItems).toBe(0);
    expect(report.mustFix).toEqual([]);
    expect(report.shouldFix).toEqual([]);
    expect(report.niceToHave).toEqual([]);
  });

  it('extracts critical risks as must-fix', () => {
    const docs = {
      riskMatrix: `# Risks\n\n## Critical\n\n- Data loss on weekly migration\n- Missing RLS on user_sessions table\n\n## High\n\n- No tests on billing path`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.length).toBeGreaterThanOrEqual(2);
    expect(report.mustFix.some(i => i.description.includes('Data loss'))).toBe(true);
    expect(report.mustFix.some(i => i.description.includes('RLS'))).toBe(true);
  });

  it('routes high risks to must-fix when security/data, should-fix otherwise', () => {
    const docs = {
      riskMatrix: `## High\n\n- Missing auth on admin endpoint\n- Lighthouse score is 72`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.some(i => i.description.includes('auth'))).toBe(true);
    expect(report.shouldFix.some(i => i.description.includes('Lighthouse'))).toBe(true);
  });

  it('routes medium risks to nice-to-have', () => {
    const docs = {
      riskMatrix: `## Medium\n\n- Contrast on footer could improve`,
    };
    const report = extractHardeningItems(docs);
    expect(report.niceToHave.length).toBe(1);
    expect(report.niceToHave[0]!.description).toContain('Contrast');
  });

  it('extracts architecture weaknesses', () => {
    const docs = {
      architecture: `# Architecture\n\n## Weaknesses\n\n- Subscription state duplicated across Stripe and db\n- Weekly cron has timezone bug`,
    };
    const report = extractHardeningItems(docs);
    expect(report.shouldFix.length).toBe(2);
    expect(report.shouldFix[0]!.source).toBe('ARCHITECTURE.md');
    expect(report.shouldFix[0]!.category).toBe('architecture');
  });

  it('flags architecture weaknesses that mention security as must-fix', () => {
    const docs = {
      architecture: `## Weaknesses\n\n- Auth tokens stored in localStorage`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.length).toBe(1);
    expect(report.mustFix[0]!.category).toBe('security');
  });

  it('extracts schema gaps as must-fix', () => {
    const docs = {
      schema: `## Gaps\n\n- No cascade delete on sessions\n- Missing index on foreign key`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.length).toBe(2);
    expect(report.mustFix[0]!.source).toBe('SCHEMA.md');
  });

  it('detects disabled RLS in schema', () => {
    const docs = {
      schema: `## RLS\n\nRLS is disabled on the events table.`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.some(i => i.description.toLowerCase().includes('row level security'))).toBe(true);
  });

  it('extracts API endpoints missing auth', () => {
    const docs = {
      apiMap: `## Endpoints

| Path | Method | Auth |
|------|--------|------|
| /api/users | GET | user |
| /api/admin | POST | none |
| /api/debug | GET | public |
| /api/health | GET | none |
`,
    };
    const report = extractHardeningItems(docs);
    const flagged = report.mustFix.filter(i => i.source === 'API_MAP.md');
    expect(flagged.length).toBe(3);
    expect(flagged.some(i => i.description.includes('/api/admin'))).toBe(true);
    expect(flagged.some(i => i.description.includes('/api/debug'))).toBe(true);
    expect(flagged.some(i => i.description.includes('/api/health'))).toBe(true);
  });

  it('does not flag endpoints that have auth', () => {
    const docs = {
      apiMap: `## Endpoints

| Path | Method | Auth |
|------|--------|------|
| /api/users | GET | user |
| /api/admin | POST | admin |
`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.filter(i => i.source === 'API_MAP.md')).toHaveLength(0);
  });

  it('extracts design token violations as should-fix', () => {
    const docs = {
      tokens: `## Violations\n\n- 12 components use inline colors\n- 3 buttons use non-system border-radius`,
    };
    const report = extractHardeningItems(docs);
    expect(report.shouldFix.filter(i => i.source === 'DESIGN_TOKENS.md')).toHaveLength(2);
  });

  it('extracts feature gaps as should-fix', () => {
    // Avoid security-keywords (password/auth/token/etc) which correctly
    // promote to must-fix. These are pure feature gaps.
    const docs = {
      features: `## Gaps\n\n- CSV export on history page incomplete\n- Dark mode not yet supported\n- Onboarding tour never finished`,
    };
    const report = extractHardeningItems(docs);
    expect(report.shouldFix.length).toBe(3);
    expect(report.shouldFix.every(i => i.source === 'FEATURES.md')).toBe(true);
  });

  it('promotes feature gaps with security keywords to must-fix', () => {
    const docs = {
      features: `## Gaps\n\n- No password reset flow`,
    };
    const report = extractHardeningItems(docs);
    expect(report.mustFix.some(i => i.description.includes('password reset'))).toBe(true);
  });

  it('combines items from all docs and deduplicates', () => {
    const docs = {
      riskMatrix: `## Critical\n\n- Missing auth on admin routes`,
      architecture: `## Weaknesses\n\n- Missing auth on admin routes`, // duplicate
      features: `## Gaps\n\n- Broken password reset`,
    };
    const report = extractHardeningItems(docs);
    expect(report.totalItems).toBe(2); // not 3 — duplicate removed
  });
});

// ============================================================================
// Formatting
// ============================================================================

describe('formatHardeningMd', () => {
  const makeReport = () => ({
    generated: '2026-04-10T12:00:00.000Z',
    projectName: 'studyflow',
    totalItems: 3,
    mustFix: [{
      priority: 'must-fix' as const,
      category: 'security' as const,
      description: 'Missing auth on admin endpoint',
      source: 'API_MAP.md',
      effort: 'S' as const,
    }],
    shouldFix: [{
      priority: 'should-fix' as const,
      category: 'architecture' as const,
      description: 'Weekly cron has timezone bug',
      source: 'ARCHITECTURE.md',
      effort: 'M' as const,
    }],
    niceToHave: [{
      priority: 'nice-to-have' as const,
      category: 'ux' as const,
      description: 'Contrast on footer is borderline',
      source: 'RISK_MATRIX.md',
      effort: 'S' as const,
    }],
  });

  it('produces a markdown document with all three buckets', () => {
    const md = formatHardeningMd(makeReport());
    expect(md).toContain('# studyflow — Hardening Proposal');
    expect(md).toContain('## Must Fix (1)');
    expect(md).toContain('## Should Fix (1)');
    expect(md).toContain('## Nice to Have (1)');
  });

  it('includes category, source, and effort for each item', () => {
    const md = formatHardeningMd(makeReport());
    expect(md).toContain('**Category:** security');
    expect(md).toContain('**Source:** `API_MAP.md`');
    expect(md).toContain('**Effort:** S');
  });

  it('handles empty report gracefully', () => {
    const empty = {
      generated: '2026-04-10T12:00:00.000Z',
      projectName: 'clean',
      totalItems: 0,
      mustFix: [],
      shouldFix: [],
      niceToHave: [],
    };
    const md = formatHardeningMd(empty);
    expect(md).toContain('No Action Items Found');
  });

  it('renders empty groups with _None detected_', () => {
    const partial = {
      ...makeReport(),
      totalItems: 1,
      shouldFix: [],
      niceToHave: [],
    };
    const md = formatHardeningMd(partial);
    expect(md).toContain('## Should Fix (0)');
    expect(md).toContain('_None detected._');
  });
});

// ============================================================================
// Full pipeline
// ============================================================================

describe('generateHardeningMd', () => {
  it('returns null when no .plan/ docs exist', () => {
    expect(generateHardeningMd(tmpDir)).toBeNull();
  });

  it('produces a report from partial plan docs', () => {
    writePlanDoc('RISK_MATRIX.md', `## Critical\n\n- Data corruption on migration\n\n## High\n\n- Missing auth on /api/admin`);
    const result = generateHardeningMd(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.report.mustFix.length).toBe(2);
    expect(result!.content).toContain('Hardening Proposal');
  });

  it('uses project name from package.json when present', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'mathproject' }), 'utf-8');
    writePlanDoc('RISK_MATRIX.md', `## Critical\n- Data loss`);
    const result = generateHardeningMd(tmpDir)!;
    expect(result.content).toContain('# mathproject');
  });

  it('falls back to directory basename when package.json is missing', () => {
    writePlanDoc('RISK_MATRIX.md', `## Critical\n- Data loss`);
    const result = generateHardeningMd(tmpDir)!;
    expect(result.content).toContain(path.basename(tmpDir));
  });

  it('writes the report to .plan/HARDENING.md', () => {
    writePlanDoc('RISK_MATRIX.md', `## Critical\n- Data loss on cron`);
    const result = generateHardeningMd(tmpDir)!;
    const filePath = writeHardeningMd(tmpDir, result.content);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toMatch(/HARDENING\.md$/);
    const contents = fs.readFileSync(filePath, 'utf-8');
    expect(contents).toContain('Data loss on cron');
  });
});

// ============================================================================
// Round-trip: parseHardeningMd + topHardeningItems
// ============================================================================

describe('parseHardeningMd', () => {
  it('returns empty report when HARDENING.md does not exist', () => {
    const parsed = parseHardeningMd(tmpDir);
    expect(parsed.totalItems).toBe(0);
  });

  it('round-trips: generate -> parse should recover the items', () => {
    writePlanDoc('RISK_MATRIX.md', `## Critical\n\n- Missing auth on admin\n- Data loss on cron job\n\n## High\n\n- Slow page load\n\n## Medium\n\n- Footer contrast below AA`);
    writePlanDoc('FEATURES.md', `## Gaps\n\n- No account deletion flow`);

    const result = generateHardeningMd(tmpDir)!;
    writeHardeningMd(tmpDir, result.content);

    const parsed = parseHardeningMd(tmpDir);
    expect(parsed.mustFix.length).toBeGreaterThanOrEqual(2);
    expect(parsed.mustFix[0]!.description).toBeTruthy();
    expect(parsed.mustFix[0]!.source).toBeTruthy();
    expect(['S', 'M', 'L']).toContain(parsed.mustFix[0]!.effort);
  });
});

describe('topHardeningItems', () => {
  it('returns must-fix items before should-fix before nice-to-have', () => {
    const report = {
      mustFix: [
        { priority: 'must-fix' as const, category: 'security' as const, description: 'A', source: 'X', effort: 'S' as const },
        { priority: 'must-fix' as const, category: 'data' as const, description: 'B', source: 'X', effort: 'M' as const },
      ],
      shouldFix: [
        { priority: 'should-fix' as const, category: 'ux' as const, description: 'C', source: 'X', effort: 'S' as const },
      ],
      niceToHave: [
        { priority: 'nice-to-have' as const, category: 'general' as const, description: 'D', source: 'X', effort: 'L' as const },
      ],
    };
    const top = topHardeningItems(report);
    expect(top.map(i => i.description)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('respects the limit', () => {
    const report = {
      mustFix: Array.from({ length: 15 }, (_, i) => ({
        priority: 'must-fix' as const,
        category: 'general' as const,
        description: `item ${i}`,
        source: 'X',
        effort: 'M' as const,
      })),
      shouldFix: [],
      niceToHave: [],
    };
    expect(topHardeningItems(report, 10)).toHaveLength(10);
    expect(topHardeningItems(report, 5)).toHaveLength(5);
  });
});

// ============================================================================
// Integration with loadPlanDocs
// ============================================================================

describe('plan-reader loads HARDENING.md', () => {
  it('loadPlanDocs picks up HARDENING.md alongside the others', () => {
    writePlanDoc('HARDENING.md', '# My project — Hardening Proposal\n\n## Must Fix (1)\n\n### 1. Test item\n\n- **Category:** security\n- **Source:** `RISK_MATRIX.md`\n- **Effort:** S');
    const docs = loadPlanDocs(tmpDir);
    expect(docs.hardening).toContain('Hardening Proposal');
  });
});
