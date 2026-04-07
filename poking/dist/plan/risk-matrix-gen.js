"use strict";
// Risk Matrix Generator: reads architecture and competitor analysis, categorizes all risks.
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
exports.collectRiskMatrixContext = collectRiskMatrixContext;
exports.generateRiskMatrixTemplate = generateRiskMatrixTemplate;
exports.writeRiskMatrix = writeRiskMatrix;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectRiskMatrixContext(projectRoot) {
    let projectName = 'unknown';
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            projectName = pkg['name'] ?? 'unknown';
        }
        catch { }
    }
    const planDir = path.join(projectRoot, '.plan');
    const readPlan = (name) => {
        const fp = path.join(planDir, name);
        if (fs.existsSync(fp)) {
            try {
                return fs.readFileSync(fp, 'utf-8');
            }
            catch { }
        }
        return null;
    };
    const architectureContent = readPlan('ARCHITECTURE.md');
    const competitorContent = readPlan('COMPETITORS.md');
    const executiveSummaryContent = readPlan('EXECUTIVE_SUMMARY.md');
    const extractedRisks = extractRisksFromContent(architectureContent, competitorContent, executiveSummaryContent);
    return { projectName, architectureContent, competitorContent, executiveSummaryContent, extractedRisks };
}
function extractRisksFromContent(arch, comp, exec) {
    const risks = [];
    const riskPatterns = [
        /(?:risk|vulnerability|weakness|issue|problem|concern|gap|missing|lack|no\s+\w+\s+(?:handling|validation|auth))/gi,
    ];
    function scanContent(content, source) {
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.replace(/^[|\-#*>\s]+/, '').trim();
            if (trimmed.length < 10 || trimmed.length > 200)
                continue;
            for (const pattern of riskPatterns) {
                pattern.lastIndex = 0;
                if (pattern.test(trimmed)) {
                    const severity = trimmed.match(/critical/i) ? 'critical'
                        : trimmed.match(/high/i) ? 'high'
                            : trimmed.match(/medium/i) ? 'medium' : 'unrated';
                    risks.push({ description: trimmed, source, suggestedSeverity: severity });
                    break;
                }
            }
        }
    }
    if (arch)
        scanContent(arch, 'ARCHITECTURE.md');
    if (comp)
        scanContent(comp, 'COMPETITORS.md');
    if (exec)
        scanContent(exec, 'EXECUTIVE_SUMMARY.md');
    return risks;
}
function generateRiskMatrixTemplate(ctx) {
    const lines = [
        `# Risk Matrix: ${ctx.projectName}`,
        '',
        '## Source Data',
        '',
        `- Architecture review: ${ctx.architectureContent ? 'available' : 'NOT AVAILABLE (run plan_architecture first)'}`,
        `- Competitor analysis: ${ctx.competitorContent ? 'available' : 'NOT AVAILABLE (run plan_competitors first)'}`,
        `- Executive summary: ${ctx.executiveSummaryContent ? 'available' : 'optional'}`,
        '',
    ];
    if (ctx.extractedRisks.length > 0) {
        lines.push('## Auto-extracted Risk Mentions', '');
        lines.push('| Risk | Source | Suggested Severity |');
        lines.push('|------|--------|--------------------|');
        for (const r of ctx.extractedRisks.slice(0, 20)) {
            lines.push(`| ${r.description} | ${r.source} | ${r.suggestedSeverity} |`);
        }
        lines.push('');
    }
    lines.push('## Template: Categorize all risks into the matrix below', '', '### Critical (high probability + high impact)', '| # | Risk | Probability | Impact | Mitigation | Owner |', '|---|------|------------|--------|------------|-------|', '| 1 | | | | | |', '', '### High (either high probability or high impact)', '| # | Risk | Probability | Impact | Mitigation | Owner |', '|---|------|------------|--------|------------|-------|', '| 1 | | | | | |', '', '### Medium', '| # | Risk | Probability | Impact | Mitigation | Owner |', '|---|------|------------|--------|------------|-------|', '| 1 | | | | | |', '', '### Accepted Risks (known, won\'t fix now)', '| # | Risk | Reason for accepting | Revisit condition |', '|---|------|---------------------|-------------------|', '| 1 | | | |', '');
    return lines.join('\n');
}
function writeRiskMatrix(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'RISK_MATRIX.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=risk-matrix-gen.js.map