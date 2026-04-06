// SheepCalledShip types: interfaces for the auto-configuring QA agent

export interface SheepConfig {
  projectRoot: string;
  buildCommand: string | null;
  testCommand: string | null;
  stack: DetectedStack;
  maxCycles: number;
}

export interface DetectedStack {
  framework: string | null;
  language: string;
  styling: string | null;
  database: string | null;
  auth: string | null;
  testing: string | null;
  deployment: string | null;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface QAPlanEntry {
  area: string;
  priority: number;
  files: string[];
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface SheepStats {
  project: string;
  sessionStart: string;
  sessionEnd: string | null;
  cycleCount: number;
  bugs: {
    discovered: number;
    autoFixed: number;
    logged: number;
    falsePositives: number;
  };
  files: {
    scanned: number;
    modified: number;
    linesChanged: number;
  };
  tests: {
    before: number;
    after: number;
    added: number;
  };
  commits: number;
  areas: {
    tested: number;
    passed: number;
    failed: number;
  };
  worstBug: string | null;
  funniestBug: string | null;
  marthaMessages: string[];
  deezeebalzRoasts: string[];
  sheepMonologues: string[];
  status: 'running' | 'paused' | 'completed';
}

export interface CycleResult {
  cycleNumber: number;
  area: string;
  bugsFound: BugReport[];
  bugsFixed: BugReport[];
  bugsLogged: BugReport[];
  marthaMessage: string | null;
  deezeebalzRoast: string | null;
  sheepMonologue: string | null;
  timestamp: string;
}

export interface BugReport {
  id: string;
  file: string;
  line: number | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  fix: string | null;
  autoFixed: boolean;
}

export interface ContentPack {
  linkedinPost: string;
  twitterThread: string[];
  bestMarthaMessage: string;
  bestDeezeebalzRoast: string;
  bestSheepMonologue: string;
  statsForInfographic: Record<string, number | string>;
}
