// Preflight Runner: orchestrates all three scanners, formats the report.

import * as fs from 'fs';
import * as path from 'path';
import { scanSecurity, type SecurityReport } from './security-scanner.js';
import { scanHealth, type HealthReport } from './health-scanner.js';
import { scanReadiness, type ReadinessReport } from './readiness-scanner.js';

export interface PreflightReport {
  projectName: string;
  timestamp: string;
  scanTimeMs: number;
  security: SecurityReport;
  health: HealthReport;
  readiness: ReadinessReport;
}

export function runPreflight(projectRoot: string): PreflightReport {
  const start = Date.now();
  const projectName = getProjectName(projectRoot);

  const security = scanSecurity(projectRoot);
  const health = scanHealth(projectRoot);
  const readiness = scanReadiness(projectRoot);

  return {
    projectName,
    timestamp: new Date().toISOString(),
    scanTimeMs: Date.now() - start,
    security,
    health,
    readiness,
  };
}

function getProjectName(projectRoot: string): string {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      if (pkg['name']) return pkg['name'] as string;
    } catch {}
  }
  return path.basename(projectRoot);
}

export function formatReport(report: PreflightReport): string {
  const lines: string[] = [
    `# PREFLIGHT REPORT: ${report.projectName}`,
    `## Generated: ${report.timestamp}`,
    `## Scan time: ${report.scanTimeMs}ms`,
    '',
  ];

  // Security
  lines.push(`## SECURITY [${report.security.score}/10]`, '');

  if (report.security.critical.length > 0) {
    lines.push('### Critical');
    for (const f of report.security.critical) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      lines.push(`- [FAIL] ${f.description}    ${loc}`);
    }
    lines.push('');
  }

  if (report.security.warnings.length > 0) {
    lines.push('### Warnings');
    for (const f of report.security.warnings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      lines.push(`- [WARN] ${f.description}    ${loc}`);
    }
    lines.push('');
  }

  if (report.security.passed.length > 0) {
    lines.push('### Passed');
    for (const p of report.security.passed) {
      lines.push(`- [PASS] ${p}`);
    }
    lines.push('');
  }

  if (report.security.critical.length === 0 && report.security.warnings.length === 0) {
    lines.push('No security issues detected.', '');
  }

  // Health
  lines.push(`## HEALTH [${report.health.score}/100]`, '');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');
  for (const m of report.health.metrics) {
    lines.push(`| ${m.name} | ${m.value} | ${m.status} |`);
  }
  lines.push('');

  // Readiness
  lines.push(`## SHIP READINESS [${report.readiness.percentage}%]`, '');
  lines.push('| Check | Status |');
  lines.push('|-------|--------|');
  for (const c of report.readiness.checks) {
    lines.push(`| ${c.name} | ${c.status} |`);
  }
  lines.push('');

  // Next steps
  const totalIssues = report.security.critical.length + report.security.warnings.length +
    report.health.metrics.filter(m => m.status === 'FAIL' || m.status === 'WARN').length +
    report.readiness.checks.filter(c => !c.passed).length;
  const autoFixable = Math.round(totalIssues * 0.7); // rough estimate

  lines.push('## NEXT STEPS');
  if (totalIssues > 0) {
    lines.push(`Run \`/linkraft sheep\` to auto-fix ~${autoFixable} of ${totalIssues} issues.`);
    lines.push(`${totalIssues - autoFixable} issues may need manual attention.`);
  } else {
    lines.push('All checks passed. Ship it.');
  }
  lines.push('');

  return lines.join('\n');
}

export function writeReport(projectRoot: string, report: PreflightReport): string {
  const preflightDir = path.join(projectRoot, '.preflight');
  if (!fs.existsSync(preflightDir)) fs.mkdirSync(preflightDir, { recursive: true });

  // Write human-readable report
  const mdPath = path.join(preflightDir, 'report.md');
  fs.writeFileSync(mdPath, formatReport(report), 'utf-8');

  // Write machine-readable JSON
  const jsonPath = path.join(preflightDir, 'report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  return mdPath;
}
