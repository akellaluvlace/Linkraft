export interface RiskMatrixContext {
    projectName: string;
    architectureContent: string | null;
    competitorContent: string | null;
    executiveSummaryContent: string | null;
    extractedRisks: ExtractedRisk[];
}
export interface ExtractedRisk {
    description: string;
    source: string;
    suggestedSeverity: string;
}
export declare function collectRiskMatrixContext(projectRoot: string): RiskMatrixContext;
export declare function generateRiskMatrixTemplate(ctx: RiskMatrixContext): string;
export declare function writeRiskMatrix(projectRoot: string, content: string): string;
