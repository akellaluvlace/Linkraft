import type { SheepStats, ContentPack } from './types.js';
/**
 * Generates a content pack from completed session stats.
 */
export declare function generateContentPack(stats: SheepStats): ContentPack;
/**
 * Formats the content pack as a markdown file.
 */
export declare function formatContentPack(pack: ContentPack): string;
