// Shared scanner utilities used by both Preflight and Sheep.
// Extracts common file-walking, pattern-matching, and project analysis.

import * as fs from 'fs';
import * as path from 'path';

export interface ScanResult {
  file: string;
  line: number | null;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

/**
 * Walks a directory tree, calling callback on each file.
 * Skips node_modules, .git, dist, .next, .plan, .sheep.
 */
export function walkDir(dir: string, callback: (filePath: string) => void, depth: number = 0): void {
  if (depth > 6) return;
  const skip = ['node_modules', '.git', 'dist', '.next', '.plan', '.sheep', '.turbo', '.cache', 'coverage'];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (skip.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full, callback, depth + 1);
      } else if (entry.isFile()) {
        callback(full);
      }
    }
  } catch {}
}

/**
 * Collects all source files from a project (ts, tsx, js, jsx).
 */
export function collectSourceFiles(projectRoot: string): string[] {
  const files: string[] = [];
  walkDir(projectRoot, (fp) => {
    if (/\.(ts|tsx|js|jsx)$/.test(fp) && !fp.includes('.d.ts')) {
      files.push(fp);
    }
  });
  return files;
}

/**
 * Reads a file safely. Returns null on error.
 */
export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Finds files matching keywords in their path.
 */
export function findFilesByKeyword(projectRoot: string, keywords: string[]): string[] {
  const results: string[] = [];
  walkDir(projectRoot, (fp) => {
    if (!/\.(ts|tsx|js|jsx)$/.test(fp)) return;
    const rel = path.relative(projectRoot, fp).replace(/\\/g, '/');
    const lower = rel.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        results.push(rel);
        return;
      }
    }
  });
  return [...new Set(results)].slice(0, 50);
}

/**
 * Scans file content for a regex pattern. Returns matches with line numbers.
 */
export function scanFileForPattern(
  filePath: string,
  pattern: RegExp,
  description: string,
  severity: ScanResult['severity'],
  category: string,
): ScanResult[] {
  const content = readFileSafe(filePath);
  if (!content) return [];

  const results: ScanResult[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i]!)) {
      results.push({
        file: filePath,
        line: i + 1,
        description,
        severity,
        category,
      });
    }
  }
  return results;
}

/**
 * Reads package.json dependencies.
 */
export function readDeps(projectRoot: string): Record<string, string> {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    return {
      ...(pkg['dependencies'] as Record<string, string> | undefined),
      ...(pkg['devDependencies'] as Record<string, string> | undefined),
    };
  } catch {
    return {};
  }
}

/**
 * Checks if a route file has auth checks.
 */
export function hasAuthCheck(content: string): boolean {
  return /getSession|getServerSession|auth\(\)|getUser|requireAuth|isAuthenticated|withAuth|getToken|verifyToken|jwt\.verify|supabase\.auth/i.test(content);
}

/**
 * Checks if a route file has rate limiting.
 */
export function hasRateLimit(content: string): boolean {
  return /rateLimit|rateLimiter|throttle|RateLimiter|upstash.*ratelimit|@upstash\/ratelimit/i.test(content);
}
