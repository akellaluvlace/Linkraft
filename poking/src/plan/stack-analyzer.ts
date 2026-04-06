// Plan Mode Stack Analyzer: detects the project's tech stack from existing code.
// Reuses detection logic from sheep/auto-config but adds convention detection.

import * as fs from 'fs';
import * as path from 'path';
import type { DetectedProjectStack, CodeConventions } from './types.js';

/**
 * Detects the full project stack from package.json, config files, and code patterns.
 */
export function analyzeStack(projectRoot: string): DetectedProjectStack {
  const stack: DetectedProjectStack = {
    framework: null,
    language: 'javascript',
    styling: null,
    database: null,
    auth: null,
    testing: null,
    deployment: null,
  };

  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return stack;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const allDeps: Record<string, string> = {
      ...(pkg['dependencies'] as Record<string, string> | undefined),
      ...(pkg['devDependencies'] as Record<string, string> | undefined),
    };

    if (allDeps['typescript'] || fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
      stack.language = 'typescript';
    }

    if (allDeps['next']) stack.framework = 'nextjs';
    else if (allDeps['nuxt']) stack.framework = 'nuxt';
    else if (allDeps['@sveltejs/kit']) stack.framework = 'sveltekit';
    else if (allDeps['astro']) stack.framework = 'astro';
    else if (allDeps['vite'] && allDeps['react']) stack.framework = 'vite-react';
    else if (allDeps['vite'] && allDeps['vue']) stack.framework = 'vite-vue';
    else if (allDeps['vite']) stack.framework = 'vite';
    else if (allDeps['express']) stack.framework = 'express';
    else if (allDeps['hono']) stack.framework = 'hono';
    else if (allDeps['expo']) stack.framework = 'expo';

    if (allDeps['tailwindcss']) stack.styling = 'tailwind';
    else if (allDeps['styled-components']) stack.styling = 'styled-components';
    else if (allDeps['@emotion/react']) stack.styling = 'emotion';

    if (allDeps['@supabase/supabase-js']) stack.database = 'supabase';
    else if (allDeps['@prisma/client']) stack.database = 'prisma';
    else if (allDeps['drizzle-orm']) stack.database = 'drizzle';
    else if (allDeps['mongoose']) stack.database = 'mongodb';

    if (allDeps['next-auth'] || allDeps['@auth/core']) stack.auth = 'authjs';
    else if (allDeps['@clerk/nextjs']) stack.auth = 'clerk';

    if (allDeps['vitest']) stack.testing = 'vitest';
    else if (allDeps['jest']) stack.testing = 'jest';
    else if (allDeps['@playwright/test']) stack.testing = 'playwright';

    if (fs.existsSync(path.join(projectRoot, 'vercel.json'))) stack.deployment = 'vercel';
    else if (fs.existsSync(path.join(projectRoot, 'Dockerfile'))) stack.deployment = 'docker';

    return stack;
  } catch {
    return stack;
  }
}

/**
 * Detects coding conventions from existing source files.
 */
export function detectConventions(projectRoot: string): CodeConventions {
  const conventions: CodeConventions = {
    indentation: 'spaces-2',
    quotes: 'single',
    semicolons: true,
    namingStyle: 'camelCase',
    importStyle: 'named',
    stateManagement: null,
  };

  // Find a sample source file
  const sampleFile = findSampleFile(projectRoot);
  if (!sampleFile) return conventions;

  try {
    const content = fs.readFileSync(sampleFile, 'utf-8');
    const lines = content.split('\n');

    // Indentation
    const indentedLines = lines.filter(l => /^\s+\S/.test(l));
    if (indentedLines.length > 0) {
      const tabCount = indentedLines.filter(l => l.startsWith('\t')).length;
      const space4Count = indentedLines.filter(l => /^    \S/.test(l)).length;
      if (tabCount > indentedLines.length / 2) conventions.indentation = 'tabs';
      else if (space4Count > indentedLines.length / 3) conventions.indentation = 'spaces-4';
    }

    // Quotes
    const singleCount = (content.match(/'/g) ?? []).length;
    const doubleCount = (content.match(/"/g) ?? []).length;
    if (doubleCount > singleCount * 1.5) conventions.quotes = 'double';

    // Semicolons
    const statementsWithSemi = (content.match(/;\s*$/gm) ?? []).length;
    const statementsWithoutSemi = lines.filter(l => /\S$/.test(l.trim()) && !/[{},;]$/.test(l.trim())).length;
    if (statementsWithoutSemi > statementsWithSemi) conventions.semicolons = false;

    // State management
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      const deps = pkg['dependencies'] as Record<string, string> | undefined;
      if (deps?.['zustand']) conventions.stateManagement = 'zustand';
      else if (deps?.['@reduxjs/toolkit']) conventions.stateManagement = 'redux-toolkit';
      else if (deps?.['jotai']) conventions.stateManagement = 'jotai';
      else if (deps?.['recoil']) conventions.stateManagement = 'recoil';
    }

    return conventions;
  } catch {
    return conventions;
  }
}

function findSampleFile(projectRoot: string): string | null {
  const candidates = [
    path.join(projectRoot, 'src', 'app', 'page.tsx'),
    path.join(projectRoot, 'src', 'App.tsx'),
    path.join(projectRoot, 'app', 'page.tsx'),
    path.join(projectRoot, 'src', 'index.ts'),
    path.join(projectRoot, 'src', 'main.ts'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Find any .ts or .tsx in src
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    try {
      const files = fs.readdirSync(srcDir);
      const tsFile = files.find(f => /\.(ts|tsx)$/.test(f));
      if (tsFile) return path.join(srcDir, tsFile);
    } catch {}
  }

  return null;
}
