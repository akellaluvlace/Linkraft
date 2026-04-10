"use strict";
// Style Genome: encodes design DNA, builds generation prompts, serializes
// for state.json and HTML comment headers.
//
// The generation prompt weights the STYLE ARCHETYPE as the dominating concern
// (not one of fourteen equal dimensions). Without this weighting, the generator
// defaults to a safe generic layout with minor color/font tweaks.
Object.defineProperty(exports, "__esModule", { value: true });
exports.genomeToPrompt = genomeToPrompt;
exports.serializeGenomeAsComment = serializeGenomeAsComment;
exports.genomeSummary = genomeSummary;
const params_js_1 = require("./params.js");
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
function genomeToPrompt(genome, brief, variationNumber, outputPath) {
    const styleSignature = (0, params_js_1.getStyleSignature)(genome.genre);
    const archetype = (0, params_js_1.getStyleArchetype)(genome.genre);
    const harmony = (0, params_js_1.getHarmonyScheme)(genome.colorPalette);
    const baseHue = genome.harmonyBaseHue ?? 0;
    const palette = (0, params_js_1.computeHarmonyPalette)(genome.colorPalette, baseHue);
    const typography = (0, params_js_1.getTypographyPairing)(genome.typography);
    const typeScale = genome.typeScale ? (0, params_js_1.getTypeScale)(genome.typeScale) : undefined;
    const borderRadius = params_js_1.BORDER_RADIUS_SPECS.find(b => b.id === genome.borderRadius);
    const shadow = params_js_1.SHADOW_SPECS.find(s => s.id === genome.shadows);
    const cta = params_js_1.CTA_STYLE_SPECS.find(c => c.id === genome.ctaStyle);
    const fontsLink = typography
        ? `https://fonts.googleapis.com/css2?${typography.googleFontsParam}&display=swap`
        : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
    const distinctiveDescription = archetype?.distinctive ?? styleSignature;
    const requiredCSS = archetype?.distinctiveCSS ?? [];
    const notLikeThis = archetype?.notLikeThis ?? [];
    const constraintBlock = `CONSTRAINT (mandatory, applied to the whole page): ${genome.wildcard}`;
    const lines = [
        `Generate a complete standalone HTML landing page for variation #${String(variationNumber).padStart(3, '0')}.`,
        `Output path: ${outputPath}`,
        '',
        '════════════════════════════════════════════════════════════════════════',
        'VISUAL IDENTITY (this is the most important part)',
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
        '════════════════════════════════════════════════════════════════════════',
        'PRODUCT BRIEF',
        '════════════════════════════════════════════════════════════════════════',
        '',
        brief,
        '',
        '════════════════════════════════════════════════════════════════════════',
        'FULL GENOME (14 dimensions — all must visibly influence the design)',
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
        'PAGE STRUCTURE (9 sections, order can vary by layout dimension)',
        '════════════════════════════════════════════════════════════════════════',
        '',
        '  1. Navigation     — transparent/sticky, logo text + 3-4 links + CTA button',
        '  2. Hero           — headline (3-6 words) + subheadline (1-2 sentences) + primary CTA',
        '  3. Trust bar      — "Trusted by" + 4-6 placeholder company names (gray)',
        '  4. Value props    — 3 props with icon placeholders + short descriptions',
        '  5. Feature        — main feature showcase, text + visual placeholder',
        '  6. Social proof   — 2-3 testimonial quotes with names + roles',
        '  7. How it works   — 3-step process (numbered)',
        '  8. CTA section    — final conversion section: headline + CTA + supporting text',
        '  9. Footer         — logo + 3 column links + copyright',
        '',
        '════════════════════════════════════════════════════════════════════════',
        'CSS QUALITY RULES (mandatory)',
        '════════════════════════════════════════════════════════════════════════',
        '',
        '  - Single standalone HTML file. No dependencies except the Google Fonts link.',
        '  - All CSS inline in a <style> tag inside <head>.',
        '  - 60-30-10 color distribution: dominant bg / secondary structure / accent CTA.',
        '  - Never use #000000 as background. Use #0A0A0A, #0F172A, #121212, or #18181B.',
        '  - Accent must contrast >= 4.5:1 with its background (WCAG AA).',
        '  - Maximum 5 colors total in the palette.',
        '  - All spacing on an 8px grid.',
        '  - Responsive at 375/768/1024/1440. Use clamp(), min(), max(), no fixed widths.',
        '  - Include @media (prefers-reduced-motion: reduce) that strips motion.',
        '  - Only animate transform and opacity (GPU composited).',
        '  - Valid HTML5: nav, main, section, footer semantic elements.',
        '  - Total file size under 50KB.',
        '  - No JavaScript except optional IntersectionObserver scroll animations (< 20 lines).',
        '  - Real content from the brief, not lorem ipsum.',
        '  - CTA in the first viewport at 375px width.',
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
        `If this variation looks like it could have been generated without knowing the style archetype "${genome.genre}", you have failed. The style must be OBVIOUS within 2 seconds of seeing the page. Every element should telegraph "${genome.genre}" — not a generic card grid with different colors.`,
        '',
        'After writing the file, return the file path so it can be scored.',
    ].filter(l => l !== '');
    return lines.join('\n');
}
/**
 * Serializes a genome as the HTML comment header that goes at the top of
 * each generated variation file.
 */
function serializeGenomeAsComment(genome, variationNumber) {
    const baseHue = genome.harmonyBaseHue ?? 0;
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
        '',
        '  SCORES: (filled in after judging)',
        '-->',
    ];
    return lines.join('\n');
}
/**
 * Short single-line summary of a genome for status output.
 */
function genomeSummary(genome) {
    return [
        `style=${genome.genre}`,
        `harmony=${genome.colorPalette}`,
        `type=${genome.typography}`,
        `layout=${genome.layoutArchetype}`,
        `mood=${genome.mood}`,
        `wildcard=${genome.wildcard}`,
    ].join(' | ');
}
//# sourceMappingURL=genome.js.map