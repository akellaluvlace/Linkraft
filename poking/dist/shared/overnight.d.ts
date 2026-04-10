export type OvernightMode = 'dreamroll' | 'sheep';
export interface OvernightScript {
    path: string;
    platform: 'windows' | 'unix';
    content: string;
    /** One-line run command the user copies into a new terminal. */
    runCommand: string;
}
/**
 * Writes the overnight script into the project root. On Unix the script
 * is chmod +x. Returns the full path, content, and the single command the
 * user should run in a new terminal.
 */
export declare function writeOvernightScript(projectRoot: string, mode: OvernightMode): OvernightScript;
/**
 * Returns the human-readable run instructions for a generated script.
 */
export declare function overnightInstructions(script: OvernightScript, mode: OvernightMode): string;
