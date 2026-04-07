import type { ApiEndpoint } from './types.js';
/**
 * Scans the project for all API endpoints.
 */
export declare function mapApiEndpoints(projectRoot: string): ApiEndpoint[];
/**
 * Generates API_MAP.md content from endpoints.
 */
export declare function formatApiMap(endpoints: ApiEndpoint[]): string;
