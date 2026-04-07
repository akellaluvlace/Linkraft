"use strict";
// MCPancake Router: MCP orchestration layer that composes multiple MCPs
// (shadcn, figma, context7, magic-ui, playwright, linkraft) into unified workflows.
// Every MCP is optional. Never throw on unavailability.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpancake = exports.MCPancakeRouter = void 0;
const MCP_CACHE_TTL_MS = 60_000; // Cache availability for 1 minute
class MCPancakeRouter {
    mcpStatus = new Map();
    caller = null;
    /**
     * Sets the MCP call function. This is injected by the host environment
     * (VS Code extension or MCP server) since MCP discovery is environment-specific.
     */
    setCaller(caller) {
        this.caller = caller;
    }
    /**
     * Checks if a specific MCP is available. Caches result per session.
     */
    async hasMcp(name) {
        const cached = this.mcpStatus.get(name);
        if (cached && Date.now() - cached.lastChecked < MCP_CACHE_TTL_MS) {
            return cached.available;
        }
        let available = false;
        if (this.caller) {
            try {
                await this.caller(name, 'ping', {});
                available = true;
            }
            catch {
                available = false;
            }
        }
        this.mcpStatus.set(name, { name, available, lastChecked: Date.now() });
        return available;
    }
    /**
     * Calls an MCP tool. Returns null if the MCP is unavailable.
     */
    async callMcp(mcpName, toolName, args) {
        if (!this.caller)
            return null;
        const available = await this.hasMcp(mcpName);
        if (!available) {
            process.stderr.write(`[mcpancake] Skipped ${mcpName}.${toolName}: MCP unavailable\n`);
            return null;
        }
        try {
            const result = await this.caller(mcpName, toolName, args);
            return result;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[mcpancake] Error calling ${mcpName}.${toolName}: ${msg}\n`);
            return null;
        }
    }
    /**
     * Lists all known MCPs and their availability status.
     */
    async getAvailableMcps() {
        const mcpNames = ['shadcn', 'figma', 'context7', 'magic-ui', 'playwright', 'linkraft'];
        const results = [];
        for (const name of mcpNames) {
            const available = await this.hasMcp(name);
            const info = this.mcpStatus.get(name);
            if (info) {
                results.push(info);
            }
            else {
                results.push({ name, available, lastChecked: Date.now() });
            }
        }
        return results;
    }
    /**
     * Search for components across all available MCPs.
     * Returns unified results regardless of which MCPs are connected.
     */
    async findComponent(query) {
        const results = [];
        // shadcn: search component registry
        const shadcnResult = await this.callMcp('shadcn', 'search', { query });
        if (shadcnResult) {
            results.push(...shadcnResult.map(r => ({ ...r, source: 'shadcn' })));
        }
        // magic-ui: generate/search components
        const magicResult = await this.callMcp('magic-ui', 'search', { query });
        if (magicResult) {
            results.push(...magicResult.map(r => ({ ...r, source: 'magic-ui' })));
        }
        return results;
    }
    /**
     * Fetch documentation for a component from available doc sources.
     */
    async getDocs(component, library) {
        // context7: version-specific docs
        const docResult = await this.callMcp('context7', 'get-docs', {
            component,
            library,
        });
        if (docResult) {
            return { ...docResult, source: 'context7' };
        }
        return null;
    }
    /**
     * Get design tokens from external sources (e.g., Figma).
     */
    async getDesignTokens() {
        const result = await this.callMcp('figma', 'get-tokens', {});
        return result;
    }
    /**
     * Generate a component from a natural language prompt.
     */
    async generateComponent(prompt, tokens) {
        const result = await this.callMcp('magic-ui', 'generate', { prompt, tokens });
        return result;
    }
    /**
     * Take a screenshot via Playwright MCP.
     */
    async screenshot(url, selector) {
        const args = { url };
        if (selector)
            args['selector'] = selector;
        const result = await this.callMcp('playwright', 'screenshot', args);
        return result;
    }
    /**
     * Distribute content via Linkraft MCPs.
     */
    async distribute(platform, content) {
        const result = await this.callMcp('linkraft', 'post', { platform, ...content });
        return result ?? false;
    }
    /**
     * Resets cached MCP availability (useful for testing or reconnection).
     */
    resetCache() {
        this.mcpStatus.clear();
    }
}
exports.MCPancakeRouter = MCPancakeRouter;
// Singleton instance
exports.mcpancake = new MCPancakeRouter();
//# sourceMappingURL=mcpancake-router.js.map