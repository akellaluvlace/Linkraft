export interface ExecutiveSummaryContext {
    projectName: string;
    projectDescription: string;
    planFiles: {
        name: string;
        content: string;
    }[];
    hasCompetitors: boolean;
    hasArchitecture: boolean;
    hasSchema: boolean;
    hasApiMap: boolean;
}
export declare function collectExecutiveSummaryContext(projectRoot: string): ExecutiveSummaryContext;
export declare function generateExecutiveSummaryTemplate(ctx: ExecutiveSummaryContext): string;
export declare function writeExecutiveSummary(projectRoot: string, content: string): string;
