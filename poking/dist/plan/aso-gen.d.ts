export interface AsoContext {
    appName: string;
    appDescription: string;
    bundleId: string | null;
    appCategory: string | null;
    platforms: string[];
    existingKeywords: string[];
}
export declare function collectAsoContext(projectRoot: string): AsoContext;
export declare function generateAsoTemplate(ctx: AsoContext): string;
export declare function writeAso(projectRoot: string, content: string): string;
