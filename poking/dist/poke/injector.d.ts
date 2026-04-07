export type Framework = 'vite' | 'nextjs' | 'webpack' | 'cra' | 'unknown';
export interface InjectionResult {
    method: 'middleware' | 'bookmarklet' | 'screenshot';
    framework: Framework;
    instructions: string;
    configPatch: string | null;
    bookmarklet: string | null;
}
/**
 * Detects the dev server framework from package.json and config files.
 */
export declare function detectFramework(projectRoot: string): Framework;
/**
 * Generates a bookmarklet that loads and initializes the overlay.
 * Works on ANY localhost page regardless of framework.
 */
export declare function generateBookmarklet(overlayUrl: string): string;
/**
 * Generates the best injection approach for the detected framework.
 */
export declare function generateInjection(projectRoot: string, pluginRoot: string): InjectionResult;
