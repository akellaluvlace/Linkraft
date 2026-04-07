export interface CompetitorContext {
    projectName: string;
    projectDescription: string;
    category: string;
    techStack: string[];
    keywords: string[];
}
export declare function collectCompetitorContext(projectRoot: string): CompetitorContext;
export declare function generateCompetitorTemplate(ctx: CompetitorContext): string;
export declare function writeCompetitors(projectRoot: string, content: string): string;
