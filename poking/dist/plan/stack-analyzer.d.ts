import type { DetectedProjectStack, CodeConventions } from './types.js';
/**
 * Detects the full project stack from package.json, config files, and code patterns.
 */
export declare function analyzeStack(projectRoot: string): DetectedProjectStack;
/**
 * Detects coding conventions from existing source files.
 */
export declare function detectConventions(projectRoot: string): CodeConventions;
