// Feature Detector: detects what kind of project this is and what plan outputs to generate.

import * as fs from 'fs';
import * as path from 'path';
import type { ProjectFeatures } from './types.js';

/**
 * Detects project features to determine which plan outputs are applicable.
 */
export function detectFeatures(projectRoot: string): ProjectFeatures {
  return {
    hasDatabase: detectDatabase(projectRoot),
    hasApiRoutes: detectApiRoutes(projectRoot),
    hasMobileApp: detectMobileApp(projectRoot),
    hasDesignSystem: detectDesignSystem(projectRoot),
    isProduct: detectIsProduct(projectRoot),
    databaseType: detectDatabaseType(projectRoot),
  };
}

function detectDatabase(projectRoot: string): boolean {
  return (
    fs.existsSync(path.join(projectRoot, 'prisma', 'schema.prisma')) ||
    fs.existsSync(path.join(projectRoot, 'drizzle.config.ts')) ||
    fs.existsSync(path.join(projectRoot, 'drizzle.config.js')) ||
    fs.existsSync(path.join(projectRoot, 'supabase', 'config.toml')) ||
    fs.existsSync(path.join(projectRoot, 'supabase', 'migrations')) ||
    hasDep(projectRoot, '@supabase/supabase-js') ||
    hasDep(projectRoot, '@prisma/client') ||
    hasDep(projectRoot, 'drizzle-orm') ||
    hasDep(projectRoot, 'mongoose')
  );
}

function detectDatabaseType(projectRoot: string): string | null {
  if (hasDep(projectRoot, '@supabase/supabase-js') || fs.existsSync(path.join(projectRoot, 'supabase'))) return 'supabase';
  if (hasDep(projectRoot, '@prisma/client') || fs.existsSync(path.join(projectRoot, 'prisma'))) return 'prisma';
  if (hasDep(projectRoot, 'drizzle-orm')) return 'drizzle';
  if (hasDep(projectRoot, 'mongoose')) return 'mongodb';
  return null;
}

function detectApiRoutes(projectRoot: string): boolean {
  return (
    fs.existsSync(path.join(projectRoot, 'src', 'app', 'api')) ||
    fs.existsSync(path.join(projectRoot, 'app', 'api')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'pages', 'api')) ||
    fs.existsSync(path.join(projectRoot, 'pages', 'api')) ||
    fs.existsSync(path.join(projectRoot, 'supabase', 'functions'))
  );
}

function detectMobileApp(projectRoot: string): boolean {
  return (
    fs.existsSync(path.join(projectRoot, 'app.json')) ||
    fs.existsSync(path.join(projectRoot, 'eas.json')) ||
    hasDep(projectRoot, 'expo') ||
    hasDep(projectRoot, 'react-native')
  );
}

function detectDesignSystem(projectRoot: string): boolean {
  return (
    hasDep(projectRoot, 'tailwindcss') ||
    fs.existsSync(path.join(projectRoot, 'tailwind.config.ts')) ||
    fs.existsSync(path.join(projectRoot, 'tailwind.config.js')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'styles', 'tokens.ts')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'theme.ts'))
  );
}

function detectIsProduct(projectRoot: string): boolean {
  // Products have landing pages, app store configs, or pricing pages
  return (
    fs.existsSync(path.join(projectRoot, 'app.json')) ||
    fs.existsSync(path.join(projectRoot, 'eas.json')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'app', 'pricing')) ||
    fs.existsSync(path.join(projectRoot, 'app', 'pricing')) ||
    fs.existsSync(path.join(projectRoot, 'landing')) ||
    hasDep(projectRoot, 'stripe') ||
    hasDep(projectRoot, '@stripe/stripe-js')
  );
}

function hasDep(projectRoot: string, depName: string): boolean {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const deps = pkg['dependencies'] as Record<string, string> | undefined;
    const devDeps = pkg['devDependencies'] as Record<string, string> | undefined;
    return !!(deps?.[depName] || devDeps?.[depName]);
  } catch {
    return false;
  }
}
