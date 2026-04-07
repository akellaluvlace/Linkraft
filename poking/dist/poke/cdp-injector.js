"use strict";
// CDP Injector: injects the poke overlay into a browser page via Chrome DevTools Protocol.
// Uses chrome-devtools-mcp's evaluate_script tool to inject and poll.
// This is the primary injection path. No VS Code extension. No manual script tags.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverlayScript = getOverlayScript;
exports.generateInjectionCode = generateInjectionCode;
exports.generatePollCode = generatePollCode;
exports.generateEnableCode = generateEnableCode;
exports.generateDisableCode = generateDisableCode;
exports.generateRemoveCode = generateRemoveCode;
exports.generatePersistenceCode = generatePersistenceCode;
exports.parsePollResult = parsePollResult;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Reads the built overlay.js bundle as a string for injection.
 */
function getOverlayScript(pluginRoot) {
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
function generateInjectionCode(overlayScript) {
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
function generatePollCode() {
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
function generateEnableCode() {
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
function generateDisableCode() {
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
function generateRemoveCode() {
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
function generatePersistenceCode(overlayScript) {
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
function parsePollResult(result) {
    if (!result || result === 'null')
        return null;
    try {
        return JSON.parse(result);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=cdp-injector.js.map