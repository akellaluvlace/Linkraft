"use strict";
// Component Browser: searches components across all available MCPs via MCPancake.
// Returns unified results with consistent metadata.
Object.defineProperty(exports, "__esModule", { value: true });
exports.browseComponents = browseComponents;
exports.getComponentDocs = getComponentDocs;
exports.formatBrowseResults = formatBrowseResults;
const mcpancake_router_js_1 = require("../shared/mcpancake-router.js");
/**
 * Searches for components across all available MCP sources.
 * Filters results by optional criteria.
 */
async function browseComponents(options) {
    let results = await mcpancake_router_js_1.mcpancake.findComponent(options.query);
    // Filter by source if specified
    if (options.source) {
        results = results.filter(r => r.source === options.source);
    }
    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
        results = results.filter(r => options.tags.some(tag => r.tags.includes(tag)));
    }
    // Collect unique sources
    const sources = [...new Set(results.map(r => r.source))];
    return {
        results,
        sources,
        totalCount: results.length,
    };
}
/**
 * Gets documentation for a specific component.
 */
async function getComponentDocs(component, library) {
    const docs = await mcpancake_router_js_1.mcpancake.getDocs(component, library);
    return docs?.content ?? null;
}
/**
 * Formats browse results as a readable string for Claude to present.
 */
function formatBrowseResults(result) {
    if (result.totalCount === 0) {
        return 'No components found matching your query.';
    }
    const lines = [
        `Found ${result.totalCount} component(s) from ${result.sources.join(', ')}:`,
        '',
    ];
    for (const comp of result.results) {
        lines.push(`**${comp.name}** (${comp.source})`);
        lines.push(`  ${comp.description}`);
        if (comp.installCommand) {
            lines.push(`  Install: \`${comp.installCommand}\``);
        }
        if (comp.tags.length > 0) {
            lines.push(`  Tags: ${comp.tags.join(', ')}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=component-browser.js.map