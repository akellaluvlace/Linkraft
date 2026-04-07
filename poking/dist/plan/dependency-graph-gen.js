"use strict";
// Dependency Graph Generator: maps task dependencies from executive summary action items.
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
exports.collectDependencyGraphContext = collectDependencyGraphContext;
exports.generateDependencyGraphTemplate = generateDependencyGraphTemplate;
exports.writeDependencyGraph = writeDependencyGraph;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectDependencyGraphContext(projectRoot) {
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
    const executiveSummaryContent = readPlan('EXECUTIVE_SUMMARY.md');
    const riskMatrixContent = readPlan('RISK_MATRIX.md');
    const actionItems = extractActionItems(executiveSummaryContent, riskMatrixContent);
    return { projectName, executiveSummaryContent, riskMatrixContent, actionItems };
}
function extractActionItems(execContent, riskContent) {
    const items = [];
    function scanForItems(content, source) {
        const lines = content.split('\n');
        for (const line of lines) {
            // Match table rows with priority column (P0, P1, P2, etc.)
            const tableMatch = line.match(/\|\s*(P\d)\s*\|\s*(.+?)\s*\|/);
            if (tableMatch && tableMatch[1] && tableMatch[2]) {
                const task = tableMatch[2].trim();
                if (task && task !== '' && !task.match(/^[-\s]*$/)) {
                    items.push({ task, priority: tableMatch[1], source });
                }
            }
            // Match checklist items
            const checkMatch = line.match(/^\s*-\s*\[[ x]\]\s*(.+)/);
            if (checkMatch && checkMatch[1]) {
                items.push({ task: checkMatch[1].trim(), priority: 'unranked', source });
            }
            // Match numbered items with "critical" or "high"
            const critMatch = line.match(/^\s*\d+\.\s*(.+(?:critical|high|urgent).+)/i);
            if (critMatch && critMatch[1]) {
                items.push({ task: critMatch[1].trim(), priority: 'P0', source });
            }
        }
    }
    if (execContent)
        scanForItems(execContent, 'EXECUTIVE_SUMMARY.md');
    if (riskContent)
        scanForItems(riskContent, 'RISK_MATRIX.md');
    return items;
}
function generateDependencyGraphTemplate(ctx) {
    const lines = [
        `# Dependency Graph: ${ctx.projectName}`,
        '',
        '## Source Data',
        '',
        `- Executive summary: ${ctx.executiveSummaryContent ? 'available' : 'NOT AVAILABLE (run plan_executive_summary first)'}`,
        `- Risk matrix: ${ctx.riskMatrixContent ? 'available' : 'optional'}`,
        '',
    ];
    if (ctx.actionItems.length > 0) {
        lines.push('## Extracted Action Items', '');
        lines.push('| Task | Priority | Source |');
        lines.push('|------|----------|--------|');
        for (const item of ctx.actionItems) {
            lines.push(`| ${item.task} | ${item.priority} | ${item.source} |`);
        }
        lines.push('');
    }
    lines.push('## Template: Map dependencies and identify the critical path', '', '### Critical Path (longest chain of dependent tasks)', '```', 'Task A -> Task B -> Task C -> Task D', '```', '(Replace with actual task chain. This determines minimum time to completion.)', '', '### Parallel Tracks', '', '**Track A: (name)**', '1. Task', '2. Task', '', '**Track B: (name)**', '1. Task', '2. Task', '', '**Track C: (name)**', '1. Task', '2. Task', '', '### Blocked Items', '| Task | Blocked by | Unblock condition |', '|------|-----------|-------------------|', '| | | |', '', '### Execution Order', '| Phase | Tasks (can run in parallel) | Depends on |', '|-------|---------------------------|------------|', '| 1 | | nothing |', '| 2 | | Phase 1 |', '| 3 | | Phase 2 |', '');
    return lines.join('\n');
}
function writeDependencyGraph(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'DEPENDENCY_GRAPH.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=dependency-graph-gen.js.map