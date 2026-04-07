"use strict";
// Executive Summary Generator: reads all .plan/ outputs and synthesizes a one-page overview.
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
exports.collectExecutiveSummaryContext = collectExecutiveSummaryContext;
exports.generateExecutiveSummaryTemplate = generateExecutiveSummaryTemplate;
exports.writeExecutiveSummary = writeExecutiveSummary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectExecutiveSummaryContext(projectRoot) {
    let projectName = 'unknown';
    let projectDescription = '';
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            projectName = pkg['name'] ?? 'unknown';
            projectDescription = pkg['description'] ?? '';
        }
        catch { }
    }
    const planFiles = [];
    const planDir = path.join(projectRoot, '.plan');
    if (fs.existsSync(planDir)) {
        try {
            for (const f of fs.readdirSync(planDir)) {
                if (f.endsWith('.md')) {
                    try {
                        planFiles.push({ name: f, content: fs.readFileSync(path.join(planDir, f), 'utf-8') });
                    }
                    catch { }
                }
            }
        }
        catch { }
    }
    const fileNames = planFiles.map(f => f.name);
    return {
        projectName, projectDescription, planFiles,
        hasCompetitors: fileNames.includes('COMPETITORS.md'),
        hasArchitecture: fileNames.includes('ARCHITECTURE.md'),
        hasSchema: fileNames.includes('SCHEMA.md'),
        hasApiMap: fileNames.includes('API_MAP.md'),
    };
}
function generateExecutiveSummaryTemplate(ctx) {
    const fileList = ctx.planFiles.map(f => `- ${f.name} (${f.content.length} chars)`).join('\n');
    const planContent = ctx.planFiles.map(f => `### ${f.name}\n${f.content.slice(0, 800)}${f.content.length > 800 ? '\n...(truncated)' : ''}`).join('\n\n');
    const lines = [
        `# Executive Summary: ${ctx.projectName}`,
        '',
        '## Available Plan Data',
        '',
        fileList || '(no plan files found yet)',
        '',
        planContent,
        '',
        '## Template: Synthesize into one-page summary',
        '',
        '### What This Project Is',
        `${ctx.projectDescription || '(Describe the project in 2-3 sentences)'}`,
        '',
        '### Current State',
        '(Where the project stands: MVP, beta, production, early development)',
        '',
        ctx.hasCompetitors ? '### Competitive Landscape Summary\n(Summarize key findings from COMPETITORS.md: how many competitors, market state, this project\'s position)\n' : '',
        ctx.hasArchitecture ? '### Technical Health\n(Summarize from ARCHITECTURE.md: overall quality rating, critical issues, security posture)\n' : '',
        '### Cost Projection',
        '| DAU | Monthly Cost | Notes |',
        '|-----|-------------|-------|',
        '| 1K | | |',
        '| 10K | | |',
        '| 100K | | |',
        '',
        '### Launch Readiness Checklist',
        '- [ ] Core features complete',
        '- [ ] Authentication/authorization',
        '- [ ] Error handling and monitoring',
        '- [ ] Performance baseline',
        '- [ ] Security review',
        '- [ ] CI/CD pipeline',
        '- [ ] Documentation',
        '- [ ] Landing page / marketing',
        '',
        '### Recommended Action Plan',
        '| Priority | Task | Effort | Impact |',
        '|----------|------|--------|--------|',
        '| P0 | | | |',
        '| P1 | | | |',
        '| P2 | | | |',
        '',
        '### The One Thing That Matters Most',
        '(Single most impactful action to take right now)',
        '',
    ];
    return lines.filter(l => l !== undefined).join('\n');
}
function writeExecutiveSummary(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'EXECUTIVE_SUMMARY.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=executive-summary-gen.js.map