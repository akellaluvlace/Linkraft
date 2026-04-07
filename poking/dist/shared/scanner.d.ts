export interface ScanResult {
    file: string;
    line: number | null;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
}
/**
 * Walks a directory tree, calling callback on each file.
 * Skips node_modules, .git, dist, .next, .plan, .sheep.
 */
export declare function walkDir(dir: string, callback: (filePath: string) => void, depth?: number): void;
/**
 * Collects all source files from a project (ts, tsx, js, jsx).
 */
export declare function collectSourceFiles(projectRoot: string): string[];
/**
 * Reads a file safely. Returns null on error.
 */
export declare function readFileSafe(filePath: string): string | null;
/**
 * Finds files matching keywords in their path.
 */
export declare function findFilesByKeyword(projectRoot: string, keywords: string[]): string[];
/**
 * Scans file content for a regex pattern. Returns matches with line numbers.
 */
export declare function scanFileForPattern(filePath: string, pattern: RegExp, description: string, severity: ScanResult['severity'], category: string): ScanResult[];
/**
 * Reads package.json dependencies.
 */
export declare function readDeps(projectRoot: string): Record<string, string>;
/**
 * Checks if a route file has auth checks.
 */
export declare function hasAuthCheck(content: string): boolean;
/**
 * Checks if a route file has rate limiting.
 */
export declare function hasRateLimit(content: string): boolean;
