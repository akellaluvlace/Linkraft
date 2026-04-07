"use strict";
// Design Token Extractor: reads tailwind.config, theme files, CSS variables.
// Outputs DESIGN_TOKENS.md in a format Forge can consume.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDesignTokens = extractDesignTokens;
exports.formatDesignTokens = formatDesignTokens;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const token_editor_js_1 = require("../forge/token-editor.js");
/**
 * Extracts design tokens from the project's config files.
 */
function extractDesignTokens(projectRoot) {
    // Try tailwind.config
    for (const configFile of ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs']) {
        const configPath = path.join(projectRoot, configFile);
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            const tokens = (0, token_editor_js_1.extractTokens)(content);
            return {
                colors: tokens.colors,
                typography: tokens.fontFamily,
                spacing: tokens.spacing,
                radii: tokens.borderRadius,
                shadows: tokens.boxShadow,
            };
        }
    }
    // Try CSS custom properties in globals.css
    for (const cssFile of ['src/app/globals.css', 'app/globals.css', 'src/styles/globals.css', 'styles/globals.css']) {
        const cssPath = path.join(projectRoot, cssFile);
        if (fs.existsSync(cssPath)) {
            const content = fs.readFileSync(cssPath, 'utf-8');
            const tokens = extractCssVariables(content);
            if (Object.keys(tokens.colors).length > 0)
                return tokens;
        }
    }
    return null;
}
/**
 * Generates DESIGN_TOKENS.md from extracted tokens.
 */
function formatDesignTokens(tokens) {
    const lines = ['# Design Tokens', ''];
    if (Object.keys(tokens.colors).length > 0) {
        lines.push('## Colors', '');
        lines.push('| Token | Value |');
        lines.push('|-------|-------|');
        for (const [k, v] of Object.entries(tokens.colors))
            lines.push(`| ${k} | ${v} |`);
        lines.push('');
    }
    if (Object.keys(tokens.typography).length > 0) {
        lines.push('## Typography', '');
        lines.push('| Role | Value |');
        lines.push('|------|-------|');
        for (const [k, v] of Object.entries(tokens.typography))
            lines.push(`| ${k} | ${v} |`);
        lines.push('');
    }
    if (Object.keys(tokens.spacing).length > 0) {
        lines.push('## Spacing', '');
        for (const [k, v] of Object.entries(tokens.spacing))
            lines.push(`- ${k}: ${v}`);
        lines.push('');
    }
    if (Object.keys(tokens.radii).length > 0) {
        lines.push('## Border Radius', '');
        for (const [k, v] of Object.entries(tokens.radii))
            lines.push(`- ${k}: ${v}`);
        lines.push('');
    }
    if (Object.keys(tokens.shadows).length > 0) {
        lines.push('## Shadows', '');
        for (const [k, v] of Object.entries(tokens.shadows))
            lines.push(`- ${k}: ${v}`);
        lines.push('');
    }
    return lines.join('\n');
}
function extractCssVariables(css) {
    const tokens = { colors: {}, typography: {}, spacing: {}, radii: {}, shadows: {} };
    const varRe = /--([a-z][a-z0-9-]*)\s*:\s*([^;]+)/gi;
    let match;
    while ((match = varRe.exec(css)) !== null) {
        const name = match[1];
        const value = match[2].trim();
        if (name.includes('color') || name.includes('bg') || name.includes('foreground') || name.includes('background')) {
            tokens.colors[name] = value;
        }
        else if (name.includes('font') || name.includes('text')) {
            tokens.typography[name] = value;
        }
        else if (name.includes('radius')) {
            tokens.radii[name] = value;
        }
        else if (name.includes('shadow')) {
            tokens.shadows[name] = value;
        }
        else if (name.includes('spacing') || name.includes('gap')) {
            tokens.spacing[name] = value;
        }
    }
    return tokens;
}
//# sourceMappingURL=token-extractor.js.map