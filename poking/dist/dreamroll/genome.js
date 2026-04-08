"use strict";
// Style Genome: encodes design DNA, builds generation prompts, serializes
// for state.json and HTML comment headers.
//
// A genome is a SeedParameters value with all 14 dimensions resolved.
// The genomeToPrompt function turns it into a complete instruction set
// for Claude to generate a standalone HTML landing page.
Object.defineProperty(exports, "__esModule", { value: true });
exports.genomeToPrompt = genomeToPrompt;
exports.serializeGenomeAsComment = serializeGenomeAsComment;
exports.genomeSummary = genomeSummary;
const params_js_1 = require("./params.js");
/**
 * Builds the complete generation prompt for Claude to create a landing page
 * variation matching this genome. Includes:
 * - All 14 dimensions
 * - CSS signature for the chosen style archetype
 * - Computed harmony palette
 * - Google Fonts link tag
 * - Type scale steps
 * - Page content template
 * - CSS quality rules
 */
function genomeToPrompt(genome, brief, variationNumber, outputPath) {
    const styleSignature = (0, params_js_1.getStyleSignature)(genome.genre);
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
    const lines = [
        `Generate a complete standalone HTML landing page for variation #${String(variationNumber).padStart(3, '0')}.`,
        `Output path: ${outputPath}`,
        '',
        `PRODUCT BRIEF: ${brief}`,
        '',
        'STYLE GENOME (14 dimensions, all must visibly influence the design):',
        `  1.  Style archetype: ${genome.genre}`,
        `      CSS signature: ${styleSignature}`,
        `  2.  Color harmony: ${genome.colorPalette}${harmony?.kind === 'algorithmic' ? ` (base hue ${baseHue}°)` : ''}`,
        `      Palette: ${palette.join(', ') || '(see scheme rules)'}`,
        `  3.  Typography: ${genome.typography}${typography ? ` (${typography.personality})` : ''}`,
        typography ? `      Heading: ${typography.heading} ${typography.headingWeight} | Body: ${typography.body} ${typography.bodyWeight}` : '',
        `  4.  Type scale: ${genome.typeScale ?? '(default)'}${typeScale ? ` (ratio ${typeScale.ratio}, steps ${typeScale.steps.join('/')}px)` : ''}`,
        `  5.  Layout pattern: ${genome.layoutArchetype}`,
        `  6.  Density: ${genome.density}`,
        `  7.  Mood: ${genome.mood}`,
        `  8.  Era influence: ${genome.era}`,
        `  9.  Animation personality: ${genome.animation}`,
        `  10. Imagery approach: ${genome.imagery}`,
        `  11. Border radius: ${genome.borderRadius ?? '(default)'}${borderRadius ? ` — ${borderRadius.px}` : ''}`,
        `  12. Shadow system: ${genome.shadows ?? '(default)'}${shadow ? ` — ${shadow.css}` : ''}`,
        `  13. CTA style: ${genome.ctaStyle ?? '(default)'}${cta ? ` — ${cta.css}` : ''}`,
        `  14. Oblique constraint: ${genome.wildcard}`,
        '',
        'GOOGLE FONTS LINK:',
        `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
        `  <link href="${fontsLink}" rel="stylesheet">`,
        '',
        'PAGE STRUCTURE (9 sections, order can vary by layout dimension):',
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
        'CSS QUALITY RULES (mandatory):',
        '  - Single standalone HTML file. No external dependencies beyond the Google Fonts link.',
        '  - All CSS inline in a <style> tag inside <head>.',
        '  - 60-30-10 color distribution: dominant bg / secondary structure / accent CTA.',
        '  - Never use #000000 as background. Use #0A0A0A, #0F172A, #121212, or #18181B for dark.',
        '  - Accent must contrast >= 4.5:1 with its background (WCAG AA).',
        '  - Maximum 5 colors total in the palette.',
        '  - All spacing on an 8px grid (multiples of 8).',
        '  - Responsive at 375px, 768px, 1024px, 1440px. Use clamp(), min(), max(), no fixed widths.',
        '  - Include @media (prefers-reduced-motion: reduce) that strips motion but keeps fades.',
        '  - Only animate transform and opacity (GPU composited).',
        '  - Valid HTML5: nav, main, section, footer semantic elements.',
        '  - Total file size under 50KB.',
        '  - No JavaScript except optional IntersectionObserver scroll animations (under 20 lines).',
        '  - Real content from the brief, not lorem ipsum.',
        '  - CTA in the first viewport at 375px width.',
        '',
        'HTML COMMENT HEADER (place at the very top of the file, before <!DOCTYPE>):',
        serializeGenomeAsComment(genome, variationNumber),
        '',
        'After writing the file, return the file path so it can be scored.',
    ].filter(l => l !== '');
    return lines.join('\n');
}
/**
 * Serializes a genome as the HTML comment header that goes at the top of
 * each generated variation file. Used for grep/compare across variations.
 * Scores are filled in by genomeWithScoresAsComment after judging.
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
 * Returns a short single-line summary of a genome, used in status output and gem listings.
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