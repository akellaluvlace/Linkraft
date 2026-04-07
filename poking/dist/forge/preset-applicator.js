"use strict";
// Forge Preset Applicator: given a preset and project files, produces a structured
// changeset describing all modifications needed to apply the design system.
// Does NOT modify files directly. Claude applies the changeset.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTailwindChanges = generateTailwindChanges;
exports.scanFileForOverrides = scanFileForOverrides;
exports.scanForForbiddenPatterns = scanForForbiddenPatterns;
exports.generateChangeset = generateChangeset;
/**
 * Generates the token changes needed to apply a preset to a Tailwind config.
 */
function generateTailwindChanges(preset) {
    const changes = [];
    // Colors
    for (const [key, value] of Object.entries(preset.tokens.colors)) {
        changes.push({ section: 'colors', key, value });
    }
    // Font families
    for (const [role, typo] of Object.entries(preset.tokens.typography)) {
        changes.push({ section: 'fontFamily', key: role, value: typo.family });
    }
    // Font weights (as extend entries)
    for (const [role, typo] of Object.entries(preset.tokens.typography)) {
        changes.push({ section: 'fontWeight', key: role, value: typo.weight });
    }
    // Border radius
    changes.push({ section: 'borderRadius', key: 'DEFAULT', value: preset.tokens.borders.radius });
    // Border width
    changes.push({ section: 'borderWidth', key: 'DEFAULT', value: preset.tokens.borders.width });
    // Box shadow
    changes.push({ section: 'boxShadow', key: 'DEFAULT', value: preset.tokens.shadows.default });
    changes.push({ section: 'boxShadow', key: 'hover', value: preset.tokens.shadows.hover });
    // Spacing scale
    for (let i = 0; i < preset.tokens.spacing.scale.length; i++) {
        const val = preset.tokens.spacing.scale[i];
        if (val !== undefined) {
            changes.push({ section: 'spacing', key: String(i), value: `${val}px` });
        }
    }
    return changes;
}
/**
 * Known component-like patterns in JSX/TSX that we can map to preset overrides.
 * Maps common element patterns to override keys.
 */
const COMPONENT_PATTERNS = {
    button: /<(?:button|Button)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]+)["'`]/g,
    card: /<(?:div|Card)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]*\bcard\b[^"'`]*)["'`]/gi,
    input: /<(?:input|Input|textarea|Textarea)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]+)["'`]/g,
    link: /<(?:a|Link)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]+)["'`]/g,
    badge: /<(?:span|Badge)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]*\bbadge\b[^"'`]*)["'`]/gi,
    alert: /<(?:div|Alert)\b[^>]*className\s*=\s*{?\s*["'`]([^"'`]*\balert\b[^"'`]*)["'`]/gi,
};
/**
 * Scans a file's content for components that match preset overrides.
 * Returns class replacements where the preset's override classes should be applied.
 */
function scanFileForOverrides(filePath, content, preset) {
    const replacements = [];
    for (const [componentType, overrideClasses] of Object.entries(preset.componentOverrides)) {
        const pattern = COMPONENT_PATTERNS[componentType];
        if (!pattern)
            continue;
        // Reset regex state
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const matchStart = match.index;
            const classesStr = match[1];
            if (!classesStr)
                continue;
            // Find line number
            let lineNum = 1;
            let col = 0;
            for (let i = 0; i < matchStart; i++) {
                if (content[i] === '\n') {
                    lineNum++;
                    col = 0;
                }
                else {
                    col++;
                }
            }
            replacements.push({
                file: filePath,
                line: lineNum,
                column: col,
                component: componentType,
                oldClasses: classesStr,
                newClasses: overrideClasses,
            });
        }
    }
    return replacements;
}
/**
 * Scans file content for usage of forbidden patterns.
 */
function scanForForbiddenPatterns(filePath, content, forbiddenPatterns) {
    const violations = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line)
            continue;
        for (const pattern of forbiddenPatterns) {
            if (line.includes(pattern)) {
                violations.push({
                    file: filePath,
                    line: i + 1,
                    pattern,
                    context: line.trim(),
                });
            }
        }
    }
    return violations;
}
/**
 * Generates a complete changeset for applying a preset to a set of project files.
 * This is the main entry point for the applicator.
 */
function generateChangeset(preset, projectFiles) {
    const tailwindChanges = generateTailwindChanges(preset);
    const classReplacements = [];
    const forbiddenViolations = [];
    for (const pf of projectFiles) {
        // Only scan TSX/JSX/HTML files for component overrides
        if (/\.(tsx|jsx|html)$/.test(pf.path)) {
            classReplacements.push(...scanFileForOverrides(pf.path, pf.content, preset));
            forbiddenViolations.push(...scanForForbiddenPatterns(pf.path, pf.content, preset.forbiddenPatterns));
        }
    }
    return {
        presetId: preset.id,
        presetName: preset.name,
        tailwindChanges,
        classReplacements,
        forbiddenViolations,
        fontsToInstall: [...preset.requiredFonts],
        shadcnTheme: preset.shadcnTheme,
    };
}
//# sourceMappingURL=preset-applicator.js.map