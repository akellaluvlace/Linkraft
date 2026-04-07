"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSheepTools = registerSheepTools;
const zod_1 = require("zod");
const auto_config_js_1 = require("../../sheep/auto-config.js");
const hunter_js_1 = require("../../sheep/hunter.js");
const stats_js_1 = require("../../sheep/stats.js");
function registerSheepTools(server) {
    server.tool('sheep_scan', 'Auto-detects project stack, build/test commands, and generates a QA plan. Zero config.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const config = (0, auto_config_js_1.autoConfig)(projectRoot);
        const qaPlan = (0, auto_config_js_1.generateQAPlan)(config);
        const summary = [
            `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
            `Styling: ${config.stack.styling ?? 'none detected'}`,
            `Database: ${config.stack.database ?? 'none detected'}`,
            `Testing: ${config.stack.testing ?? 'none detected'}`,
            `Build: ${config.buildCommand ?? 'not found'}`,
            `Test: ${config.testCommand ?? 'not found'}`,
            `Package manager: ${config.stack.packageManager}`,
            '', '---', '',
            qaPlan,
        ].join('\n');
        return { content: [{ type: 'text', text: summary }] };
    });
    server.tool('sheep_init', 'Initializes or resumes a Sheep QA session. Creates .sheep/ with QA plan, stats, story, human-review. Resumes automatically if a running session exists.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const { config, stats, resumed, preflightUsed } = (0, hunter_js_1.initSession)(projectRoot);
        const status = resumed ? 'RESUMED' : 'INITIALIZED';
        return {
            content: [{
                    type: 'text',
                    text: [
                        `SheepCalledShip ${status}.`,
                        '',
                        `Project: ${projectRoot}`,
                        `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
                        `Build: ${config.buildCommand ?? 'not detected'}`,
                        `Test: ${config.testCommand ?? 'not detected'}`,
                        resumed ? `Resuming from cycle ${stats.cycleCount}` : '',
                        preflightUsed ? 'Preflight report found: using findings to prioritize QA plan.' : '',
                        '',
                        'Files:',
                        '  .sheep/QA_PLAN.md      QA plan',
                        '  .sheep/stats.json      live stats',
                        '  .sheep/story.md        narrative report',
                        '  .sheep/human-review.md logged items',
                        '',
                        'Call sheep_next to get the next target area.',
                    ].filter(l => l !== '').join('\n'),
                }],
        };
    });
    server.tool('sheep_next', 'Returns the next area to test: area name, files, description, risk level. Returns instructions for the analysis/fix/commit loop.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const next = (0, hunter_js_1.getNextArea)(projectRoot);
        if (!next) {
            return { content: [{ type: 'text', text: 'All cycles complete. Call sheep_complete to finalize.' }] };
        }
        const lines = [
            `CYCLE ${next.cycleNumber}`,
            `Area: ${next.area}`,
            `Risk: ${next.riskLevel}`,
            `Description: ${next.description}`,
            '',
            'Files to scan:',
            ...next.files.map(f => `  ${f}`),
            '',
            'Loop:',
            '1. Read files, find bugs (null checks, error handling, types, security)',
            '2. Categorize: FIX (safe) or LOG (needs human)',
            '3. Apply FIX items, run build, run tests',
            '4. If build/tests fail: revert, mark as LOG',
            '5. If pass: git commit with [sheep] prefix',
            '6. Call sheep_record_cycle with results',
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('sheep_record_cycle', 'Records a completed cycle. Generates persona commentary (deezeebalz99, Martha, Sheep). Writes to stats, story, human-review.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        area: zod_1.z.string().describe('Area tested'),
        target: zod_1.z.string().describe('What was examined'),
        filesScanned: zod_1.z.array(zod_1.z.string()).describe('Files scanned'),
        bugsFound: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            file: zod_1.z.string(),
            line: zod_1.z.number().nullable(),
            severity: zod_1.z.enum(['critical', 'high', 'medium', 'low']),
            category: zod_1.z.string(),
            description: zod_1.z.string(),
            fix: zod_1.z.string().nullable(),
            autoFixed: zod_1.z.boolean(),
            whyNotFixed: zod_1.z.string().nullable(),
        })).describe('All bugs found'),
        buildPassed: zod_1.z.boolean(),
        testsPassed: zod_1.z.boolean(),
        testCount: zod_1.z.number(),
        commitHash: zod_1.z.string().nullable(),
    }, async (input) => {
        const bugsFixed = input.bugsFound.filter(b => b.autoFixed);
        const bugsLogged = input.bugsFound.filter(b => !b.autoFixed);
        const result = (0, hunter_js_1.recordCycleResult)(input.projectRoot, {
            area: input.area,
            target: input.target,
            filesScanned: input.filesScanned,
            bugsFound: input.bugsFound,
            bugsFixed,
            bugsLogged,
            buildPassed: input.buildPassed,
            testsPassed: input.testsPassed,
            testCount: input.testCount,
            commitHash: input.commitHash,
        });
        const lines = [
            `Cycle ${result.cycleNumber} recorded.`,
            `Bugs: ${result.bugsFound.length} found, ${result.bugsFixed.length} fixed, ${result.bugsLogged.length} logged`,
            `Build: ${result.buildPassed ? 'PASS' : 'FAIL'} | Tests: ${result.testCount}`,
            result.commitHash ? `Commit: ${result.commitHash}` : '',
            '',
        ];
        if (result.sheepMonologue)
            lines.push(`Sheep: "${result.sheepMonologue}"`);
        if (result.deezeebalzRoast)
            lines.push(`deezeebalz99: "${result.deezeebalzRoast}"`);
        if (result.marthaMessage)
            lines.push(`Martha: ${result.marthaMessage}`);
        lines.push('', 'Call sheep_next for the next target.');
        return { content: [{ type: 'text', text: lines.filter(l => l !== '').join('\n') }] };
    });
    server.tool('sheep_complete', 'Completes the session. Generates content-pack.md, writes epilogue, finalizes stats.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const { stats, contentPackPath } = (0, hunter_js_1.completeHunt)(projectRoot);
        return {
            content: [{
                    type: 'text',
                    text: [
                        'SHEEPCALLEDSHIP SESSION COMPLETE',
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                        '',
                        `Cycles: ${stats.cycleCount} | Runtime: ${stats.totalRuntimeMinutes}m`,
                        `Bugs: ${stats.bugs.discovered} found, ${stats.bugs.autoFixed} fixed, ${stats.bugs.logged} logged`,
                        `Commits: ${stats.commits}`,
                        '',
                        'Output:',
                        '  .sheep/stats.json        final statistics',
                        '  .sheep/story.md          narrative field report',
                        '  .sheep/human-review.md   items for human review',
                        `  ${contentPackPath}   social media content`,
                    ].join('\n'),
                }],
        };
    });
    server.tool('sheep_status', 'Live session status: cycles, bugs, areas, runtime, latest persona commentary.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        return { content: [{ type: 'text', text: (0, hunter_js_1.getReport)(projectRoot) }] };
    });
    server.tool('sheep_report', 'Full session report with output file locations.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const stats = (0, stats_js_1.loadStats)(projectRoot);
        if (!stats) {
            return { content: [{ type: 'text', text: 'No Sheep session. Run /linkraft sheep to start.' }] };
        }
        const report = (0, hunter_js_1.getReport)(projectRoot);
        const extras = [
            report,
            'Output:',
            '  .sheep/QA_PLAN.md        QA plan',
            '  .sheep/stats.json        statistics',
            '  .sheep/story.md          narrative',
            '  .sheep/human-review.md   human items',
            stats.status === 'completed' ? '  .sheep/content-pack.md   content' : '',
        ].filter(l => l !== '');
        return { content: [{ type: 'text', text: extras.join('\n') }] };
    });
}
//# sourceMappingURL=sheep-tools.js.map