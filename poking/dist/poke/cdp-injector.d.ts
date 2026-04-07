import type { PokeContext } from '../shared/types.js';
/**
 * Reads the built overlay.js bundle as a string for injection.
 */
export declare function getOverlayScript(pluginRoot: string): string;
/**
 * Generates the JavaScript code to inject the overlay into a page.
 * The overlay stores selected elements on window.__POKE_SELECTED__.
 */
export declare function generateInjectionCode(overlayScript: string): string;
/**
 * Generates the JavaScript code to read and clear the selected element.
 */
export declare function generatePollCode(): string;
/**
 * Generates code to enable poke mode (if overlay is already injected).
 */
export declare function generateEnableCode(): string;
/**
 * Generates code to disable poke mode.
 */
export declare function generateDisableCode(): string;
/**
 * Generates code to remove the overlay entirely.
 */
export declare function generateRemoveCode(): string;
/**
 * Generates a persistence script that re-injects the overlay after hot reload.
 * Uses a MutationObserver to detect when the body is replaced.
 */
export declare function generatePersistenceCode(overlayScript: string): string;
/**
 * Parses a poll result into a PokeContext or null.
 */
export declare function parsePollResult(result: string | null): PokeContext | null;
