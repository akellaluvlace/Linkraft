import type { ClaudeMdConfig } from './types.js';
/**
 * Scans a project and builds the config needed to generate CLAUDE.md.
 */
export declare function scanProject(projectRoot: string): ClaudeMdConfig;
/**
 * Generates a complete CLAUDE.md from a scanned project config.
 */
export declare function generateClaudeMd(config: ClaudeMdConfig): string;
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
 * Full pipeline: scan + generate + write (or detect existing for merge).
 */
export declare function generateAndWriteClaudeMd(projectRoot: string): {
    path: string;
    content: string;
    mergedContent: string;
    existed: boolean;
    hasChanges: boolean;
    newSections: string[];
    updatedSections: string[];
};
