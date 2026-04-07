"use strict";
// Overlay auto-injector: detects dev server framework and generates injection configs.
// Three tiers per Zero-Friction Doctrine:
// 1. Dev middleware (Claude adds one line to your config)
// 2. Bookmarklet (drag to bookmarks bar, click on any localhost page)
// 3. Screenshot-only (absolute fallback, no injection needed)
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
exports.detectFramework = detectFramework;
exports.generateBookmarklet = generateBookmarklet;
exports.generateInjection = generateInjection;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects the dev server framework from package.json and config files.
 */
function detectFramework(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath))
        return 'unknown';
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = {
            ...pkg['dependencies'],
            ...pkg['devDependencies'],
        };
        // Check config files first (more specific)
        if (fs.existsSync(path.join(projectRoot, 'vite.config.ts')) ||
            fs.existsSync(path.join(projectRoot, 'vite.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'vite.config.mts'))) {
            return 'vite';
        }
        if (fs.existsSync(path.join(projectRoot, 'next.config.ts')) ||
            fs.existsSync(path.join(projectRoot, 'next.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'next.config.mjs'))) {
            return 'nextjs';
        }
        if (fs.existsSync(path.join(projectRoot, 'webpack.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'webpack.config.ts'))) {
            return 'webpack';
        }
        // Fallback to dependency check
        if (deps['vite'])
            return 'vite';
        if (deps['next'])
            return 'nextjs';
        if (deps['react-scripts'])
            return 'cra';
        if (deps['webpack'])
            return 'webpack';
        return 'unknown';
    }
    catch {
        return 'unknown';
    }
}
/**
 * Generates a Vite plugin snippet that auto-injects the overlay in dev mode.
 */
function generateVitePlugin(overlayPath) {
    return `// Add to your vite.config.ts plugins array (dev only):
{
  name: 'poke-overlay',
  transformIndexHtml(html) {
    if (process.env.NODE_ENV === 'production') return html;
    return html.replace(
      '</body>',
      \`<script src="${overlayPath}"></script>
<script>window.PokeOverlay && PokeOverlay.init();</script>
</body>\`
    );
  }
}`;
}
/**
 * Generates a Next.js script component snippet for overlay injection.
 */
function generateNextjsSnippet(overlayPath) {
    return `// Add to your app/layout.tsx (or pages/_app.tsx):
// Only loads in development
{process.env.NODE_ENV === 'development' && (
  <>
    <script src="${overlayPath}" />
    <script dangerouslySetInnerHTML={{ __html: 'window.PokeOverlay && PokeOverlay.init();' }} />
  </>
)}`;
}
/**
 * Generates a bookmarklet that loads and initializes the overlay.
 * Works on ANY localhost page regardless of framework.
 */
function generateBookmarklet(overlayUrl) {
    const code = `(function(){if(window.PokeOverlay){PokeOverlay.enablePokeMode();return;}var s=document.createElement('script');s.src='${overlayUrl}';s.onload=function(){PokeOverlay.init();PokeOverlay.enablePokeMode();};document.body.appendChild(s);})()`;
    return `javascript:${encodeURIComponent(code)}`;
}
/**
 * Resolves the overlay path for injection.
 * Returns a file:// URL or a relative path depending on context.
 */
function resolveOverlayPath(pluginRoot) {
    const overlayPath = path.join(pluginRoot, 'dist', 'overlay.js');
    // Use file:// protocol for local development
    return `file:///${overlayPath.replace(/\\/g, '/')}`;
}
/**
 * Generates the best injection approach for the detected framework.
 */
function generateInjection(projectRoot, pluginRoot) {
    const framework = detectFramework(projectRoot);
    const overlayPath = resolveOverlayPath(pluginRoot);
    const bookmarklet = generateBookmarklet(overlayPath);
    if (framework === 'vite') {
        const configPatch = generateVitePlugin(overlayPath);
        return {
            method: 'middleware',
            framework,
            instructions: [
                'I can add the poke overlay to your Vite config. One plugin, dev-only.',
                'It injects a small script (11KB) that enables element selection.',
                'Automatically stripped in production builds.',
                '',
                'Want me to add it to your vite.config.ts?',
                '',
                'Alternative: drag this bookmarklet to your bookmarks bar:',
                bookmarklet,
            ].join('\n'),
            configPatch,
            bookmarklet,
        };
    }
    if (framework === 'nextjs') {
        const configPatch = generateNextjsSnippet(overlayPath);
        return {
            method: 'middleware',
            framework,
            instructions: [
                'I can add the poke overlay to your Next.js layout. Dev-only, two lines.',
                'It loads a small script (11KB) that enables element selection.',
                'Only renders in development mode.',
                '',
                'Want me to add it to your app/layout.tsx?',
                '',
                'Alternative: drag this bookmarklet to your bookmarks bar:',
                bookmarklet,
            ].join('\n'),
            configPatch,
            bookmarklet,
        };
    }
    // For unknown frameworks or webpack/CRA, offer bookmarklet as primary
    return {
        method: 'bookmarklet',
        framework,
        instructions: [
            'Drag this bookmarklet to your bookmarks bar, then click it on any localhost page:',
            '',
            bookmarklet,
            '',
            'It loads a small script (11KB) that enables element selection.',
            'Works on any framework, any page, any dev server.',
            'Click it again to re-enable if you navigate to a new page.',
        ].join('\n'),
        configPatch: null,
        bookmarklet,
    };
}
//# sourceMappingURL=injector.js.map