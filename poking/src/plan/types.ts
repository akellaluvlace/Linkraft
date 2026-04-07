// Plan mode types: interfaces for research, architecture, CLAUDE.md generation,
// schema extraction, API mapping, design tokens, and risk analysis.

export interface PlanConfig {
  projectRoot: string;
  productDescription: string;
}

export interface DetectedProjectStack {
  framework: string | null;
  language: string;
  styling: string | null;
  database: string | null;
  auth: string | null;
  testing: string | null;
  deployment: string | null;
}

export interface CodeConventions {
  indentation: 'tabs' | 'spaces-2' | 'spaces-4';
  quotes: 'single' | 'double';
  semicolons: boolean;
  namingStyle: string;
  importStyle: string;
  stateManagement: string | null;
}

export interface FileMapEntry {
  path: string;
  purpose: string;
}

export interface EnvVar {
  name: string;
  purpose: string;
  file: string;
  hasValue: boolean;
}

export interface ClaudeMdConfig {
  projectName: string;
  projectDescription: string;
  stack: DetectedProjectStack;
  buildCommand: string | null;
  testCommand: string | null;
  lintCommand: string | null;
  devCommand: string | null;
  fileMap: FileMapEntry[];
  directoryStructure: string;
  conventions: CodeConventions;
  hardConstraints: string[];
  architecture: string;
  envVars: EnvVar[];
  knownPatterns: string[];
  neverTouch: string[];
}

// Schema extraction
export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  notes: string | null;
}

// API mapping
export interface ApiEndpoint {
  path: string;
  method: string;
  auth: string;
  purpose: string;
  file: string;
}

// Design tokens
export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
}

// Project feature detection
export interface ProjectFeatures {
  hasDatabase: boolean;
  hasApiRoutes: boolean;
  hasMobileApp: boolean;
  hasDesignSystem: boolean;
  isProduct: boolean;
  databaseType: string | null;
}
