// Wildcard prompt mutations for Dreamroll.
// Each mutation forces creative divergence to prevent AI convergence on safe designs.

import type { WildcardMutation } from './types.js';

export const WILDCARDS: WildcardMutation[] = [
  // Era-specific
  { id: 'era-1920s', prompt: 'Design this as if websites were invented in 1920s Art Deco era', category: 'era' },
  { id: 'era-1950s', prompt: 'Design with 1950s mid-century modern aesthetics: atomic age optimism, boomerang shapes, pastel colors', category: 'era' },
  { id: 'era-1960s', prompt: 'Design with 1960s psychedelic aesthetics: vibrant swirls, melting typography, peace-era energy', category: 'era' },
  { id: 'era-1970s', prompt: 'Design with 1970s earth tones, shag carpet textures, groovy rounded typography', category: 'era' },
  { id: 'era-1980s', prompt: 'Design with 1980s neon aesthetics: grid lines, chrome text, synth wave gradients', category: 'era' },
  { id: 'era-1990s', prompt: 'Design with 1990s web aesthetics: visitor counters, marquee text, under construction GIFs', category: 'era' },
  { id: 'era-2000s', prompt: 'Design with early 2000s web 2.0: glossy buttons, drop shadows, reflections, glass effects', category: 'era' },
  { id: 'era-future', prompt: 'Design as if this website exists 100 years in the future with holographic UI conventions', category: 'era' },
  { id: 'era-victorian', prompt: 'Design with Victorian era typography: ornate borders, serif flourishes, engraving textures', category: 'era' },

  // Medium-specific
  { id: 'medium-magazine', prompt: 'The page should feel like a physical magazine spread', category: 'medium' },
  { id: 'medium-poster', prompt: 'Design as if this were a concert poster: bold, single-impact, readable at distance', category: 'medium' },
  { id: 'medium-billboard', prompt: 'Design for billboard impact: 3 seconds to communicate everything', category: 'medium' },
  { id: 'medium-book', prompt: 'Design like a book cover: one striking image, perfect typography, mystery', category: 'medium' },
  { id: 'medium-album', prompt: 'Design like an iconic album cover: Velvet Underground, Dark Side, OK Computer energy', category: 'medium' },
  { id: 'medium-newspaper', prompt: 'Design like a broadsheet newspaper front page: headline hierarchy, columns, dateline', category: 'medium' },
  { id: 'medium-letter', prompt: 'The page is a single scroll with no sections, like a personal letter', category: 'medium' },
  { id: 'medium-telegram', prompt: 'Communicate everything in the most compressed form possible, like a telegram', category: 'medium' },

  // Constraint-specific
  { id: 'constraint-two-colors', prompt: 'The entire page must work in only two colors', category: 'constraint' },
  { id: 'constraint-one-font', prompt: 'Use only one font family for everything. Make it work through weight and size alone', category: 'constraint' },
  { id: 'constraint-no-images', prompt: 'Typography IS the design. No images, no icons, no illustrations', category: 'constraint' },
  { id: 'constraint-monochrome', prompt: 'Everything must be monochrome: black, white, and shades of gray only', category: 'constraint' },
  { id: 'constraint-circles', prompt: 'Use only circular shapes and curved lines. No straight edges anywhere', category: 'constraint' },
  { id: 'constraint-no-rectangles', prompt: 'No rectangles. Every shape must be organic', category: 'constraint' },
  { id: 'constraint-system-fonts', prompt: 'Design with only system fonts and no CSS framework', category: 'constraint' },
  { id: 'constraint-printable', prompt: 'The page must look good printed on paper', category: 'constraint' },
  { id: 'constraint-overlap', prompt: 'Every component overlaps at least one other component', category: 'constraint' },
  { id: 'constraint-rotation', prompt: 'Every element must be rotated at least 2 degrees', category: 'constraint' },
  { id: 'constraint-no-hover', prompt: 'Design assuming hover states do not exist. Everything must communicate through static visual hierarchy', category: 'constraint' },

  // Culture-specific
  { id: 'culture-japanese', prompt: 'Apply Japanese minimalism: ma (negative space), wabi-sabi (beauty in imperfection), restrained palette', category: 'culture' },
  { id: 'culture-scandinavian', prompt: 'Scandinavian design: functional beauty, natural materials, hygge warmth, light colors', category: 'culture' },
  { id: 'culture-bauhaus', prompt: 'Bauhaus school: form follows function, primary colors, geometric shapes, grid system', category: 'culture' },
  { id: 'culture-memphis', prompt: 'Memphis design: bold patterns, clashing colors, geometric shapes, irreverent, anti-minimalist', category: 'culture' },
  { id: 'culture-dutch', prompt: 'De Stijl / Mondrian: primary colors, black lines, right angles, asymmetric balance', category: 'culture' },
  { id: 'culture-swiss', prompt: 'International Typographic Style: grid-based, sans-serif, objective photography, mathematical precision', category: 'culture' },
  { id: 'culture-arabic', prompt: 'Design for a user who reads right-to-left. Arabic calligraphy-inspired patterns', category: 'culture' },
  { id: 'culture-indian', prompt: 'Indian design aesthetics: vibrant colors, intricate patterns, mandala geometry, rich textures', category: 'culture' },

  // Emotion-specific
  { id: 'emotion-anxiety', prompt: 'The page should create a sense of urgency and anxiety: tight spacing, sharp angles, countdown pressure', category: 'emotion' },
  { id: 'emotion-joy', prompt: 'Pure joy and celebration: confetti, bright colors, playful typography, movement', category: 'emotion' },
  { id: 'emotion-nostalgia', prompt: 'Deep nostalgia: sepia tones, worn textures, vintage typography, memory lane vibes', category: 'emotion' },
  { id: 'emotion-urgency', prompt: 'Extreme urgency: red accents, bold countdown, limited availability signals, FOMO design', category: 'emotion' },
  { id: 'emotion-calm', prompt: 'Absolute calm: soft gradients, generous whitespace, rounded shapes, breathing room', category: 'emotion' },
  { id: 'emotion-mystery', prompt: 'Dark mystery: hidden elements, reveal-on-scroll, fog effects, barely visible text', category: 'emotion' },
  { id: 'emotion-trust', prompt: 'Maximum trust: blue tones, clean layout, security badges, professional photography, social proof', category: 'emotion' },
  { id: 'emotion-rebellion', prompt: 'Punk rebellion: torn edges, handwritten type, anti-design, break every rule deliberately', category: 'emotion' },

  // Layout experiments
  { id: 'layout-hero-bottom', prompt: 'What if the hero section was at the bottom?', category: 'layout' },
  { id: 'layout-sidebar', prompt: 'The entire page is a sidebar conversation, not a traditional top-down scroll', category: 'layout' },
  { id: 'layout-grid-chaos', prompt: 'Start with a perfect grid then intentionally break it in 3 places for visual tension', category: 'layout' },
  { id: 'layout-single-column', prompt: 'Everything in a single narrow column, like a mobile-first luxury experience', category: 'layout' },
  { id: 'layout-asymmetric', prompt: 'Aggressively asymmetric layout: nothing is centered, everything pulls to one side', category: 'layout' },
  { id: 'layout-negative-space', prompt: 'Negative space is the primary design element. Content is secondary to the void', category: 'layout' },
  { id: 'layout-scale-contrast', prompt: 'The page communicates entirely through scale contrast: tiny text next to enormous elements', category: 'layout' },

  // Identity shifts
  { id: 'identity-fashion', prompt: 'What if this brand was a luxury fashion house? Vogue editorial vibes', category: 'identity' },
  { id: 'identity-game', prompt: 'Make the page feel like a video game menu screen: health bars, XP, achievement unlocks', category: 'identity' },
  { id: 'identity-museum', prompt: 'Design as a museum exhibit: object labels, curator notes, clean glass cases', category: 'identity' },
  { id: 'identity-restaurant', prompt: 'Fine dining menu aesthetic: minimal, elegant, tactile, gold foil hints', category: 'identity' },
  { id: 'identity-hacker', prompt: 'Terminal aesthetic: monospace everything, command prompts, green on black, matrix vibes', category: 'identity' },
  { id: 'identity-children', prompt: 'Design for someone who has never seen a website before. Pure intuition, zero convention', category: 'identity' },

  // Technical experiments
  { id: 'tech-high-res', prompt: 'Design as if screen resolution was 10x higher than today: micro-detail, ultra-fine lines', category: 'technical' },
  { id: 'tech-background-hero', prompt: 'What if the background was the most important element? Content floats on top', category: 'technical' },
  { id: 'tech-brutalist-data', prompt: 'Data visualization as design: charts, graphs, and numbers ARE the visual elements', category: 'technical' },
  { id: 'tech-glassmorphism-max', prompt: 'Push glassmorphism to the extreme: everything is glass, everything blurs', category: 'technical' },
  { id: 'tech-gradient-only', prompt: 'The entire design palette is gradients. No flat colors anywhere', category: 'technical' },
];

/**
 * Returns a random wildcard mutation.
 */
export function getRandomWildcard(): WildcardMutation {
  const index = Math.floor(Math.random() * WILDCARDS.length);
  return WILDCARDS[index]!;
}

/**
 * Returns a random wildcard from a specific category.
 */
export function getRandomWildcardByCategory(category: string): WildcardMutation | null {
  const filtered = WILDCARDS.filter(w => w.category === category);
  if (filtered.length === 0) return null;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index]!;
}
