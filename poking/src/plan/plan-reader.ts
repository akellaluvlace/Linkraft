// Plan Reader: reads .plan/*.md documents (produced by the other plan_* tools)
// and extracts the key sections needed to synthesize a CLAUDE.md.
//
// When /linkraft plan runs the full pipeline, steps 1-12 produce:
//   .plan/STACK.md  SCHEMA.md  API_MAP.md  DESIGN_TOKENS.md
//   .plan/ARCHITECTURE.md  RISK_MATRIX.md  EXECUTIVE_SUMMARY.md  FEATURES.md
//
// The CLAUDE.md generator should distill those into a cheat sheet rather than
// re-scanning the project directly. This module loads the files and exposes
// helpers that extract specific sections with resilient markdown parsing.

import * as fs from 'fs';
import * as path from 'path';

export interface PlanDocs {
  stack?: string;
  schema?: string;
  apiMap?: string;
  tokens?: string;
  architecture?: string;
  riskMatrix?: string;
  executiveSummary?: string;
  features?: string;
  /** Step 13: prioritized action items synthesized from all earlier docs. */
  hardening?: string;
}

/** Map of .plan filenames to PlanDocs field names. */
const PLAN_FILES: Array<[string, keyof PlanDocs]> = [
  ['STACK.md', 'stack'],
  ['SCHEMA.md', 'schema'],
  ['API_MAP.md', 'apiMap'],
  ['DESIGN_TOKENS.md', 'tokens'],
  ['ARCHITECTURE.md', 'architecture'],
  ['RISK_MATRIX.md', 'riskMatrix'],
  ['EXECUTIVE_SUMMARY.md', 'executiveSummary'],
  ['FEATURES.md', 'features'],
  ['HARDENING.md', 'hardening'],
];

/**
 * Reads every known .plan/*.md document from the project root.
 * Missing files simply stay undefined — all downstream extractors tolerate that.
 */
export function loadPlanDocs(projectRoot: string): PlanDocs {
  const docs: PlanDocs = {};
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) return docs;

  for (const [fileName, key] of PLAN_FILES) {
    const filePath = path.join(planDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    try {
      docs[key] = fs.readFileSync(filePath, 'utf-8');
    } catch {
      // Best effort — corrupt files are skipped, not thrown
    }
  }
  return docs;
}

/** Returns true if at least one plan doc was loaded. */
export function hasPlanDocs(docs: PlanDocs): boolean {
  return Object.values(docs).some(v => v !== undefined);
}

/**
 * Extracts a section from markdown by heading text.
 *
 * Matches any heading level (#, ##, ###) with the given text (case-insensitive,
 * substring match so "Tech Stack" also matches "## Tech Stack & Dependencies").
 * Returns the content between that heading and the next heading of the same
 * or higher level, trimmed. Returns null if no matching heading is found.
 */
export function extractSection(markdown: string, headingSubstring: string): string | null {
  const lines = markdown.split('\n');
  const target = headingSubstring.toLowerCase();

  let startLine = -1;
  let startLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i]!);
    if (!m) continue;
    const heading = m[2]!.toLowerCase();
    if (heading.includes(target)) {
      startLine = i;
      startLevel = m[1]!.length;
      break;
    }
  }

  if (startLine === -1) return null;

  // Collect lines until next heading of same or higher level
  const out: string[] = [];
  for (let i = startLine + 1; i < lines.length; i++) {
    const m = /^(#{1,6})\s+/.exec(lines[i]!);
    if (m && m[1]!.length <= startLevel) break;
    out.push(lines[i]!);
  }

  return out.join('\n').trim() || null;
}

/**
 * Extracts the first N bullet list items from a markdown section.
 * Handles `-`, `*`, `+`, and numbered list markers. Returns cleaned item text.
 * Used to limit noisy lists to a cheat-sheet-sized handful.
 */
export function extractBullets(markdown: string, max = 10): string[] {
  const items: string[] = [];
  for (const line of markdown.split('\n')) {
    const m = /^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/.exec(line);
    if (m && m[1]!.trim()) {
      items.push(m[1]!.trim());
      if (items.length >= max) break;
    }
  }
  return items;
}

/**
 * Extracts the first N markdown table rows from a section.
 * Returns raw row strings including the separator row so the caller can
 * reuse them directly in the final markdown.
 */
export function extractTableRows(markdown: string, maxDataRows = 12): string[] {
  const lines = markdown.split('\n');
  const rows: string[] = [];
  let inTable = false;
  let dataRowsCollected = 0;

  for (const line of lines) {
    const isRow = /^\s*\|.+\|\s*$/.test(line);
    const isSeparator = /^\s*\|[\s|:-]+\|\s*$/.test(line);

    if (isRow) {
      if (!inTable) inTable = true;
      if (isSeparator) {
        rows.push(line.trim());
      } else {
        if (dataRowsCollected >= maxDataRows) break;
        rows.push(line.trim());
        dataRowsCollected++;
      }
    } else if (inTable && line.trim() === '') {
      // Blank line inside table block is tolerated but ends the table
      break;
    } else if (inTable) {
      break;
    }
  }

  return rows;
}

/**
 * Extracts a short paragraph (up to maxChars) from the start of a section.
 * Used to pull a concise summary from executive summary style docs.
 */
export function extractLeadParagraph(markdown: string, maxChars = 400): string | null {
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('```'));
  if (paragraphs.length === 0) return null;
  const first = paragraphs[0]!;
  if (first.length <= maxChars) return first;
  const truncated = first.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxChars * 0.7 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Extracts inline code spans that look like shell commands from a section.
 * Returns unique commands in document order.
 */
export function extractCommands(markdown: string, maxCommands = 6): string[] {
  const commands: string[] = [];
  const seen = new Set<string>();
  const codeSpans = markdown.match(/`([^`\n]+)`/g) ?? [];
  for (const span of codeSpans) {
    const cmd = span.slice(1, -1).trim();
    if (!cmd) continue;
    // Heuristic: commands contain a space or start with recognized runners
    const looksLikeCommand =
      /\s/.test(cmd) && /^(npm|pnpm|yarn|bun|npx|node|deno|tsx|vitest|jest|eslint|prettier|next|vite|supabase|prisma|drizzle|make|cargo|python|pytest|pip)\b/.test(cmd);
    if (!looksLikeCommand) continue;
    if (seen.has(cmd)) continue;
    seen.add(cmd);
    commands.push(cmd);
    if (commands.length >= maxCommands) break;
  }
  return commands;
}
