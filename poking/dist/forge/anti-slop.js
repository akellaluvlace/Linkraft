"use strict";
// Anti-Slop Engine: detects forbidden pattern violations in project files.
// Used by Forge SKILL.md to teach Claude what NOT to generate.
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectViolations = detectViolations;
exports.generateSlopReport = generateSlopReport;
exports.formatSlopReport = formatSlopReport;
// Common replacements for forbidden patterns by design system context
const PATTERN_SUGGESTIONS = {
    'rounded-lg': 'Use rounded-none or the preset\'s border radius',
    'rounded-xl': 'Use rounded-none or the preset\'s border radius',
    'rounded-full': 'Use rounded-none or the preset\'s border radius',
    'rounded-2xl': 'Use rounded-none or the preset\'s border radius',
    'rounded-3xl': 'Use rounded-none or the preset\'s border radius',
    'bg-gradient-to-': 'Use solid colors from the preset\'s color tokens',
    'shadow-sm': 'Use the preset\'s shadow tokens or shadow-none',
    'shadow-md': 'Use the preset\'s shadow tokens or shadow-none',
    'shadow-lg': 'Use the preset\'s shadow tokens or shadow-none',
    'shadow-xl': 'Use the preset\'s shadow tokens or shadow-none',
    'opacity-': 'Avoid transparency; use solid colors from the preset',
    'blur-': 'Avoid blur effects with this preset',
    'backdrop-blur': 'Avoid backdrop blur with this preset',
    'border-3': 'Use the preset\'s border width token',
    'border-4': 'Use the preset\'s border width token',
    'shadow-[': 'Use the preset\'s shadow tokens',
    'rounded-none': 'Use the preset\'s border radius token',
    'italic': 'Avoid italic with this preset',
    'uppercase': 'Check if the preset allows text transforms',
};
const DEFAULT_SUGGESTION = 'Remove or replace with a pattern from the active preset';
/**
 * Scans file content for forbidden pattern violations.
 * Returns detailed violation info with suggestions for fixes.
 */
function detectViolations(filePath, content, forbiddenPatterns) {
    const violations = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line)
            continue;
        // Skip comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
            continue;
        for (const pattern of forbiddenPatterns) {
            if (line.includes(pattern)) {
                violations.push({
                    file: filePath,
                    line: i + 1,
                    pattern,
                    context: trimmed,
                    suggestion: PATTERN_SUGGESTIONS[pattern] ?? DEFAULT_SUGGESTION,
                });
            }
        }
    }
    return violations;
}
/**
 * Generates a summary report from a list of violations.
 */
function generateSlopReport(violations) {
    const byPattern = {};
    const byFile = {};
    for (const v of violations) {
        byPattern[v.pattern] = (byPattern[v.pattern] ?? 0) + 1;
        byFile[v.file] = (byFile[v.file] ?? 0) + 1;
    }
    return {
        totalViolations: violations.length,
        fileCount: Object.keys(byFile).length,
        byPattern,
        byFile,
        violations,
    };
}
/**
 * Formats a slop report as a human-readable string for Claude to present.
 */
function formatSlopReport(report) {
    if (report.totalViolations === 0) {
        return 'No forbidden pattern violations found. Code is clean.';
    }
    const lines = [
        `Found ${report.totalViolations} violation(s) across ${report.fileCount} file(s):`,
        '',
    ];
    // By pattern summary
    const sortedPatterns = Object.entries(report.byPattern).sort((a, b) => b[1] - a[1]);
    lines.push('Violations by pattern:');
    for (const [pattern, count] of sortedPatterns) {
        lines.push(`  "${pattern}": ${count} occurrence(s)`);
    }
    lines.push('');
    // Details per file
    const fileGroups = new Map();
    for (const v of report.violations) {
        const existing = fileGroups.get(v.file);
        if (existing) {
            existing.push(v);
        }
        else {
            fileGroups.set(v.file, [v]);
        }
    }
    for (const [file, fileViolations] of fileGroups) {
        lines.push(`${file}:`);
        for (const v of fileViolations) {
            lines.push(`  L${v.line}: "${v.pattern}" — ${v.suggestion}`);
            lines.push(`    > ${v.context}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=anti-slop.js.map