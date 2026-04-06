// Vault Client: reads the vault GitHub repo for component browsing.
// Zero-Friction: if GitHub is unreachable, falls back to bundled example components.
// Never returns empty silently. Always explains what happened.

import type { VaultComponent, VaultComponentMeta, VaultSearchOptions } from './types.js';

export interface VaultClientOptions {
  repoOwner?: string;
  repoName?: string;
}

export interface VaultResult<T> {
  data: T;
  source: 'github' | 'bundled' | 'local';
  message: string | null;
}

// Bundled example components that ship with the plugin.
// These are always available even when offline.
const BUNDLED_COMPONENTS: VaultComponentMeta[] = [
  {
    name: 'hero-split',
    author: 'akellainmotion',
    description: 'Split hero section with image on right, text + CTA on left. Responsive.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['hero', 'landing', 'split-layout'],
    designSystem: 'neo-brutalism',
    downloads: 0,
    stars: 0,
  },
  {
    name: 'feature-grid',
    author: 'akellainmotion',
    description: 'Three-column feature grid with icons, titles, and descriptions. Stacks on mobile.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['features', 'grid', 'landing'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'testimonial-cards',
    author: 'akellainmotion',
    description: 'Horizontal scroll testimonial cards with avatar, quote, and role.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['testimonials', 'social-proof', 'cards'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'cta-banner',
    author: 'akellainmotion',
    description: 'Full-width CTA banner with headline, subtext, and primary action button.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['cta', 'banner', 'conversion'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'pricing-table',
    author: 'akellainmotion',
    description: 'Three-tier pricing table with feature comparison and highlighted recommended plan.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['pricing', 'table', 'landing', 'saas'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'faq-accordion',
    author: 'akellainmotion',
    description: 'Expandable FAQ section with smooth animations. Accessible with keyboard navigation.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['faq', 'accordion', 'landing'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'footer-links',
    author: 'akellainmotion',
    description: 'Multi-column footer with link groups, social icons, and newsletter signup.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['footer', 'navigation', 'layout'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'logo-cloud',
    author: 'akellainmotion',
    description: 'Animated logo cloud for social proof. Grayscale logos that colorize on hover.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['logos', 'social-proof', 'trust'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'stats-counter',
    author: 'akellainmotion',
    description: 'Animated number counters for key metrics. Triggers on scroll into view.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['stats', 'numbers', 'social-proof'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
  {
    name: 'newsletter-form',
    author: 'akellainmotion',
    description: 'Email capture form with inline validation and success animation.',
    framework: 'react',
    styling: 'tailwind',
    tags: ['form', 'email', 'newsletter', 'conversion'],
    designSystem: null,
    downloads: 0,
    stars: 0,
  },
];

export class VaultClient {
  private rawBase: string;
  private indexCache: VaultComponentMeta[] | null = null;
  private indexCacheTime = 0;
  constructor(options?: VaultClientOptions) {
    const owner = options?.repoOwner ?? 'akellainmotion';
    const name = options?.repoName ?? 'poking-vault';
    this.rawBase = `https://raw.githubusercontent.com/${owner}/${name}/main`;
  }

  /**
   * Fetches the vault index from GitHub.
   * Falls back to bundled components if GitHub is unreachable.
   */
  async getIndex(): Promise<VaultResult<VaultComponentMeta[]>> {
    const CACHE_TTL = 5 * 60 * 1000;
    if (this.indexCache && Date.now() - this.indexCacheTime < CACHE_TTL) {
      return { data: this.indexCache, source: 'github', message: null };
    }

    try {
      const response = await fetch(`${this.rawBase}/index.json`);
      if (!response.ok) {
        return {
          data: BUNDLED_COMPONENTS,
          source: 'bundled',
          message: `Vault repo not reachable (${response.status}). Showing ${BUNDLED_COMPONENTS.length} bundled example components. Run /linkraft vault browse --retry when online.`,
        };
      }
      const data = await response.json() as VaultComponentMeta[];
      this.indexCache = data;
      this.indexCacheTime = Date.now();
      return { data, source: 'github', message: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        data: BUNDLED_COMPONENTS,
        source: 'bundled',
        message: `Vault offline (${msg}). Showing ${BUNDLED_COMPONENTS.length} bundled example components instead.`,
      };
    }
  }

  /**
   * Browse all available components. Never returns empty.
   */
  async browse(): Promise<VaultResult<VaultComponentMeta[]>> {
    return this.getIndex();
  }

  /**
   * Search components by query, tags, framework, or design system.
   */
  async search(options: VaultSearchOptions): Promise<VaultResult<VaultComponentMeta[]>> {
    const indexResult = await this.getIndex();
    let results = [...indexResult.data];

    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)),
      );
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(c =>
        options.tags!.some(t => c.tags.includes(t)),
      );
    }

    if (options.framework) {
      results = results.filter(c => c.framework === options.framework);
    }

    if (options.styling) {
      results = results.filter(c => c.styling === options.styling);
    }

    if (options.designSystem) {
      results = results.filter(c => c.designSystem === options.designSystem);
    }

    const message = results.length === 0
      ? `No components match your search${indexResult.source === 'bundled' ? ' (searching bundled examples only, vault offline)' : ''}. Try broader terms.`
      : indexResult.message;

    return { data: results, source: indexResult.source, message };
  }

  /**
   * Download a full component package by name.
   */
  async download(componentName: string): Promise<VaultResult<VaultComponent | null>> {
    try {
      const response = await fetch(`${this.rawBase}/components/${componentName}/package.json`);
      if (!response.ok) {
        return {
          data: null,
          source: 'github',
          message: `Component "${componentName}" not found in Vault (${response.status}). Run /linkraft vault search to see available components.`,
        };
      }
      const data = await response.json() as VaultComponent;
      return { data, source: 'github', message: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        data: null,
        source: 'bundled',
        message: `Could not download "${componentName}" (${msg}). Vault may be offline.`,
      };
    }
  }

  /**
   * Clears the cached index.
   */
  clearCache(): void {
    this.indexCache = null;
    this.indexCacheTime = 0;
  }
}

// Default singleton
export const vaultClient = new VaultClient();
