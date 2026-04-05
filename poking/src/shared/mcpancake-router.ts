// MCPancake Router: MCP orchestration layer that composes multiple MCPs
// (shadcn, figma, context7, magic-ui, playwright, linkraft) into unified workflows.
// Every MCP is optional. Never throw on unavailability.

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

const MCP_CACHE_TTL_MS = 60_000; // Cache availability for 1 minute

export class MCPancakeRouter {
  private mcpStatus: Map<string, McpInfo> = new Map();
  private caller: McpCaller | null = null;

  /**
   * Sets the MCP call function. This is injected by the host environment
   * (VS Code extension or MCP server) since MCP discovery is environment-specific.
   */
  setCaller(caller: McpCaller): void {
    this.caller = caller;
  }

  /**
   * Checks if a specific MCP is available. Caches result per session.
   */
  async hasMcp(name: string): Promise<boolean> {
    const cached = this.mcpStatus.get(name);
    if (cached && Date.now() - cached.lastChecked < MCP_CACHE_TTL_MS) {
      return cached.available;
    }

    let available = false;
    if (this.caller) {
      try {
        await this.caller(name, 'ping', {});
        available = true;
      } catch {
        available = false;
      }
    }

    this.mcpStatus.set(name, { name, available, lastChecked: Date.now() });
    return available;
  }

  /**
   * Calls an MCP tool. Returns null if the MCP is unavailable.
   */
  async callMcp<T>(mcpName: string, toolName: string, args: Record<string, unknown>): Promise<T | null> {
    if (!this.caller) return null;
    const available = await this.hasMcp(mcpName);
    if (!available) {
      process.stderr.write(`[mcpancake] Skipped ${mcpName}.${toolName}: MCP unavailable\n`);
      return null;
    }

    try {
      const result = await this.caller(mcpName, toolName, args);
      return result as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[mcpancake] Error calling ${mcpName}.${toolName}: ${msg}\n`);
      return null;
    }
  }

  /**
   * Lists all known MCPs and their availability status.
   */
  async getAvailableMcps(): Promise<McpInfo[]> {
    const mcpNames = ['shadcn', 'figma', 'context7', 'magic-ui', 'playwright', 'linkraft'];
    const results: McpInfo[] = [];

    for (const name of mcpNames) {
      const available = await this.hasMcp(name);
      const info = this.mcpStatus.get(name);
      if (info) {
        results.push(info);
      } else {
        results.push({ name, available, lastChecked: Date.now() });
      }
    }

    return results;
  }

  /**
   * Search for components across all available MCPs.
   * Returns unified results regardless of which MCPs are connected.
   */
  async findComponent(query: string): Promise<ComponentResult[]> {
    const results: ComponentResult[] = [];

    // shadcn: search component registry
    const shadcnResult = await this.callMcp<ComponentResult[]>('shadcn', 'search', { query });
    if (shadcnResult) {
      results.push(...shadcnResult.map(r => ({ ...r, source: 'shadcn' })));
    }

    // magic-ui: generate/search components
    const magicResult = await this.callMcp<ComponentResult[]>('magic-ui', 'search', { query });
    if (magicResult) {
      results.push(...magicResult.map(r => ({ ...r, source: 'magic-ui' })));
    }

    return results;
  }

  /**
   * Fetch documentation for a component from available doc sources.
   */
  async getDocs(component: string, library: string): Promise<DocResult | null> {
    // context7: version-specific docs
    const docResult = await this.callMcp<DocResult>('context7', 'get-docs', {
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
  async getDesignTokens(): Promise<Record<string, unknown> | null> {
    const result = await this.callMcp<Record<string, unknown>>('figma', 'get-tokens', {});
    return result;
  }

  /**
   * Generate a component from a natural language prompt.
   */
  async generateComponent(prompt: string, tokens: Record<string, unknown>): Promise<string | null> {
    const result = await this.callMcp<string>('magic-ui', 'generate', { prompt, tokens });
    return result;
  }

  /**
   * Take a screenshot via Playwright MCP.
   */
  async screenshot(url: string, selector?: string): Promise<string | null> {
    const args: Record<string, unknown> = { url };
    if (selector) args['selector'] = selector;
    const result = await this.callMcp<string>('playwright', 'screenshot', args);
    return result;
  }

  /**
   * Distribute content via Linkraft MCPs.
   */
  async distribute(platform: string, content: Record<string, unknown>): Promise<boolean> {
    const result = await this.callMcp<boolean>('linkraft', 'post', { platform, ...content });
    return result ?? false;
  }

  /**
   * Resets cached MCP availability (useful for testing or reconnection).
   */
  resetCache(): void {
    this.mcpStatus.clear();
  }
}

// Singleton instance
export const mcpancake = new MCPancakeRouter();
