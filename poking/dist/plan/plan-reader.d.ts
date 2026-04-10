export interface PlanDocs {
    stack?: string;
    schema?: string;
    apiMap?: string;
    tokens?: string;
    architecture?: string;
    riskMatrix?: string;
    executiveSummary?: string;
    features?: string;
}
/**
 * Reads every known .plan/*.md document from the project root.
 * Missing files simply stay undefined — all downstream extractors tolerate that.
 */
export declare function loadPlanDocs(projectRoot: string): PlanDocs;
/** Returns true if at least one plan doc was loaded. */
export declare function hasPlanDocs(docs: PlanDocs): boolean;
/**
 * Extracts a section from markdown by heading text.
 *
 * Matches any heading level (#, ##, ###) with the given text (case-insensitive,
 * substring match so "Tech Stack" also matches "## Tech Stack & Dependencies").
 * Returns the content between that heading and the next heading of the same
 * or higher level, trimmed. Returns null if no matching heading is found.
 */
export declare function extractSection(markdown: string, headingSubstring: string): string | null;
/**
 * Extracts the first N bullet list items from a markdown section.
 * Handles `-`, `*`, `+`, and numbered list markers. Returns cleaned item text.
 * Used to limit noisy lists to a cheat-sheet-sized handful.
 */
export declare function extractBullets(markdown: string, max?: number): string[];
/**
 * Extracts the first N markdown table rows from a section.
 * Returns raw row strings including the separator row so the caller can
 * reuse them directly in the final markdown.
 */
export declare function extractTableRows(markdown: string, maxDataRows?: number): string[];
/**
 * Extracts a short paragraph (up to maxChars) from the start of a section.
 * Used to pull a concise summary from executive summary style docs.
 */
export declare function extractLeadParagraph(markdown: string, maxChars?: number): string | null;
/**
 * Extracts inline code spans that look like shell commands from a section.
 * Returns unique commands in document order.
 */
export declare function extractCommands(markdown: string, maxCommands?: number): string[];
