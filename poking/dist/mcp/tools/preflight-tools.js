"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPreflightTools = registerPreflightTools;
const zod_1 = require("zod");
const runner_js_1 = require("../../preflight/runner.js");
const security_scanner_js_1 = require("../../preflight/security-scanner.js");
const health_scanner_js_1 = require("../../preflight/health-scanner.js");
const readiness_scanner_js_1 = require("../../preflight/readiness-scanner.js");
const projectRootSchema = { projectRoot: zod_1.z.string().describe('Project root directory') };
function registerPreflightTools(server) {
    server.tool('preflight_full', 'Runs a full preflight scan: security, health, and ship readiness. Writes report to .preflight/.', projectRootSchema, async ({ projectRoot }) => {
        const report = (0, runner_js_1.runPreflight)(projectRoot);
        const reportPath = (0, runner_js_1.writeReport)(projectRoot, report);
        const formatted = (0, runner_js_1.formatReport)(report);
        return {
            content: [{
                    type: 'text',
                    text: `Written to ${reportPath}\n\n${formatted}`,
                }],
        };
    });
    server.tool('preflight_security', 'Runs security scan only: secrets, auth, rate limiting, injection, XSS, RLS.', projectRootSchema, async ({ projectRoot }) => {
        const result = (0, security_scanner_js_1.scanSecurity)(projectRoot);
        const lines = [
            `## SECURITY [${result.score}/10]`,
            '',
            ...result.critical.map(f => `- [CRITICAL] ${f.description}  ${f.file}${f.line ? ':' + f.line : ''}`),
            ...result.warnings.map(f => `- [${f.severity.toUpperCase()}] ${f.description}  ${f.file}${f.line ? ':' + f.line : ''}`),
            ...result.passed.map(p => `- [PASS] ${p}`),
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('preflight_health', 'Runs health scan only: console.logs, TypeScript any, tests, file size, TODOs.', projectRootSchema, async ({ projectRoot }) => {
        const result = (0, health_scanner_js_1.scanHealth)(projectRoot);
        const lines = [
            `## HEALTH [${result.score}/100]`,
            '',
            '| Metric | Value | Status |',
            '|--------|-------|--------|',
            ...result.metrics.map(m => `| ${m.name} | ${m.value} | ${m.status} |`),
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('preflight_readiness', 'Runs ship readiness scan only: error handling, loading states, 404, auth, deploy config, meta tags.', projectRootSchema, async ({ projectRoot }) => {
        const result = (0, readiness_scanner_js_1.scanReadiness)(projectRoot);
        const lines = [
            `## SHIP READINESS [${result.percentage}%]`,
            '',
            '| Check | Status |',
            '|-------|--------|',
            ...result.checks.map(c => `| ${c.name} | ${c.status} |`),
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
}
//# sourceMappingURL=preflight-tools.js.map