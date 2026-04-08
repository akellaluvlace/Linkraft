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
        'DREAMROLL MORNING REPORT',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `Duration: ${report.duration}`,
        `Variations: ${report.totalVariations} total | ${report.gemCount} gems | ${report.iteratedCount} decent | ${report.discardedCount} weak`,
        '',
        'Self-evaluated (Claude scored its own output — scores may have optimism bias)',
        '',
    ];
    if (report.topGems.length > 0) {
        lines.push('TOP GEMS (ranked by average score):');
        lines.push('');
        for (let i = 0; i < report.topGems.length; i++) {
            const gem = report.topGems[i];
            const baseHue = gem.seed.harmonyBaseHue ?? 0;
            lines.push(`#${i + 1} — variation_${String(gem.variationId).padStart(3, '0')}.html  (avg ${gem.averageScore}/10)`);
            lines.push(`     Style: ${gem.seed.genre} | Harmony: ${gem.seed.colorPalette} (base ${baseHue}°)`);
            lines.push(`     Typography: ${gem.seed.typography} | Scale: ${gem.seed.typeScale ?? '—'}`);
            lines.push(`     Layout: ${gem.seed.layoutArchetype} | Density: ${gem.seed.density} | Mood: ${gem.seed.mood}`);
            lines.push(`     Era: ${gem.seed.era} | Animation: ${gem.seed.animation} | Imagery: ${gem.seed.imagery}`);
            lines.push(`     Radius: ${gem.seed.borderRadius ?? '—'} | Shadows: ${gem.seed.shadows ?? '—'} | CTA: ${gem.seed.ctaStyle ?? '—'}`);
            lines.push(`     Constraint: ${gem.seed.wildcard}`);
            for (const s of gem.scores) {
                lines.push(`     ${s.judge.toUpperCase()} (${s.score}): "${s.comment}"`);
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
    lines.push('OPEN IN BROWSER:');
    lines.push('  All variations are standalone HTML files in .dreamroll/variations/');
    lines.push('  Open any file directly to view it.');
    if (report.topGems.length > 0) {
        const top = report.topGems[0];
        lines.push(`  Recommended start: variation_${String(top.variationId).padStart(3, '0')}.html (avg ${top.averageScore}/10)`);
    }
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=reporter.js.map