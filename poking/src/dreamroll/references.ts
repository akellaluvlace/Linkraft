// Dreamroll References: --reference and --style-note support.
//
// --reference "linear.app, stripe.com, vercel.com"
//   Claude scrapes each site's CSS before the loop starts, extracts design DNA
//   (colors, fonts, radius, shadows, layout, mood), and passes it to dreamroll_start.
//   The extracted data is saved to .dreamroll/references.json and persisted in state.
//   The generation prompt includes a REFERENCE INSPIRATION block. Evolution weights
//   are biased toward parameters that match the reference DNA.
//
// --style-note "dark mode, minimal, big bold typography, no gradients"
//   Plain text injected directly into the generation prompt as a constraint.
//   No scraping, no weight biasing. Simpler and faster.

import * as fs from 'fs';
import * as path from 'path';
import type { ParamWeights } from './params.js';

export interface ReferenceDesignDNA {
  url: string;
  colors: string[];
  fonts: string[];
  radius: string;
  shadows: string;
  layout: string;
  mood: string;
}

/**
 * Saves extracted reference data to .dreamroll/references.json.
 */
export function saveReferences(projectRoot: string, refs: ReferenceDesignDNA[]): string {
  const dir = path.join(projectRoot, '.dreamroll');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'references.json');
  fs.writeFileSync(filePath, JSON.stringify(refs, null, 2), 'utf-8');
  return filePath;
}

/**
 * Loads previously saved references. Returns empty array if missing.
 */
export function loadReferences(projectRoot: string): ReferenceDesignDNA[] {
  const filePath = path.join(projectRoot, '.dreamroll', 'references.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ReferenceDesignDNA[];
  } catch {
    return [];
  }
}

/**
 * Builds the REFERENCE INSPIRATION prompt block. Injected into genomeToPrompt
 * when references are present. Placed early in the prompt so the generator
 * internalizes the principles before seeing the genome dimensions.
 */
export function formatReferencesForPrompt(refs: ReferenceDesignDNA[]): string[] {
  if (refs.length === 0) return [];

  const lines: string[] = [
    '════════════════════════════════════════════════════════════════════════',
    'REFERENCE INSPIRATION (the user admires these sites)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    `The user pointed to these sites as aspirational references: ${refs.map(r => r.url).join(', ')}.`,
    '',
    'Here is what makes each one distinctive:',
    '',
  ];

  for (const ref of refs) {
    lines.push(`  ${ref.url}:`);
    if (ref.colors.length > 0) lines.push(`    Colors: ${ref.colors.join(', ')}`);
    if (ref.fonts.length > 0) lines.push(`    Fonts: ${ref.fonts.join(', ')}`);
    if (ref.radius) lines.push(`    Radius: ${ref.radius}`);
    if (ref.shadows) lines.push(`    Shadows: ${ref.shadows}`);
    if (ref.layout) lines.push(`    Layout: ${ref.layout}`);
    if (ref.mood) lines.push(`    Mood: ${ref.mood}`);
    lines.push('');
  }

  lines.push(
    'Your variation should feel like it belongs in this company.',
    'Do NOT copy them. Extract the PRINCIPLES: their restraint, their color',
    'temperature, their spacing philosophy, their typography confidence.',
    'Apply those principles to a fresh design that still follows the genome.',
    '',
  );

  return lines;
}

/**
 * Builds the STYLE NOTE prompt block. Simpler than references: plain text
 * injected directly as a constraint.
 */
export function formatStyleNoteForPrompt(note: string): string[] {
  if (!note) return [];
  return [
    '════════════════════════════════════════════════════════════════════════',
    'STYLE NOTE (user guidance)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'The user provided this stylistic direction:',
    '',
    `  "${note}"`,
    '',
    'Treat this as a hard constraint. Every design decision should be',
    'filtered through this note. If the genome conflicts with the note,',
    'the note wins.',
    '',
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// Evolution weight derivation from references
// ═══════════════════════════════════════════════════════════════════════

const DARK_COLORS = ['#000', '#0a0a0a', '#0f172a', '#121212', '#18181b', '#1a1a2e', '#111'];
const LIGHT_COLORS = ['#fff', '#ffffff', '#fafafa', '#f5f5f5', '#f8f8f8'];

const FONT_TO_TYPOGRAPHY: Record<string, string[]> = {
  'inter': ['poppins-inter', 'space-grotesk-inter', 'space-mono-inter', 'bodoni-inter', 'jetbrains-source', 'cabinet-grotesk-inter'],
  'source sans': ['playfair-source', 'jetbrains-source'],
  'dm sans': ['dm-serif-dm-sans', 'syne-general-sans'],
  'mono': ['space-mono-inter', 'jetbrains-source', 'fira-code-rubik', 'ibm-plex-mono-sans'],
  'serif': ['playfair-source', 'abril-lato', 'bodoni-inter', 'dm-serif-dm-sans', 'cormorant-proza', 'instrument-serif-sans', 'young-serif-outfit', 'fraunces-commissioner'],
};

const RADIUS_TO_PARAM: Record<string, string> = {
  '0': 'sharp-zero',
  '2px': 'sharp-zero',
  '4px': 'subtle-small',
  '6px': 'subtle-small',
  '8px': 'moderate-medium',
  '10px': 'moderate-medium',
  '12px': 'moderate-medium',
  '16px': 'rounded-large',
  '20px': 'rounded-large',
  '24px': 'rounded-large',
  '9999px': 'pill-full',
  'full': 'pill-full',
  'pill': 'pill-full',
};

const SHADOW_TO_PARAM: Record<string, string> = {
  'none': 'no-shadows',
  'no': 'no-shadows',
  'flat': 'no-shadows',
  'subtle': 'subtle-ambient',
  'light': 'subtle-ambient',
  'medium': 'medium-layered',
  'layered': 'medium-layered',
  'heavy': 'dramatic-offset',
  'dramatic': 'dramatic-offset',
  'neumorphic': 'soft-neumorphic',
};

/**
 * Derives evolution-style ParamWeights from the extracted reference data.
 * Values that match what the references use get 2x weight. Values that
 * clearly conflict get 0.5x. Everything else stays at 1 (default).
 *
 * This is approximate — it reads the extracted strings and maps them to
 * the closest dreamroll parameters. Not every reference attribute has a
 * clean mapping, and that's fine: the prompt block does the nuanced work,
 * the weights just nudge the random rolls in the right direction.
 */
export function deriveWeightsFromReferences(refs: ReferenceDesignDNA[]): ParamWeights | undefined {
  if (refs.length === 0) return undefined;

  const weights: ParamWeights = {};

  // Palette: detect dark vs light preference
  const allColors = refs.flatMap(r => r.colors.map(c => c.toLowerCase().trim()));
  const darkCount = allColors.filter(c => DARK_COLORS.some(d => c.startsWith(d))).length;
  const lightCount = allColors.filter(c => LIGHT_COLORS.some(l => c.startsWith(l))).length;
  if (darkCount > lightCount) {
    weights.palette = { 'neon-on-dark': 2, 'black-plus-accent': 2, 'pastels': 0.5 };
  } else if (lightCount > darkCount) {
    weights.palette = { 'pastels': 2, 'earth-tones': 1.5, 'neon-on-dark': 0.5 };
  }

  // Typography: boost pairings that include referenced fonts
  const allFonts = refs.flatMap(r => r.fonts.map(f => f.toLowerCase().trim()));
  const typoWeights: Record<string, number> = {};
  for (const font of allFonts) {
    for (const [key, pairings] of Object.entries(FONT_TO_TYPOGRAPHY)) {
      if (font.includes(key)) {
        for (const p of pairings) typoWeights[p] = (typoWeights[p] ?? 1) * 2;
      }
    }
  }
  // Suppress serif if all references use sans
  const allSans = allFonts.every(f => !f.includes('serif') && !f.includes('playfair') && !f.includes('garamond'));
  if (allSans) {
    for (const serifPairing of FONT_TO_TYPOGRAPHY['serif'] ?? []) {
      typoWeights[serifPairing] = (typoWeights[serifPairing] ?? 1) * 0.5;
    }
  }
  if (Object.keys(typoWeights).length > 0) weights.typography = typoWeights;

  // Border radius
  const radiusMatches = refs.map(r => {
    const normalized = r.radius.toLowerCase().replace(/\s/g, '');
    for (const [key, param] of Object.entries(RADIUS_TO_PARAM)) {
      if (normalized.includes(key)) return param;
    }
    return null;
  }).filter((r): r is string => r !== null);
  if (radiusMatches.length > 0) {
    const rWeights: Record<string, number> = {};
    for (const m of radiusMatches) rWeights[m] = (rWeights[m] ?? 1) * 2;
    weights.borderRadius = rWeights;
  }

  // Shadows
  const shadowMatches = refs.map(r => {
    const normalized = r.shadows.toLowerCase();
    for (const [key, param] of Object.entries(SHADOW_TO_PARAM)) {
      if (normalized.includes(key)) return param;
    }
    return null;
  }).filter((r): r is string => r !== null);
  if (shadowMatches.length > 0) {
    const sWeights: Record<string, number> = {};
    for (const m of shadowMatches) sWeights[m] = (sWeights[m] ?? 1) * 2;
    weights.shadows = sWeights;
  }

  // Mood: if all references are "dark" or "minimal", boost matching moods
  const allMoods = refs.map(r => r.mood.toLowerCase());
  const moodWeights: Record<string, number> = {};
  if (allMoods.some(m => m.includes('dark'))) { moodWeights['mysterious-dark'] = 2; moodWeights['techy-hacker'] = 1.5; }
  if (allMoods.some(m => m.includes('minimal'))) { moodWeights['calm-zen'] = 2; moodWeights['cold-clinical'] = 1.5; }
  if (allMoods.some(m => m.includes('premium') || m.includes('luxury'))) { moodWeights['premium-luxury'] = 2; }
  if (allMoods.some(m => m.includes('playful') || m.includes('fun'))) { moodWeights['playful-energy'] = 2; }
  if (allMoods.some(m => m.includes('warm'))) { moodWeights['warm-friendly'] = 2; }
  if (Object.keys(moodWeights).length > 0) weights.mood = moodWeights;

  return Object.keys(weights).length > 0 ? weights : undefined;
}
