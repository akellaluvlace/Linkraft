// Preflight Security Scanner: detects hardcoded secrets, missing auth,
// missing rate limiting, fail-open patterns, injection vectors, XSS.

import * as fs from 'fs';
import * as path from 'path';
import {
  collectSourceFiles, readFileSafe, scanFileForPattern,
  findFilesByKeyword, hasAuthCheck, hasRateLimit, readDeps,
  type ScanResult,
} from '../shared/scanner.js';

export interface SecurityReport {
  score: number; // 0-10
  critical: ScanResult[];
  warnings: ScanResult[];
  passed: string[];
}

export function scanSecurity(projectRoot: string): SecurityReport {
  const findings: ScanResult[] = [];
  const passed: string[] = [];
  const sourceFiles = collectSourceFiles(projectRoot);
  const deps = readDeps(projectRoot);

  // 1. Hardcoded secrets in source files
  const secretPatterns = [
    { pattern: /['"`](sk_live_|sk_test_|pk_live_|pk_test_)[a-zA-Z0-9]+['"`]/g, desc: 'Hardcoded Stripe key' },
    { pattern: /['"`]AIza[a-zA-Z0-9_-]{35}['"`]/g, desc: 'Hardcoded Google API key' },
    { pattern: /['"`](ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}['"`]/g, desc: 'Hardcoded GitHub token' },
    { pattern: /['"`]eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+['"`]/g, desc: 'Hardcoded JWT token' },
    { pattern: /password\s*[:=]\s*['"`][^'"` ]{4,}['"`]/gi, desc: 'Hardcoded password' },
  ];

  for (const sf of sourceFiles) {
    const rel = path.relative(projectRoot, sf).replace(/\\/g, '/');
    if (rel.includes('.env') || rel.includes('config.example')) continue;

    for (const { pattern, desc } of secretPatterns) {
      const results = scanFileForPattern(sf, pattern, desc, 'critical', 'secrets');
      findings.push(...results.map(r => ({ ...r, file: rel })));
    }
  }
  if (findings.filter(f => f.category === 'secrets').length === 0) {
    passed.push('No hardcoded secrets detected');
  }

  // 2. API routes missing auth
  const apiFiles = findFilesByKeyword(projectRoot, ['api/', 'routes/']);
  const routeFiles = apiFiles.filter(f => /route\.(ts|js)$|handler\.(ts|js)$/.test(f));
  let unprotectedRoutes = 0;

  for (const rf of routeFiles) {
    const content = readFileSafe(path.join(projectRoot, rf));
    if (!content) continue;
    if (!hasAuthCheck(content)) {
      // Check if it's a public route (health, webhook, auth callback)
      if (/health|webhook|callback|confirm|verify|public/i.test(rf)) continue;
      findings.push({
        file: rf, line: 1, description: 'API route has no auth check',
        severity: 'high', category: 'auth',
      });
      unprotectedRoutes++;
    }
  }
  if (unprotectedRoutes === 0 && routeFiles.length > 0) {
    passed.push(`All ${routeFiles.length} API routes have auth checks`);
  }

  // 3. API routes missing rate limiting
  let unratedRoutes = 0;
  for (const rf of routeFiles) {
    const content = readFileSafe(path.join(projectRoot, rf));
    if (!content) continue;
    if (!hasRateLimit(content)) {
      findings.push({
        file: rf, line: 1, description: 'API route has no rate limiting',
        severity: 'medium', category: 'rate-limit',
      });
      unratedRoutes++;
    }
  }
  if (unratedRoutes === 0 && routeFiles.length > 0) {
    passed.push('All API routes have rate limiting');
  }

  // 4. Fail-open patterns (catch blocks that return success)
  for (const sf of sourceFiles) {
    const rel = path.relative(projectRoot, sf).replace(/\\/g, '/');
    const content = readFileSafe(sf);
    if (!content) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/catch\s*\(/.test(line)) {
        // Look at next few lines for return success patterns
        const block = lines.slice(i, i + 5).join('\n');
        if (/return\s*(Response\.json|NextResponse\.json|res\.json|res\.status\(200\))\s*\(?\s*\{/.test(block) &&
            !/error|fail|message|status.*[45]\d\d/.test(block)) {
          findings.push({
            file: rel, line: i + 1, description: 'Catch block returns success (fail-open pattern)',
            severity: 'high', category: 'fail-open',
          });
        }
      }
    }
  }

  // 5. dangerouslySetInnerHTML
  for (const sf of sourceFiles) {
    const rel = path.relative(projectRoot, sf).replace(/\\/g, '/');
    const results = scanFileForPattern(sf, /dangerouslySetInnerHTML/g, 'dangerouslySetInnerHTML usage (XSS risk)', 'high', 'xss');
    findings.push(...results.map(r => ({ ...r, file: rel })));
  }

  // 6. SQL injection vectors
  for (const sf of sourceFiles) {
    const rel = path.relative(projectRoot, sf).replace(/\\/g, '/');
    const results = scanFileForPattern(sf, /`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g, 'Possible SQL injection (template literal in query)', 'high', 'injection');
    // Filter to only files that look like they contain queries
    const content = readFileSafe(sf);
    if (content && /query|sql|execute|select|insert|update|delete/i.test(content)) {
      findings.push(...results.map(r => ({ ...r, file: rel })));
    }
  }

  // 7. Env vars exposed to client
  for (const sf of sourceFiles) {
    const rel = path.relative(projectRoot, sf).replace(/\\/g, '/');
    if (!rel.includes('client') && !rel.includes('component') && !rel.includes('page') && !rel.includes('app/')) continue;
    const results = scanFileForPattern(
      sf,
      /process\.env\.(DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|JWT_SECRET|AUTH_SECRET)/g,
      'Server-side env var used in client-accessible file',
      'critical', 'env-leak',
    );
    findings.push(...results.map(r => ({ ...r, file: rel })));
  }

  // 8. RLS check for Supabase
  if (deps['@supabase/supabase-js']) {
    const migrationDir = path.join(projectRoot, 'supabase', 'migrations');
    if (fs.existsSync(migrationDir)) {
      let hasRls = false;
      try {
        const files = fs.readdirSync(migrationDir);
        for (const f of files) {
          if (f.endsWith('.sql')) {
            const content = readFileSafe(path.join(migrationDir, f));
            if (content && /enable\s+row\s+level\s+security/i.test(content)) {
              hasRls = true;
            }
          }
        }
      } catch {}
      if (!hasRls) {
        findings.push({
          file: 'supabase/migrations/', line: null,
          description: 'No RLS policies detected in migrations',
          severity: 'critical', category: 'rls',
        });
      } else {
        passed.push('RLS policies detected in Supabase migrations');
      }
    }
  }

  // Score: 10 - (critical*3 + high*2 + medium*1), clamped to 0-10
  const critical = findings.filter(f => f.severity === 'critical');
  const high = findings.filter(f => f.severity === 'high');
  const medium = findings.filter(f => f.severity === 'medium');
  const penalty = critical.length * 3 + high.length * 2 + medium.length;
  const score = Math.max(0, Math.min(10, 10 - penalty));

  return {
    score,
    critical: findings.filter(f => f.severity === 'critical'),
    warnings: findings.filter(f => f.severity !== 'critical'),
    passed,
  };
}
