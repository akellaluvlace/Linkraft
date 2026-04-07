import type { TestResults } from './types.js';
/**
 * Runs all quality checks on a landing page.
 * Always returns actionable feedback regardless of available tools.
 */
export declare function runTests(pageUrl: string, projectRoot?: string): Promise<TestResults>;
/**
 * Formats test results as a readable string.
 */
export declare function formatTestResults(results: TestResults): string;
