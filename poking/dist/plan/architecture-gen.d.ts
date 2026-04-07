export interface ArchitectureContext {
    projectName: string;
    directoryTree: string;
    dependencies: {
        name: string;
        purpose: string;
    }[];
    hasDocker: boolean;
    hasCICD: boolean;
    cicdPlatform: string | null;
    existingPlanFiles: {
        name: string;
        content: string;
    }[];
    entryPoints: string[];
    middlewareFiles: string[];
    configFiles: string[];
}
export declare function collectArchitectureContext(projectRoot: string): ArchitectureContext;
export declare function generateArchitectureTemplate(ctx: ArchitectureContext): string;
export declare function writeArchitecture(projectRoot: string, content: string): string;
