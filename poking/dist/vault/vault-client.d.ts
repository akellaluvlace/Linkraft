import type { VaultComponent, VaultComponentMeta, VaultSearchOptions } from './types.js';
export interface VaultClientOptions {
    repoOwner?: string;
    repoName?: string;
}
export interface VaultResult<T> {
    data: T;
    source: 'github' | 'bundled' | 'local';
    message: string | null;
}
export declare class VaultClient {
    private rawBase;
    private indexCache;
    private indexCacheTime;
    constructor(options?: VaultClientOptions);
    /**
     * Fetches the vault index from GitHub.
     * Falls back to bundled components if GitHub is unreachable.
     */
    getIndex(): Promise<VaultResult<VaultComponentMeta[]>>;
    /**
     * Browse all available components. Never returns empty.
     */
    browse(): Promise<VaultResult<VaultComponentMeta[]>>;
    /**
     * Search components by query, tags, framework, or design system.
     */
    search(options: VaultSearchOptions): Promise<VaultResult<VaultComponentMeta[]>>;
    /**
     * Download a full component package by name.
     */
    download(componentName: string): Promise<VaultResult<VaultComponent | null>>;
    /**
     * Clears the cached index.
     */
    clearCache(): void;
}
export declare const vaultClient: VaultClient;
