import type { DreamrollState, MorningReport } from './types.js';
/**
 * Generates a morning report from the current state.
 */
export declare function generateReport(state: DreamrollState): MorningReport;
/**
 * Formats the morning report as a readable markdown string.
 */
export declare function formatReport(report: MorningReport): string;
