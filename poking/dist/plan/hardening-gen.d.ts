import { type PlanDocs } from './plan-reader.js';
export type HardeningPriority = 'must-fix' | 'should-fix' | 'nice-to-have';
export type HardeningCategory = 'security' | 'data' | 'architecture' | 'schema' | 'api' | 'design' | 'performance' | 'ux' | 'feature' | 'general';
export interface HardeningItem {
    priority: HardeningPriority;
    category: HardeningCategory;
    description: string;
    source: string;
    effort: 'S' | 'M' | 'L';
}
export interface HardeningReport {
    generated: string;
    projectName: string;
    totalItems: number;
    mustFix: HardeningItem[];
    shouldFix: HardeningItem[];
    niceToHave: HardeningItem[];
}
/** Classifies an action item by category based on its description text. */
export declare function categorize(text: string): HardeningCategory;
/** Security or data issues are always must-fix regardless of their source bucket. */
export declare function isLaunchBlocker(text: string): boolean;
/** Rough effort estimate from description length + keywords. */
export declare function estimateEffort(text: string): 'S' | 'M' | 'L';
/**
 * Assembles a HardeningReport from loaded plan docs. Deterministic: same
 * input produces the same report.
 */
export declare function extractHardeningItems(docs: PlanDocs): Omit<HardeningReport, 'generated' | 'projectName'>;
/** Formats a HardeningReport as markdown. */
export declare function formatHardeningMd(report: HardeningReport): string;
/**
 * Full pipeline: load plan docs, extract items, format markdown, return both
 * the content and the report data. Returns null if no .plan/ docs exist.
 */
export declare function generateHardeningMd(projectRoot: string): {
    content: string;
    report: HardeningReport;
} | null;
/** Writes HARDENING.md to .plan/. Creates .plan/ if missing. */
export declare function writeHardeningMd(projectRoot: string, content: string): string;
/**
 * Parses a HARDENING.md back into structured items. Used by the CLAUDE.md
 * generator to surface the top N action items in the Known Issues section.
 * Returns empty arrays if the file does not exist or can't be parsed.
 */
export declare function parseHardeningMd(projectRoot: string): Omit<HardeningReport, 'generated' | 'projectName'>;
/**
 * Returns the top N items from a hardening report, must-fix first, then
 * should-fix, then nice-to-have. Used by CLAUDE.md to surface priorities.
 */
export declare function topHardeningItems(report: Pick<HardeningReport, 'mustFix' | 'shouldFix' | 'niceToHave'>, limit?: number): HardeningItem[];
