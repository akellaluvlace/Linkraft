import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { validatePreset } from '../../forge/preset-schema.js';
import { generateChangeset } from '../../forge/preset-applicator.js';
import { extractTokens, updateToken } from '../../forge/token-editor.js';
import { detectViolations, generateSlopReport, formatSlopReport } from '../../forge/anti-slop.js';
import type { DesignPreset } from '../../forge/preset-schema.js';

function getPresetsDir(): string {
  return path.resolve(__dirname, '../../../presets');
}

function loadAllPresets(): DesignPreset[] {
  const dir = getPresetsDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const presets: DesignPreset[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const data: unknown = JSON.parse(raw);
      const errors = validatePreset(data);
      if (errors.length === 0) {
        presets.push(data as DesignPreset);
      }
    } catch {
      // Skip invalid presets
    }
  }
  return presets;
}

function loadPresetById(id: string): DesignPreset | null {
  const presets = loadAllPresets();
  return presets.find(p => p.id === id) ?? null;
}

export function registerForgeTools(server: McpServer): void {
  server.tool(
    'forge_list_presets',
    'Lists all available design system presets with name, id, and description.',
    {},
    async () => {
      const presets = loadAllPresets();
      if (presets.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No presets found.' }] };
      }
      const lines = presets.map(p => `- **${p.name}** (${p.id}): ${p.description}`);
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'forge_get_preset',
    'Returns the full details of a design preset by ID, including tokens, component overrides, and forbidden patterns.',
    { id: z.string().describe('Preset ID, e.g. "neo-brutalism"') },
    async ({ id }) => {
      const preset = loadPresetById(id);
      if (!preset) {
        return { content: [{ type: 'text' as const, text: `Preset "${id}" not found.` }] };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(preset, null, 2) }] };
    },
  );

  server.tool(
    'forge_apply_preset',
    'Generates a changeset for applying a design preset to project files. Returns token changes, class replacements, and forbidden pattern violations. Does not modify files directly.',
    {
      presetId: z.string().describe('Preset ID to apply, e.g. "neo-brutalism"'),
      files: z.array(z.object({
        path: z.string().describe('File path relative to project root'),
        content: z.string().describe('File content'),
      })).describe('Project files to analyze (TSX/JSX/HTML)'),
    },
    async ({ presetId, files }) => {
      const preset = loadPresetById(presetId);
      if (!preset) {
        return { content: [{ type: 'text' as const, text: `Preset "${presetId}" not found.` }] };
      }
      const changeset = generateChangeset(preset, files);
      return { content: [{ type: 'text' as const, text: JSON.stringify(changeset, null, 2) }] };
    },
  );

  server.tool(
    'forge_get_tokens',
    'Reads design tokens from a Tailwind config file content. Returns structured colors, fonts, spacing, borders, shadows.',
    {
      configContent: z.string().describe('The content of tailwind.config.ts or tailwind.config.js'),
    },
    async ({ configContent }) => {
      const tokens = extractTokens(configContent);
      const { raw: _raw, ...display } = tokens;
      return { content: [{ type: 'text' as const, text: JSON.stringify(display, null, 2) }] };
    },
  );

  server.tool(
    'forge_set_tokens',
    'Updates a specific design token in a Tailwind config. Returns the modified config content.',
    {
      configContent: z.string().describe('Current tailwind.config content'),
      section: z.string().describe('Token section: colors, fontFamily, borderRadius, boxShadow, etc.'),
      key: z.string().describe('Token key within the section, e.g. "primary"'),
      value: z.string().describe('New value, e.g. "#FF0000"'),
    },
    async ({ configContent, section, key, value }) => {
      const updated = updateToken(configContent, section, key, value);
      return { content: [{ type: 'text' as const, text: updated }] };
    },
  );

  server.tool(
    'forge_check_violations',
    'Scans file content for forbidden pattern violations against a preset. Returns violations with file, line, pattern, and suggestion.',
    {
      presetId: z.string().describe('Preset ID whose forbidden patterns to check against'),
      files: z.array(z.object({
        path: z.string().describe('File path'),
        content: z.string().describe('File content'),
      })).describe('Files to scan'),
    },
    async ({ presetId, files }) => {
      const preset = loadPresetById(presetId);
      if (!preset) {
        return { content: [{ type: 'text' as const, text: `Preset "${presetId}" not found.` }] };
      }
      const allViolations = files.flatMap(f =>
        detectViolations(f.path, f.content, preset.forbiddenPatterns),
      );
      const report = generateSlopReport(allViolations);
      return { content: [{ type: 'text' as const, text: formatSlopReport(report) }] };
    },
  );
}
