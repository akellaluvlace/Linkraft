// Scaffold Generator: step 15 of Path B.
//
// Produces a minimal project skeleton AFTER the planning docs are written.
// Explicitly does NOT generate application code — only the structural shell:
//   - package.json with recommended deps
//   - tsconfig.json
//   - folder structure (src/ etc.)
//   - .env.example with required variables
//   - framework config stub (next.config.mjs / app.json / etc.)
//
// The user reviews CLAUDE.md then tells Claude "start building step 1" in a
// fresh session. This module never overwrites files that already exist.

import * as fs from 'fs';
import * as path from 'path';
import type { IdeaContext, ProductCategory } from './idea-reader.js';

export interface ScaffoldPlan {
  projectName: string;
  category: ProductCategory;
  files: ScaffoldFile[];
  directories: string[];
}

export interface ScaffoldFile {
  /** Relative path from project root. */
  path: string;
  /** File contents. Short stubs only — no application logic. */
  content: string;
}

export interface ScaffoldResult {
  created: string[];
  skipped: string[];
  directories: string[];
}

/**
 * Builds a ScaffoldPlan from an IdeaContext. The plan is data only — no files
 * are touched. Callers can inspect it, merge edits, and then pass it to
 * writeScaffold() to actually create files.
 */
export function buildScaffoldPlan(ctx: IdeaContext): ScaffoldPlan {
  const slug = slugify(ctx.productName);

  switch (ctx.category) {
    case 'mobile app':
      return buildExpoScaffold(slug, ctx);
    case 'backend service':
      return buildBackendScaffold(slug, ctx);
    case 'CLI tool':
      return buildCliScaffold(slug, ctx);
    default:
      return buildNextScaffold(slug, ctx);
  }
}

/**
 * Writes the scaffold plan to disk. Never overwrites existing files; paths
 * that already exist are recorded in `skipped`. Creates directories as needed.
 */
export function writeScaffold(projectRoot: string, plan: ScaffoldPlan): ScaffoldResult {
  const created: string[] = [];
  const skipped: string[] = [];
  const directoriesCreated: string[] = [];

  for (const dir of plan.directories) {
    const full = path.join(projectRoot, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      directoriesCreated.push(dir);
    }
  }

  for (const file of plan.files) {
    const full = path.join(projectRoot, file.path);
    if (fs.existsSync(full)) {
      skipped.push(file.path);
      continue;
    }
    const parent = path.dirname(full);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.writeFileSync(full, file.content, 'utf-8');
    created.push(file.path);
  }

  return { created, skipped, directories: directoriesCreated };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'app';
}

// --- Next.js ---------------------------------------------------------------

function buildNextScaffold(slug: string, ctx: IdeaContext): ScaffoldPlan {
  const pkg = {
    name: slug,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      test: 'vitest run',
    },
    dependencies: {
      next: '^16.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.6.0',
      vitest: '^2.0.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
    },
  };

  return {
    projectName: slug,
    category: ctx.category,
    directories: ['src/app', 'src/components', 'src/lib', 'public', 'tests'],
    files: [
      { path: 'package.json', content: JSON.stringify(pkg, null, 2) + '\n' },
      { path: 'tsconfig.json', content: tsconfigNext() },
      { path: 'next.config.mjs', content: nextConfig() },
      { path: 'tailwind.config.ts', content: tailwindConfig() },
      { path: 'postcss.config.mjs', content: postcssConfig() },
      { path: '.env.example', content: envExampleNext() },
      { path: '.gitignore', content: gitignoreNode() },
      { path: 'README.md', content: readmeStub(ctx) },
    ],
  };
}

// --- Expo ------------------------------------------------------------------

function buildExpoScaffold(slug: string, ctx: IdeaContext): ScaffoldPlan {
  const pkg = {
    name: slug,
    version: '0.1.0',
    private: true,
    main: 'expo-router/entry',
    scripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
      test: 'vitest run',
    },
    dependencies: {
      expo: '^52.0.0',
      'expo-router': '^4.0.0',
      react: '^19.0.0',
      'react-native': '^0.76.0',
      '@supabase/supabase-js': '^2.45.0',
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      typescript: '^5.6.0',
      vitest: '^2.0.0',
      nativewind: '^4.0.0',
      tailwindcss: '^3.4.0',
    },
  };

  return {
    projectName: slug,
    category: ctx.category,
    directories: ['app', 'components', 'lib', 'assets', 'tests'],
    files: [
      { path: 'package.json', content: JSON.stringify(pkg, null, 2) + '\n' },
      { path: 'tsconfig.json', content: tsconfigExpo() },
      { path: 'app.json', content: appJsonExpo(slug, ctx.productName) },
      { path: 'babel.config.js', content: babelConfigExpo() },
      { path: 'tailwind.config.js', content: tailwindConfig() },
      { path: '.env.example', content: envExampleExpo() },
      { path: '.gitignore', content: gitignoreNode() },
      { path: 'README.md', content: readmeStub(ctx) },
    ],
  };
}

// --- Backend (Hono) --------------------------------------------------------

function buildBackendScaffold(slug: string, ctx: IdeaContext): ScaffoldPlan {
  const pkg = {
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      test: 'vitest run',
    },
    dependencies: {
      hono: '^4.6.0',
      '@hono/node-server': '^1.13.0',
      zod: '^3.23.0',
      'drizzle-orm': '^0.36.0',
      postgres: '^3.4.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      tsx: '^4.19.0',
      typescript: '^5.6.0',
      vitest: '^2.0.0',
      'drizzle-kit': '^0.28.0',
    },
  };

  return {
    projectName: slug,
    category: ctx.category,
    directories: ['src/routes', 'src/db', 'src/middleware', 'tests'],
    files: [
      { path: 'package.json', content: JSON.stringify(pkg, null, 2) + '\n' },
      { path: 'tsconfig.json', content: tsconfigNodeEsm() },
      { path: 'drizzle.config.ts', content: drizzleConfig() },
      { path: '.env.example', content: envExampleBackend() },
      { path: '.gitignore', content: gitignoreNode() },
      { path: 'README.md', content: readmeStub(ctx) },
    ],
  };
}

// --- CLI -------------------------------------------------------------------

function buildCliScaffold(slug: string, ctx: IdeaContext): ScaffoldPlan {
  const pkg = {
    name: slug,
    version: '0.1.0',
    type: 'module',
    bin: { [slug]: './dist/cli.js' },
    files: ['dist'],
    scripts: {
      build: 'tsup src/cli.ts --format esm --dts --clean',
      dev: 'tsx src/cli.ts',
      test: 'vitest run',
    },
    dependencies: {
      commander: '^12.1.0',
      chalk: '^5.3.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      tsx: '^4.19.0',
      tsup: '^8.3.0',
      typescript: '^5.6.0',
      vitest: '^2.0.0',
    },
  };

  return {
    projectName: slug,
    category: ctx.category,
    directories: ['src', 'tests'],
    files: [
      { path: 'package.json', content: JSON.stringify(pkg, null, 2) + '\n' },
      { path: 'tsconfig.json', content: tsconfigNodeEsm() },
      { path: '.env.example', content: '# (CLI tools rarely need env vars)\n' },
      { path: '.gitignore', content: gitignoreNode() },
      { path: 'README.md', content: readmeStub(ctx) },
    ],
  };
}

// --- File contents ---------------------------------------------------------

function tsconfigNext(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2) + '\n';
}

function tsconfigExpo(): string {
  return JSON.stringify({
    extends: 'expo/tsconfig.base',
    compilerOptions: {
      strict: true,
      paths: { '@/*': ['./*'] },
    },
    include: ['**/*.ts', '**/*.tsx'],
  }, null, 2) + '\n';
}

function tsconfigNodeEsm(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: 'dist',
      declaration: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'tests'],
  }, null, 2) + '\n';
}

function nextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`;
}

function tailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`;
}

function postcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function appJsonExpo(slug: string, displayName: string): string {
  return JSON.stringify({
    expo: {
      name: displayName,
      slug,
      version: '0.1.0',
      orientation: 'portrait',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      ios: { supportsTablet: true, bundleIdentifier: `com.example.${slug}` },
      android: { package: `com.example.${slug}` },
      plugins: ['expo-router'],
    },
  }, null, 2) + '\n';
}

function babelConfigExpo(): string {
  return `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [],
  };
};
`;
}

function drizzleConfig(): string {
  return `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
}

function envExampleNext(): string {
  return `# Database
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
`;
}

function envExampleExpo(): string {
  return `# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
`;
}

function envExampleBackend(): string {
  return `# Database
DATABASE_URL=

# Server
PORT=3000
NODE_ENV=development
`;
}

function gitignoreNode(): string {
  return `node_modules/
dist/
build/
.next/
.expo/
*.log
.env
.env.local
.env.*.local
.DS_Store
coverage/
`;
}

function readmeStub(ctx: IdeaContext): string {
  return `# ${ctx.productName}

${ctx.oneLiner || ctx.description || ''}

> Scaffold generated by \`/linkraft plan\`. See \`CLAUDE.md\` and \`.plan/\` for the full technical blueprint.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`;
}

/**
 * Convenience: format a human readable summary of what a scaffold plan will
 * produce. Used by the MCP tool when returning the plan without writing.
 */
export function formatScaffoldPreview(plan: ScaffoldPlan): string {
  const lines = [
    `# Scaffold Plan: ${plan.projectName}`,
    '',
    `Category: **${plan.category}**`,
    '',
    '## Directories',
    ...plan.directories.map(d => `- ${d}/`),
    '',
    '## Files',
    ...plan.files.map(f => `- ${f.path}`),
    '',
    'To apply, call `plan_scaffold` again with `apply: true`.',
  ];
  return lines.join('\n');
}
