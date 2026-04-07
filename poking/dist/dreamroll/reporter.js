"use strict";
// Dreamroll Reporter: generates the morning report from run state.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
exports.formatReport = formatReport;
const evolution_js_1 = require("./evolution.js");
/**
 * Formats milliseconds as a human-readable duration string.
 */
function formatDuration(ms) {
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
/**
 * Generates a morning report from the current state.
 */
function generateReport(state) {
    const gemVariations = state.variations.filter(v => state.gems.includes(v.id));
    const iteratedCount = state.variations.filter(v => v.verdict?.verdict === 'iterate').length;
    const discardedCount = state.variations.filter(v => v.verdict?.verdict === 'discard').length;
    // Sort gems by average score descending
    const topGems = gemVariations
        .filter(v => v.verdict)
        .sort((a, b) => (b.verdict?.averageScore ?? 0) - (a.verdict?.averageScore ?? 0))
        .slice(0, 5)
        .map(v => ({
        variationId: v.id,
        averageScore: v.verdict.averageScore,
        scores: v.verdict.scores,
        seed: v.seed,
        screenshotPath: v.screenshotPath,
    }));
    const patterns = (0, evolution_js_1.detectPatterns)(state);
    // Find wildcards that produced gems
    const wildcardDiscoveries = [];
    for (const gem of gemVariations) {
        if (gem.seed.wildcard) {
            wildcardDiscoveries.push(`"${gem.seed.wildcard}" -> gem v${gem.id} (${gem.verdict?.averageScore ?? 0}/10)`);
        }
    }
    return {
        duration: formatDuration(state.elapsedMs),
        totalVariations: state.variations.length,
        gemCount: gemVariations.length,
        iteratedCount,
        discardedCount,
        topGems,
        patterns,
        wildcardDiscoveries: [...new Set(wildcardDiscoveries)],
    };
}
/**
 * Formats the morning report as a readable markdown string.
 */
function formatReport(report) {
    const lines = [
        'DREAMROLL COMPLETE',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `Duration: ${report.duration}`,
        `Variations generated: ${report.totalVariations}`,
        `Gems saved: ${report.gemCount}`,
        `Iterated improvements: ${report.iteratedCount}`,
        `Discarded: ${report.discardedCount}`,
        '',
    ];
    if (report.topGems.length > 0) {
        lines.push('TOP GEMS:');
        lines.push('');
        for (let i = 0; i < report.topGems.length; i++) {
            const gem = report.topGems[i];
            lines.push(`#${i + 1} - v${String(gem.variationId).padStart(3, '0')}  Score: ${gem.averageScore}/10`);
            lines.push(`     Layout: ${gem.seed.layoutArchetype} | Genre: ${gem.seed.genre} | Mood: ${gem.seed.mood}`);
            for (const s of gem.scores) {
                lines.push(`     ${s.judge.toUpperCase()}: ${s.score} ("${s.comment}")`);
            }
            if (gem.screenshotPath) {
                lines.push(`     Screenshot: ${gem.screenshotPath}`);
            }
            lines.push('');
        }
    }
    if (report.patterns.length > 0) {
        lines.push('EMERGING PATTERNS:');
        for (const p of report.patterns) {
            lines.push(`- ${p}`);
        }
        lines.push('');
    }
    if (report.wildcardDiscoveries.length > 0) {
        lines.push('WILDCARD DISCOVERIES:');
        for (const w of report.wildcardDiscoveries) {
            lines.push(`- ${w}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=reporter.js.map