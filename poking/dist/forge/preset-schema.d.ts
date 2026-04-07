export interface DesignPreset {
    name: string;
    id: string;
    author: string;
    description: string;
    tokens: DesignTokens;
    componentOverrides: Record<string, string>;
    forbiddenPatterns: string[];
    requiredFonts: string[];
    shadcnTheme: string | null;
}
export interface DesignTokens {
    colors: ColorTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    borders: BorderTokens;
    shadows: ShadowTokens;
    animations: AnimationTokens;
}
export interface ColorTokens {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    surface: string;
    [key: string]: string;
}
export interface TypographyRole {
    family: string;
    weight: string;
    transform?: string;
}
export interface TypographyTokens {
    heading: TypographyRole;
    body: TypographyRole;
    mono: TypographyRole;
    [key: string]: TypographyRole;
}
export interface SpacingTokens {
    unit: string;
    scale: number[];
}
export interface BorderTokens {
    width: string;
    style: string;
    color: string;
    radius: string;
}
export interface ShadowTokens {
    default: string;
    hover: string;
    [key: string]: string;
}
export interface AnimationTokens {
    style: string;
    hover: string;
    [key: string]: string;
}
export interface PresetValidationError {
    field: string;
    message: string;
}
/**
 * Validates a preset object. Returns an empty array if valid.
 */
export declare function validatePreset(data: unknown): PresetValidationError[];
/**
 * Loads and validates a preset from a parsed JSON object.
 * Returns the typed preset if valid, throws with details if invalid.
 */
export declare function parsePreset(data: unknown): DesignPreset;
