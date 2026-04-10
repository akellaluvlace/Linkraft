// Dreamroll Style Genome: 14 parameter dimensions per dreamroll-build-spec.
// Each variation rolls one value from each pool. Combination = design DNA.
// Some pools attach metadata (CSS signatures, font names, etc.) used by genome.ts
// when constructing the generation prompt.

import type { SeedParameters } from './types.js';

// ============================================================================
// Dimension 1: STYLE ARCHETYPE (30 options)
// Each archetype carries a CSS signature the generator must follow.
// ============================================================================

export interface StyleArchetype {
  id: string;
  category: 'modern-digital' | 'historical' | 'subcultural' | 'editorial' | 'emerging';
  /** Short CSS signature string used in prompt summary. */
  signature: string;
  /** 3-4 sentence description of what makes this style VISUALLY DISTINCT from a generic page. */
  distinctive: string;
  /** Specific CSS declarations that MUST appear in the generated HTML. Checked programmatically. */
  distinctiveCSS: string[];
  /** Anti-patterns: what the page MUST NOT look like for this style. */
  notLikeThis: string[];
}

export const STYLE_ARCHETYPES: StyleArchetype[] = [
  // ==========================================================================
  // MODERN DIGITAL
  // ==========================================================================
  {
    id: 'glassmorphism',
    category: 'modern-digital',
    signature: 'backdrop-filter: blur(10px); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.18)',
    distinctive: 'Every container is translucent with heavy backdrop-blur. Content floats on frosted glass layers. The background bleeds through everything. You can see blurred color shapes behind every UI element. There must be at least two colored blob shapes behind the content, visible through the frosted containers.',
    distinctiveCSS: ['backdrop-filter: blur(', 'background: rgba(', 'border: 1px solid rgba('],
    notLikeThis: ['opaque card backgrounds', 'hard solid borders', 'flat single-color fills', 'containers without blur', 'no visible background through elements'],
  },
  {
    id: 'neumorphism',
    category: 'modern-digital',
    signature: 'matching bg + element color; box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
    distinctive: 'Elements extrude from a matching-color background using dual shadows (one light from top-left, one dark from bottom-right). No strong borders. No saturated colors. The whole interface looks carved from a single piece of soft material. Cards must be the EXACT same background color as the page, differentiated only by shadow.',
    distinctiveCSS: ['box-shadow:', '-8px -8px', '8px 8px'],
    notLikeThis: ['cards with contrasting backgrounds', 'dark mode', 'gradient fills', 'sharp borders', 'saturated accent colors on containers'],
  },
  {
    id: 'aurora-ui',
    category: 'modern-digital',
    signature: 'absolute-positioned color blobs with filter: blur(50px) and animated hue-rotate()',
    distinctive: 'Large blurred color blobs float absolutely-positioned behind content. The page has a dreamlike atmospheric quality. Colors gradually shift across the viewport like a slow aurora. Content sits above diffuse color washes. There must be at least 3 blurred circles positioned around the page, each with different hues.',
    distinctiveCSS: ['filter: blur(', 'position: absolute', 'border-radius: 50%'],
    notLikeThis: ['solid backgrounds', 'sharp edges', 'uniform color fills', 'static decoration', 'no blurred shapes'],
  },
  {
    id: 'bento-grid',
    category: 'modern-digital',
    signature: 'CSS Grid with mixed span sizes, consistent gap: 16px, border-radius: 16px',
    distinctive: 'Mixed-size cards arranged on a CSS Grid with consistent gaps. Each cell tells one thing. Cards feel like tiles in a Japanese bento box. Every tile has the same rounded corners and same shadow depth. The hero itself is a bento arrangement, not a traditional centered headline.',
    distinctiveCSS: ['grid-template-columns', 'grid-column: span', 'gap: 16px', 'border-radius: 16px'],
    notLikeThis: ['single-column layouts', 'irregular gaps', 'cards with different radii', 'traditional centered hero', 'floating elements outside the grid'],
  },
  {
    id: 'neo-brutalism',
    category: 'modern-digital',
    signature: 'border: 3px solid #000; box-shadow: 4px 4px 0 #000; saturated flat fills',
    distinctive: 'Thick black borders on everything. Hard offset shadows that look drawn with a marker. No gradients. Raw saturated fills like #FF6B6B, #FFE66D, #4ECDC4. Elements look like they were slapped onto the page with confidence. Buttons and cards have 4px solid black borders and box-shadow: 6px 6px 0 #000 (no blur, pure offset).',
    distinctiveCSS: ['border: 3px solid #000', 'box-shadow:', '0 #000'],
    notLikeThis: ['subtle shadows with blur', 'rounded corners over 8px', 'gradient backgrounds', 'thin borders', 'pastel colors', 'soft easing'],
  },
  {
    id: 'claymorphism',
    category: 'modern-digital',
    signature: 'border-radius: 30px; background: pastel; box-shadow with inner highlight + outer soft shadow',
    distinctive: 'Everything has deep rounded corners (30px+). Soft pastel backgrounds (#F5E6E8, #E8F0F5, #F8F4E6). Inner highlights and outer shadows give elements a 3D "clay" feel. The page looks like it was sculpted from playdough. Buttons and cards must have extreme rounding and dual shadows (inner + outer).',
    distinctiveCSS: ['border-radius: 30px', 'box-shadow:', 'inset'],
    notLikeThis: ['sharp corners', 'flat 2D look', 'saturated colors', 'hard borders', 'small border-radius values'],
  },
  {
    id: 'liquid-glass',
    category: 'modern-digital',
    signature: 'backdrop-filter: blur(20px) saturate(180%); semi-transparent layers; refraction borders (Apple 2025)',
    distinctive: 'Heavy backdrop-blur with saturation boost. Multiple semi-transparent layers stack with subtle refraction borders. Content feels like it is under water. This is Apple 2025 liquid glass: heavier than classic glassmorphism, with 180% saturation boost and visible layering. Nav, cards, and CTA are all translucent layers.',
    distinctiveCSS: ['backdrop-filter: blur(', 'saturate(', 'rgba('],
    notLikeThis: ['opaque cards', 'single layer design', 'no blur', 'solid borders', 'matte finishes'],
  },

  // ==========================================================================
  // HISTORICAL MOVEMENTS
  // ==========================================================================
  {
    id: 'bauhaus',
    category: 'historical',
    signature: 'circles + triangles + squares; primary colors (#DD0000, #FFD700, #003DA5); Futura; strict grid',
    distinctive: 'Pure geometric primitives everywhere: circles, triangles, squares as the only decorative elements. Primary colors ONLY: red #DD0000, yellow #FFD700, blue #003DA5. Futura or geometric sans-serif. Strict mathematical grid. Anti-decorative. The page should feel like Herbert Bayer designed it in 1923.',
    distinctiveCSS: ['border-radius: 50%', '#DD0000', '#FFD700', '#003DA5'],
    notLikeThis: ['organic shapes', 'gradients', 'decorative fonts', 'soft or muted colors', 'curves', 'shadows'],
  },
  {
    id: 'art-deco',
    category: 'historical',
    signature: 'navy bg (#1A1A2E) + gold (#C9A94E); geometric symmetry; condensed serif; wide letter-spacing',
    distinctive: 'Navy #1A1A2E background with gold #C9A94E accents as the ONLY palette. Geometric symmetry everywhere. Wide letter-spacing on condensed serif headlines. Vertical chevrons, stepped pyramids, and sunburst motifs. Gatsby-era glamour. The Chrysler Building translated to web.',
    distinctiveCSS: ['#1A1A2E', '#C9A94E', 'letter-spacing:', 'text-transform: uppercase'],
    notLikeThis: ['sans-serif body', 'bright modern colors', 'asymmetric layouts', 'casual typography', 'soft shapes'],
  },
  {
    id: 'de-stijl',
    category: 'historical',
    signature: 'CSS Grid asymmetric blocks; border: 3px solid #000; pure primaries only; Mondrian composition',
    distinctive: 'Mondrian composition: rectangular blocks separated by 3px solid black borders. Only five colors allowed: red #E63946, blue #1D3557, yellow #F1C40F, white #FFFFFF, black #000000. CSS Grid with asymmetric cells. NO other colors. NO shadows. NO gradients. NO curves.',
    distinctiveCSS: ['border: 3px solid #000', 'grid-template', '#E63946', '#1D3557', '#F1C40F'],
    notLikeThis: ['curves', 'gradients', 'soft colors', 'rounded corners', 'shadows', 'any color outside primaries'],
  },
  {
    id: 'constructivism',
    category: 'historical',
    signature: 'transform: rotate(-15deg); diagonal compositions; Bebas Neue; red/black/cream',
    distinctive: 'Diagonal compositions via transform: rotate(-15deg) on multiple elements. Bebas Neue or condensed sans-serif, uppercase. Red #C41E3A, black, and cream palette only. Propaganda poster energy. Everything tilted and urgent. Hero headline at 15 degrees. Blocks that feel like they are about to fly off the page.',
    distinctiveCSS: ['transform: rotate(', '#C41E3A', 'text-transform: uppercase'],
    notLikeThis: ['horizontal baselines only', 'centered compositions', 'soft colors', 'serif fonts', 'calm rhythm'],
  },
  {
    id: 'swiss-international',
    category: 'historical',
    signature: 'Helvetica/Arial; strict 12-column grid; asymmetric layout; black + white + one accent',
    distinctive: 'Strict 12-column grid. Helvetica, Arial, or Inter (geometric sans). Pure black-and-white base with exactly ONE accent color (usually red or blue). Asymmetric layout with disciplined alignment. Extreme whitespace. Every element aligns to the grid. This is Muller-Brockmann-level discipline.',
    distinctiveCSS: ['grid-template-columns: repeat(12', 'Helvetica', 'Arial'],
    notLikeThis: ['decorative typography', 'multiple accent colors', 'gradients', 'centered layouts', 'soft shapes'],
  },
  {
    id: 'memphis',
    category: 'historical',
    signature: 'squiggles + dots + triangles; clashing pastels + neons; playful sans-serif; pattern backgrounds',
    distinctive: 'Clashing pastels and neons: pink #FF4081, cyan #00E5FF, yellow #FFEB3B, all at once. Squiggles, dots, triangles as repeating background patterns. Playful anti-minimalist chaos. Looks like 80s wallpaper designed by kids on sugar. Use repeating-linear-gradient or background-image patterns on multiple sections.',
    distinctiveCSS: ['repeating-linear-gradient', 'background-image:', '#FF4081', '#00E5FF'],
    notLikeThis: ['restrained palettes', 'professional tone', 'minimal decoration', 'monochrome', 'calm rhythm'],
  },
  {
    id: 'art-nouveau',
    category: 'historical',
    signature: 'organic curves; clip-path with flowing shapes; muted greens/golds; decorative serif',
    distinctive: 'Flowing organic curves via clip-path on sections and images. Muted greens #5D7052, golds #C9A94E, and warm creams #F5F0E1. Decorative serif fonts (Cormorant Garamond, Playfair). Nature-inspired curves and vines. Cards with wavy bottom edges. William Morris meets modern CSS.',
    distinctiveCSS: ['clip-path:', '#C9A94E', 'serif'],
    notLikeThis: ['geometric shapes', 'rigid grid layouts', 'bright saturated colors', 'sans-serif only', 'straight edges'],
  },

  // ==========================================================================
  // SUBCULTURAL
  // ==========================================================================
  {
    id: 'synthwave',
    category: 'subcultural',
    signature: 'sunset gradient (purple to orange); perspective grid lines; neon glow text-shadows; chrome text',
    distinctive: 'Sunset gradient from deep purple #0D0221 to hot magenta #CC00FF to orange #FF6600 as the hero background. Perspective grid lines receding on the floor (repeating-linear-gradient + transform: perspective). Neon pink #FF006E and cyan #00F5D4 glow text-shadows on headlines. Chrome effect on typography. 80s retrofuture Miami.',
    distinctiveCSS: ['linear-gradient(', '#FF006E', 'text-shadow:', 'perspective('],
    notLikeThis: ['muted colors', 'no gradients', 'light backgrounds', 'subtle type', 'corporate palette'],
  },
  {
    id: 'cyberpunk',
    category: 'subcultural',
    signature: 'clip-path angular cuts; magenta/cyan neon; #0A0A0A bg; glitch effects; monospace',
    distinctive: 'Angular clip-path cuts on every container (corners sliced off). Magenta #FF00FF and cyan #00FFFF neon borders on #0A0A0A background. Monospace typography (JetBrains Mono or Fira Code). Glitch effects on hover. Blade Runner Tokyo neon. Containers look like interface panels in a hacking terminal.',
    distinctiveCSS: ['clip-path: polygon', '#0A0A0A', 'monospace', '#FF00FF', '#00FFFF'],
    notLikeThis: ['rounded corners', 'pastel colors', 'serif fonts', 'light backgrounds', 'calm composition'],
  },
  {
    id: 'vaporwave',
    category: 'subcultural',
    signature: 'pastel neons (#FF71CE, #01CDFE, #05FFA1); glitch text; monospace; nostalgic imagery references',
    distinctive: 'Pastel neons only: pink #FF71CE, cyan #01CDFE, mint #05FFA1. Monospace or italic serif text. Gradient text fills. Roman statue and 90s Windows references in copy. Lo-fi dreamy 90s mall aesthetics. Grid backgrounds. Every element feels slightly melancholy and VHS-degraded.',
    distinctiveCSS: ['#FF71CE', '#01CDFE', '#05FFA1'],
    notLikeThis: ['corporate palettes', 'modern clean look', 'dark mode minimalism', 'serif headlines', 'sharp edges'],
  },
  {
    id: 'solarpunk',
    category: 'subcultural',
    signature: 'warm greens + amber; organic shapes; rounded everything; natural textures via CSS patterns',
    distinctive: 'Warm forest greens #2D5016, #5D7052, and amber #DAA520, #F4A261. Everything rounded (no sharp corners at all). Leaf and wave motifs via SVG or clip-path. Natural texture patterns via repeating-radial-gradient. Hopeful utopian imagery. Plants and growth copy. Post-oil future optimism.',
    distinctiveCSS: ['border-radius:', '#2D5016', '#DAA520'],
    notLikeThis: ['hard edges', 'cool blues', 'minimal greenery', 'dystopian dark palette', 'corporate tone'],
  },
  {
    id: 'steampunk',
    category: 'subcultural',
    signature: 'brass/copper gradients; gear-shaped borders; sepia tones; ornate serif; textured backgrounds',
    distinctive: 'Brass #B87333 and copper #A0522D linear gradients on borders and CTAs. Gear and cog motifs. Sepia tones throughout. Ornate serif typography (Cinzel, Cormorant). Textured backgrounds via repeating radial gradients suggesting wood or leather. Victorian industrial revolution. The page feels like a mechanical contraption.',
    distinctiveCSS: ['linear-gradient(', '#B87333', '#A0522D', 'serif'],
    notLikeThis: ['modern clean look', 'cool colors', 'sans-serif', 'minimal texture', 'flat design'],
  },
  {
    id: 'y2k',
    category: 'subcultural',
    signature: 'glossy bubbles; filter: saturate(1.5); bubblegum neons; metallic text; blob shapes',
    distinctive: 'Glossy bubble shapes via border-radius: 50% on decorative divs. filter: saturate(1.5) applied to the whole page. Bubblegum neon blobs: pink #FF71CE, sky #01CDFE, purple #B967FF. Metallic silver text via gradient clips. Chrome and plastic textures. Late 90s MSN Messenger energy. Aqua buttons with inset highlights.',
    distinctiveCSS: ['filter: saturate', 'border-radius: 50%', '#FF71CE'],
    notLikeThis: ['muted palette', 'minimalism', 'flat design', 'editorial tone', 'monochrome'],
  },

  // ==========================================================================
  // EDITORIAL / PRINT
  // ==========================================================================
  {
    id: 'newspaper',
    category: 'editorial',
    signature: 'multi-column text (column-count: 3); serif body; rules between columns; masthead layout',
    distinctive: 'Body text in 3 columns (column-count: 3) with column-rule separators. Serif body fonts (Merriweather, Source Serif). Horizontal double-rules between sections. Masthead at top with volume/issue date. Drop caps on first paragraph via ::first-letter. Editorial gravitas. The page must look like a broadsheet paper.',
    distinctiveCSS: ['column-count:', 'column-rule:', 'serif'],
    notLikeThis: ['single column prose', 'sans-serif body', 'casual layout', 'no rules between sections', 'modern card grids'],
  },
  {
    id: 'magazine',
    category: 'editorial',
    signature: 'full-bleed images; overlapping text on image; dramatic scale contrast; editorial serif',
    distinctive: 'Full-bleed hero that touches both edges of the viewport. Overlapping text on image placeholders (position: absolute with z-index). Dramatic scale contrast: huge display type next to tiny captions. Editorial serif headlines (Playfair Display, Bodoni). Large intentional whitespace. Vogue/Harpers layout energy.',
    distinctiveCSS: ['position: absolute', 'font-size: clamp(', 'serif'],
    notLikeThis: ['contained images only', 'uniform type sizes', 'grid-only layout', 'sans-serif everywhere', 'symmetric compositions'],
  },
  {
    id: 'poster',
    category: 'editorial',
    signature: 'single viewport; massive typography (120px+); minimal elements; maximum impact',
    distinctive: 'The entire landing page is essentially one giant poster. Massive typography at clamp(80px, 14vw, 180px). One headline, one CTA, minimal elements. Maximum visual impact with 3-5 total elements on screen. Concert poster energy. The rest of the page sections are small subordinate additions below the poster hero.',
    distinctiveCSS: ['font-size: clamp(', 'font-weight: 900'],
    notLikeThis: ['many small sections', 'small typography', 'dense content', 'grid layouts', 'multiple CTAs in hero'],
  },
  {
    id: 'book-cover',
    category: 'editorial',
    signature: 'centered composition; single typeface; restrained color; strong vertical rhythm',
    distinctive: 'Everything perfectly centered on a vertical axis. Single typeface (one serif for everything, differentiated by weight and size). Maximum 3 colors. Strong vertical rhythm. Penguin Classics energy. Every element in symmetric hierarchy. Hero looks like the front of a novel, not a landing page.',
    distinctiveCSS: ['text-align: center', 'serif'],
    notLikeThis: ['asymmetric layouts', 'multiple type families', 'busy composition', 'grid layouts'],
  },

  // ==========================================================================
  // EMERGING 2025-2026
  // ==========================================================================
  {
    id: 'kinetic-type',
    category: 'emerging',
    signature: 'variable font animation; font-variation-settings transitions; text as hero element',
    distinctive: 'Text IS the design. Animated variable font weight/width transitions via @keyframes on font-variation-settings. Huge typography with constant motion. Words move, morph, or pulse. Typography is the hero element, not supporting. The page should feel like a typographic animation played on a loop.',
    distinctiveCSS: ['font-variation-settings', '@keyframes', 'animation:'],
    notLikeThis: ['static typography only', 'small type', 'image-dominated design', 'no animation', 'calm type'],
  },
  {
    id: 'tactile-rebellion',
    category: 'emerging',
    signature: 'grain texture overlays; hand-drawn SVG borders; deliberate imperfection; anti-AI-polish',
    distinctive: 'Visible grain texture overlays via SVG noise filter or background-image. Hand-drawn wavy SVG borders instead of clean lines. Deliberate imperfection: uneven margins, slightly rotated elements (transform: rotate(-0.7deg)). Warm paper colors. Anti-AI-polish. The page should look like it was built by a person who does not care about pixel-perfect alignment.',
    distinctiveCSS: ['background-image:', 'transform: rotate('],
    notLikeThis: ['pixel-perfect alignment', 'cold digital look', 'AI-generated feel', 'sharp edges', 'perfect grid'],
  },
  {
    id: 'dopamine-design',
    category: 'emerging',
    signature: 'hyper-saturated palettes; bold gradients; energetic layout; maximum visual stimulation',
    distinctive: 'Hyper-saturated palette with 5+ bright colors used aggressively. Bold multi-stop linear gradients on every section. Energetic chaotic layout. Maximum visual stimulation. Every element competes for attention. TikTok/Gen Z energy. The page should feel like a sugar rush.',
    distinctiveCSS: ['linear-gradient(', 'filter: saturate'],
    notLikeThis: ['restrained palette', 'muted colors', 'minimal design', 'corporate tone', 'monochrome'],
  },
  {
    id: 'dark-luxe',
    category: 'emerging',
    signature: 'near-black bg (#0A0A0A); gold or silver accent; thin serif; extreme whitespace',
    distinctive: 'Near-black #0A0A0A background. Gold #D4AF37 or silver #C0C0C0 accents only. Thin elegant serifs (font-weight: 300, Playfair Display Light). Extreme whitespace (padding-block: 160px+ on sections). Restrained like a luxury jeweler website. The page should feel expensive and quiet.',
    distinctiveCSS: ['#0A0A0A', '#D4AF37', 'font-weight: 300', 'serif'],
    notLikeThis: ['bright colors', 'bold weights', 'dense layouts', 'multiple accents', 'casual tone'],
  },
  {
    id: 'scrollytelling',
    category: 'emerging',
    signature: 'CSS scroll-timeline animations; narrative section flow; parallax depth layers',
    distinctive: 'CSS scroll-driven animations on every section. Parallax depth layers via transform: translateZ or scroll-triggered transforms. Each section tells part of a narrative. Content reveals on scroll. position: sticky elements that pin and release. Information unfolds cinematically.',
    distinctiveCSS: ['position: sticky', 'transform:', '@keyframes'],
    notLikeThis: ['static layout', 'no scroll effects', 'traditional landing page', 'no narrative flow'],
  },
  {
    id: 'organic-minimal',
    category: 'emerging',
    signature: 'earth tones; generous whitespace; rounded shapes; natural proportions; calm energy',
    distinctive: 'Earth tones: warm beige #F5F0EB, sage green #8A9A5B, soft ochre #E8B07A. Generous whitespace (sections at 120px+ padding). All corners rounded (border-radius: 16-24px). Natural proportions. Calm breathing rhythm. Notion meets Muji. The page should feel like a quiet morning.',
    distinctiveCSS: ['border-radius:', '#F5F0EB', '#8A9A5B'],
    notLikeThis: ['sharp corners', 'bright saturated colors', 'dense layouts', 'cold tones', 'aggressive tone'],
  },
];

export const STYLE_POOL: string[] = STYLE_ARCHETYPES.map(s => s.id);

export function getStyleSignature(styleId: string): string {
  return STYLE_ARCHETYPES.find(s => s.id === styleId)?.signature ?? '';
}

export function getStyleArchetype(styleId: string): StyleArchetype | undefined {
  return STYLE_ARCHETYPES.find(s => s.id === styleId);
}

/**
 * Scans generated HTML for the required CSS declarations for a given style.
 * Returns which required strings are present vs missing.
 * Used by the auto-deduction path in the recording flow.
 */
export function checkDistinctiveCSS(
  htmlContent: string,
  styleId: string,
): { required: string[]; present: string[]; missing: string[] } {
  const archetype = getStyleArchetype(styleId);
  if (!archetype || archetype.distinctiveCSS.length === 0) {
    return { required: [], present: [], missing: [] };
  }

  const present: string[] = [];
  const missing: string[] = [];
  for (const req of archetype.distinctiveCSS) {
    if (htmlContent.includes(req)) present.push(req);
    else missing.push(req);
  }
  return { required: archetype.distinctiveCSS, present, missing };
}

// ============================================================================
// Dimension 2: COLOR HARMONY (12 options — 7 algorithmic + 5 curated)
// Algorithmic schemes derive from a random base hue (0-360).
// ============================================================================

export type HarmonyKind = 'algorithmic' | 'curated';

export interface HarmonyScheme {
  id: string;
  kind: HarmonyKind;
  /** Static palette for curated presets. Algorithmic schemes generate at runtime from base hue. */
  preset?: string[];
}

export const HARMONY_SCHEMES: HarmonyScheme[] = [
  { id: 'monochromatic', kind: 'algorithmic' },
  { id: 'complementary', kind: 'algorithmic' },
  { id: 'analogous', kind: 'algorithmic' },
  { id: 'triadic', kind: 'algorithmic' },
  { id: 'split-complementary', kind: 'algorithmic' },
  { id: 'tetradic', kind: 'algorithmic' },
  { id: 'golden-ratio', kind: 'algorithmic' },
  { id: 'earth-tones', kind: 'curated', preset: ['#8B7355', '#6B8E23', '#CD853F', '#DEB887', '#556B2F'] },
  { id: 'neon-on-dark', kind: 'curated', preset: ['#0A0A0A', '#FF006E', '#00F5D4', '#FFD166'] },
  { id: 'jewel-tones', kind: 'curated', preset: ['#7B2D8E', '#1B4D3E', '#8B0000', '#DAA520', '#191970'] },
  { id: 'pastels', kind: 'curated', preset: ['#FFB5E8', '#B5DEFF', '#E7FFAC', '#FFC9DE', '#C4FAF8'] },
  { id: 'black-plus-accent', kind: 'curated', preset: ['#0A0A0A', '#1A1A1A', '#2A2A2A'] }, // accent appended at runtime
];

export const PALETTE_POOL: string[] = HARMONY_SCHEMES.map(h => h.id);

export function getHarmonyScheme(id: string): HarmonyScheme | undefined {
  return HARMONY_SCHEMES.find(h => h.id === id);
}

/**
 * Generates a palette from a harmony scheme + base hue.
 * For algorithmic schemes returns computed HSL values; for curated returns the preset.
 */
export function computeHarmonyPalette(schemeId: string, baseHue: number): string[] {
  const scheme = getHarmonyScheme(schemeId);
  if (!scheme) return [];
  if (scheme.kind === 'curated' && scheme.preset) return scheme.preset;

  const sat = 60;
  const light = 50;
  const hsl = (h: number, s: number, l: number): string => `hsl(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%)`;

  switch (schemeId) {
    case 'monochromatic':
      return [hsl(baseHue, sat, 30), hsl(baseHue, sat, 50), hsl(baseHue, sat, 70), hsl(baseHue, sat - 20, 40), hsl(baseHue, sat - 20, 60)];
    case 'complementary':
      return [hsl(baseHue, sat, light), hsl(baseHue + 180, sat, light)];
    case 'analogous':
      return [hsl(baseHue - 30, sat, light), hsl(baseHue, sat, light), hsl(baseHue + 30, sat, light)];
    case 'triadic':
      return [hsl(baseHue, sat, light), hsl(baseHue + 120, sat, light), hsl(baseHue + 240, sat, light)];
    case 'split-complementary':
      return [hsl(baseHue, sat, light), hsl(baseHue + 150, sat, light), hsl(baseHue + 210, sat, light)];
    case 'tetradic':
      return [hsl(baseHue, sat, light), hsl(baseHue + 60, sat, light), hsl(baseHue + 180, sat, light), hsl(baseHue + 240, sat, light)];
    case 'golden-ratio': {
      const phi = 0.618;
      return [
        hsl(baseHue, sat, light),
        hsl(baseHue + 360 * phi, sat, light),
        hsl(baseHue + 720 * phi, sat, light),
        hsl(baseHue + 1080 * phi, sat, light),
      ];
    }
    default:
      return [];
  }
}

// ============================================================================
// Dimension 3: TYPOGRAPHY PAIRING (25 options)
// Each pairing has heading + body Google Font name + personality tag.
// ============================================================================

export interface TypographyPairing {
  id: string;
  heading: string;
  headingWeight: number;
  body: string;
  bodyWeight: number;
  personality: string;
  category: 'serif-sans' | 'sans-sans' | 'display-workhorse' | 'mono-sans' | 'experimental';
  /** Google Fonts URL fragment for both fonts */
  googleFontsParam: string;
}

export const TYPOGRAPHY_PAIRINGS: TypographyPairing[] = [
  // SERIF + SANS
  { id: 'playfair-source', heading: 'Playfair Display', headingWeight: 700, body: 'Source Sans 3', bodyWeight: 400, personality: 'editorial-luxury', category: 'serif-sans', googleFontsParam: 'family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400' },
  { id: 'abril-lato', heading: 'Abril Fatface', headingWeight: 400, body: 'Lato', bodyWeight: 400, personality: 'dramatic-warm', category: 'serif-sans', googleFontsParam: 'family=Abril+Fatface&family=Lato:wght@400' },
  { id: 'bodoni-inter', heading: 'Bodoni Moda', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'high-fashion', category: 'serif-sans', googleFontsParam: 'family=Bodoni+Moda:wght@700&family=Inter:wght@400' },
  { id: 'dm-serif-dm-sans', heading: 'DM Serif Display', headingWeight: 400, body: 'DM Sans', bodyWeight: 400, personality: 'balanced-modern', category: 'serif-sans', googleFontsParam: 'family=DM+Serif+Display&family=DM+Sans:wght@400' },
  { id: 'cormorant-proza', heading: 'Cormorant Garamond', headingWeight: 600, body: 'Proza Libre', bodyWeight: 400, personality: 'literary-refined', category: 'serif-sans', googleFontsParam: 'family=Cormorant+Garamond:wght@600&family=Proza+Libre:wght@400' },

  // SANS + SANS
  { id: 'montserrat-opensans', heading: 'Montserrat', headingWeight: 700, body: 'Open Sans', bodyWeight: 400, personality: 'modern-workhorse', category: 'sans-sans', googleFontsParam: 'family=Montserrat:wght@700&family=Open+Sans:wght@400' },
  { id: 'poppins-inter', heading: 'Poppins', headingWeight: 600, body: 'Inter', bodyWeight: 400, personality: 'friendly-precise', category: 'sans-sans', googleFontsParam: 'family=Poppins:wght@600&family=Inter:wght@400' },
  { id: 'clash-satoshi', heading: 'Manrope', headingWeight: 600, body: 'Inter', bodyWeight: 400, personality: 'bold-contemporary', category: 'sans-sans', googleFontsParam: 'family=Manrope:wght@600&family=Inter:wght@400' },
  { id: 'space-grotesk-inter', heading: 'Space Grotesk', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'geometric-clean', category: 'sans-sans', googleFontsParam: 'family=Space+Grotesk:wght@700&family=Inter:wght@400' },
  { id: 'outfit-plus-jakarta', heading: 'Outfit', headingWeight: 600, body: 'Plus Jakarta Sans', bodyWeight: 400, personality: 'rounded-approachable', category: 'sans-sans', googleFontsParam: 'family=Outfit:wght@600&family=Plus+Jakarta+Sans:wght@400' },

  // DISPLAY + WORKHORSE
  { id: 'bebas-heebo', heading: 'Bebas Neue', headingWeight: 400, body: 'Heebo', bodyWeight: 400, personality: 'bold-impact', category: 'display-workhorse', googleFontsParam: 'family=Bebas+Neue&family=Heebo:wght@400' },
  { id: 'oswald-merriweather', heading: 'Oswald', headingWeight: 600, body: 'Merriweather', bodyWeight: 400, personality: 'condensed-readable', category: 'display-workhorse', googleFontsParam: 'family=Oswald:wght@600&family=Merriweather:wght@400' },
  { id: 'archivo-black-karla', heading: 'Archivo Black', headingWeight: 400, body: 'Karla', bodyWeight: 400, personality: 'heavy-friendly', category: 'display-workhorse', googleFontsParam: 'family=Archivo+Black&family=Karla:wght@400' },
  { id: 'anton-work-sans', heading: 'Anton', headingWeight: 400, body: 'Work Sans', bodyWeight: 400, personality: 'ultra-bold-clean', category: 'display-workhorse', googleFontsParam: 'family=Anton&family=Work+Sans:wght@400' },
  { id: 'righteous-nunito', heading: 'Righteous', headingWeight: 400, body: 'Nunito Sans', bodyWeight: 400, personality: 'retro-soft', category: 'display-workhorse', googleFontsParam: 'family=Righteous&family=Nunito+Sans:wght@400' },

  // MONO + SANS
  { id: 'space-mono-inter', heading: 'Space Mono', headingWeight: 700, body: 'Inter', bodyWeight: 400, personality: 'terminal-precise', category: 'mono-sans', googleFontsParam: 'family=Space+Mono:wght@700&family=Inter:wght@400' },
  { id: 'jetbrains-source', heading: 'JetBrains Mono', headingWeight: 700, body: 'Source Sans 3', bodyWeight: 400, personality: 'developer-clean', category: 'mono-sans', googleFontsParam: 'family=JetBrains+Mono:wght@700&family=Source+Sans+3:wght@400' },
  { id: 'fira-code-rubik', heading: 'Fira Code', headingWeight: 600, body: 'Rubik', bodyWeight: 400, personality: 'code-friendly', category: 'mono-sans', googleFontsParam: 'family=Fira+Code:wght@600&family=Rubik:wght@400' },
  { id: 'ibm-plex-mono-sans', heading: 'IBM Plex Mono', headingWeight: 600, body: 'IBM Plex Sans', bodyWeight: 400, personality: 'ibm-systematic', category: 'mono-sans', googleFontsParam: 'family=IBM+Plex+Mono:wght@600&family=IBM+Plex+Sans:wght@400' },

  // EXPERIMENTAL
  { id: 'syne-general-sans', heading: 'Syne', headingWeight: 700, body: 'DM Sans', bodyWeight: 400, personality: 'avant-garde', category: 'experimental', googleFontsParam: 'family=Syne:wght@700&family=DM+Sans:wght@400' },
  { id: 'cabinet-grotesk-inter', heading: 'Manrope', headingWeight: 800, body: 'Inter', bodyWeight: 400, personality: 'trendy-sharp', category: 'experimental', googleFontsParam: 'family=Manrope:wght@800&family=Inter:wght@400' },
  { id: 'instrument-serif-sans', heading: 'Instrument Serif', headingWeight: 400, body: 'Instrument Sans', bodyWeight: 400, personality: 'elegant-matched', category: 'experimental', googleFontsParam: 'family=Instrument+Serif&family=Instrument+Sans:wght@400' },
  { id: 'fraunces-commissioner', heading: 'Fraunces', headingWeight: 700, body: 'Commissioner', bodyWeight: 400, personality: 'quirky-professional', category: 'experimental', googleFontsParam: 'family=Fraunces:wght@700&family=Commissioner:wght@400' },
  { id: 'young-serif-outfit', heading: 'Young Serif', headingWeight: 400, body: 'Outfit', bodyWeight: 400, personality: 'nostalgic-modern', category: 'experimental', googleFontsParam: 'family=Young+Serif&family=Outfit:wght@400' },
  { id: 'bricolage-atkinson', heading: 'Bricolage Grotesque', headingWeight: 700, body: 'Atkinson Hyperlegible', bodyWeight: 400, personality: 'accessible-bold', category: 'experimental', googleFontsParam: 'family=Bricolage+Grotesque:wght@700&family=Atkinson+Hyperlegible:wght@400' },
];

export const TYPOGRAPHY_POOL: string[] = TYPOGRAPHY_PAIRINGS.map(t => t.id);

export function getTypographyPairing(id: string): TypographyPairing | undefined {
  return TYPOGRAPHY_PAIRINGS.find(t => t.id === id);
}

// ============================================================================
// Dimension 4: TYPE SCALE (6 options)
// ============================================================================

export interface TypeScale {
  id: string;
  ratio: number;
  description: string;
  steps: number[];
}

export const TYPE_SCALES: TypeScale[] = [
  { id: 'minor-second', ratio: 1.067, description: 'subtle, calm', steps: [16, 17, 18, 19, 21] },
  { id: 'major-second', ratio: 1.125, description: 'gentle, editorial', steps: [16, 18, 20, 23, 25] },
  { id: 'minor-third', ratio: 1.200, description: 'balanced, versatile', steps: [16, 19, 23, 28, 33] },
  { id: 'major-third', ratio: 1.250, description: 'confident, standard', steps: [16, 20, 25, 31, 39] },
  { id: 'perfect-fourth', ratio: 1.333, description: 'dramatic, bold', steps: [16, 21, 28, 38, 50] },
  { id: 'golden-ratio', ratio: 1.618, description: 'maximum impact, display', steps: [16, 26, 42, 67, 109] },
];

export const TYPE_SCALE_POOL: string[] = TYPE_SCALES.map(s => s.id);

export function getTypeScale(id: string): TypeScale | undefined {
  return TYPE_SCALES.find(s => s.id === id);
}

// ============================================================================
// Dimension 5: LAYOUT PATTERN (10 options)
// ============================================================================

export const LAYOUT_POOL = [
  'single-column-hero',
  'split-50-50',
  'asymmetric-golden',
  'full-bleed-sections',
  'bento-mosaic',
  'editorial-magazine',
  'card-grid',
  'sidebar-anchor',
  'z-pattern',
  'stacked-panels',
];

// ============================================================================
// Dimension 6: DENSITY (5 options)
// ============================================================================

export const DENSITY_POOL = [
  'ultra-minimal',
  'sparse',
  'balanced',
  'information-rich',
  'dense',
];

// ============================================================================
// Dimension 7: MOOD (10 options)
// ============================================================================

export const MOOD_POOL = [
  'corporate-trust',
  'playful-energy',
  'premium-luxury',
  'raw-authentic',
  'techy-hacker',
  'warm-friendly',
  'cold-clinical',
  'mysterious-dark',
  'energetic-bold',
  'calm-zen',
];

// ============================================================================
// Dimension 8: ERA INFLUENCE (10 options)
// ============================================================================

export const ERA_POOL = [
  '1920s-art-deco',
  '1960s-psychedelic',
  '1970s-warm',
  '1980s-neon',
  '1990s-grunge',
  '2000s-web2',
  '2010s-flat',
  '2020s-modern',
  'far-future',
  'timeless',
];

// ============================================================================
// Dimension 9: ANIMATION PERSONALITY (7 options)
// ============================================================================

export const ANIMATION_POOL = [
  'none',
  'subtle-fade',
  'scroll-reveal',
  'kinetic-type',
  'bouncy-playful',
  'cinematic-reveal',
  'glitch-digital',
];

// ============================================================================
// Dimension 10: IMAGERY APPROACH (8 options)
// ============================================================================

export const IMAGERY_POOL = [
  'no-images-pure-type',
  'geometric-shapes',
  'gradients-only',
  'pattern-backgrounds',
  'abstract-blobs',
  'svg-illustrations',
  'photo-placeholders',
  'noise-texture',
];

// ============================================================================
// Dimension 11: BORDER RADIUS (5 options)
// ============================================================================

export interface BorderRadiusSpec {
  id: string;
  px: string;
}

export const BORDER_RADIUS_SPECS: BorderRadiusSpec[] = [
  { id: 'sharp-zero', px: '0px everywhere (brutalist, terminal, constructivist)' },
  { id: 'subtle-small', px: '4px (professional, corporate, precise)' },
  { id: 'moderate-medium', px: '8-12px (modern default, balanced)' },
  { id: 'rounded-large', px: '16-24px (friendly, approachable, bento)' },
  { id: 'pill-full', px: '9999px on buttons, 24px on containers (playful, bubbly)' },
];

export const BORDER_RADIUS_POOL: string[] = BORDER_RADIUS_SPECS.map(b => b.id);

// ============================================================================
// Dimension 12: SHADOW SYSTEM (5 options)
// ============================================================================

export interface ShadowSpec {
  id: string;
  css: string;
}

export const SHADOW_SPECS: ShadowSpec[] = [
  { id: 'no-shadows', css: 'flat, no shadows; depth via color/border' },
  { id: 'subtle-ambient', css: 'box-shadow: 0 1px 3px rgba(0,0,0,0.1)' },
  { id: 'medium-layered', css: 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)' },
  { id: 'dramatic-offset', css: 'box-shadow: 8px 8px 0 #000 (neo-brutalism, retro)' },
  { id: 'soft-neumorphic', css: 'dual directional shadows, light + dark, matching bg hue' },
];

export const SHADOW_POOL: string[] = SHADOW_SPECS.map(s => s.id);

// ============================================================================
// Dimension 13: CTA STYLE (6 options)
// ============================================================================

export interface CtaStyleSpec {
  id: string;
  css: string;
}

export const CTA_STYLE_SPECS: CtaStyleSpec[] = [
  { id: 'solid-fill', css: 'bg-accent, text-white, no border, standard button' },
  { id: 'outline-ghost', css: 'border: 2px solid accent, transparent bg, hover fills' },
  { id: 'gradient-button', css: 'linear-gradient bg, subtle hover shift' },
  { id: 'text-link-arrow', css: 'no button shape, text + arrow icon, underline on hover' },
  { id: 'pill-glow', css: 'border-radius: 9999px + box-shadow glow in accent color' },
  { id: 'brutalist-block', css: 'thick border, hard shadow offset, square corners, uppercase' },
];

export const CTA_STYLE_POOL: string[] = CTA_STYLE_SPECS.map(c => c.id);

// ============================================================================
// Dimension 14: OBLIQUE STRATEGY CONSTRAINT (40 options)
// ============================================================================

// ============================================================================
// Dimension 15: STYLE MUTATION (8 options)
// Controls HOW the style archetype is applied. Changes the generation prompt.
// ============================================================================

export interface MutationSpec {
  id: string;
  weight: number;
  /** Short summary shown in the report + HTML comment. */
  summary: string;
  /** Per-type description of what the mutation does, templated with primary and other rolled values. */
  describe: (args: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    material?: string;
    era?: string;
  }) => string;
}

export const MUTATIONS: MutationSpec[] = [
  {
    id: 'pure',
    weight: 30,
    summary: 'Apply the archetype faithfully',
    describe: () => 'Standard execution. Apply the style archetype faithfully as documented.',
  },
  {
    id: 'mashup',
    weight: 25,
    summary: 'Two archetypes fused',
    describe: ({ primary, secondary }) =>
      `Roll TWO style archetypes. Apply "${primary}" to layout and structure. Apply "${secondary}" to color, texture, and surface treatment. The skeleton is ${primary}. The skin is ${secondary}.`,
  },
  {
    id: 'invert',
    weight: 10,
    summary: 'Opposite of archetype rules',
    describe: ({ primary }) =>
      `Take "${primary}"'s rules and do the OPPOSITE. If the archetype says thick borders, use whisper-thin. If it says dark background, use pastel. If it says hard edges, use soft. Invert every distinctive property while keeping the same product brief.`,
  },
  {
    id: 'era-clash',
    weight: 10,
    summary: 'Archetype forced through the era',
    describe: ({ primary, era }) =>
      `Apply "${primary}" but force it through the era "${era}" literally. The archetype provides structure and layout philosophy, but every color, texture, and typographic flourish comes from ${era}. Example: Swiss-international grid with 1970s warm earth tones.`,
  },
  {
    id: 'material-swap',
    weight: 10,
    summary: 'Surfaces replaced with a material',
    describe: ({ primary, material }) =>
      `Keep "${primary}"'s layout and structure but replace every surface, border, and fill with the physical material "${material}". Cards become ${material}. Buttons become ${material}. Backgrounds become ${material}. Use CSS to simulate the material's visual properties (texture, transparency, weight, light).`,
  },
  {
    id: 'maximum',
    weight: 5,
    summary: 'Archetype properties pushed to 200%',
    describe: ({ primary }) =>
      `Take every distinctive CSS property of "${primary}" and push it to 200%. If the archetype has 3px borders, use 8px. If 10px blur, use 40px. If 10% gold accent, use 30%. Every rule amplified past normal. Over-commit to the style.`,
  },
  {
    id: 'minimum',
    weight: 5,
    summary: 'Strip to one essential property',
    describe: ({ primary }) =>
      `Strip "${primary}" to its ONE most essential property. Identify the single most defining CSS rule of the archetype and apply ONLY that. Everything else is clean, neutral, unremarkable. Force elegant restraint.`,
  },
  {
    id: 'franken',
    weight: 5,
    summary: 'Chimera of three archetypes',
    describe: ({ primary, secondary, tertiary }) =>
      `Three archetypes fused. Take the COLOR SYSTEM from "${primary}". Take the TYPOGRAPHY rules from "${secondary}". Take the LAYOUT pattern from "${tertiary}". Deliberately chimeric. The result should have no coherent parent — it's a new creature.`,
  },
];

export const MUTATION_POOL: string[] = MUTATIONS.map(m => m.id);

export function getMutation(id: string): MutationSpec | undefined {
  return MUTATIONS.find(m => m.id === id);
}

/** Materials for the material-swap mode. */
export const MATERIALS = [
  'concrete', 'silk', 'glass', 'paper', 'metal', 'water', 'marble', 'velvet',
];

export const WILDCARD_POOL = [
  // REDUCTION
  'one-font-only',
  'max-3-colors',
  'no-borders',
  'no-images-text-only',
  'only-system-fonts',
  'no-padding-over-16px',
  'no-headings-over-3-words',

  // INVERSION
  'dark-mode-only',
  'light-mode-only',
  'everything-centered',
  'all-uppercase',
  'all-lowercase',
  'inverted-hierarchy',

  // MATERIAL
  'paper-texture',
  'glass-everything',
  'metal-industrial',
  'neon-signs',
  'watercolor-wash',

  // STRUCTURAL
  'single-scroll-no-sections',
  'alternating-dark-light',
  'full-viewport-sections',
  'sidebar-layout',
  'asymmetric-whitespace',
  'css-grid-only-no-flexbox',
  'sticky-everything',

  // CREATIVE (Oblique Strategies adapted)
  'use-unacceptable-color',
  'simple-subtraction',
  'turn-it-upside-down',
  'empty-hero',
  'one-element-per-kind',
  'make-blank-valuable',
  'what-would-a-child-draw',
  'design-for-one-person',
  'contradict-every-section',
  'the-accidental-masterpiece',
  'maximum-with-minimum',
  'analog-in-digital',
  'the-last-page-on-earth',
  'brutally-honest-copy',
  'hand-drawn-borders',
];

// ============================================================================
// Dimension 16: COPY ANGLE (10 options)
// Frames the headline / subheadline / CTA copy. Same brief, different angle.
// ============================================================================

export interface CopyAngleSpec {
  id: string;
  /** One-line guidance the prompt builder embeds. */
  guidance: string;
}

export const COPY_ANGLE_SPECS: CopyAngleSpec[] = [
  { id: 'pain-point-first',   guidance: 'Lead with the problem the user has TODAY. Headline names the pain. Sub explains the cost. CTA promises relief.' },
  { id: 'outcome-first',      guidance: 'Lead with what life looks like AFTER. Headline paints the destination. Sub describes the new normal. CTA is the door.' },
  { id: 'social-proof-first', guidance: 'Lead with WHO is already using it. Headline name-drops or quantifies users. Sub backs it up. CTA invites the reader to join the crowd.' },
  { id: 'contrarian',         guidance: 'Lead by challenging an assumption everyone in the market holds. Headline picks the fight. Sub explains the better way. CTA is the new path.' },
  { id: 'story',              guidance: 'Narrative arc from problem to solution. Headline opens with a vignette. Sub continues the story. CTA is the next chapter.' },
  { id: 'data-driven',        guidance: 'Lead with one specific stat or number that does the persuading. Headline IS the number. Sub contextualizes it. CTA acts on the implication.' },
  { id: 'question',           guidance: 'Open with a provocative question the reader cannot answer comfortably. Sub answers it for them. CTA acts on the answer.' },
  { id: 'comparison',         guidance: 'Frame as "unlike X, we do Y". Headline draws the contrast. Sub spells out the difference. CTA is the obvious choice.' },
  { id: 'minimal',            guidance: 'As few words as possible. Headline under 5 words. Sub under 12. CTA is one word. The design carries the load.' },
  { id: 'bold-claim',         guidance: 'Make ONE audacious promise. Headline is the promise. Sub backs it with one reason. CTA is the way to claim it.' },
];

export const COPY_ANGLE_POOL: string[] = COPY_ANGLE_SPECS.map(c => c.id);

export function getCopyAngle(id: string): CopyAngleSpec | undefined {
  return COPY_ANGLE_SPECS.find(c => c.id === id);
}

// ============================================================================
// Dimension 17: SECTION VARIATION (3 options)
// Controls how much page sections deviate from the base genome.
// Creates internal rhythm rather than one flat tone throughout.
// ============================================================================

export interface SectionVariationSpec {
  id: string;
  /** Prompt instructions for the generator. */
  instructions: string;
}

export const SECTION_VARIATION_SPECS: SectionVariationSpec[] = [
  { id: 'uniform',  instructions: 'Every section follows the base genome exactly. Density, layout, and rhythm are constant from nav to footer.' },
  { id: 'subtle',   instructions: 'Pick 1-2 sections that shift density or layout slightly from the base genome. The shift should be felt, not announced. Most of the page reads as one piece.' },
  { id: 'dramatic', instructions: 'Each section rolls its own sub-density and sub-layout. Hero is the primary genome. Features uses a denser layout. Testimonials uses a different layout pattern. How-it-works can be sparser. The page should feel like a magazine spread where each spread breathes differently. All sub-rolls still respect the style archetype, color harmony, and typography.' },
];

export const SECTION_VARIATION_POOL: string[] = SECTION_VARIATION_SPECS.map(s => s.id);

export function getSectionVariation(id: string): SectionVariationSpec | undefined {
  return SECTION_VARIATION_SPECS.find(s => s.id === id);
}

// ============================================================================
// Per-parameter weight map for evolution.
// Higher weight = more likely to be picked.
// ============================================================================

export interface ParamWeights {
  style?: Record<string, number>;
  palette?: Record<string, number>;
  typography?: Record<string, number>;
  typeScale?: Record<string, number>;
  layout?: Record<string, number>;
  density?: Record<string, number>;
  mood?: Record<string, number>;
  era?: Record<string, number>;
  animation?: Record<string, number>;
  imagery?: Record<string, number>;
  borderRadius?: Record<string, number>;
  shadows?: Record<string, number>;
  ctaStyle?: Record<string, number>;
  wildcard?: Record<string, number>;
  copyAngle?: Record<string, number>;
  sectionVariation?: Record<string, number>;
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Picks from a pool respecting optional weights.
 * Unweighted values default to 1. Weighted values use their number.
 */
export function weightedPick<T extends string>(pool: readonly T[], weights?: Record<string, number>): T {
  if (!weights || Object.keys(weights).length === 0) return randomFrom(pool);

  const weighted: Array<{ value: T; weight: number }> = pool.map(v => ({
    value: v,
    weight: weights[v] ?? 1,
  }));
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.value;
  }
  return weighted[weighted.length - 1]!.value;
}

/**
 * Rolls the STYLE_MUTATION dimension using the weights defined in MUTATIONS.
 * Respects chaos mode (uniform random) and optional weight overrides.
 */
function rollMutation(weights?: Record<string, number>, chaos = false): string {
  if (chaos) return randomFrom(MUTATION_POOL);
  // Build weights object from MUTATIONS distribution unless overridden
  const built: Record<string, number> = {};
  for (const m of MUTATIONS) built[m.id] = weights?.[m.id] ?? m.weight;
  return weightedPick(MUTATION_POOL, built);
}

/**
 * Rolls all 15 parameter dimensions, returning a complete StyleGenome.
 * If weights are provided, uses weighted selection.
 * If chaos is true, ignores weights (mandatory chaos rounds).
 *
 * Mashup rolls a secondary archetype (distinct from the primary).
 * Franken rolls a secondary AND tertiary (both distinct from each other and primary).
 * Material-swap rolls a physical material from MATERIALS.
 */
export function rollParams(weights?: ParamWeights & { mutation?: Record<string, number> }, chaos = false): SeedParameters {
  const w = chaos ? undefined : weights;
  const primary = weightedPick(STYLE_POOL, w?.style);

  // Roll the mutation (15th dimension)
  const mutation = rollMutation(w?.mutation, chaos);

  // Roll dependent values based on mutation
  let mutationSecondary: string | undefined;
  let mutationTertiary: string | undefined;
  let mutationMaterial: string | undefined;

  const pickDifferent = (exclude: string[]): string => {
    const pool = STYLE_POOL.filter(s => !exclude.includes(s));
    return pool[Math.floor(Math.random() * pool.length)]!;
  };

  if (mutation === 'mashup') {
    mutationSecondary = pickDifferent([primary]);
  } else if (mutation === 'franken') {
    mutationSecondary = pickDifferent([primary]);
    mutationTertiary = pickDifferent([primary, mutationSecondary]);
  } else if (mutation === 'material-swap') {
    mutationMaterial = randomFrom(MATERIALS);
  }

  return {
    genre: primary,
    colorPalette: weightedPick(PALETTE_POOL, w?.palette),
    harmonyBaseHue: Math.floor(Math.random() * 360),
    typography: weightedPick(TYPOGRAPHY_POOL, w?.typography),
    typeScale: weightedPick(TYPE_SCALE_POOL, w?.typeScale),
    layoutArchetype: weightedPick(LAYOUT_POOL, w?.layout),
    density: weightedPick(DENSITY_POOL, w?.density),
    mood: weightedPick(MOOD_POOL, w?.mood),
    era: weightedPick(ERA_POOL, w?.era),
    animation: weightedPick(ANIMATION_POOL, w?.animation),
    imagery: weightedPick(IMAGERY_POOL, w?.imagery),
    borderRadius: weightedPick(BORDER_RADIUS_POOL, w?.borderRadius),
    shadows: weightedPick(SHADOW_POOL, w?.shadows),
    ctaStyle: weightedPick(CTA_STYLE_POOL, w?.ctaStyle),
    wildcard: weightedPick(WILDCARD_POOL, w?.wildcard),
    mutation,
    mutationSecondary,
    mutationTertiary,
    mutationMaterial,
    copyAngle: weightedPick(COPY_ANGLE_POOL, w?.copyAngle),
    sectionVariation: weightedPick(SECTION_VARIATION_POOL, w?.sectionVariation),
    temperature: Math.round((0.7 + Math.random() * 0.6) * 100) / 100,
  };
}

/**
 * Returns all 17 pools for tests and documentation.
 */
export function getAllPools(): Record<string, readonly string[]> {
  return {
    style: STYLE_POOL,
    palette: PALETTE_POOL,
    typography: TYPOGRAPHY_POOL,
    typeScale: TYPE_SCALE_POOL,
    layout: LAYOUT_POOL,
    density: DENSITY_POOL,
    mood: MOOD_POOL,
    era: ERA_POOL,
    animation: ANIMATION_POOL,
    imagery: IMAGERY_POOL,
    borderRadius: BORDER_RADIUS_POOL,
    shadows: SHADOW_POOL,
    ctaStyle: CTA_STYLE_POOL,
    wildcard: WILDCARD_POOL,
    mutation: MUTATION_POOL,
    copyAngle: COPY_ANGLE_POOL,
    sectionVariation: SECTION_VARIATION_POOL,
  };
}
