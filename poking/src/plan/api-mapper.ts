// API Mapper: scans for API routes, Edge Functions, server actions.
// Produces an API_MAP.md with endpoint table and security flags.

import * as fs from 'fs';
import * as path from 'path';
import type { ApiEndpoint } from './types.js';

/**
 * Scans the project for all API endpoints.
 */
export function mapApiEndpoints(projectRoot: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  // Next.js App Router API routes
  for (const base of ['src/app/api', 'app/api']) {
    const apiDir = path.join(projectRoot, base);
    if (fs.existsSync(apiDir)) {
      endpoints.push(...scanNextAppRoutes(apiDir, base, projectRoot));
    }
  }

  // Next.js Pages Router API routes
  for (const base of ['src/pages/api', 'pages/api']) {
    const apiDir = path.join(projectRoot, base);
    if (fs.existsSync(apiDir)) {
      endpoints.push(...scanNextPagesRoutes(apiDir, base, projectRoot));
    }
  }

  // Supabase Edge Functions
  const fnDir = path.join(projectRoot, 'supabase', 'functions');
  if (fs.existsSync(fnDir)) {
    endpoints.push(...scanEdgeFunctions(fnDir, projectRoot));
  }

  return endpoints;
}

/**
 * Generates API_MAP.md content from endpoints.
 */
export function formatApiMap(endpoints: ApiEndpoint[]): string {
  if (endpoints.length === 0) return '# API Map\n\nNo API endpoints detected.';

  const lines = ['# API Map', ''];

  // Group by type
  const edgeFns = endpoints.filter(e => e.file.includes('supabase/functions'));
  const apiRoutes = endpoints.filter(e => !e.file.includes('supabase/functions'));

  if (edgeFns.length > 0) {
    lines.push('## Edge Functions (Supabase)', '');
    lines.push('| Endpoint | Method | Auth | Purpose | File |');
    lines.push('|----------|--------|------|---------|------|');
    for (const e of edgeFns) lines.push(`| ${e.path} | ${e.method} | ${e.auth} | ${e.purpose} | ${e.file} |`);
    lines.push('');
  }

  if (apiRoutes.length > 0) {
    lines.push('## API Routes', '');
    lines.push('| Route | Method | Auth | Purpose | File |');
    lines.push('|-------|--------|------|---------|------|');
    for (const e of apiRoutes) lines.push(`| ${e.path} | ${e.method} | ${e.auth} | ${e.purpose} | ${e.file} |`);
    lines.push('');
  }

  // Flag unprotected endpoints
  const unprotected = endpoints.filter(e => e.auth === 'none');
  if (unprotected.length > 0) {
    lines.push('## Unprotected Endpoints', '');
    for (const e of unprotected) lines.push(`- ${e.method} ${e.path} (${e.file})`);
    lines.push('');
  }

  return lines.join('\n');
}

function scanNextAppRoutes(dir: string, _basePath: string, projectRoot: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  function walk(d: string, routePath: string): void {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full, `${routePath}/${entry.name}`);
        } else if (/^route\.(ts|js)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf-8');
          const methods = detectHttpMethods(content);
          const auth = detectAuth(content);
          const relPath = path.relative(projectRoot, full).replace(/\\/g, '/');

          for (const method of methods) {
            endpoints.push({
              path: `/api${routePath}`,
              method,
              auth,
              purpose: guessPurpose(routePath, method),
              file: relPath,
            });
          }
        }
      }
    } catch {}
  }

  walk(dir, '');
  return endpoints;
}

function scanNextPagesRoutes(dir: string, _basePath: string, projectRoot: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  function walk(d: string, routePath: string): void {
    try {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full, `${routePath}/${entry.name}`);
        } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.startsWith('_')) {
          const name = entry.name.replace(/\.(ts|js)$/, '');
          const relPath = path.relative(projectRoot, full).replace(/\\/g, '/');
          endpoints.push({
            path: `/api${routePath}/${name === 'index' ? '' : name}`,
            method: 'ALL',
            auth: 'unknown',
            purpose: guessPurpose(`${routePath}/${name}`, 'ALL'),
            file: relPath,
          });
        }
      }
    } catch {}
  }

  walk(dir, '');
  return endpoints;
}

function scanEdgeFunctions(dir: string, projectRoot: string): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  try {
    const fns = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory());
    for (const fn of fns) {
      const indexPath = path.join(dir, fn.name, 'index.ts');
      if (!fs.existsSync(indexPath)) continue;
      const content = fs.readFileSync(indexPath, 'utf-8');
      const auth = detectAuth(content);
      const relPath = path.relative(projectRoot, indexPath).replace(/\\/g, '/');

      endpoints.push({
        path: fn.name,
        method: 'POST',
        auth,
        purpose: guessPurpose(fn.name, 'POST'),
        file: relPath,
      });
    }
  } catch {}
  return endpoints;
}

function detectHttpMethods(content: string): string[] {
  const methods: string[] = [];
  if (/export\s+(?:async\s+)?function\s+GET/m.test(content)) methods.push('GET');
  if (/export\s+(?:async\s+)?function\s+POST/m.test(content)) methods.push('POST');
  if (/export\s+(?:async\s+)?function\s+PUT/m.test(content)) methods.push('PUT');
  if (/export\s+(?:async\s+)?function\s+PATCH/m.test(content)) methods.push('PATCH');
  if (/export\s+(?:async\s+)?function\s+DELETE/m.test(content)) methods.push('DELETE');
  return methods.length > 0 ? methods : ['ALL'];
}

function detectAuth(content: string): string {
  if (/auth|session|token|jwt|bearer|getUser|getSession|clerk|supabase.*auth/i.test(content)) return 'required';
  return 'none';
}

function guessPurpose(routePath: string, _method: string): string {
  const lower = routePath.toLowerCase().replace(/[^a-z]/g, ' ').trim();
  if (!lower) return 'API endpoint';
  return lower.split(/\s+/).slice(-2).join(' ');
}
