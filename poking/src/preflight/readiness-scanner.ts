// Preflight Readiness Scanner: checks if the project is ready to ship.
// Error handling, loading states, 404, auth, deploy config, meta tags, etc.

import * as fs from 'fs';
import * as path from 'path';
import { collectSourceFiles, readFileSafe, findFilesByKeyword, readDeps } from '../shared/scanner.js';

export interface ReadinessCheck {
  name: string;
  status: string; // 'present', 'missing', 'N missing', etc.
  passed: boolean;
}

export interface ReadinessReport {
  percentage: number; // 0-100
  checks: ReadinessCheck[];
}

export function scanReadiness(projectRoot: string): ReadinessReport {
  const checks: ReadinessCheck[] = [];
  const sourceFiles = collectSourceFiles(projectRoot);
  const deps = readDeps(projectRoot);

  // 1. Error handling on API routes
  const routeFiles = findFilesByKeyword(projectRoot, ['api/']).filter(f => /route\.(ts|js)$/.test(f));
  let routesMissingErrorHandling = 0;
  for (const rf of routeFiles) {
    const content = readFileSafe(path.join(projectRoot, rf));
    if (!content) continue;
    if (!/try\s*\{|\.catch\(|catch\s*\(/.test(content)) {
      routesMissingErrorHandling++;
    }
  }
  checks.push({
    name: 'Error handling on API routes',
    status: routesMissingErrorHandling === 0
      ? (routeFiles.length > 0 ? 'all covered' : 'no routes')
      : `${routesMissingErrorHandling} missing`,
    passed: routesMissingErrorHandling === 0,
  });

  // 2. Loading states (Suspense, loading.tsx, isLoading)
  let hasLoadingStates = false;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    if (/Suspense|loading\.(tsx|jsx)|isLoading|isPending|skeleton|Skeleton/i.test(content)) {
      hasLoadingStates = true;
      break;
    }
  }
  // Also check for loading.tsx files in Next.js
  const loadingFiles = findFilesByKeyword(projectRoot, ['loading.tsx', 'loading.jsx']);
  checks.push({
    name: 'Loading states',
    status: hasLoadingStates || loadingFiles.length > 0 ? 'present' : 'missing',
    passed: hasLoadingStates || loadingFiles.length > 0,
  });

  // 3. Empty states
  let hasEmptyStates = false;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    if (/empty.?state|no.?results|no.?data|nothing.?here|\.length\s*===?\s*0/i.test(content)) {
      hasEmptyStates = true;
      break;
    }
  }
  checks.push({
    name: 'Empty states',
    status: hasEmptyStates ? 'present' : 'missing',
    passed: hasEmptyStates,
  });

  // 4. 404 page
  const has404 =
    fs.existsSync(path.join(projectRoot, 'app', 'not-found.tsx')) ||
    fs.existsSync(path.join(projectRoot, 'app', 'not-found.jsx')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'app', 'not-found.tsx')) ||
    fs.existsSync(path.join(projectRoot, 'pages', '404.tsx')) ||
    fs.existsSync(path.join(projectRoot, 'pages', '404.jsx'));
  checks.push({ name: '404 page', status: has404 ? 'present' : 'missing', passed: has404 });

  // 5. Auth implemented
  const hasAuth = !!(
    deps['next-auth'] || deps['@auth/core'] || deps['@clerk/nextjs'] ||
    deps['@supabase/auth-helpers-nextjs'] || deps['lucia'] ||
    findFilesByKeyword(projectRoot, ['auth', 'login', 'signup']).length > 0
  );
  checks.push({ name: 'Auth implemented', status: hasAuth ? 'yes' : 'no', passed: hasAuth });

  // 6. Deploy config
  const hasDeploy =
    fs.existsSync(path.join(projectRoot, 'vercel.json')) ||
    fs.existsSync(path.join(projectRoot, 'vercel.ts')) ||
    fs.existsSync(path.join(projectRoot, 'netlify.toml')) ||
    fs.existsSync(path.join(projectRoot, 'Dockerfile')) ||
    fs.existsSync(path.join(projectRoot, 'fly.toml')) ||
    fs.existsSync(path.join(projectRoot, 'render.yaml'));
  checks.push({ name: 'Deploy config', status: hasDeploy ? 'present' : 'not configured', passed: hasDeploy });

  // 7. Env vars documented
  const hasEnvDocs =
    fs.existsSync(path.join(projectRoot, '.env.example')) ||
    fs.existsSync(path.join(projectRoot, '.env.local.example')) ||
    fs.existsSync(path.join(projectRoot, '.env.sample'));
  checks.push({ name: 'Env vars documented', status: hasEnvDocs ? 'present' : 'missing', passed: hasEnvDocs });

  // 8. Favicon
  const hasFavicon =
    fs.existsSync(path.join(projectRoot, 'public', 'favicon.ico')) ||
    fs.existsSync(path.join(projectRoot, 'public', 'favicon.svg')) ||
    fs.existsSync(path.join(projectRoot, 'app', 'favicon.ico')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'app', 'favicon.ico'));
  checks.push({ name: 'Favicon', status: hasFavicon ? 'present' : 'missing', passed: hasFavicon });

  // 9. OG meta tags
  let hasOgTags = false;
  const layoutFiles = findFilesByKeyword(projectRoot, ['layout.tsx', 'layout.jsx', '_app.tsx']);
  for (const lf of layoutFiles) {
    const content = readFileSafe(path.join(projectRoot, lf));
    if (!content) continue;
    if (/openGraph|og:title|og:description|og:image|metadata/i.test(content)) {
      hasOgTags = true;
      break;
    }
  }
  checks.push({ name: 'OG meta tags', status: hasOgTags ? 'present' : 'missing', passed: hasOgTags });

  // 10. robots.txt
  const hasRobots = fs.existsSync(path.join(projectRoot, 'public', 'robots.txt'));
  checks.push({ name: 'robots.txt', status: hasRobots ? 'present' : 'missing', passed: hasRobots });

  // 11. TODOs remaining (count)
  let todoCount = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const matches = content.match(/\/\/\s*TODO/gi);
    if (matches) todoCount += matches.length;
  }
  checks.push({
    name: 'TODOs remaining',
    status: todoCount === 0 ? 'none' : `${todoCount}`,
    passed: todoCount <= 5,
  });

  // 12. FIXMEs remaining
  let fixmeCount = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const matches = content.match(/\/\/\s*FIXME/gi);
    if (matches) fixmeCount += matches.length;
  }
  checks.push({
    name: 'FIXMEs remaining',
    status: fixmeCount === 0 ? 'none' : `${fixmeCount}`,
    passed: fixmeCount === 0,
  });

  const passedCount = checks.filter(c => c.passed).length;
  const percentage = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;

  return { percentage, checks };
}
