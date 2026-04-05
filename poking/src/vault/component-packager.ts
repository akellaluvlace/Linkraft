// Component Packager: extracts a component and its local dependencies
// into a self-contained vault package.

import * as path from 'path';
import type { VaultComponent } from './types.js';

export interface PackageInput {
  entryFile: string;
  entryContent: string;
  localFiles: Record<string, string>;
  author: string;
  description: string;
  framework: 'react' | 'vue' | 'svelte' | 'html';
  styling: 'tailwind' | 'css-modules' | 'css' | 'styled-components';
  tags: string[];
  designSystem: string | null;
}

// Matches import/require of local files (relative paths)
const LOCAL_IMPORT_RE = /(?:import|require)\s*\(?[^'"]*['"](\.[^'"]+)['"]\)?/g;

/**
 * Extracts local import paths from file content.
 */
export function extractLocalImports(content: string): string[] {
  const imports: string[] = [];
  const re = new RegExp(LOCAL_IMPORT_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }
  return imports;
}

/**
 * Extracts npm package imports from file content.
 */
export function extractNpmDependencies(content: string): string[] {
  const deps: string[] = [];
  const re = /(?:import|require)\s*\(?[^'"]*['"]([^./][^'"]*)['"]\)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match[1]) {
      // Extract package name (handle scoped packages like @scope/pkg)
      const pkg = match[1].startsWith('@')
        ? match[1].split('/').slice(0, 2).join('/')
        : match[1].split('/')[0]!;
      if (!deps.includes(pkg)) {
        deps.push(pkg);
      }
    }
  }
  return deps;
}

/**
 * Extracts prop types from a React component.
 * Simple regex-based extraction for TypeScript interfaces/types.
 */
export function extractProps(content: string): Record<string, string> {
  const props: Record<string, string> = {};

  // Match interface Props { ... } or type Props = { ... }
  const interfaceMatch = /(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?\{([^}]+)\}/s.exec(content);
  if (interfaceMatch?.[1]) {
    const body = interfaceMatch[1];
    const propRe = /(\w+)\s*[?]?\s*:\s*([^;,\n]+)/g;
    let propMatch: RegExpExecArray | null;
    while ((propMatch = propRe.exec(body)) !== null) {
      if (propMatch[1] && propMatch[2]) {
        props[propMatch[1]] = propMatch[2].trim();
      }
    }
  }

  return props;
}

/**
 * Resolves a relative import path to a key in localFiles.
 */
function resolveImportPath(importPath: string, baseDir: string, localFiles: Record<string, string>): string | null {
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
  const resolved = path.posix.resolve(baseDir, importPath);

  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (candidate in localFiles) return candidate;
  }

  return null;
}

/**
 * Packages a component and its local dependencies into a VaultComponent.
 */
export function packageComponent(input: PackageInput): VaultComponent {
  const code: Record<string, string> = {};
  const entryBasename = path.basename(input.entryFile);
  const entryDir = path.dirname(input.entryFile);

  // Add entry file
  code[entryBasename] = input.entryContent;

  // Resolve and include local dependencies
  const visited = new Set<string>([input.entryFile]);
  const queue = extractLocalImports(input.entryContent);

  while (queue.length > 0) {
    const importPath = queue.pop()!;
    const resolved = resolveImportPath(importPath, entryDir, input.localFiles);
    if (!resolved || visited.has(resolved)) continue;

    visited.add(resolved);
    const fileContent = input.localFiles[resolved];
    if (fileContent) {
      const relativeName = path.relative(entryDir, resolved) || path.basename(resolved);
      code[relativeName] = fileContent;
      queue.push(...extractLocalImports(fileContent));
    }
  }

  // Extract npm dependencies from all collected files
  const allContent = Object.values(code).join('\n');
  const dependencies = extractNpmDependencies(allContent);

  // Extract props from entry file
  const props = extractProps(input.entryContent);

  const now = new Date().toISOString();

  return {
    name: path.basename(input.entryFile, path.extname(input.entryFile)),
    author: input.author,
    description: input.description,
    framework: input.framework,
    styling: input.styling,
    tags: input.tags,
    designSystem: input.designSystem,
    code,
    preview: null,
    dependencies,
    props,
    downloads: 0,
    stars: 0,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  };
}
