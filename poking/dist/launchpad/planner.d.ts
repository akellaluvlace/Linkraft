import type { LaunchBrief, PageCopy, Wireframe, SEOConfig } from './types.js';
/**
 * Creates the planning directory structure.
 */
export declare function initPlanningDir(projectRoot: string): string;
/**
 * Generates a brief document from the product description.
 */
export declare function generateBrief(brief: LaunchBrief): string;
/**
 * Generates a default wireframe for a landing page.
 */
export declare function generateDefaultWireframe(): Wireframe;
/**
 * Generates default SEO configuration from brief.
 */
export declare function generateSEOConfig(brief: LaunchBrief): SEOConfig;
/**
 * Generates default page copy structure from brief.
 */
export declare function generateDefaultCopy(brief: LaunchBrief): PageCopy;
/**
 * Writes all planning files to the .launchpad directory.
 */
export declare function writePlanningFiles(projectRoot: string, brief: LaunchBrief): {
    dir: string;
    files: string[];
};
