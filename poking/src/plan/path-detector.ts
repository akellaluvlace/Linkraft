// Path Detector: decides how /linkraft plan should run.
//
// Path A — analytical: project exists (package.json present). Scan the code.
// Path B — generative: no package.json, but a rough idea .md is in the root.
//          Plan from the idea instead.
// Missing — neither. Caller should ask the user to create an idea .md.

import * as fs from 'fs';
import * as path from 'path';

export type PlanPath = 'a' | 'b' | 'missing';

export interface PlanPathDetection {
  path: PlanPath;
  /** For Path B: relative path to the idea .md file that was picked up. */
  ideaFile?: string;
  /** Human readable reason for the chosen path. */
  reason: string;
}

/**
 * Candidate filenames checked in order when looking for a Path B idea doc.
 * The first match wins, so more specific names come first. Anything else ending
 * in .md at the root is considered as a last resort, except the generic files
 * that would produce misleading plans (CHANGELOG, LICENSE, CONTRIBUTING).
 */
const IDEA_CANDIDATES = [
  'PLAN.md',
  'plan.md',
  'IDEA.md',
  'idea.md',
  'BRIEF.md',
  'brief.md',
  'SPEC.md',
  'spec.md',
  'PRD.md',
  'prd.md',
];

const IDEA_BLOCKLIST = new Set([
  'CHANGELOG.md',
  'LICENSE.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'AUTHORS.md',
  'MEMORY.md',
]);

/**
 * Decides whether to run /linkraft plan in Path A or Path B mode.
 *
 * Detection:
 *   1. package.json at root     -> Path A (existing project).
 *   2. A recognizable idea .md  -> Path B (new project from rough plan).
 *   3. Any other .md at root    -> Path B (fallback).
 *   4. Nothing                  -> missing (caller prompts user).
 *
 * CLAUDE.md is ignored as an idea source: it is generated output, not input.
 */
export function detectPlanPath(projectRoot: string): PlanPathDetection {
  if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    return { path: 'missing', reason: `projectRoot does not exist: ${projectRoot}` };
  }

  if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    return { path: 'a', reason: 'package.json found — treating as existing project.' };
  }

  const ideaFile = findIdeaFile(projectRoot);
  if (ideaFile) {
    return {
      path: 'b',
      ideaFile,
      reason: `no package.json — planning from rough idea in ${ideaFile}.`,
    };
  }

  return {
    path: 'missing',
    reason:
      'No project found. Create a .md file with your idea (e.g. PLAN.md, IDEA.md, BRIEF.md) and run /linkraft plan again.',
  };
}

/**
 * Finds an idea markdown file at the project root. Returns the relative
 * filename as it actually appears on disk, or undefined if nothing suitable
 * is present.
 *
 * Preference order:
 *   1. Any file whose name case-insensitively matches IDEA_CANDIDATES.
 *   2. README.md (many solo projects start here).
 *   3. The first other .md file at the root that is not in IDEA_BLOCKLIST
 *      and is not CLAUDE.md.
 *
 * We go through readdirSync rather than existsSync so the returned filename
 * matches actual disk casing on case-insensitive filesystems (Windows, macOS).
 */
export function findIdeaFile(projectRoot: string): string | undefined {
  let entries: string[];
  try {
    entries = fs.readdirSync(projectRoot);
  } catch {
    return undefined;
  }

  const mdEntries = entries.filter(e => e.toLowerCase().endsWith('.md'));
  const byLower = new Map<string, string>();
  for (const e of mdEntries) byLower.set(e.toLowerCase(), e);

  for (const candidate of IDEA_CANDIDATES) {
    const actual = byLower.get(candidate.toLowerCase());
    if (actual && isFile(projectRoot, actual)) return actual;
  }

  const readme = byLower.get('readme.md');
  if (readme && isFile(projectRoot, readme)) return readme;

  const blockLower = new Set(Array.from(IDEA_BLOCKLIST).map(n => n.toLowerCase()));
  for (const entry of mdEntries) {
    const lower = entry.toLowerCase();
    if (blockLower.has(lower)) continue;
    if (lower === 'claude.md') continue;
    if (isFile(projectRoot, entry)) return entry;
  }

  return undefined;
}

function isFile(projectRoot: string, entry: string): boolean {
  try {
    return fs.statSync(path.join(projectRoot, entry)).isFile();
  } catch {
    return false;
  }
}
