// From-Idea Generators: Path B variants for the "analytical" steps of
// /linkraft plan. These don't scan code (there isn't any) — they produce
// templates pre-populated with idea context that Claude fills in.
//
// One shared two-mode helper keeps the surface area small: each generator
// writes to .plan/<NAME>.md when given content, otherwise returns a template.

import * as fs from 'fs';
import * as path from 'path';
import type { IdeaContext } from './idea-reader.js';
import { readIdeaFile } from './idea-reader.js';
import { findIdeaFile } from './path-detector.js';

function writePlanDoc(projectRoot: string, fileName: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Resolves idea context for Path B. Tries .plan/IDEA.md first (normalized
 * summary written by plan_read_idea), then falls back to re-reading the
 * original idea file from the root. Returns null if neither is available.
 */
export function resolveIdeaContext(projectRoot: string): IdeaContext | null {
  const ideaFile = findIdeaFile(projectRoot);
  if (!ideaFile) return null;
  return readIdeaFile(projectRoot, ideaFile);
}

function contextBlock(ctx: IdeaContext): string[] {
  return [
    '## Idea Context (from your rough plan)',
    '',
    `- **Product:** ${ctx.productName}`,
    `- **One-liner:** ${ctx.oneLiner || '(not detected)'}`,
    `- **Category:** ${ctx.category}`,
    `- **Target audience:** ${ctx.targetAudience.length > 0 ? ctx.targetAudience.join('; ') : '(not specified)'}`,
    `- **Core features:** ${ctx.features.length > 0 ? ctx.features.slice(0, 8).join('; ') : '(not specified)'}`,
    `- **Tech hints:** ${ctx.techHints.length > 0 ? ctx.techHints.join(', ') : '(none — recommend from scratch)'}`,
    '',
  ];
}

// --- STACK ------------------------------------------------------------------

export function generateStackFromIdeaTemplate(ctx: IdeaContext): string {
  const recommendation = defaultStackFor(ctx);
  const lines = [
    `# Stack Recommendation: ${ctx.productName}`,
    '',
    ...contextBlock(ctx),
    '## Suggested Stack',
    '',
    'Below is a starting point based on the product category. Revise as needed.',
    '',
    '| Layer | Recommendation | Reasoning | Alternatives |',
    '|-------|----------------|-----------|--------------|',
    ...recommendation.map(r => `| ${r.layer} | ${r.pick} | ${r.why} | ${r.alts} |`),
    '',
    '## Decisions to Confirm',
    '',
    '- [ ] Language and runtime version',
    '- [ ] Framework',
    '- [ ] Database',
    '- [ ] Auth provider',
    '- [ ] Hosting / deployment target',
    '- [ ] Testing framework',
    '- [ ] Styling / design system',
    '',
    '## Constraints Noted in Idea',
    '',
    ctx.techHints.length > 0
      ? ctx.techHints.map(t => `- Author mentioned: \`${t}\``).join('\n')
      : '- (none)',
    '',
  ];
  return lines.join('\n');
}

interface StackRow { layer: string; pick: string; why: string; alts: string; }

function defaultStackFor(ctx: IdeaContext): StackRow[] {
  const hints = new Set(ctx.techHints);
  const has = (t: string) => hints.has(t);

  if (ctx.category === 'mobile app' || has('expo') || has('react-native')) {
    return [
      { layer: 'Framework', pick: 'Expo (React Native)', why: 'Cross-platform iOS/Android with single codebase and EAS Build', alts: 'Flutter, native SwiftUI + Kotlin' },
      { layer: 'Language', pick: 'TypeScript', why: 'Type safety and shared types across client/server', alts: 'JavaScript' },
      { layer: 'Backend', pick: 'Supabase', why: 'Auth, postgres, storage, realtime in one managed service', alts: 'Firebase, custom Node.js + Postgres' },
      { layer: 'State', pick: 'Zustand or React Query', why: 'Lightweight, idiomatic for RN', alts: 'Redux Toolkit, Jotai' },
      { layer: 'Styling', pick: 'NativeWind (Tailwind for RN)', why: 'Utility-first, familiar Tailwind syntax', alts: 'StyleSheet, Tamagui' },
      { layer: 'Testing', pick: 'Vitest + Detox', why: 'Unit + E2E on devices', alts: 'Jest + Maestro' },
      { layer: 'Deployment', pick: 'EAS Build + TestFlight/Play Console', why: 'Native to Expo toolchain', alts: 'Fastlane, manual builds' },
    ];
  }

  if (ctx.category === 'backend service') {
    return [
      { layer: 'Runtime', pick: 'Node.js 24 (LTS)', why: 'Current default on Vercel, wide ecosystem', alts: 'Python 3.13 + FastAPI, Go, Bun' },
      { layer: 'Framework', pick: 'Hono', why: 'Lightweight, edge-friendly, TypeScript-first', alts: 'Fastify, Express, NestJS' },
      { layer: 'Database', pick: 'Postgres (Neon or Supabase)', why: 'Relational, proven, free tier on serverless providers', alts: 'PlanetScale (MySQL), SQLite' },
      { layer: 'ORM', pick: 'Drizzle', why: 'Type-safe, no codegen, close to SQL', alts: 'Prisma, Kysely' },
      { layer: 'Auth', pick: 'JWT + Clerk (if user-facing)', why: 'Drop-in if consumer app; raw JWT if machine-to-machine', alts: 'Auth0, custom sessions' },
      { layer: 'Testing', pick: 'Vitest', why: 'Fast, ESM-native, matches TS toolchain', alts: 'Jest' },
      { layer: 'Deployment', pick: 'Vercel Functions (Fluid Compute)', why: 'Zero-config Node.js, 300s timeouts', alts: 'Fly.io, Railway, self-hosted Docker' },
    ];
  }

  if (ctx.category === 'CLI tool') {
    return [
      { layer: 'Runtime', pick: 'Node.js 24', why: 'Wide install base, good ESM support', alts: 'Bun, Deno, Go, Rust' },
      { layer: 'Framework', pick: 'commander + chalk', why: 'Battle-tested for subcommand CLIs', alts: 'yargs, oclif, clipanion' },
      { layer: 'Language', pick: 'TypeScript', why: 'Type safety in a public-facing API', alts: 'JavaScript' },
      { layer: 'Testing', pick: 'Vitest', why: 'Fast, ESM-native', alts: 'Jest' },
      { layer: 'Publishing', pick: 'npm + tsup', why: 'Standard for TS CLIs', alts: 'pkgroll, unbuild' },
    ];
  }

  return [
    { layer: 'Framework', pick: 'Next.js 16 (App Router)', why: 'Server Components, Cache Components, wide ecosystem', alts: 'SvelteKit, Nuxt, Remix, Astro' },
    { layer: 'Language', pick: 'TypeScript', why: 'Default for modern full-stack JS', alts: 'JavaScript' },
    { layer: 'Database', pick: 'Postgres via Neon', why: 'Free tier, serverless-friendly, branching', alts: 'Supabase, PlanetScale' },
    { layer: 'ORM', pick: 'Drizzle', why: 'Type-safe, no codegen', alts: 'Prisma, Kysely' },
    { layer: 'Auth', pick: 'Clerk', why: 'Native Vercel Marketplace integration, fast setup', alts: 'Auth0, Supabase Auth, NextAuth' },
    { layer: 'Styling', pick: 'Tailwind + shadcn/ui', why: 'Utility-first + composable components', alts: 'CSS Modules, Panda CSS' },
    { layer: 'Testing', pick: 'Vitest + Playwright', why: 'Unit + E2E that plays nicely with Next.js', alts: 'Jest + Cypress' },
    { layer: 'Deployment', pick: 'Vercel', why: 'Zero-config Next.js with Fluid Compute', alts: 'Netlify, Cloudflare Pages, self-hosted' },
  ];
}

export function writeStackFromIdea(projectRoot: string, content: string): string {
  return writePlanDoc(projectRoot, 'STACK.md', content);
}

// --- SCHEMA -----------------------------------------------------------------

export function generateSchemaFromIdeaTemplate(ctx: IdeaContext): string {
  const lines = [
    `# Schema Design: ${ctx.productName}`,
    '',
    ...contextBlock(ctx),
    '## Instructions',
    '',
    'Design the initial database schema from the core feature list above.',
    'Focus on entities that appear in multiple features — those are your tables.',
    '',
    '## Proposed Tables',
    '',
    '### users',
    '| column | type | nullable | notes |',
    '|--------|------|----------|-------|',
    '| id | uuid | no | primary key |',
    '| email | text | no | unique |',
    '| created_at | timestamptz | no | default now() |',
    '',
    '### (add more tables here based on features)',
    '',
    '## Relationships',
    '',
    '(describe foreign keys and cardinality)',
    '',
    '## RLS / Access Policies',
    '',
    '(if using Supabase or Postgres RLS, sketch the policies here)',
    '',
    '## Migrations Plan',
    '',
    '1. Initial schema migration with core tables',
    '2. Indexes on foreign keys and query hotpaths',
    '',
  ];
  return lines.join('\n');
}

export function writeSchemaFromIdea(projectRoot: string, content: string): string {
  return writePlanDoc(projectRoot, 'SCHEMA.md', content);
}

// --- API MAP ----------------------------------------------------------------

export function generateApiMapFromIdeaTemplate(ctx: IdeaContext): string {
  const lines = [
    `# API Map: ${ctx.productName}`,
    '',
    ...contextBlock(ctx),
    '## Instructions',
    '',
    'Design the initial API surface from the feature list. One endpoint per feature',
    'action at minimum. Keep routes RESTful unless there is a reason not to.',
    '',
    '## Endpoints',
    '',
    '| Method | Path | Auth | Input | Output | Purpose |',
    '|--------|------|------|-------|--------|---------|',
    '| POST | /api/auth/signup | none | { email, password } | { token } | Create user account |',
    '| POST | /api/auth/login | none | { email, password } | { token } | Authenticate user |',
    '| GET | /api/me | required | - | User | Current user |',
    '| (add more from features) | | | | | |',
    '',
    '## Auth Model',
    '',
    '- How are sessions managed?',
    '- Where do tokens live (cookie, header)?',
    '- What routes are public vs. protected?',
    '',
    '## Error Contract',
    '',
    '- Error shape: `{ error: string, code: string, details?: object }`',
    '- HTTP status codes: 400 validation, 401 unauth, 403 forbidden, 404 missing, 500 server',
    '',
  ];
  return lines.join('\n');
}

export function writeApiMapFromIdea(projectRoot: string, content: string): string {
  return writePlanDoc(projectRoot, 'API_MAP.md', content);
}

// --- DESIGN TOKENS ----------------------------------------------------------

export function generateTokensFromIdeaTemplate(ctx: IdeaContext): string {
  const lines = [
    `# Design Tokens: ${ctx.productName}`,
    '',
    ...contextBlock(ctx),
    '## Instructions',
    '',
    'Propose a starting design system. Pick colors, typography, spacing, and radii',
    `that match a ${ctx.category}. Revise once you have real screens.`,
    '',
    '## Colors',
    '',
    '```css',
    ':root {',
    '  --background: #ffffff;',
    '  --foreground: #0b0b0c;',
    '  --muted: #6b7280;',
    '  --primary: #111827;',
    '  --primary-foreground: #ffffff;',
    '  --accent: #2563eb;',
    '  --destructive: #dc2626;',
    '  --border: #e5e7eb;',
    '}',
    '```',
    '',
    '## Typography',
    '',
    '- **Body:** Inter (system-ui fallback)',
    '- **Headings:** Inter, semibold / bold',
    '- **Mono:** JetBrains Mono, ui-monospace fallback',
    '- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48 px',
    '',
    '## Spacing',
    '',
    '4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px (Tailwind default scale)',
    '',
    '## Radii',
    '',
    '`sm 4px` / `md 8px` / `lg 12px` / `xl 16px` / `full 9999px`',
    '',
    '## Shadows',
    '',
    '`sm` light elevation, `md` cards, `lg` modals',
    '',
  ];
  return lines.join('\n');
}

export function writeTokensFromIdea(projectRoot: string, content: string): string {
  return writePlanDoc(projectRoot, 'DESIGN_TOKENS.md', content);
}

// --- FEATURES ---------------------------------------------------------------

export function generateFeaturesFromIdeaTemplate(ctx: IdeaContext): string {
  const always = ['IDEA', 'STACK', 'SCHEMA', 'API_MAP', 'DESIGN_TOKENS', 'FEATURES', 'CLAUDE.md',
    'COMPETITORS', 'ARCHITECTURE', 'EXECUTIVE_SUMMARY', 'RISK_MATRIX', 'DEPENDENCY_GRAPH', 'HARDENING'];

  const conditional: string[] = [];
  if (ctx.category === 'mobile app') conditional.push('ASO_KEYWORDS');
  conditional.push('MONETIZATION');

  const lines = [
    `# Feature Detection (Path B): ${ctx.productName}`,
    '',
    ...contextBlock(ctx),
    '## Plan Outputs to Generate',
    '',
    '### Always',
    ...always.map(a => `- ${a}`),
    '',
    '### Conditional',
    ...conditional.map(a => `- ${a}`),
    '',
    '## Extracted Feature List',
    '',
    ...(ctx.features.length > 0
      ? ctx.features.map((f, i) => `${i + 1}. ${f}`)
      : ['(no features extracted — add them to the idea file and re-run)']),
    '',
  ];
  return lines.join('\n');
}

export function writeFeaturesFromIdea(projectRoot: string, content: string): string {
  return writePlanDoc(projectRoot, 'FEATURES.md', content);
}
