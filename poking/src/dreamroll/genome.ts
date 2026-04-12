// Style Genome: encodes design DNA, builds generation prompts, serializes
// for state.json and HTML comment headers.
//
// The generation prompt weights the STYLE ARCHETYPE as the dominating concern
// (not one of fourteen equal dimensions). Without this weighting, the generator
// defaults to a safe generic layout with minor color/font tweaks.

import type { SeedParameters } from './types.js';
import {
  getStyleSignature,
  getStyleArchetype,
  getHarmonyScheme,
  computeHarmonyPalette,
  getTypographyPairing,
  getTypeScale,
  getMutation,
  getCopyAngle,
  getSectionVariation,
  getImageTreatment,
  BORDER_RADIUS_SPECS,
  SHADOW_SPECS,
  CTA_STYLE_SPECS,
} from './params.js';
import {
  formatReferencesForPrompt,
  formatStyleNoteForPrompt,
  type ReferenceDesignDNA,
} from './references.js';

/**
 * Re-exports SeedParameters under the spec's "StyleGenome" name.
 * They're the same shape; this is naming alignment with the build spec.
 */
export type StyleGenome = SeedParameters;

/**
 * Builds the complete generation prompt for Claude to create a landing page
 * variation matching this genome.
 *
 * Structure (spec-driven to combat generic output):
 *   1. VISUAL IDENTITY (the style archetype, front and center)
 *   2. Constraint (first of three repetitions)
 *   3. THIS PAGE MUST NOT LOOK LIKE
 *   4. Required distinctive CSS declarations
 *   5. All 14 genome dimensions with metadata
 *   6. Constraint (second repetition)
 *   7. Google Fonts link
 *   8. Page structure + CSS quality rules
 *   9. HTML comment header template
 *  10. Constraint (third repetition) + failure warning
 */
export interface PromptContext {
  recentStyles?: readonly string[];
  references?: readonly ReferenceDesignDNA[];
  styleNote?: string;
}

export function genomeToPrompt(
  genome: StyleGenome,
  brief: string,
  variationNumber: number,
  outputPath: string,
  recentStylesOrCtx: readonly string[] | PromptContext = [],
): string {
  const ctx: PromptContext = Array.isArray(recentStylesOrCtx)
    ? { recentStyles: recentStylesOrCtx as readonly string[] }
    : recentStylesOrCtx as PromptContext;
  const recentStyles = ctx.recentStyles ?? [];
  const styleSignature = getStyleSignature(genome.genre);
  const archetype = getStyleArchetype(genome.genre);
  const harmony = getHarmonyScheme(genome.colorPalette);
  const baseHue = genome.harmonyBaseHue ?? 0;
  const palette = computeHarmonyPalette(genome.colorPalette, baseHue);
  const typography = getTypographyPairing(genome.typography);
  const typeScale = genome.typeScale ? getTypeScale(genome.typeScale) : undefined;
  const borderRadius = BORDER_RADIUS_SPECS.find(b => b.id === genome.borderRadius);
  const shadow = SHADOW_SPECS.find(s => s.id === genome.shadows);
  const cta = CTA_STYLE_SPECS.find(c => c.id === genome.ctaStyle);
  const mutationId = genome.mutation ?? 'pure';
  const mutationSpec = getMutation(mutationId);
  const isMutation = mutationId !== 'pure';
  const copyAngleId = genome.copyAngle ?? 'outcome-first';
  const copyAngleSpec = getCopyAngle(copyAngleId);
  const sectionVariationId = genome.sectionVariation ?? 'uniform';
  const sectionVariationSpec = getSectionVariation(sectionVariationId);
  const imageTreatmentId = genome.imageTreatment ?? 'editorial-bleed';
  const imageTreatmentSpec = getImageTreatment(imageTreatmentId);

  const fontsLink = typography
    ? `https://fonts.googleapis.com/css2?${typography.googleFontsParam}&display=swap`
    : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';

  const distinctiveDescription = archetype?.distinctive ?? styleSignature;
  const requiredCSS = archetype?.distinctiveCSS ?? [];
  const notLikeThis = archetype?.notLikeThis ?? [];

  const constraintBlock = `CONSTRAINT (mandatory, applied to the whole page): ${genome.wildcard}`;

  // Build the mutation banner (only when non-pure)
  const mutationBanner: string[] = [];
  if (isMutation && mutationSpec) {
    const mutationDescription = mutationSpec.describe({
      primary: genome.genre,
      secondary: genome.mutationSecondary,
      tertiary: genome.mutationTertiary,
      material: genome.mutationMaterial,
      era: genome.era,
    });
    mutationBanner.push(
      '════════════════════════════════════════════════════════════════════════',
      `STYLE MUTATION: ${mutationId.toUpperCase()}`,
      '════════════════════════════════════════════════════════════════════════',
      '',
      `This variation is a STYLE MUTATION (${mutationId}). You are NOT recreating a known style. You are INVENTING a new one by ${mutationDescription}`,
      '',
      'The result should look like nothing that exists on any design website. If a designer could name this style in one word, you have not gone far enough.',
      '',
    );
    if (genome.mutationSecondary) {
      const secondaryArch = getStyleArchetype(genome.mutationSecondary);
      if (secondaryArch) {
        mutationBanner.push(
          `SECONDARY ARCHETYPE: ${genome.mutationSecondary}`,
          `  Signature: ${secondaryArch.signature}`,
          `  Identity: ${secondaryArch.distinctive}`,
          '',
        );
      }
    }
    if (genome.mutationTertiary) {
      const tertiaryArch = getStyleArchetype(genome.mutationTertiary);
      if (tertiaryArch) {
        mutationBanner.push(
          `TERTIARY ARCHETYPE: ${genome.mutationTertiary}`,
          `  Signature: ${tertiaryArch.signature}`,
          `  Identity: ${tertiaryArch.distinctive}`,
          '',
        );
      }
    }
    if (genome.mutationMaterial) {
      mutationBanner.push(`MATERIAL: ${genome.mutationMaterial}`, '');
    }
  }

  // Diversity directive: surface recent styles so the generator physically cannot
  // regress toward them. Omitted when no recent history exists yet.
  const diversityBlock: string[] = [];
  if (recentStyles.length > 0) {
    diversityBlock.push(
      '════════════════════════════════════════════════════════════════════════',
      'DIVERSITY DIRECTIVE (read this first)',
      '════════════════════════════════════════════════════════════════════════',
      '',
      `Previous variations used these styles: ${recentStyles.join(', ')}.`,
      '',
      'This variation MUST look completely different from all of them. Specifically:',
      '  - Different color temperature (if they were warm, go cool; if dark, go light).',
      '  - Different layout structure (if they used a grid, go editorial or single-column).',
      '  - Different typography mood (if they used geometric sans, go serif or mono).',
      '',
      'If your output could be mistaken for any of the listed styles at a glance, you have',
      'failed the diversity brief regardless of how well it executes the assigned archetype.',
      '',
    );
  }

  const lines: string[] = [
    `Generate a complete standalone HTML landing page for variation #${String(variationNumber).padStart(3, '0')}.`,
    `Output path: ${outputPath}`,
    '',
    ...diversityBlock,
    ...formatReferencesForPrompt([...(ctx.references ?? [])]),
    ...formatStyleNoteForPrompt(ctx.styleNote ?? ''),
    ...mutationBanner,
    '════════════════════════════════════════════════════════════════════════',
    isMutation
      ? `PRIMARY ARCHETYPE: ${genome.genre} (the mutation operates on this)`
      : 'VISUAL IDENTITY (this is the most important part)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    `STYLE: ${genome.genre}`,
    '',
    distinctiveDescription,
    '',
    `CSS signature: ${styleSignature}`,
    '',
    constraintBlock,
    '',
    ...(isMutation
      ? [
        '════════════════════════════════════════════════════════════════════════',
        'ANTI-PATTERNS (use as reference — the mutation may override these)',
        '════════════════════════════════════════════════════════════════════════',
        '',
        'In a PURE application of this archetype, these would be failures:',
        ...notLikeThis.map(n => `  - ${n}`),
        '',
        'Because this is a mutation, some of these may actively be required. Use judgment.',
        '',
        '════════════════════════════════════════════════════════════════════════',
        `REFERENCE CSS (for "${genome.genre}" — not strictly required during mutations)`,
        '════════════════════════════════════════════════════════════════════════',
        '',
        'In a PURE application of this archetype, these strings would be checked',
        'programmatically. For mutations the check is skipped — you are free to',
        'violate them when the mutation demands it.',
        '',
        ...requiredCSS.map(c => `  - ${c}`),
        '',
      ]
      : [
        '════════════════════════════════════════════════════════════════════════',
        'THIS PAGE MUST NOT LOOK LIKE',
        '════════════════════════════════════════════════════════════════════════',
        '',
        ...notLikeThis.map(n => `  - ${n}`),
        '',
        'If your output could pass for any of the above, you have failed the style brief.',
        '',
        '════════════════════════════════════════════════════════════════════════',
        `REQUIRED CSS DECLARATIONS (must appear in the output for "${genome.genre}")`,
        '════════════════════════════════════════════════════════════════════════',
        '',
        'Every one of these strings must appear somewhere in your generated HTML/CSS.',
        'They are checked programmatically after generation. Missing any triggers',
        'an automatic 2-point BRUTUS deduction.',
        '',
        ...requiredCSS.map(c => `  - ${c}`),
        '',
      ]
    ),
    '════════════════════════════════════════════════════════════════════════',
    `COPY ANGLE: ${copyAngleId}`,
    '════════════════════════════════════════════════════════════════════════',
    '',
    copyAngleSpec?.guidance ?? 'Use clear, direct copy that matches the product brief.',
    '',
    'The product brief content stays the same — only the framing of the headline,',
    'subheadline, and CTA changes. Apply this angle consistently across all sections.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    `SECTION RHYTHM: ${sectionVariationId}`,
    '════════════════════════════════════════════════════════════════════════',
    '',
    sectionVariationSpec?.instructions ?? 'Every section follows the base genome.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    `IMAGE TREATMENT: ${imageTreatmentId}`,
    '════════════════════════════════════════════════════════════════════════',
    '',
    imageTreatmentSpec?.description ?? 'Place images in standard rectangular containers.',
    '',
    'Required CSS for this treatment:',
    imageTreatmentSpec?.css ?? '(default layout)',
    '',
    'Apply this treatment to EVERY image on the page (hero, features, testimonial',
    'avatars, background images). The treatment is how the images are placed and',
    'styled, not which images are chosen. The Unsplash photo selection (from the',
    'REAL IMAGES block) stays the same regardless of treatment.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'PRODUCT BRIEF',
    '════════════════════════════════════════════════════════════════════════',
    '',
    brief,
    '',
    '════════════════════════════════════════════════════════════════════════',
    'FULL GENOME (18 dimensions — all must visibly influence the design)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    `  1.  Style archetype:  ${genome.genre}  ← the dominating concern above`,
    `  2.  Color harmony:    ${genome.colorPalette}${harmony?.kind === 'algorithmic' ? ` (base hue ${baseHue}°)` : ''}`,
    `      Palette:          ${palette.join(', ') || '(see scheme rules)'}`,
    `  3.  Typography:       ${genome.typography}${typography ? ` (${typography.personality})` : ''}`,
    typography ? `      Heading/Body:     ${typography.heading} ${typography.headingWeight} / ${typography.body} ${typography.bodyWeight}` : '',
    `  4.  Type scale:       ${genome.typeScale ?? '(default)'}${typeScale ? ` (ratio ${typeScale.ratio}, steps ${typeScale.steps.join('/')}px)` : ''}`,
    `  5.  Layout pattern:   ${genome.layoutArchetype}`,
    `  6.  Density:          ${genome.density}`,
    `  7.  Mood:             ${genome.mood}`,
    `  8.  Era influence:    ${genome.era}`,
    `  9.  Animation:        ${genome.animation}`,
    `  10. Imagery:          ${genome.imagery}`,
    `  11. Border radius:    ${genome.borderRadius ?? '(default)'}${borderRadius ? ` — ${borderRadius.px}` : ''}`,
    `  12. Shadow system:    ${genome.shadows ?? '(default)'}${shadow ? ` — ${shadow.css}` : ''}`,
    `  13. CTA style:        ${genome.ctaStyle ?? '(default)'}${cta ? ` — ${cta.css}` : ''}`,
    `  14. Oblique constraint: ${genome.wildcard}  ← MUST be applied`,
    `  15. Style mutation:   ${mutationId}${mutationSpec ? ` — ${mutationSpec.summary}` : ''}`,
    `  16. Copy angle:       ${copyAngleId}${copyAngleSpec ? ' — see COPY ANGLE block' : ''}`,
    `  17. Section rhythm:   ${sectionVariationId}${sectionVariationSpec ? ' — see SECTION RHYTHM block' : ''}`,
    `  18. Image treatment:  ${imageTreatmentId}${imageTreatmentSpec ? ' — see IMAGE TREATMENT block' : ''}`,
    '',
    constraintBlock,
    '',
    '════════════════════════════════════════════════════════════════════════',
    'GOOGLE FONTS',
    '════════════════════════════════════════════════════════════════════════',
    '',
    `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
    `  <link href="${fontsLink}" rel="stylesheet">`,
    '',
    '════════════════════════════════════════════════════════════════════════',
    'LUCIDE ICONS (Mandatory — same icon set as shadcn/ui)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'Include this script tag right before </body>:',
    '',
    '  <script src="https://unpkg.com/lucide@latest"></script>',
    '  <script>lucide.createIcons();</script>',
    '',
    'Usage: <i data-lucide="icon-name" class="icon"></i>',
    '',
    'Use icons that MATCH THE CONTENT, not generic placeholder icons:',
    '  Navigation:   menu, x, arrow-right, chevron-down',
    '  Features:     brain, camera, zap, shield, message-circle, globe,',
    '                code, lock, database, cloud, rocket, sparkles, layers',
    '  Trust:        check-circle, award, lock, verified, star',
    '  CTA buttons:  arrow-right INLINE with button text',
    '  Steps:        1/2/3 or check, arrow-down, flag',
    '  Social:       quote, user, message-square',
    '  Footer:       github, twitter, linkedin, mail',
    '',
    'Style icons via CSS:',
    '  .icon { width: 24px; height: 24px; stroke: var(--accent); }',
    '  .icon-sm { width: 16px; height: 16px; }',
    '  .icon-lg { width: 32px; height: 32px; }',
    '',
    'Every feature card, every step, and every CTA MUST have a Lucide icon.',
    'No emoji substitutes. No SVG inline icons. Use the data-lucide attribute.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'REAL IMAGES (Unsplash — contextual, not decorative)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'Use real Unsplash photos that match the PRODUCT BRIEF, not the style',
    'archetype. Read the brief, then pick 3-5 contextually relevant photos.',
    '',
    'URL pattern:',
    '  https://images.unsplash.com/photo-{ID}?w={W}&h={H}&fit=crop&q=80',
    '',
    'Standard sizes:',
    '  Hero:    ?w=1200&h=800&fit=crop&q=80',
    '  Feature: ?w=800&h=600&fit=crop&q=80',
    '  Card:    ?w=600&h=400&fit=crop&q=80',
    '  Avatar:  ?w=100&h=100&fit=crop&q=80',
    '',
    'Content matching (critical — this is what separates a good variation):',
    '  Brief says "study platform"         -> students, notebooks, libraries',
    '  Brief says "social deduction game"   -> friends gathering, phones, party',
    '  Brief says "fitness tracker"          -> gym, running, healthy food',
    '  Brief says "developer tool"           -> laptop, code on screen, coffee',
    '',
    'Image rules:',
    '  - Every <img> MUST have a descriptive alt attribute (not "image" or "photo")',
    '  - Every <img> MUST have loading="lazy" EXCEPT the hero image',
    '  - Apply object-fit: cover with proper aspect-ratio in CSS',
    '  - Set a background-color fallback on every image container so if the',
    '    photo ID is wrong the page still looks intentional, not broken:',
    '    .img-container { background: var(--surface); aspect-ratio: 3/2; }',
    '  - Hero image can be a background-image on a full-width div with',
    '    a dark overlay for text readability',
    '',
    'FALLBACK RULE: if you are unsure a photo ID exists, use a CSS gradient',
    'placeholder instead. A gradient is always better than a broken image.',
    'For example: background: linear-gradient(135deg, var(--surface), var(--accent));',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'PAGE STRUCTURE (9 sections — use Lucide icons + Unsplash images throughout)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    '  1. Navigation     — HORIZONTAL TOP NAV BAR. Always. Logo text + 3-4 links + CTA button.',
    '                       No sidebar navigation. No vertical nav. Horizontal top bar only.',
    '                       Lucide menu/x for mobile toggle.',
    '  2. Hero           — headline (3-6 words) + sub + primary CTA with arrow-right icon.',
    '                       Use an Unsplash hero image that matches the brief.',
    '  3. Trust bar      — "Trusted by" + 4-6 placeholder company names. Lucide check-circle.',
    '  4. Value props    — 3 props, each with a Lucide icon + short description.',
    '  5. Feature        — main feature showcase. Unsplash image + text. Lucide icon for the heading.',
    '  6. Social proof   — 2-3 testimonial quotes. Unsplash avatar photos. Lucide quote icon.',
    '  7. How it works   — 3-step process. Lucide icon per step (numbered or thematic).',
    '  8. CTA section    — final conversion. Headline + CTA button with arrow-right. Unsplash bg optional.',
    '  9. Footer         — logo + 3 column links + Lucide social icons + copyright.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'CSS ARCHITECTURE (mandatory — design tokens in :root)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'Every repeated value MUST be a CSS custom property on :root. This is the',
    'bridge from "dreamroll output" to "production page": a user can open the',
    'file, change 5 variables in :root, and the entire page updates. No',
    'hardcoded colors, fonts, spacings, radii, or shadows anywhere in the rest',
    'of the stylesheet.',
    '',
    ':root MUST declare (at minimum — use these names):',
    '',
    '  Colors:',
    '    --bg           page background',
    '    --text         primary body text',
    '    --muted        secondary / label text',
    '    --surface      card / container background',
    '    --border       divider / outline',
    '    --accent       CTA / highlight',
    '    --accent-fg    text color on top of --accent',
    '',
    '  Fonts (use the Google Fonts loaded above):',
    '    --font-heading font-family stack for headings',
    '    --font-body    font-family stack for body',
    '',
    '  Spacing (multiples of 8px — always use these, never hardcode px):',
    '    --space-xs     4px',
    '    --space-sm     8px',
    '    --space-md     16px',
    '    --space-lg     24px',
    '    --space-xl     40px',
    '    --space-2xl    64px',
    '    --space-3xl    96px',
    '',
    '  Radii:',
    '    --radius-sm    small (matches the border-radius dimension)',
    '    --radius-md    medium',
    '    --radius-lg    large',
    '',
    '  Shadows:',
    '    --shadow-sm    subtle elevation',
    '    --shadow-md    card / modal elevation',
    '',
    '  Motion:',
    '    --ease         e.g. cubic-bezier(0.22, 1, 0.36, 1)',
    '    --duration     e.g. 240ms',
    '',
    'Elsewhere in the <style> block, use var(--name) for EVERY color, font,',
    'spacing, radius, shadow, and transition. If you catch yourself typing a',
    'raw hex, a raw font-family, or a raw px value, stop and promote it to a',
    'token. The only exception is the :root declarations themselves.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'RESPONSIVE (375px must look intentional, not collapsed)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'Every variation MUST include a proper @media (max-width: 375px) section',
    '(and preferably 768px and 1024px breakpoints too). The mobile view is not',
    '"stack the columns" — it is a designed layout at 375×667. Rules:',
    '',
    '  - The hero headline MUST be readable at 375px with NO horizontal scroll.',
    '    Use clamp() so the type scales down gracefully.',
    '  - The primary CTA MUST be visible above the fold at the 667px viewport',
    '    height. Measure: hero headline + sub + button must fit in ~600px of',
    '    vertical space (leaving room for nav).',
    '  - No text smaller than 14px on mobile. Body copy should be 15-16px.',
    '  - Touch targets (buttons, links, icon tap zones) MUST be at least 44×44px.',
    '    Use min-height: 44px on interactive elements.',
    '  - Respect the SAFE AREA on iOS: use env(safe-area-inset-*) on fixed bars.',
    '  - Reduce horizontal padding on mobile (e.g. --space-md instead of --space-2xl)',
    '    so content has room to breathe.',
    '  - Nav collapses to a logo + single CTA or a hamburger — not five tiny links.',
    '  - Multi-column grids become single-column BUT each card still reads as',
    '    intentional: full-width, proper internal padding, no orphaned elements.',
    '',
    'The test: if a designer viewed this page at 375×667 and put it in Figma',
    'next to the desktop version, would they both look like they belong to the',
    'same designed product? If no, you have failed the responsive brief.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'CSS QUALITY RULES (mandatory)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    '  - Single standalone HTML file. Allowed external resources: Google Fonts link,',
    '    Lucide CDN script, Unsplash images. No other dependencies.',
    '  - All CSS inline in a <style> tag inside <head>.',
    '  - 60-30-10 color distribution: dominant bg / secondary structure / accent CTA.',
    '  - Never use #000000 as background. Use #0A0A0A, #0F172A, #121212, or #18181B.',
    '  - Accent must contrast >= 4.5:1 with its background (WCAG AA).',
    '  - Maximum 5 colors total in the palette.',
    '  - All spacing on an 8px grid (use the --space-* tokens).',
    '  - Responsive at 375/768/1024/1440. Use clamp(), min(), max(), no fixed widths.',
    '  - Include @media (prefers-reduced-motion: reduce) that strips motion.',
    '  - Only animate transform and opacity (GPU composited).',
    '  - Valid HTML5: nav, main, section, footer semantic elements.',
    '  - Total file size under 50KB.',
    '  - No JavaScript except: (1) the Lucide CDN script + createIcons() call,',
    '    (2) optional IntersectionObserver scroll animations (< 20 lines),',
    '    (3) optional mobile nav toggle (< 10 lines).',
    '  - Real content from the brief, not lorem ipsum.',
    '  - CTA in the first viewport at 375px width.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'LAYOUT DENSITY RULES (mandatory — the most common failure mode)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    'Pages often have huge empty gaps, especially in hero sections with',
    'two-column layouts where one column has a small element in a large space.',
    'These rules prevent that. BRUTUS auto-deducts points for violations.',
    '',
    '  1. No element should occupy less than 60% of its grid cell.',
    '     If an image is in a 50% column, it must fill most of that column,',
    '     not float as a small circle in empty space. Use width: 100% or',
    '     min-width: 80% on the primary content of every grid cell.',
    '',
    '  2. Hero sections must feel FULL. Three acceptable patterns:',
    '     a) Single column centered — text fills the width, large font sizes',
    '     b) True 50/50 split — BOTH sides have substantial content',
    '        (text side: headline + sub + CTA + trust bar;',
    '         image side: fills the cell edge to edge)',
    '     c) Full-bleed image with text overlay',
    '     NEVER: a small element alone in a large grid cell.',
    '     NEVER: a 200px circle floating in a 600px column.',
    '',
    '  3. Maximum gap between any two content elements: 80px.',
    '     Use var(--space-3xl) = 96px as the absolute ceiling for section',
    '     padding. Within a section, max gap is var(--space-xl) = 40px.',
    '     If you see more than 80px of empty space between elements,',
    '     something is missing — add a trust bar, stats row, or tighten.',
    '',
    '  4. Squint test: if you squint at the page, every section should have',
    '     balanced visual weight across its width. No section should be 70%',
    '     empty space on one side. Two-column sections need both columns',
    '     to carry similar visual weight.',
    '',
    '  5. Circular images in hero sections must be at least 300px diameter',
    '     if standalone. If smaller, group them with other elements (stats,',
    '     badges, secondary text) to fill the column. Use min-width: 300px',
    '     on standalone hero images.',
    '',
    '  6. Sticky sidebars must not create dead columns. If using a sidebar',
    '     nav, the main content must expand to fill the remaining space:',
    '     main { flex: 1; min-width: 0; } not a fixed narrow column.',
    '',
    '════════════════════════════════════════════════════════════════════════',
    'HTML COMMENT HEADER (place at the very top of the file, before <!DOCTYPE>)',
    '════════════════════════════════════════════════════════════════════════',
    '',
    serializeGenomeAsComment(genome, variationNumber),
    '',
    '════════════════════════════════════════════════════════════════════════',
    'FINAL REMINDER',
    '════════════════════════════════════════════════════════════════════════',
    '',
    constraintBlock,
    '',
    isMutation
      ? `This variation is an experimental STYLE MUTATION (${mutationId}). Do not try to match a known style — the mutation demands invention. The judges have been told this is experimental: they will evaluate whether the combination WORKS, not whether it matches "${genome.genre}". Push past recognizable aesthetics.`
      : `If this variation looks like it could have been generated without knowing the style archetype "${genome.genre}", you have failed. The style must be OBVIOUS within 2 seconds of seeing the page. Every element should telegraph "${genome.genre}" — not a generic card grid with different colors.`,
    '',
    'After writing the file, return the file path so it can be scored.',
  ].filter(l => l !== '');

  return lines.join('\n');
}

/**
 * Serializes a genome as the HTML comment header that goes at the top of
 * each generated variation file.
 */
export function serializeGenomeAsComment(genome: StyleGenome, variationNumber: number): string {
  const baseHue = genome.harmonyBaseHue ?? 0;
  const mutationId = genome.mutation ?? 'pure';

  const mutationLines: string[] = [`    mutation:   ${mutationId}`];
  if (genome.mutationSecondary) mutationLines.push(`    secondary:  ${genome.mutationSecondary}`);
  if (genome.mutationTertiary) mutationLines.push(`    tertiary:   ${genome.mutationTertiary}`);
  if (genome.mutationMaterial) mutationLines.push(`    material:   ${genome.mutationMaterial}`);

  const lines = [
    '<!--',
    `  DREAMROLL VARIATION #${String(variationNumber).padStart(3, '0')}`,
    '',
    '  GENOME:',
    `    style:      ${genome.genre}`,
    `    harmony:    ${genome.colorPalette} (base hue: ${baseHue})`,
    `    typography: ${genome.typography}`,
    `    scale:      ${genome.typeScale ?? '(default)'}`,
    `    layout:     ${genome.layoutArchetype}`,
    `    density:    ${genome.density}`,
    `    mood:       ${genome.mood}`,
    `    era:        ${genome.era}`,
    `    animation:  ${genome.animation}`,
    `    imagery:    ${genome.imagery}`,
    `    radius:     ${genome.borderRadius ?? '(default)'}`,
    `    shadows:    ${genome.shadows ?? '(default)'}`,
    `    cta:        ${genome.ctaStyle ?? '(default)'}`,
    `    constraint: ${genome.wildcard}`,
    ...mutationLines,
    `    copyAngle:  ${genome.copyAngle ?? '(default)'}`,
    `    section:    ${genome.sectionVariation ?? '(default)'}`,
    `    imgTreat:   ${genome.imageTreatment ?? '(default)'}`,
    '',
    '  SCORES: (filled in after judging)',
    '-->',
  ];
  return lines.join('\n');
}

/**
 * Sanitizes a genome dimension value into a filename-safe slug.
 */
function slug(input: string | undefined): string {
  if (!input) return 'na';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'na';
}

/**
 * Builds the variation filename including the key genome identifiers, so users
 * can scan filenames in .dreamroll/variations/ and know what each one is
 * without opening it.
 *
 * Format: {NNN}_{style}_{palette}_{mutation}.html
 * Example: 001_cyberpunk_neon-on-dark_pure.html
 */
export function genomeFilename(variationNumber: number, genome: StyleGenome): string {
  const num = String(variationNumber).padStart(3, '0');
  const style = slug(genome.genre);
  const palette = slug(genome.colorPalette);
  const mutation = slug(genome.mutation ?? 'pure');
  return `${num}_${style}_${palette}_${mutation}.html`;
}

/**
 * Short single-line summary of a genome for status output.
 */
export function genomeSummary(genome: StyleGenome): string {
  const parts = [
    `style=${genome.genre}`,
    `harmony=${genome.colorPalette}`,
    `type=${genome.typography}`,
    `layout=${genome.layoutArchetype}`,
    `mood=${genome.mood}`,
    `wildcard=${genome.wildcard}`,
  ];
  const mutationId = genome.mutation ?? 'pure';
  if (mutationId !== 'pure') {
    let m = `mutation=${mutationId}`;
    if (genome.mutationSecondary) m += `(+${genome.mutationSecondary})`;
    if (genome.mutationTertiary) m += `(+${genome.mutationTertiary})`;
    if (genome.mutationMaterial) m += `(${genome.mutationMaterial})`;
    parts.push(m);
  }
  if (genome.copyAngle) parts.push(`copy=${genome.copyAngle}`);
  if (genome.sectionVariation && genome.sectionVariation !== 'uniform') {
    parts.push(`section=${genome.sectionVariation}`);
  }
  if (genome.imageTreatment) parts.push(`img=${genome.imageTreatment}`);
  return parts.join(' | ');
}
