// Idea Reader: for Path B of /linkraft plan.
//
// Given a rough idea markdown file (PLAN.md, IDEA.md, BRIEF.md, README.md, etc.)
// this module extracts the structured context that later Path B generators need:
//   - what the product is
//   - who it is for
//   - core feature hints
//   - any tech preferences the author mentioned
//   - whether this looks like a mobile app, web app, CLI, backend, etc.
//
// It then writes a normalized .plan/IDEA.md summary so the existing research
// generators (competitors, architecture, risk-matrix, ...) pick it up through
// their `.plan/*.md` scanning without needing any code changes.

import * as fs from 'fs';
import * as path from 'path';

export type ProductCategory =
  | 'mobile app'
  | 'web application'
  | 'backend service'
  | 'CLI tool'
  | 'desktop app'
  | 'library'
  | 'software project';

export interface IdeaContext {
  /** The filename that was read (relative to project root). */
  sourceFile: string;
  /** Short product name, extracted from H1 or filename. */
  productName: string;
  /** One-line description distilled from the idea doc. */
  oneLiner: string;
  /** Longer description (first paragraph under the H1). */
  description: string;
  /** Product category used to guide stack and monetization recommendations. */
  category: ProductCategory;
  /** Target audience / users mentioned in the doc. */
  targetAudience: string[];
  /** Feature bullets extracted from the doc. */
  features: string[];
  /** Technologies the author explicitly mentioned (next, expo, postgres, ...). */
  techHints: string[];
  /** Full raw contents of the idea file (for downstream use). */
  raw: string;
}

const TECH_VOCAB: Record<string, string> = {
  // frontend
  'next.js': 'next',
  nextjs: 'next',
  next: 'next',
  react: 'react',
  'react native': 'react-native',
  expo: 'expo',
  svelte: 'svelte',
  sveltekit: 'sveltekit',
  vue: 'vue',
  nuxt: 'nuxt',
  remix: 'remix',
  astro: 'astro',
  // backend
  fastapi: 'fastapi',
  django: 'django',
  flask: 'flask',
  express: 'express',
  hono: 'hono',
  fastify: 'fastify',
  nestjs: 'nestjs',
  rails: 'rails',
  // data
  postgres: 'postgres',
  postgresql: 'postgres',
  mysql: 'mysql',
  sqlite: 'sqlite',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  redis: 'redis',
  supabase: 'supabase',
  firebase: 'firebase',
  prisma: 'prisma',
  drizzle: 'drizzle',
  // infra
  vercel: 'vercel',
  netlify: 'netlify',
  cloudflare: 'cloudflare',
  aws: 'aws',
  docker: 'docker',
  // styling
  tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss',
  shadcn: 'shadcn',
  'shadcn/ui': 'shadcn',
  // auth
  clerk: 'clerk',
  auth0: 'auth0',
  'next-auth': 'next-auth',
  // payments
  stripe: 'stripe',
  lemonsqueezy: 'lemonsqueezy',
  // ai
  openai: 'openai',
  anthropic: 'anthropic',
  claude: 'anthropic',
  ollama: 'ollama',
  langchain: 'langchain',
};

/**
 * Reads and parses the idea file into an IdeaContext. The caller is expected
 * to have already picked a filename via findIdeaFile() from path-detector.
 */
export function readIdeaFile(projectRoot: string, ideaFile: string): IdeaContext | null {
  const full = path.join(projectRoot, ideaFile);
  if (!fs.existsSync(full)) return null;

  let raw: string;
  try {
    raw = fs.readFileSync(full, 'utf-8');
  } catch {
    return null;
  }

  const productName = extractProductName(raw, ideaFile);
  const description = extractDescription(raw);
  const oneLiner = deriveOneLiner(description, productName);
  const features = extractFeatures(raw);
  const targetAudience = extractTargetAudience(raw);
  const techHints = extractTechHints(raw);
  const category = inferCategory(raw, techHints);

  return {
    sourceFile: ideaFile,
    productName,
    oneLiner,
    description,
    category,
    targetAudience,
    features,
    techHints,
    raw,
  };
}

function extractProductName(raw: string, ideaFile: string): string {
  const h1 = raw.match(/^#\s+(.+?)\s*$/m);
  if (h1 && h1[1]) {
    const name = h1[1].replace(/[:\-|].*$/, '').trim();
    if (name) return name;
  }
  return path.basename(ideaFile, path.extname(ideaFile));
}

function extractDescription(raw: string): string {
  const lines = raw.split('\n');
  let collecting = false;
  const para: string[] = [];
  for (const line of lines) {
    if (/^#\s/.test(line)) {
      if (collecting) break;
      collecting = true;
      continue;
    }
    if (!collecting) continue;
    if (/^#{2,}\s/.test(line)) break;
    if (line.trim() === '') {
      if (para.length > 0) break;
      continue;
    }
    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) break;
    para.push(line.trim());
  }
  return para.join(' ').trim();
}

function deriveOneLiner(description: string, fallback: string): string {
  if (!description) return fallback;
  const firstSentence = description.split(/(?<=[.!?])\s+/)[0] ?? description;
  return firstSentence.length > 200 ? firstSentence.slice(0, 197) + '...' : firstSentence;
}

function extractFeatures(raw: string): string[] {
  const features: string[] = [];
  const lines = raw.split('\n');
  let inFeatureSection = false;
  let depth = 0;

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const title = heading[2]!.toLowerCase();
      const level = heading[1]!.length;
      if (/feature|capabilit|mvp|what.*do|scope|requirements?/i.test(title)) {
        inFeatureSection = true;
        depth = level;
        continue;
      }
      if (inFeatureSection && level <= depth) break;
    }
    if (!inFeatureSection) continue;

    const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/.exec(line);
    if (bullet && bullet[1]) {
      const text = bullet[1].replace(/\*\*/g, '').trim();
      if (text.length > 2) features.push(text);
    }
  }

  if (features.length === 0) {
    for (const line of lines) {
      const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/.exec(line);
      if (bullet && bullet[1]) {
        const text = bullet[1].replace(/\*\*/g, '').trim();
        if (text.length > 2) features.push(text);
      }
      if (features.length >= 12) break;
    }
  }

  return features.slice(0, 20);
}

function extractTargetAudience(raw: string): string[] {
  const audience: string[] = [];
  const lines = raw.split('\n');
  let inSection = false;
  let depth = 0;

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const title = heading[2]!.toLowerCase();
      const level = heading[1]!.length;
      if (/audience|target|users?|persona|who.*for|customer/i.test(title)) {
        inSection = true;
        depth = level;
        continue;
      }
      if (inSection && level <= depth) break;
    }
    if (!inSection) continue;

    const bullet = /^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/.exec(line);
    if (bullet && bullet[1]) audience.push(bullet[1].trim());
    else if (line.trim().length > 4 && !line.startsWith('#')) audience.push(line.trim());
    if (audience.length >= 8) break;
  }

  return audience.slice(0, 8);
}

function extractTechHints(raw: string): string[] {
  const found = new Set<string>();
  const haystack = raw.toLowerCase();
  for (const [token, normalized] of Object.entries(TECH_VOCAB)) {
    const re = new RegExp(`(?:^|[^a-z])${escapeRegex(token)}(?:[^a-z]|$)`, 'i');
    if (re.test(haystack)) found.add(normalized);
  }
  return Array.from(found);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferCategory(raw: string, techHints: string[]): ProductCategory {
  const lc = raw.toLowerCase();
  const has = (t: string) => techHints.includes(t);
  const mentions = (re: RegExp) => re.test(lc);

  if (has('expo') || has('react-native') || mentions(/\b(ios|android|mobile app|app store|play store)\b/)) {
    return 'mobile app';
  }
  if (mentions(/\b(cli|command[- ]line|terminal tool)\b/)) return 'CLI tool';
  if (mentions(/\b(electron|tauri|desktop app)\b/)) return 'desktop app';
  if (has('fastapi') || has('django') || has('flask') || has('express') || has('hono') || has('fastify') || has('nestjs')) {
    if (!has('next') && !has('nuxt') && !has('react') && !mentions(/\bweb app\b/)) return 'backend service';
  }
  if (has('next') || has('nuxt') || has('sveltekit') || has('remix') || has('astro') || mentions(/\b(web app|saas|dashboard|landing page)\b/)) {
    return 'web application';
  }
  if (mentions(/\b(library|npm package|sdk)\b/)) return 'library';
  return 'software project';
}

/**
 * Writes a normalized .plan/IDEA.md summary. This is what downstream generators
 * read (they all scan .plan/*.md already), so every Path B run ends up with
 * rich context flowing into competitors, architecture, risk-matrix, etc.
 */
export function writeIdeaSummary(projectRoot: string, ctx: IdeaContext): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'IDEA.md');
  fs.writeFileSync(filePath, formatIdeaSummary(ctx), 'utf-8');
  return filePath;
}

export function formatIdeaSummary(ctx: IdeaContext): string {
  const lines = [
    `# Idea: ${ctx.productName}`,
    '',
    `> Source: \`${ctx.sourceFile}\``,
    '',
    '## One-liner',
    '',
    ctx.oneLiner || '(not detected)',
    '',
    '## Description',
    '',
    ctx.description || '(not detected)',
    '',
    '## Category',
    '',
    ctx.category,
    '',
    '## Target Audience',
    '',
    ...(ctx.targetAudience.length > 0
      ? ctx.targetAudience.map(a => `- ${a}`)
      : ['(not detected)']),
    '',
    '## Core Features',
    '',
    ...(ctx.features.length > 0 ? ctx.features.map(f => `- ${f}`) : ['(not detected)']),
    '',
    '## Tech Hints (author mentioned)',
    '',
    ...(ctx.techHints.length > 0
      ? ctx.techHints.map(t => `- ${t}`)
      : ['(none — stack will be recommended from scratch)']),
    '',
  ];
  return lines.join('\n');
}

/**
 * Reads the normalized .plan/IDEA.md (written by writeIdeaSummary) if it exists.
 * Returns the raw markdown string. Downstream generators use this as lightweight
 * context when operating in Path B.
 */
export function loadIdeaSummary(projectRoot: string): string | null {
  const filePath = path.join(projectRoot, '.plan', 'IDEA.md');
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
