// CDP Injector: injects the poke overlay into a browser page via Chrome DevTools Protocol.
// Uses chrome-devtools-mcp's evaluate_script tool to inject and poll.
// This is the primary injection path. No VS Code extension. No manual script tags.

import * as fs from 'fs';
import * as path from 'path';
import type { PokeContext } from '../shared/types.js';

/**
 * Reads the built overlay.js bundle as a string for injection.
 */
export function getOverlayScript(pluginRoot: string): string {
  const overlayPath = path.join(pluginRoot, 'dist', 'overlay.js');
  if (!fs.existsSync(overlayPath)) {
    throw new Error(`Overlay bundle not found at ${overlayPath}. Run 'npm run build' first.`);
  }
  return fs.readFileSync(overlayPath, 'utf-8');
}

/**
 * Generates the JavaScript code to inject the overlay into a page.
 * The overlay stores selected elements on window.__POKE_SELECTED__.
 */
export function generateInjectionCode(overlayScript: string): string {
  // Escape backticks and backslashes in the overlay for embedding in template literal
  const escaped = overlayScript
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
(function() {
  if (window.__POKE_OVERLAY__) return 'already_injected';

  // Inject the overlay script
  var script = document.createElement('script');
  script.textContent = \`${escaped}\`;
  document.head.appendChild(script);

  // Mark as injected
  window.__POKE_OVERLAY__ = true;

  // Initialize and enable poke mode
  if (typeof PokeOverlay !== 'undefined') {
    PokeOverlay.init();
    PokeOverlay.enablePokeMode();
  }

  return 'injected';
})()`;
}

/**
 * Generates the JavaScript code to read and clear the selected element.
 */
export function generatePollCode(): string {
  return `
(function() {
  var selected = window.__POKE_SELECTED__;
  if (selected) {
    window.__POKE_SELECTED__ = null;
    return JSON.stringify(selected);
  }
  return null;
})()`;
}

/**
 * Generates code to enable poke mode (if overlay is already injected).
 */
export function generateEnableCode(): string {
  return `
(function() {
  if (typeof PokeOverlay !== 'undefined') {
    PokeOverlay.enablePokeMode();
    return 'enabled';
  }
  return 'overlay_not_found';
})()`;
}

/**
 * Generates code to disable poke mode.
 */
export function generateDisableCode(): string {
  return `
(function() {
  if (typeof PokeOverlay !== 'undefined') {
    PokeOverlay.disablePokeMode();
    return 'disabled';
  }
  return 'overlay_not_found';
})()`;
}

/**
 * Generates code to remove the overlay entirely.
 */
export function generateRemoveCode(): string {
  return `
(function() {
  if (typeof PokeOverlay !== 'undefined') {
    PokeOverlay.disablePokeMode();
  }
  var host = document.getElementById('poke-overlay-root');
  if (host) host.remove();
  window.__POKE_OVERLAY__ = false;
  window.__POKE_SELECTED__ = null;
  return 'removed';
})()`;
}

/**
 * Generates a persistence script that re-injects the overlay after hot reload.
 * Uses a MutationObserver to detect when the body is replaced.
 */
export function generatePersistenceCode(overlayScript: string): string {
  const escaped = overlayScript
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
(function() {
  if (window.__POKE_PERSISTENCE__) return 'already_watching';

  window.__POKE_PERSISTENCE__ = true;

  var observer = new MutationObserver(function(mutations) {
    // Check if overlay root was removed (e.g., by hot reload)
    if (!document.getElementById('poke-overlay-root') && window.__POKE_OVERLAY__) {
      window.__POKE_OVERLAY__ = false;

      // Re-inject after a small delay to let the new DOM settle
      setTimeout(function() {
        var script = document.createElement('script');
        script.textContent = \`${escaped}\`;
        document.head.appendChild(script);
        window.__POKE_OVERLAY__ = true;
        if (typeof PokeOverlay !== 'undefined') {
          PokeOverlay.init();
          PokeOverlay.enablePokeMode();
        }
      }, 200);
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });
  return 'watching';
})()`;
}

/**
 * Parses a poll result into a PokeContext or null.
 */
export function parsePollResult(result: string | null): PokeContext | null {
  if (!result || result === 'null') return null;
  try {
    return JSON.parse(result) as PokeContext;
  } catch {
    return null;
  }
}
