export type OvernightMode = 'dreamroll' | 'sheep';
export interface OvernightScript {
    path: string;
    platform: 'windows' | 'unix';
    content: string;
}
/**
 * Writes the overnight script for the current OS into the mode's state dir.
 * Makes the Unix version executable. Returns the script path and content.
 */
export declare function writeOvernightScript(projectRoot: string, mode: OvernightMode): OvernightScript;
/**
 * Returns the human-readable run instructions for a generated script.
 */
export declare function overnightInstructions(script: OvernightScript, mode: OvernightMode): string;
