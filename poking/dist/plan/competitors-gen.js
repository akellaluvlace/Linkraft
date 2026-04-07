"use strict";
// Competitors Generator: collects project context for competitive analysis.
// Returns a template for Claude to fill in using web_search.
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
exports.collectCompetitorContext = collectCompetitorContext;
exports.generateCompetitorTemplate = generateCompetitorTemplate;
exports.writeCompetitors = writeCompetitors;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectCompetitorContext(projectRoot) {
    let name = 'unknown';
    let description = '';
    const deps = [];
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            name = pkg['name'] ?? 'unknown';
            description = pkg['description'] ?? '';
            const d = pkg['dependencies'];
            const dd = pkg['devDependencies'];
            if (d)
                deps.push(...Object.keys(d));
            if (dd)
                deps.push(...Object.keys(dd));
        }
        catch { }
    }
    if (!description) {
        const readmePath = path.join(projectRoot, 'README.md');
        if (fs.existsSync(readmePath)) {
            try {
                const readme = fs.readFileSync(readmePath, 'utf-8');
                const match = readme.match(/^#[^\n]*\n+([^\n#]+)/);
                if (match)
                    description = match[1].trim();
            }
            catch { }
        }
    }
    const category = detectCategory(projectRoot, deps);
    const words = description.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    const keywords = [...new Set([name, ...category.split(' '), ...words])];
    return { projectName: name, projectDescription: description, category, techStack: deps.slice(0, 20), keywords };
}
function detectCategory(projectRoot, deps) {
    if (deps.includes('expo') || deps.includes('react-native'))
        return 'mobile app';
    if (deps.includes('electron') || deps.includes('tauri'))
        return 'desktop app';
    if (fs.existsSync(path.join(projectRoot, 'bin')) || deps.includes('commander') || deps.includes('yargs'))
        return 'CLI tool';
    if (deps.includes('next') || deps.includes('nuxt') || deps.includes('@sveltejs/kit'))
        return 'web application';
    if (deps.includes('express') || deps.includes('fastify') || deps.includes('hono'))
        return 'backend service';
    if (fs.existsSync(path.join(projectRoot, 'src', 'index.ts')) && !deps.includes('next'))
        return 'library';
    return 'software project';
}
function generateCompetitorTemplate(ctx) {
    const lines = [
        `# Competitor Analysis: ${ctx.projectName}`,
        '',
        '## Project Context (auto-detected)',
        '',
        `- **Name:** ${ctx.projectName}`,
        `- **Description:** ${ctx.projectDescription || 'not detected'}`,
        `- **Category:** ${ctx.category}`,
        `- **Key tech:** ${ctx.techStack.slice(0, 10).join(', ') || 'none detected'}`,
        '',
        '## Research Instructions',
        '',
        `Use web_search to research competitors for this ${ctx.category}.`,
        `Suggested search queries:`,
        ...ctx.keywords.slice(0, 5).map(k => `- "${k} alternatives""`),
        `- "${ctx.category} comparison ${new Date().getFullYear()}"`,
        `- "${ctx.projectName} vs"`,
        '',
        '## Template: Fill in below',
        '',
        '### Direct Competitors',
        '| Name | What it does | Pricing | Users/Revenue | Tech stack | Status |',
        '|------|-------------|---------|---------------|------------|--------|',
        '| | | | | | |',
        '',
        '### Feature Comparison Matrix',
        '| Feature | This Project | Competitor 1 | Competitor 2 | Competitor 3 |',
        '|---------|-------------|-------------|-------------|-------------|',
        '| | | | | |',
        '',
        '### Dead/Failed Competitors',
        '| Name | What happened | When | Lesson |',
        '|------|--------------|------|--------|',
        '| | | | |',
        '',
        '### Competitive Advantage',
        '- What this project does better:',
        '- What competitors do better:',
        '- Unfair advantages:',
        '',
        '### Risks from Competitors',
        '| Risk | Probability | Impact | Mitigation |',
        '|------|------------|--------|------------|',
        '| | | | |',
        '',
    ];
    return lines.join('\n');
}
function writeCompetitors(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'COMPETITORS.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=competitors-gen.js.map