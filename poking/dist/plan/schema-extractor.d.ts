import type { SchemaTable } from './types.js';
/**
 * Detects and extracts database schema from the project.
 */
export declare function extractSchema(projectRoot: string): {
    tables: SchemaTable[];
    source: string;
} | null;
/**
 * Generates SCHEMA.md content from extracted tables.
 */
export declare function formatSchema(tables: SchemaTable[], source: string): string;
