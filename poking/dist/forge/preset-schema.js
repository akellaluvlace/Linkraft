"use strict";
// Design preset schema: interfaces + validation for Forge design system presets
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePreset = validatePreset;
exports.parsePreset = parsePreset;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_LENGTH_RE = /^\d+(\.\d+)?(px|rem|em|%)$/;
function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function validateColors(colors, errors) {
    if (!isObject(colors)) {
        errors.push({ field: 'tokens.colors', message: 'must be an object' });
        return;
    }
    const required = ['primary', 'secondary', 'background', 'accent', 'surface'];
    for (const key of required) {
        if (!isNonEmptyString(colors[key])) {
            errors.push({ field: `tokens.colors.${key}`, message: 'required color is missing or empty' });
        }
        else if (!HEX_COLOR_RE.test(colors[key])) {
            errors.push({ field: `tokens.colors.${key}`, message: `invalid hex color: ${colors[key]}` });
        }
    }
    for (const [key, val] of Object.entries(colors)) {
        if (!required.includes(key) && isNonEmptyString(val) && !HEX_COLOR_RE.test(val)) {
            errors.push({ field: `tokens.colors.${key}`, message: `invalid hex color: ${val}` });
        }
    }
}
function validateTypographyRole(role, path, errors) {
    if (!isObject(role)) {
        errors.push({ field: path, message: 'must be an object with family and weight' });
        return;
    }
    if (!isNonEmptyString(role['family'])) {
        errors.push({ field: `${path}.family`, message: 'font family is required' });
    }
    if (!isNonEmptyString(role['weight'])) {
        errors.push({ field: `${path}.weight`, message: 'font weight is required' });
    }
}
function validateTypography(typography, errors) {
    if (!isObject(typography)) {
        errors.push({ field: 'tokens.typography', message: 'must be an object' });
        return;
    }
    for (const key of ['heading', 'body', 'mono']) {
        validateTypographyRole(typography[key], `tokens.typography.${key}`, errors);
    }
}
function validateSpacing(spacing, errors) {
    if (!isObject(spacing)) {
        errors.push({ field: 'tokens.spacing', message: 'must be an object' });
        return;
    }
    if (!isNonEmptyString(spacing['unit']) || !CSS_LENGTH_RE.test(spacing['unit'])) {
        errors.push({ field: 'tokens.spacing.unit', message: 'must be a valid CSS length (e.g. "8px")' });
    }
    if (!Array.isArray(spacing['scale']) || spacing['scale'].length === 0) {
        errors.push({ field: 'tokens.spacing.scale', message: 'must be a non-empty array of numbers' });
    }
    else if (!spacing['scale'].every((n) => typeof n === 'number')) {
        errors.push({ field: 'tokens.spacing.scale', message: 'all scale values must be numbers' });
    }
}
function validateBorders(borders, errors) {
    if (!isObject(borders)) {
        errors.push({ field: 'tokens.borders', message: 'must be an object' });
        return;
    }
    for (const key of ['width', 'radius']) {
        if (!isNonEmptyString(borders[key]) || !CSS_LENGTH_RE.test(borders[key])) {
            errors.push({ field: `tokens.borders.${key}`, message: 'must be a valid CSS length' });
        }
    }
    if (!isNonEmptyString(borders['style'])) {
        errors.push({ field: 'tokens.borders.style', message: 'border style is required' });
    }
    if (!isNonEmptyString(borders['color'])) {
        errors.push({ field: 'tokens.borders.color', message: 'border color is required' });
    }
}
function validateShadows(shadows, errors) {
    if (!isObject(shadows)) {
        errors.push({ field: 'tokens.shadows', message: 'must be an object' });
        return;
    }
    for (const key of ['default', 'hover']) {
        if (!isNonEmptyString(shadows[key])) {
            errors.push({ field: `tokens.shadows.${key}`, message: 'required shadow value is missing' });
        }
    }
}
function validateAnimations(animations, errors) {
    if (!isObject(animations)) {
        errors.push({ field: 'tokens.animations', message: 'must be an object' });
        return;
    }
    for (const key of ['style', 'hover']) {
        if (!isNonEmptyString(animations[key])) {
            errors.push({ field: `tokens.animations.${key}`, message: 'required animation value is missing' });
        }
    }
}
function validateTokens(tokens, errors) {
    if (!isObject(tokens)) {
        errors.push({ field: 'tokens', message: 'must be an object' });
        return;
    }
    validateColors(tokens['colors'], errors);
    validateTypography(tokens['typography'], errors);
    validateSpacing(tokens['spacing'], errors);
    validateBorders(tokens['borders'], errors);
    validateShadows(tokens['shadows'], errors);
    validateAnimations(tokens['animations'], errors);
}
/**
 * Check that no forbiddenPattern appears as a substring in any componentOverride value.
 * This catches contradictions like forbidding "rounded-lg" while using it in a button override.
 */
function validateNoContradictions(overrides, forbidden, errors) {
    for (const [component, classes] of Object.entries(overrides)) {
        for (const pattern of forbidden) {
            if (classes.includes(pattern)) {
                errors.push({
                    field: `componentOverrides.${component}`,
                    message: `uses forbidden pattern "${pattern}"`,
                });
            }
        }
    }
}
/**
 * Validates a preset object. Returns an empty array if valid.
 */
function validatePreset(data) {
    const errors = [];
    if (!isObject(data)) {
        errors.push({ field: '(root)', message: 'preset must be a JSON object' });
        return errors;
    }
    // Required string fields
    for (const key of ['name', 'id', 'author', 'description']) {
        if (!isNonEmptyString(data[key])) {
            errors.push({ field: key, message: `"${key}" is required and must be a non-empty string` });
        }
    }
    // id format: lowercase alphanumeric + hyphens
    if (isNonEmptyString(data['id']) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data['id'])) {
        errors.push({ field: 'id', message: 'id must be lowercase alphanumeric with hyphens (e.g. "neo-brutalism")' });
    }
    validateTokens(data['tokens'], errors);
    // componentOverrides
    if (!isObject(data['componentOverrides'])) {
        errors.push({ field: 'componentOverrides', message: 'must be an object mapping component names to Tailwind class strings' });
    }
    else {
        for (const [key, val] of Object.entries(data['componentOverrides'])) {
            if (typeof val !== 'string') {
                errors.push({ field: `componentOverrides.${key}`, message: 'must be a string of Tailwind classes' });
            }
        }
    }
    // forbiddenPatterns
    if (!Array.isArray(data['forbiddenPatterns'])) {
        errors.push({ field: 'forbiddenPatterns', message: 'must be an array of strings' });
    }
    else if (!data['forbiddenPatterns'].every((p) => typeof p === 'string')) {
        errors.push({ field: 'forbiddenPatterns', message: 'all entries must be strings' });
    }
    // requiredFonts
    if (!Array.isArray(data['requiredFonts'])) {
        errors.push({ field: 'requiredFonts', message: 'must be an array of font name strings' });
    }
    else if (!data['requiredFonts'].every((f) => isNonEmptyString(f))) {
        errors.push({ field: 'requiredFonts', message: 'all entries must be non-empty strings' });
    }
    // shadcnTheme: string or null
    if (data['shadcnTheme'] !== null && data['shadcnTheme'] !== undefined && typeof data['shadcnTheme'] !== 'string') {
        errors.push({ field: 'shadcnTheme', message: 'must be a string or null' });
    }
    // Contradiction check: forbidden patterns used in overrides
    if (isObject(data['componentOverrides']) && Array.isArray(data['forbiddenPatterns'])) {
        validateNoContradictions(data['componentOverrides'], data['forbiddenPatterns'], errors);
    }
    return errors;
}
/**
 * Loads and validates a preset from a parsed JSON object.
 * Returns the typed preset if valid, throws with details if invalid.
 */
function parsePreset(data) {
    const errors = validatePreset(data);
    if (errors.length > 0) {
        const details = errors.map(e => `  ${e.field}: ${e.message}`).join('\n');
        throw new Error(`Invalid preset:\n${details}`);
    }
    return data;
}
//# sourceMappingURL=preset-schema.js.map