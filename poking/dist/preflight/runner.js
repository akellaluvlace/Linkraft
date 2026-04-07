"use strict";
// Preflight Runner: orchestrates all three scanners, formats the report.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPreflight = runPreflight;
exports.formatReport = formatReport;
exports.writeReport = writeReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const security_scanner_js_1 = require("./security-scanner.js");
const health_scanner_js_1 = require("./health-scanner.js");
const readiness_scanner_js_1 = require("./readiness-scanner.js");
function runPreflight(projectRoot) {
    const start = Date.now();
    const projectName = getProjectName(projectRoot);
    const security = (0, security_scanner_js_1.scanSecurity)(projectRoot);
    const health = (0, health_scanner_js_1.scanHealth)(projectRoot);
    const readiness = (0, readiness_scanner_js_1.scanReadiness)(projectRoot);
    return {
        projectName,
        timestamp: new Date().toISOString(),
        scanTimeMs: Date.now() - start,
        security,
        health,
        readiness,
    };
}
function getProjectName(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (pkg['name'])
                return pkg['name'];
        }
        catch { }
    }
    return path.basename(projectRoot);
}
function formatReport(report) {
    const lines = [
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
    }
    else {
        lines.push('All checks passed. Ship it.');
    }
    lines.push('');
    return lines.join('\n');
}
function writeReport(projectRoot, report) {
    const preflightDir = path.join(projectRoot, '.preflight');
    if (!fs.existsSync(preflightDir))
        fs.mkdirSync(preflightDir, { recursive: true });
    // Write human-readable report
    const mdPath = path.join(preflightDir, 'report.md');
    fs.writeFileSync(mdPath, formatReport(report), 'utf-8');
    // Write machine-readable JSON
    const jsonPath = path.join(preflightDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    return mdPath;
}
//# sourceMappingURL=runner.js.map