import type { SheepConfig, DetectedStack, QAPlanEntry } from './types.js';
/**
 * Detects the tech stack from project files.
 */
export declare function detectStack(projectRoot: string): DetectedStack;
/**
 * Finds the build command from package.json scripts.
 */
export declare function findBuildCommand(projectRoot: string): string | null;
/**
 * Finds the test command from package.json scripts.
 */
export declare function findTestCommand(projectRoot: string): string | null;
/**
 * Reads .preflight/report.json if it exists. Returns null if missing or invalid.
 */
export declare function readPreflightReport(projectRoot: string): PreflightFindings | null;
interface PreflightFindings {
    flaggedFiles: Set<string>;
    failingChecks: Set<string>;
    hasCritical: boolean;
}
/**
 * Identifies high-risk areas in the codebase for the QA plan.
 * If .preflight/report.json exists, uses it to boost areas with known issues
 * and deprioritize areas preflight found clean.
 */
export declare function identifyHighRiskAreas(projectRoot: string): QAPlanEntry[];
/**
 * Generates a complete SheepConfig from auto-detection.
 */
export declare function autoConfig(projectRoot: string): SheepConfig;
/**
 * Generates the QA plan as markdown.
 */
export declare function generateQAPlan(config: SheepConfig): string;
export {};
