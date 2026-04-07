export interface SlopViolation {
    file: string;
    line: number;
    pattern: string;
    context: string;
    suggestion: string;
}
/**
 * Scans file content for forbidden pattern violations.
 * Returns detailed violation info with suggestions for fixes.
 */
export declare function detectViolations(filePath: string, content: string, forbiddenPatterns: string[]): SlopViolation[];
export interface SlopReport {
    totalViolations: number;
    fileCount: number;
    byPattern: Record<string, number>;
    byFile: Record<string, number>;
    violations: SlopViolation[];
}
/**
 * Generates a summary report from a list of violations.
 */
export declare function generateSlopReport(violations: SlopViolation[]): SlopReport;
/**
 * Formats a slop report as a human-readable string for Claude to present.
 */
export declare function formatSlopReport(report: SlopReport): string;
