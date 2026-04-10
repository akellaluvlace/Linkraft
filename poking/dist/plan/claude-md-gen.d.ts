import type { ClaudeMdConfig } from './types.js';
import { type PlanDocs } from './plan-reader.js';
/**
 * Scans a project and builds the config needed to generate CLAUDE.md.
 */
export declare function scanProject(projectRoot: string): ClaudeMdConfig;
/**
 * Generates a complete CLAUDE.md from a scanned project config.
 */
export declare function generateClaudeMd(config: ClaudeMdConfig): string;
/**
 * Generates a CLAUDE.md by distilling the .plan/*.md documents.
 *
 * This is the preferred path when the full /linkraft plan pipeline has run
 * and produced the research + analysis outputs. The resulting CLAUDE.md is a
 * cheat sheet (~2000-3000 tokens) — not a copy of the plan docs. Sections are
 * intentionally short bullet lists so future Claude sessions can load the
 * whole file into context cheaply.
 *
 * Unknown or missing docs are tolerated — each section is emitted only when
 * the corresponding source is available and parseable.
 */
export declare function generateClaudeMdFromPlan(projectRoot: string, docs: PlanDocs): string;
/**
 * Compares generated CLAUDE.md with existing one.
 */
export declare function diffClaudeMd(existing: string, generated: string): {
    newSections: string[];
    updatedSections: string[];
    mergedContent: string;
};
/**
 * Writes CLAUDE.md to the project root.
 */
export declare function writeClaudeMd(projectRoot: string, content: string): string;
/**
 * Full pipeline: generate CLAUDE.md and write it (or detect existing for merge).
 *
 * PRIMARY PATH: if `.plan/*.md` documents are present (produced by steps 1-12
 * of /linkraft plan), distill them into the CLAUDE.md. This gives the user a
 * cheat sheet synthesized from the full research + analysis pipeline.
 *
 * FALLBACK PATH: if no `.plan/` docs exist (e.g. user ran `plan claude-md`
 * standalone), scan the project directly and build CLAUDE.md from that.
 *
 * The return shape now includes a `source` field so callers can surface
 * whether the plan-aware or direct-scan path was used.
 */
export declare function generateAndWriteClaudeMd(projectRoot: string): {
    path: string;
    content: string;
    mergedContent: string;
    existed: boolean;
    hasChanges: boolean;
    newSections: string[];
    updatedSections: string[];
    source: 'plan' | 'scan';
};
