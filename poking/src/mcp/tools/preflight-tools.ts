import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { runPreflight, formatReport, writeReport } from '../../preflight/runner.js';
import { scanSecurity } from '../../preflight/security-scanner.js';
import { scanHealth } from '../../preflight/health-scanner.js';
import { scanReadiness } from '../../preflight/readiness-scanner.js';

const projectRootSchema = { projectRoot: z.string().describe('Project root directory') };

export function registerPreflightTools(server: McpServer): void {
  server.tool(
    'preflight_full',
    'Runs a full preflight scan: security, health, and ship readiness. Writes report to .preflight/.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const report = runPreflight(projectRoot);
      const reportPath = writeReport(projectRoot, report);
      const formatted = formatReport(report);
      return {
        content: [{
          type: 'text' as const,
          text: `Written to ${reportPath}\n\n${formatted}`,
        }],
      };
    },
  );

  server.tool(
    'preflight_security',
    'Runs security scan only: secrets, auth, rate limiting, injection, XSS, RLS.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = scanSecurity(projectRoot);
      const lines = [
        `## SECURITY [${result.score}/10]`,
        '',
        ...result.critical.map(f => `- [CRITICAL] ${f.description}  ${f.file}${f.line ? ':' + f.line : ''}`),
        ...result.warnings.map(f => `- [${f.severity.toUpperCase()}] ${f.description}  ${f.file}${f.line ? ':' + f.line : ''}`),
        ...result.passed.map(p => `- [PASS] ${p}`),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'preflight_health',
    'Runs health scan only: console.logs, TypeScript any, tests, file size, TODOs.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = scanHealth(projectRoot);
      const lines = [
        `## HEALTH [${result.score}/100]`,
        '',
        '| Metric | Value | Status |',
        '|--------|-------|--------|',
        ...result.metrics.map(m => `| ${m.name} | ${m.value} | ${m.status} |`),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'preflight_readiness',
    'Runs ship readiness scan only: error handling, loading states, 404, auth, deploy config, meta tags.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const result = scanReadiness(projectRoot);
      const lines = [
        `## SHIP READINESS [${result.percentage}%]`,
        '',
        '| Check | Status |',
        '|-------|--------|',
        ...result.checks.map(c => `| ${c.name} | ${c.status} |`),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
