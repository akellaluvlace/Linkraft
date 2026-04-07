"use strict";
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
exports.registerForgeTools = registerForgeTools;
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const preset_schema_js_1 = require("../../forge/preset-schema.js");
const preset_applicator_js_1 = require("../../forge/preset-applicator.js");
const token_editor_js_1 = require("../../forge/token-editor.js");
const anti_slop_js_1 = require("../../forge/anti-slop.js");
function getPresetsDir() {
    return path.resolve(__dirname, '../../../presets');
}
function loadAllPresets() {
    const dir = getPresetsDir();
    if (!fs.existsSync(dir))
        return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const presets = [];
    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
            const data = JSON.parse(raw);
            const errors = (0, preset_schema_js_1.validatePreset)(data);
            if (errors.length === 0) {
                presets.push(data);
            }
        }
        catch {
            // Skip invalid presets
        }
    }
    return presets;
}
function loadPresetById(id) {
    const presets = loadAllPresets();
    return presets.find(p => p.id === id) ?? null;
}
function registerForgeTools(server) {
    server.tool('forge_list_presets', 'Lists all available design system presets with name, id, and description.', {}, async () => {
        const presets = loadAllPresets();
        if (presets.length === 0) {
            return { content: [{ type: 'text', text: 'No presets found.' }] };
        }
        const lines = presets.map(p => `- **${p.name}** (${p.id}): ${p.description}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('forge_get_preset', 'Returns the full details of a design preset by ID, including tokens, component overrides, and forbidden patterns.', { id: zod_1.z.string().describe('Preset ID, e.g. "neo-brutalism"') }, async ({ id }) => {
        const preset = loadPresetById(id);
        if (!preset) {
            return { content: [{ type: 'text', text: `Preset "${id}" not found.` }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(preset, null, 2) }] };
    });
    server.tool('forge_apply_preset', 'Generates a changeset for applying a design preset to project files. Returns token changes, class replacements, and forbidden pattern violations. Does not modify files directly.', {
        presetId: zod_1.z.string().describe('Preset ID to apply, e.g. "neo-brutalism"'),
        files: zod_1.z.array(zod_1.z.object({
            path: zod_1.z.string().describe('File path relative to project root'),
            content: zod_1.z.string().describe('File content'),
        })).describe('Project files to analyze (TSX/JSX/HTML)'),
    }, async ({ presetId, files }) => {
        const preset = loadPresetById(presetId);
        if (!preset) {
            return { content: [{ type: 'text', text: `Preset "${presetId}" not found.` }] };
        }
        const changeset = (0, preset_applicator_js_1.generateChangeset)(preset, files);
        return { content: [{ type: 'text', text: JSON.stringify(changeset, null, 2) }] };
    });
    server.tool('forge_get_tokens', 'Reads design tokens from a Tailwind config file content. Returns structured colors, fonts, spacing, borders, shadows.', {
        configContent: zod_1.z.string().describe('The content of tailwind.config.ts or tailwind.config.js'),
    }, async ({ configContent }) => {
        const tokens = (0, token_editor_js_1.extractTokens)(configContent);
        const { raw: _raw, ...display } = tokens;
        return { content: [{ type: 'text', text: JSON.stringify(display, null, 2) }] };
    });
    server.tool('forge_set_tokens', 'Updates a specific design token in a Tailwind config. Returns the modified config content.', {
        configContent: zod_1.z.string().describe('Current tailwind.config content'),
        section: zod_1.z.string().describe('Token section: colors, fontFamily, borderRadius, boxShadow, etc.'),
        key: zod_1.z.string().describe('Token key within the section, e.g. "primary"'),
        value: zod_1.z.string().describe('New value, e.g. "#FF0000"'),
    }, async ({ configContent, section, key, value }) => {
        const updated = (0, token_editor_js_1.updateToken)(configContent, section, key, value);
        return { content: [{ type: 'text', text: updated }] };
    });
    server.tool('forge_check_violations', 'Scans file content for forbidden pattern violations against a preset. Returns violations with file, line, pattern, and suggestion.', {
        presetId: zod_1.z.string().describe('Preset ID whose forbidden patterns to check against'),
        files: zod_1.z.array(zod_1.z.object({
            path: zod_1.z.string().describe('File path'),
            content: zod_1.z.string().describe('File content'),
        })).describe('Files to scan'),
    }, async ({ presetId, files }) => {
        const preset = loadPresetById(presetId);
        if (!preset) {
            return { content: [{ type: 'text', text: `Preset "${presetId}" not found.` }] };
        }
        const allViolations = files.flatMap(f => (0, anti_slop_js_1.detectViolations)(f.path, f.content, preset.forbiddenPatterns));
        const report = (0, anti_slop_js_1.generateSlopReport)(allViolations);
        return { content: [{ type: 'text', text: (0, anti_slop_js_1.formatSlopReport)(report) }] };
    });
}
//# sourceMappingURL=forge-tools.js.map