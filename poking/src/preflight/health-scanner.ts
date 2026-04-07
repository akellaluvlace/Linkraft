// Preflight Health Scanner: dead code, console.logs, TypeScript any,
// test coverage estimate, file complexity, TODO/FIXME counts.

import * as path from 'path';
import { collectSourceFiles, readFileSafe, walkDir } from '../shared/scanner.js';

export interface HealthMetric {
  name: string;
  value: number | string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'LOW' | 'INFO';
  detail: string | null;
}

export interface HealthReport {
  score: number; // 0-100
  metrics: HealthMetric[];
}

export function scanHealth(projectRoot: string): HealthReport {
  const sourceFiles = collectSourceFiles(projectRoot);
  const metrics: HealthMetric[] = [];

  // 1. Console.log count
  let consoleLogs = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const matches = content.match(/console\.(log|debug|info)\(/g);
    if (matches) consoleLogs += matches.length;
  }
  metrics.push({
    name: 'Console.logs',
    value: consoleLogs,
    status: consoleLogs === 0 ? 'PASS' : consoleLogs <= 5 ? 'WARN' : 'FAIL',
    detail: consoleLogs > 0 ? `${consoleLogs} console statements in production code` : null,
  });

  // 2. TypeScript any count
  let anyCount = 0;
  for (const sf of sourceFiles) {
    if (!/\.tsx?$/.test(sf)) continue;
    const content = readFileSafe(sf);
    if (!content) continue;
    const matches = content.match(/:\s*any\b|as\s+any\b|<any>/g);
    if (matches) anyCount += matches.length;
  }
  metrics.push({
    name: 'TypeScript any',
    value: anyCount,
    status: anyCount === 0 ? 'PASS' : anyCount <= 3 ? 'WARN' : 'FAIL',
    detail: anyCount > 0 ? `${anyCount} uses of 'any' type` : null,
  });

  // 3. Test file count
  let testFiles = 0;
  walkDir(projectRoot, (fp) => {
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fp)) testFiles++;
  });
  const testRatio = sourceFiles.length > 0 ? testFiles / sourceFiles.length : 0;
  metrics.push({
    name: 'Test count',
    value: testFiles,
    status: testFiles === 0 ? 'FAIL' : testRatio < 0.1 ? 'LOW' : testRatio < 0.3 ? 'WARN' : 'PASS',
    detail: `${testFiles} test files for ${sourceFiles.length} source files (${Math.round(testRatio * 100)}%)`,
  });

  // 4. Largest file by line count
  let largestFile = '';
  let largestLines = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const lineCount = content.split('\n').length;
    if (lineCount > largestLines) {
      largestLines = lineCount;
      largestFile = path.relative(projectRoot, sf).replace(/\\/g, '/');
    }
  }
  metrics.push({
    name: 'Largest file',
    value: `${largestLines} lines`,
    status: largestLines <= 300 ? 'PASS' : largestLines <= 500 ? 'WARN' : 'FAIL',
    detail: largestFile ? `${largestFile} (${largestLines} lines)` : null,
  });

  // 5. TODO/FIXME count
  let todoCount = 0;
  let fixmeCount = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const todos = content.match(/\/\/\s*TODO/gi);
    const fixmes = content.match(/\/\/\s*FIXME/gi);
    if (todos) todoCount += todos.length;
    if (fixmes) fixmeCount += fixmes.length;
  }
  metrics.push({
    name: 'TODOs',
    value: todoCount,
    status: todoCount === 0 ? 'PASS' : todoCount <= 5 ? 'INFO' : 'WARN',
    detail: todoCount > 0 ? `${todoCount} TODOs remaining` : null,
  });
  metrics.push({
    name: 'FIXMEs',
    value: fixmeCount,
    status: fixmeCount === 0 ? 'PASS' : 'WARN',
    detail: fixmeCount > 0 ? `${fixmeCount} FIXMEs need attention` : null,
  });

  // 6. Empty catch blocks
  let emptyCatches = 0;
  for (const sf of sourceFiles) {
    const content = readFileSafe(sf);
    if (!content) continue;
    const matches = content.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
    if (matches) emptyCatches += matches.length;
  }
  metrics.push({
    name: 'Empty catch blocks',
    value: emptyCatches,
    status: emptyCatches === 0 ? 'PASS' : 'WARN',
    detail: emptyCatches > 0 ? `${emptyCatches} swallowed errors` : null,
  });

  // 7. Source file count
  metrics.push({
    name: 'Source files',
    value: sourceFiles.length,
    status: 'INFO',
    detail: null,
  });

  // Score: weighted average
  const weights: Record<string, number> = {
    'PASS': 100, 'INFO': 80, 'LOW': 40, 'WARN': 30, 'FAIL': 0,
  };
  const scorable = metrics.filter(m => m.status !== 'INFO');
  const score = scorable.length > 0
    ? Math.round(scorable.reduce((sum, m) => sum + (weights[m.status] ?? 50), 0) / scorable.length)
    : 50;

  return { score, metrics };
}
