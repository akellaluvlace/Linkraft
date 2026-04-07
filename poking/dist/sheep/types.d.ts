export interface SheepConfig {
    projectRoot: string;
    buildCommand: string | null;
    testCommand: string | null;
    stack: DetectedStack;
    maxCycles: number;
    allowCommits: boolean;
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
    totalRuntimeMinutes: number;
    bugs: {
        discovered: number;
        autoFixed: number;
        logged: number;
        falsePositives: number;
    };
    files: {
        scanned: number;
        modified: number;
        linesAdded: number;
        linesRemoved: number;
    };
    tests: {
        before: number;
        after: number;
        added: number;
    };
    commits: number;
    areas: {
        tested: string[];
        passed: string[];
        failed: string[];
    };
    worstBug: BugSummary | null;
    funniestBug: BugSummary | null;
    marthaMessages: string[];
    deezeebalzRoasts: string[];
    sheepMonologues: string[];
    status: 'running' | 'paused' | 'completed';
}
export interface BugSummary {
    description: string;
    severity: string;
    file: string;
    howFound: string;
}
export interface CycleResult {
    cycleNumber: number;
    area: string;
    target: string;
    filesScanned: string[];
    bugsFound: BugReport[];
    bugsFixed: BugReport[];
    bugsLogged: BugReport[];
    buildPassed: boolean;
    testsPassed: boolean;
    testCount: number;
    marthaMessage: string | null;
    deezeebalzRoast: string | null;
    sheepMonologue: string | null;
    commitHash: string | null;
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
    whyNotFixed: string | null;
}
export interface ContentPack {
    linkedinPost: string;
    twitterThread: string[];
    bestMarthaMessage: string;
    bestDeezeebalzRoast: string;
    bestSheepMonologue: string;
    statsForInfographic: Record<string, number | string>;
}
