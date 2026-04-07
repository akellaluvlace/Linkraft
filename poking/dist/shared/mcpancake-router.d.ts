export interface McpInfo {
    name: string;
    available: boolean;
    lastChecked: number;
}
export interface ComponentResult {
    name: string;
    source: string;
    description: string;
    installCommand: string | null;
    previewUrl: string | null;
    tags: string[];
}
export interface DocResult {
    content: string;
    source: string;
    version: string | null;
}
export interface McpCallResult<T> {
    data: T;
    source: string;
}
type McpCaller = (mcpName: string, toolName: string, args: Record<string, unknown>) => Promise<unknown>;
export declare class MCPancakeRouter {
    private mcpStatus;
    private caller;
    /**
     * Sets the MCP call function. This is injected by the host environment
     * (VS Code extension or MCP server) since MCP discovery is environment-specific.
     */
    setCaller(caller: McpCaller): void;
    /**
     * Checks if a specific MCP is available. Caches result per session.
     */
    hasMcp(name: string): Promise<boolean>;
    /**
     * Calls an MCP tool. Returns null if the MCP is unavailable.
     */
    callMcp<T>(mcpName: string, toolName: string, args: Record<string, unknown>): Promise<T | null>;
    /**
     * Lists all known MCPs and their availability status.
     */
    getAvailableMcps(): Promise<McpInfo[]>;
    /**
     * Search for components across all available MCPs.
     * Returns unified results regardless of which MCPs are connected.
     */
    findComponent(query: string): Promise<ComponentResult[]>;
    /**
     * Fetch documentation for a component from available doc sources.
     */
    getDocs(component: string, library: string): Promise<DocResult | null>;
    /**
     * Get design tokens from external sources (e.g., Figma).
     */
    getDesignTokens(): Promise<Record<string, unknown> | null>;
    /**
     * Generate a component from a natural language prompt.
     */
    generateComponent(prompt: string, tokens: Record<string, unknown>): Promise<string | null>;
    /**
     * Take a screenshot via Playwright MCP.
     */
    screenshot(url: string, selector?: string): Promise<string | null>;
    /**
     * Distribute content via Linkraft MCPs.
     */
    distribute(platform: string, content: Record<string, unknown>): Promise<boolean>;
    /**
     * Resets cached MCP availability (useful for testing or reconnection).
     */
    resetCache(): void;
}
export declare const mcpancake: MCPancakeRouter;
export {};
