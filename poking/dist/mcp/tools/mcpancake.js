"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMcpancakeTools = registerMcpancakeTools;
const zod_1 = require("zod");
const mcpancake_router_js_1 = require("../../shared/mcpancake-router.js");
const component_browser_js_1 = require("../../forge/component-browser.js");
function registerMcpancakeTools(server) {
    server.tool('mcpancake_search_components', 'Searches for UI components across all available MCP sources (shadcn, Magic UI, Vault). Returns unified results with name, source, description, and install command.', {
        query: zod_1.z.string().describe('Search query, e.g. "hero section" or "animated tabs"'),
        source: zod_1.z.string().optional().describe('Filter by source: "shadcn", "magic-ui"'),
        tags: zod_1.z.array(zod_1.z.string()).optional().describe('Filter by tags, e.g. ["hero", "landing"]'),
    }, async ({ query, source, tags }) => {
        const result = await (0, component_browser_js_1.browseComponents)({ query, source, tags });
        return { content: [{ type: 'text', text: (0, component_browser_js_1.formatBrowseResults)(result) }] };
    });
    server.tool('mcpancake_get_docs', 'Fetches documentation for a specific component from available doc sources (Context7).', {
        component: zod_1.z.string().describe('Component name, e.g. "Button"'),
        library: zod_1.z.string().describe('Library name, e.g. "shadcn"'),
    }, async ({ component, library }) => {
        const docs = await mcpancake_router_js_1.mcpancake.getDocs(component, library);
        if (!docs) {
            return { content: [{ type: 'text', text: `No documentation found for ${component} from ${library}.` }] };
        }
        return { content: [{ type: 'text', text: docs.content }] };
    });
    server.tool('mcpancake_available_mcps', 'Lists all known MCPs and whether they are currently available.', {}, async () => {
        const mcps = await mcpancake_router_js_1.mcpancake.getAvailableMcps();
        const lines = mcps.map(m => `- **${m.name}**: ${m.available ? 'available' : 'not connected'}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
}
//# sourceMappingURL=mcpancake.js.map