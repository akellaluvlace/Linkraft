"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sheep_tools_js_1 = require("./tools/sheep-tools.js");
const plan_tools_js_1 = require("./tools/plan-tools.js");
const preflight_tools_js_1 = require("./tools/preflight-tools.js");
const dreamroll_tools_js_1 = require("./tools/dreamroll-tools.js");
// v1.0 launch: plan, preflight, sheep, dreamroll.
// Poke, forge, vault, launchpad tools remain deferred.
async function main() {
    const server = new mcp_js_1.McpServer({
        name: 'linkraft',
        version: '1.0.0',
    });
    (0, plan_tools_js_1.registerPlanTools)(server);
    (0, preflight_tools_js_1.registerPreflightTools)(server);
    (0, sheep_tools_js_1.registerSheepTools)(server);
    (0, dreamroll_tools_js_1.registerDreamrollTools)(server);
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('[linkraft] MCP server running on stdio\n');
}
main().catch((error) => {
    process.stderr.write(`[linkraft] Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
//# sourceMappingURL=server.js.map