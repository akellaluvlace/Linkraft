import { DesignPreset } from './preset-schema.js';
export interface TailwindTokenChange {
    section: string;
    key: string;
    value: string;
}
export interface ClassReplacement {
    file: string;
    line: number;
    column: number;
    component: string;
    oldClasses: string;
    newClasses: string;
}
export interface ForbiddenViolation {
    file: string;
    line: number;
    pattern: string;
    context: string;
}
export interface PresetChangeset {
    presetId: string;
    presetName: string;
    tailwindChanges: TailwindTokenChange[];
    classReplacements: ClassReplacement[];
    forbiddenViolations: ForbiddenViolation[];
    fontsToInstall: string[];
    shadcnTheme: string | null;
}
/**
 * Generates the token changes needed to apply a preset to a Tailwind config.
 */
export declare function generateTailwindChanges(preset: DesignPreset): TailwindTokenChange[];
/**
 * Scans a file's content for components that match preset overrides.
 * Returns class replacements where the preset's override classes should be applied.
 */
export declare function scanFileForOverrides(filePath: string, content: string, preset: DesignPreset): ClassReplacement[];
/**
 * Scans file content for usage of forbidden patterns.
 */
export declare function scanForForbiddenPatterns(filePath: string, content: string, forbiddenPatterns: string[]): ForbiddenViolation[];
export interface ProjectFile {
    path: string;
    content: string;
}
/**
 * Generates a complete changeset for applying a preset to a set of project files.
 * This is the main entry point for the applicator.
 */
export declare function generateChangeset(preset: DesignPreset, projectFiles: ProjectFile[]): PresetChangeset;
