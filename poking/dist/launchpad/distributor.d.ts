import type { LaunchBrief, DistributionDraft } from './types.js';
/**
 * Generates distribution drafts for all platforms.
 */
export declare function generateAllDrafts(brief: LaunchBrief): DistributionDraft[];
/**
 * Generates a draft for a specific platform.
 */
export declare function generateDraft(brief: LaunchBrief, platform: string): DistributionDraft | null;
/**
 * Writes all drafts to .launchpad/distribution/ directory.
 */
export declare function writeDrafts(projectRoot: string, drafts: DistributionDraft[]): string[];
