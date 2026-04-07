export interface ExtractedTokens {
    colors: Record<string, string>;
    fontFamily: Record<string, string>;
    fontWeight: Record<string, string>;
    spacing: Record<string, string>;
    borderRadius: Record<string, string>;
    borderWidth: Record<string, string>;
    boxShadow: Record<string, string>;
    raw: string;
}
/**
 * Extracts design tokens from a Tailwind config file content string.
 * Handles nested `theme.extend` structures at any depth.
 */
export declare function extractTokens(configContent: string): ExtractedTokens;
/**
 * Updates a single token value in a Tailwind config string.
 * Returns the modified config content.
 *
 * @param configContent - The full tailwind config file as a string
 * @param section - The token section (e.g., 'colors', 'fontFamily')
 * @param key - The key within the section (e.g., 'primary')
 * @param newValue - The new value to set
 * @returns Updated config content, or original if key not found
 */
export declare function updateToken(configContent: string, section: string, key: string, newValue: string): string;
/**
 * Generates a Tailwind config extend block from extracted tokens.
 * Useful for creating a config snippet from a preset's token changes.
 */
export declare function generateConfigSnippet(tokens: Partial<ExtractedTokens>): string;
