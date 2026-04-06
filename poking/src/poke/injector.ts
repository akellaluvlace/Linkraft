// Overlay auto-injector: detects dev server framework and generates injection configs.
// Three tiers per Zero-Friction Doctrine:
// 1. Dev middleware (Claude adds one line to your config)
// 2. Bookmarklet (drag to bookmarks bar, click on any localhost page)
// 3. Screenshot-only (absolute fallback, no injection needed)

import * as fs from 'fs';
import * as path from 'path';

export type Framework = 'vite' | 'nextjs' | 'webpack' | 'cra' | 'unknown';

export interface InjectionResult {
  method: 'middleware' | 'bookmarklet' | 'screenshot';
  framework: Framework;
  instructions: string;
  configPatch: string | null;
  bookmarklet: string | null;
}

/**
 * Detects the dev server framework from package.json and config files.
 */
export function detectFramework(projectRoot: string): Framework {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return 'unknown';

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const deps = {
      ...(pkg['dependencies'] as Record<string, string> | undefined),
      ...(pkg['devDependencies'] as Record<string, string> | undefined),
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
    if (deps['vite']) return 'vite';
    if (deps['next']) return 'nextjs';
    if (deps['react-scripts']) return 'cra';
    if (deps['webpack']) return 'webpack';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Generates a Vite plugin snippet that auto-injects the overlay in dev mode.
 */
function generateVitePlugin(overlayPath: string): string {
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
function generateNextjsSnippet(overlayPath: string): string {
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
export function generateBookmarklet(overlayUrl: string): string {
  const code = `(function(){if(window.PokeOverlay){PokeOverlay.enablePokeMode();return;}var s=document.createElement('script');s.src='${overlayUrl}';s.onload=function(){PokeOverlay.init();PokeOverlay.enablePokeMode();};document.body.appendChild(s);})()`;
  return `javascript:${encodeURIComponent(code)}`;
}

/**
 * Resolves the overlay path for injection.
 * Returns a file:// URL or a relative path depending on context.
 */
function resolveOverlayPath(pluginRoot: string): string {
  const overlayPath = path.join(pluginRoot, 'dist', 'overlay.js');
  // Use file:// protocol for local development
  return `file:///${overlayPath.replace(/\\/g, '/')}`;
}

/**
 * Generates the best injection approach for the detected framework.
 */
export function generateInjection(projectRoot: string, pluginRoot: string): InjectionResult {
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
