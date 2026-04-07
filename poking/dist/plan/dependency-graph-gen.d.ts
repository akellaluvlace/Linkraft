export interface DependencyGraphContext {
    projectName: string;
    executiveSummaryContent: string | null;
    riskMatrixContent: string | null;
    actionItems: ActionItem[];
}
export interface ActionItem {
    task: string;
    priority: string;
    source: string;
}
export declare function collectDependencyGraphContext(projectRoot: string): DependencyGraphContext;
export declare function generateDependencyGraphTemplate(ctx: DependencyGraphContext): string;
export declare function writeDependencyGraph(projectRoot: string, content: string): string;
