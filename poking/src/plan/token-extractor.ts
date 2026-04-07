// Design Token Extractor: reads tailwind.config, theme files, CSS variables.
// Outputs DESIGN_TOKENS.md in a format Forge can consume.

import * as fs from 'fs';
import * as path from 'path';
import type { DesignTokens } from './types.js';
import { extractTokens } from '../forge/token-editor.js';

/**
 * Extracts design tokens from the project's config files.
 */
export function extractDesignTokens(projectRoot: string): DesignTokens | null {
  // Try tailwind.config
  for (const configFile of ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs']) {
    const configPath = path.join(projectRoot, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const tokens = extractTokens(content);
      return {
        colors: tokens.colors,
        typography: tokens.fontFamily,
        spacing: tokens.spacing,
        radii: tokens.borderRadius,
        shadows: tokens.boxShadow,
      };
    }
  }

  // Try CSS custom properties in globals.css
  for (const cssFile of ['src/app/globals.css', 'app/globals.css', 'src/styles/globals.css', 'styles/globals.css']) {
    const cssPath = path.join(projectRoot, cssFile);
    if (fs.existsSync(cssPath)) {
      const content = fs.readFileSync(cssPath, 'utf-8');
      const tokens = extractCssVariables(content);
      if (Object.keys(tokens.colors).length > 0) return tokens;
    }
  }

  return null;
}

/**
 * Generates DESIGN_TOKENS.md from extracted tokens.
 */
export function formatDesignTokens(tokens: DesignTokens): string {
  const lines = ['# Design Tokens', ''];

  if (Object.keys(tokens.colors).length > 0) {
    lines.push('## Colors', '');
    lines.push('| Token | Value |');
    lines.push('|-------|-------|');
    for (const [k, v] of Object.entries(tokens.colors)) lines.push(`| ${k} | ${v} |`);
    lines.push('');
  }

  if (Object.keys(tokens.typography).length > 0) {
    lines.push('## Typography', '');
    lines.push('| Role | Value |');
    lines.push('|------|-------|');
    for (const [k, v] of Object.entries(tokens.typography)) lines.push(`| ${k} | ${v} |`);
    lines.push('');
  }

  if (Object.keys(tokens.spacing).length > 0) {
    lines.push('## Spacing', '');
    for (const [k, v] of Object.entries(tokens.spacing)) lines.push(`- ${k}: ${v}`);
    lines.push('');
  }

  if (Object.keys(tokens.radii).length > 0) {
    lines.push('## Border Radius', '');
    for (const [k, v] of Object.entries(tokens.radii)) lines.push(`- ${k}: ${v}`);
    lines.push('');
  }

  if (Object.keys(tokens.shadows).length > 0) {
    lines.push('## Shadows', '');
    for (const [k, v] of Object.entries(tokens.shadows)) lines.push(`- ${k}: ${v}`);
    lines.push('');
  }

  return lines.join('\n');
}

function extractCssVariables(css: string): DesignTokens {
  const tokens: DesignTokens = { colors: {}, typography: {}, spacing: {}, radii: {}, shadows: {} };
  const varRe = /--([a-z][a-z0-9-]*)\s*:\s*([^;]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = varRe.exec(css)) !== null) {
    const name = match[1]!;
    const value = match[2]!.trim();

    if (name.includes('color') || name.includes('bg') || name.includes('foreground') || name.includes('background')) {
      tokens.colors[name] = value;
    } else if (name.includes('font') || name.includes('text')) {
      tokens.typography[name] = value;
    } else if (name.includes('radius')) {
      tokens.radii[name] = value;
    } else if (name.includes('shadow')) {
      tokens.shadows[name] = value;
    } else if (name.includes('spacing') || name.includes('gap')) {
      tokens.spacing[name] = value;
    }
  }

  return tokens;
}
