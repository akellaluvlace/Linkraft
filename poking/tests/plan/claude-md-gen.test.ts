import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanProject, generateClaudeMd, generateAndWriteClaudeMd, generateClaudeMdFromPlan } from '../../src/plan/claude-md-gen.js';
import { loadPlanDocs } from '../../src/plan/plan-reader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-md-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupNextProject(): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'my-saas-app',
    description: 'A SaaS application for team management',
    dependencies: { next: '^14.0.0', tailwindcss: '^3.0.0', '@supabase/supabase-js': '^2.0.0' },
    devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0' },
    scripts: { build: 'next build', test: 'vitest run', lint: 'eslint .' },
  }), 'utf-8');

  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
  fs.writeFileSync(path.join(tmpDir, 'tailwind.config.ts'), 'export default {}');

  const srcApp = path.join(tmpDir, 'src', 'app');
  fs.mkdirSync(srcApp, { recursive: true });
  fs.writeFileSync(path.join(srcApp, 'layout.tsx'), `export default function Layout({ children }) { return <html><body>{children}</body></html>; }`);
  fs.writeFileSync(path.join(srcApp, 'page.tsx'), `export default function Home() { return <div>Hello</div>; }`);
}

describe('scanProject', () => {
  it('detects Next.js + Tailwind + Supabase stack', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.projectName).toBe('my-saas-app');
    expect(config.stack.framework).toBe('nextjs');
    expect(config.stack.styling).toBe('tailwind');
    expect(config.stack.database).toBe('supabase');
    expect(config.stack.language).toBe('typescript');
  });

  it('finds build, test, and lint commands', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.buildCommand).toBeTruthy();
    expect(config.testCommand).toBeTruthy();
    expect(config.lintCommand).toBeTruthy();
  });

  it('detects file map entries', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.fileMap.some(f => f.path === 'package.json')).toBe(true);
    expect(config.fileMap.some(f => f.path === 'tsconfig.json')).toBe(true);
  });

  it('generates hard constraints for Tailwind', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    expect(config.hardConstraints.some(c => c.includes('Tailwind'))).toBe(true);
  });
});

describe('generateClaudeMd', () => {
  it('produces markdown with all sections', () => {
    setupNextProject();
    const config = scanProject(tmpDir);
    const md = generateClaudeMd(config);

    expect(md).toContain('# my-saas-app');
    expect(md).toContain('## Tech Stack');
    expect(md).toContain('nextjs');
    expect(md).toContain('## Commands');
    expect(md).toContain('npm run build');
    expect(md).toContain('## Coding Standards');
    expect(md).toContain('## Key Files');
    expect(md).toContain('## Hard Constraints');
    expect(md).toContain('Tailwind');
  });

  it('handles minimal project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'minimal' }));
    const config = scanProject(tmpDir);
    const md = generateClaudeMd(config);
    expect(md).toContain('# minimal');
    expect(md).toContain('## Tech Stack');
  });
});

describe('generateAndWriteClaudeMd', () => {
  it('case 1: no CLAUDE.md — generates and writes', () => {
    setupNextProject();
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.existed).toBe(false);
    expect(result.hasChanges).toBe(false);
    expect(fs.existsSync(result.path)).toBe(true);
    const content = fs.readFileSync(result.path, 'utf-8');
    expect(content).toContain('# my-saas-app');
    expect(content).toContain('nextjs');
  });

  it('case 2: stale CLAUDE.md — detects new sections', () => {
    setupNextProject();
    // Write a minimal CLAUDE.md missing most sections
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '## Tech Stack\n\n- Framework: nextjs\n');
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.existed).toBe(true);
    expect(result.hasChanges).toBe(true);
    expect(result.newSections.length).toBeGreaterThan(0);
    // mergedContent should include both existing and new sections
    expect(result.mergedContent).toContain('## Tech Stack');
    expect(result.mergedContent).toContain('## Commands');
  });

  it('case 3: comprehensive CLAUDE.md — no new sections', () => {
    setupNextProject();
    // Generate once to create CLAUDE.md
    generateAndWriteClaudeMd(tmpDir);
    // Regenerate with CLAUDE.md now in the directory tree, then overwrite
    const config = scanProject(tmpDir);
    const freshContent = generateClaudeMd(config);
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), freshContent);
    // Third run: existing matches generated exactly
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.existed).toBe(true);
    expect(result.newSections).toHaveLength(0);
    expect(result.hasChanges).toBe(false);
  });

  it('case 1: file is actually written to disk', () => {
    setupNextProject();
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
    generateAndWriteClaudeMd(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('case 2: does not overwrite existing CLAUDE.md', () => {
    setupNextProject();
    const original = '## Tech Stack\n\n- Framework: nextjs\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), original);
    generateAndWriteClaudeMd(tmpDir);
    // Should NOT have been overwritten (only proposes merge)
    const afterRun = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(afterRun).toBe(original);
  });
});

// ===========================================================================
// Plan-aware path: when .plan/*.md docs exist, CLAUDE.md is distilled from
// them instead of scanning the project directly.
// ===========================================================================

function writePlanDoc(name: string, content: string): void {
  const planDir = path.join(tmpDir, '.plan');
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(planDir, name), content, 'utf-8');
}

function setupFullPlanDocs(): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'studyflow',
    description: 'AI study platform for neurodivergent students',
  }), 'utf-8');

  writePlanDoc('EXECUTIVE_SUMMARY.md', `# Executive Summary

## What It Is

StudyFlow is a study companion for ADHD and autistic students that adapts to focus patterns and celebrates small wins through a quiet mode by default.

## Current State

Public beta with 600 early users. Core focus-tracking loop is shipped. Payments and social features are behind a flag. Two open critical bugs around the weekly report cron.

## What's Left Before Launch

- Fix the weekly report cron timezone bug
- Add billing via Stripe
- Migrate old beta accounts to the new schema
`);

  writePlanDoc('STACK.md', `# Stack

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.3 |
| Database | Supabase (Postgres) |
| Styling | Tailwind 3.4 |
| Testing | Vitest |

## Commands

- \`pnpm run dev\` — dev server
- \`pnpm run build\` — production build
- \`pnpm test\` — run the Vitest suite
- \`pnpm run lint\` — eslint + prettier

## Directory Structure

\`\`\`
src/
  app/
  components/
  lib/
  server/
\`\`\`

## Conventions

- Server Components by default, "use client" only when needed
- Tailwind only, no inline styles or CSS modules
- 2-space indentation, single quotes, no semicolons
- Imports: external first, then @/ aliases, then relative
`);

  writePlanDoc('SCHEMA.md', `# Schema

## Tables

| Table | Purpose |
|-------|---------|
| users | auth.users mirror with display name and timezone |
| focus_sessions | logged study sessions with duration and mood tags |
| attention_maps | weekly aggregates for each user |
| subscriptions | Stripe subscription state |

## RLS

- Every table has RLS enabled
- users can only read their own focus_sessions rows
- attention_maps readable only via RPC

## RPC Functions

- \`get_weekly_focus_map(user_id)\` — returns the 7-day rollup for a user
- \`upsert_focus_session(session)\` — validates and inserts a session
`);

  writePlanDoc('API_MAP.md', `# API Map

## Endpoints

| Path | Method | Auth |
|------|--------|------|
| /api/sessions | GET | user |
| /api/sessions | POST | user |
| /api/weekly | GET | user |
| /api/webhooks/stripe | POST | stripe signature |
| /api/health | GET | none |
`);

  writePlanDoc('DESIGN_TOKENS.md', `# Design Tokens

## Colors

- --bg: #0F0F12
- --ink: #F5F5FA
- --accent: #7B2D8E

## Typography

- Headings: Inter 700
- Body: Inter 400

## Banned Patterns

- Never use inline styles
- No raw CSS files
- No box-shadow without design approval
`);

  writePlanDoc('ARCHITECTURE.md', `# Architecture

## Strengths

- Server Components keep initial JS tiny
- Supabase RLS removes whole classes of auth bugs
- Weekly cron is decoupled via a queue

## Weaknesses

- Weekly cron has a timezone bug that double-counts sessions
- Subscription state is duplicated in both Stripe and our db
- No integration tests for the focus session upsert path
`);

  writePlanDoc('RISK_MATRIX.md', `# Risk Matrix

## Critical

- Weekly report timezone bug double-counts user sessions
- Subscription sync between Stripe and db is eventually consistent — mid-month upgrades may go unbilled

## High

- No tests on upsert_focus_session RPC
- Missing database backup verification

## Medium

- Lighthouse score on landing is 78
- Contrast on secondary text is borderline

## Accepted

- No mobile app this year
`);

  writePlanDoc('FEATURES.md', `# Features

## Detected Features

- Focus session tracking
- Weekly attention maps
- Stripe subscriptions (behind flag)
- Quiet mode

## Gaps

- No password reset flow
- No account deletion path
- Missing CSV export on the history page
- Beta accounts not yet migrated to new schema
`);
}

describe('generateClaudeMdFromPlan', () => {
  it('produces a markdown document with expected sections', () => {
    setupFullPlanDocs();
    const docs = loadPlanDocs(tmpDir);
    const md = generateClaudeMdFromPlan(tmpDir, docs);

    expect(md).toContain('# studyflow');
    expect(md).toContain('AI study platform for neurodivergent students');
    expect(md).toContain('## Project Overview');
    expect(md).toContain('## Tech Stack');
    expect(md).toContain('## Commands');
    expect(md).toContain('## Database');
    expect(md).toContain('## API Endpoints');
    expect(md).toContain('## Design System');
    expect(md).toContain('## Architecture Notes');
    expect(md).toContain('## Critical Risks');
    expect(md).toContain('## Hard Constraints');
    expect(md).toContain('## Known Issues');
    expect(md).toContain('## Session Protocol');
  });

  it('distills content from the plan docs', () => {
    setupFullPlanDocs();
    const md = generateClaudeMdFromPlan(tmpDir, loadPlanDocs(tmpDir));

    // Overview pulled from EXECUTIVE_SUMMARY.md
    expect(md).toContain('ADHD and autistic students');

    // Tech stack table pulled from STACK.md
    expect(md).toContain('Next.js 15');
    expect(md).toContain('Supabase');

    // Commands extracted from inline code spans
    expect(md).toContain('pnpm run build');

    // Database tables pulled from SCHEMA.md
    expect(md).toContain('focus_sessions');

    // API endpoints table pulled from API_MAP.md
    expect(md).toContain('/api/sessions');

    // Design system tokens
    expect(md).toContain('--bg: #0F0F12');

    // Architecture weaknesses
    expect(md).toContain('timezone bug');

    // Critical risks only (not medium)
    expect(md).toContain('Weekly report timezone bug');
    expect(md).not.toContain('Lighthouse score on landing');

    // Known issues from features gaps
    expect(md).toContain('No password reset flow');
  });

  it('stays within cheat-sheet size budget (~2000-3000 tokens)', () => {
    setupFullPlanDocs();
    const md = generateClaudeMdFromPlan(tmpDir, loadPlanDocs(tmpDir));
    // Token approximation: 1 token ≈ 4 chars. 3000 tokens ≈ 12KB.
    expect(md.length).toBeGreaterThan(1000);
    expect(md.length).toBeLessThan(14000);
  });

  it('omits sections for missing plan docs', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'partial' }), 'utf-8');
    writePlanDoc('STACK.md', '## Tech Stack\n\n- Next.js');
    writePlanDoc('SCHEMA.md', '## Tables\n\n- users');

    const md = generateClaudeMdFromPlan(tmpDir, loadPlanDocs(tmpDir));

    expect(md).toContain('Tech Stack');
    expect(md).toContain('Database');
    expect(md).not.toContain('## API Endpoints');
    expect(md).not.toContain('## Design System');
    expect(md).not.toContain('## Critical Risks');
  });

  it('includes the synthesized-from-plan marker', () => {
    setupFullPlanDocs();
    const md = generateClaudeMdFromPlan(tmpDir, loadPlanDocs(tmpDir));
    expect(md).toContain('Synthesized from');
    expect(md).toContain('.plan/');
  });
});

describe('generateAndWriteClaudeMd: path selection', () => {
  it('uses the plan path when .plan/ docs exist', () => {
    setupFullPlanDocs();
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.source).toBe('plan');
    expect(result.content).toContain('Synthesized from');
    expect(result.content).toContain('ADHD and autistic students');
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('falls back to direct scan when .plan/ docs are missing', () => {
    setupNextProject();
    // No .plan/ directory created
    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.source).toBe('scan');
    expect(result.content).not.toContain('Synthesized from');
    // Should still produce a valid CLAUDE.md from the scan
    expect(result.content).toContain('## Tech Stack');
    expect(result.content).toContain('nextjs');
  });

  it('plan path + existing CLAUDE.md still returns diff without overwriting', () => {
    setupFullPlanDocs();
    const original = '# Pre-existing\n\n## Custom Section\n\nUser wrote this.';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), original);

    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.source).toBe('plan');
    expect(result.existed).toBe(true);
    expect(result.hasChanges).toBe(true);

    // Original file must be unchanged on disk (diff-only, no overwrite)
    const afterRun = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(afterRun).toBe(original);

    // Merged content should include new sections from plan-derived output
    expect(result.mergedContent).toContain('Custom Section');
    expect(result.mergedContent).toContain('Project Overview');
  });

  it('partial plan docs still trigger the plan path', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'partial' }), 'utf-8');
    writePlanDoc('STACK.md', '## Tech Stack\n\n- Next.js');

    const result = generateAndWriteClaudeMd(tmpDir);
    expect(result.source).toBe('plan');
  });
});
