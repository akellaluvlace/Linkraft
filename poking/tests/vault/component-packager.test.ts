import { describe, it, expect } from 'vitest';
import {
  extractLocalImports,
  extractNpmDependencies,
  extractProps,
  packageComponent,
} from '../../src/vault/component-packager.js';

describe('extractLocalImports', () => {
  it('extracts relative import paths', () => {
    const content = `
import { Button } from './Button';
import styles from './Hero.module.css';
import { cn } from '../utils/cn';
`;
    const imports = extractLocalImports(content);
    expect(imports).toContain('./Button');
    expect(imports).toContain('./Hero.module.css');
    expect(imports).toContain('../utils/cn');
  });

  it('ignores npm package imports', () => {
    const content = `
import React from 'react';
import { motion } from 'framer-motion';
`;
    const imports = extractLocalImports(content);
    expect(imports.length).toBe(0);
  });
});

describe('extractNpmDependencies', () => {
  it('extracts npm package names', () => {
    const content = `
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
`;
    const deps = extractNpmDependencies(content);
    expect(deps).toContain('react');
    expect(deps).toContain('framer-motion');
  });

  it('handles scoped packages', () => {
    const content = `import { something } from '@radix-ui/react-dialog';`;
    const deps = extractNpmDependencies(content);
    expect(deps).toContain('@radix-ui/react-dialog');
  });

  it('deduplicates packages', () => {
    const content = `
import React from 'react';
import { useState } from 'react';
`;
    const deps = extractNpmDependencies(content);
    expect(deps.filter(d => d === 'react').length).toBe(1);
  });
});

describe('extractProps', () => {
  it('extracts props from interface', () => {
    const content = `
interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  imageSrc: string;
}
`;
    const props = extractProps(content);
    expect(props['title']).toBe('string');
    expect(props['subtitle']).toBe('string');
    expect(props['ctaText']).toBe('string');
    expect(props['imageSrc']).toBe('string');
  });

  it('returns empty for components without props', () => {
    const content = `export function Logo() { return <svg />; }`;
    const props = extractProps(content);
    expect(Object.keys(props).length).toBe(0);
  });
});

describe('packageComponent', () => {
  it('creates a self-contained vault package', () => {
    const pkg = packageComponent({
      entryFile: 'src/components/Hero.tsx',
      entryContent: `
import { Button } from './Button';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return <div><h1>{title}</h1><p>{subtitle}</p><Button>CTA</Button></div>;
}`,
      localFiles: {
        'src/components/Button.tsx': `export function Button({ children }: { children: React.ReactNode }) { return <button>{children}</button>; }`,
        'src/utils/cn.ts': `export function cn(...args: string[]) { return args.join(' '); }`,
      },
      author: 'test-author',
      description: 'A hero section',
      framework: 'react',
      styling: 'tailwind',
      tags: ['hero', 'landing'],
      designSystem: 'neo-brutalism',
    });

    expect(pkg.name).toBe('Hero');
    expect(pkg.author).toBe('test-author');
    expect(pkg.description).toBe('A hero section');
    expect(pkg.framework).toBe('react');
    expect(pkg.tags).toContain('hero');
    expect(pkg.designSystem).toBe('neo-brutalism');
    expect(Object.keys(pkg.code).length).toBeGreaterThanOrEqual(1); // at least entry file
    expect(pkg.code['Hero.tsx']).toBeDefined();
    expect(pkg.dependencies).toContain('framer-motion');
    expect(pkg.props['title']).toBe('string');
    expect(pkg.props['subtitle']).toBe('string');
    expect(pkg.downloads).toBe(0);
    expect(pkg.stars).toBe(0);
  });
});
