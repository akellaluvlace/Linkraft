// Plan mode types: interfaces for market research, architecture, and CLAUDE.md generation

export interface PlanConfig {
  projectRoot: string;
  productDescription: string;
}

export interface MarketResearch {
  competitors: CompetitorInfo[];
  gaps: string[];
  opportunities: string[];
  generatedAt: string;
}

export interface CompetitorInfo {
  name: string;
  url: string | null;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export interface StackRecommendation {
  framework: string;
  language: string;
  styling: string;
  database: string;
  auth: string;
  deployment: string;
  reasoning: string;
}

export interface ArchitectureProposal {
  overview: string;
  components: ArchComponent[];
  dataFlow: string;
  apiRoutes: string[];
  schemaOutline: string;
}

export interface ArchComponent {
  name: string;
  type: 'page' | 'component' | 'hook' | 'util' | 'api' | 'service' | 'middleware';
  description: string;
  dependencies: string[];
}

export interface ClaudeMdConfig {
  projectName: string;
  projectDescription: string;
  stack: DetectedProjectStack;
  buildCommand: string | null;
  testCommand: string | null;
  lintCommand: string | null;
  fileMap: FileMapEntry[];
  conventions: CodeConventions;
  hardConstraints: string[];
  architecture: string;
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

export interface FileMapEntry {
  path: string;
  purpose: string;
}

export interface CodeConventions {
  indentation: 'tabs' | 'spaces-2' | 'spaces-4';
  quotes: 'single' | 'double';
  semicolons: boolean;
  namingStyle: string;
  importStyle: string;
  stateManagement: string | null;
}
