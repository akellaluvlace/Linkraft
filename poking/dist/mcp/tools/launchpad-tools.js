"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLaunchpadTools = registerLaunchpadTools;
const zod_1 = require("zod");
const planner_js_1 = require("../../launchpad/planner.js");
const tester_js_1 = require("../../launchpad/tester.js");
const distributor_js_1 = require("../../launchpad/distributor.js");
function registerLaunchpadTools(server) {
    server.tool('launchpad_plan', 'Generates planning documents for a landing page: brief, wireframe, SEO config, copy structure. Writes to .launchpad/ directory.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        productName: zod_1.z.string().describe('Product name'),
        productDescription: zod_1.z.string().describe('What the product does'),
        targetAudience: zod_1.z.string().describe('Who the product is for'),
        uniqueValue: zod_1.z.string().describe('Unique value proposition (one sentence)'),
        tone: zod_1.z.string().describe('Desired tone: professional, playful, technical, etc.'),
    }, async ({ projectRoot, productName, productDescription, targetAudience, uniqueValue, tone }) => {
        const brief = { productName, productDescription, targetAudience, uniqueValue, tone };
        const result = (0, planner_js_1.writePlanningFiles)(projectRoot, brief);
        return {
            content: [{
                    type: 'text',
                    text: `Planning files created in ${result.dir}:\n${result.files.map(f => `  - ${f}`).join('\n')}`,
                }],
        };
    });
    server.tool('launchpad_test', 'Runs quality checks on a landing page: Lighthouse scores, responsive screenshots, CTA visibility.', {
        pageUrl: zod_1.z.string().describe('URL of the page to test, e.g. "http://localhost:3000"'),
    }, async ({ pageUrl }) => {
        const results = await (0, tester_js_1.runTests)(pageUrl);
        return { content: [{ type: 'text', text: (0, tester_js_1.formatTestResults)(results) }] };
    });
    server.tool('launchpad_distribute', 'Generates distribution drafts for LinkedIn, Twitter, Product Hunt, Reddit, and email. Saves to .launchpad/distribution/.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        productName: zod_1.z.string().describe('Product name'),
        productDescription: zod_1.z.string().describe('What the product does'),
        targetAudience: zod_1.z.string().describe('Who the product is for'),
        uniqueValue: zod_1.z.string().describe('Unique value proposition'),
        tone: zod_1.z.string().describe('Desired tone'),
    }, async ({ projectRoot, productName, productDescription, targetAudience, uniqueValue, tone }) => {
        const brief = { productName, productDescription, targetAudience, uniqueValue, tone };
        const drafts = (0, distributor_js_1.generateAllDrafts)(brief);
        const files = (0, distributor_js_1.writeDrafts)(projectRoot, drafts);
        return {
            content: [{
                    type: 'text',
                    text: `Distribution drafts created:\n${files.map(f => `  - ${f}`).join('\n')}\n\nThese are drafts for your review. Edit before posting.`,
                }],
        };
    });
    server.tool('launchpad_status', 'Shows the current Launchpad pipeline status: which phases are complete.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
    }, async ({ projectRoot }) => {
        const fs = await import('fs');
        const path = await import('path');
        const dir = path.join(projectRoot, '.launchpad');
        if (!fs.existsSync(dir)) {
            return { content: [{ type: 'text', text: 'No Launchpad session. Run /launchpad plan to start.' }] };
        }
        const files = fs.readdirSync(dir);
        const hasBrief = files.includes('brief.md');
        const hasWireframe = files.includes('wireframe.json');
        const hasCopy = files.includes('copy.json');
        const hasSEO = files.includes('seo.json');
        const hasDist = fs.existsSync(path.join(dir, 'distribution'));
        const lines = [
            `Planning: ${hasBrief ? 'DONE' : 'pending'}`,
            `Wireframe: ${hasWireframe ? 'DONE' : 'pending'}`,
            `Copy: ${hasCopy ? 'DONE' : 'pending'}`,
            `SEO: ${hasSEO ? 'DONE' : 'pending'}`,
            `Build: pending (run manually)`,
            `Test: pending (run launchpad_test)`,
            `Distribution: ${hasDist ? 'DONE' : 'pending'}`,
        ];
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
}
//# sourceMappingURL=launchpad-tools.js.map