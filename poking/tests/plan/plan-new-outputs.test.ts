import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { collectCompetitorContext, generateCompetitorTemplate, writeCompetitors } from '../../src/plan/competitors-gen.js';
import { collectArchitectureContext, generateArchitectureTemplate, writeArchitecture } from '../../src/plan/architecture-gen.js';
import { collectExecutiveSummaryContext, generateExecutiveSummaryTemplate, writeExecutiveSummary } from '../../src/plan/executive-summary-gen.js';
import { collectRiskMatrixContext, generateRiskMatrixTemplate, writeRiskMatrix } from '../../src/plan/risk-matrix-gen.js';
import { collectDependencyGraphContext, generateDependencyGraphTemplate, writeDependencyGraph } from '../../src/plan/dependency-graph-gen.js';
import { collectMonetizationContext, generateMonetizationTemplate, writeMonetization } from '../../src/plan/monetization-gen.js';
import { collectAsoContext, generateAsoTemplate, writeAso } from '../../src/plan/aso-gen.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-new-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupProject(opts: {
  name?: string;
  description?: string;
  deps?: Record<string, string>;
  devDeps?: Record<string, string>;
  readme?: string;
  expo?: boolean;
  stripe?: boolean;
  nextApi?: boolean;
  prisma?: boolean;
  planFiles?: Record<string, string>;
} = {}): void {
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: opts.name ?? 'test-app',
    description: opts.description ?? 'A test application',
    dependencies: {
      ...(opts.deps ?? {}),
      ...(opts.expo ? { expo: '^50.0.0', 'react-native': '^0.73.0' } : {}),
      ...(opts.stripe ? { stripe: '^14.0.0', '@stripe/stripe-js': '^2.0.0' } : {}),
    },
    devDependencies: {
      typescript: '^5.0.0',
      ...(opts.devDeps ?? {}),
    },
    scripts: { build: 'next build', test: 'vitest run', dev: 'next dev' },
  }), 'utf-8');

  if (opts.readme) {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), opts.readme);
  }

  if (opts.expo) {
    fs.writeFileSync(path.join(tmpDir, 'app.json'), JSON.stringify({
      expo: {
        name: opts.name ?? 'TestApp',
        description: opts.description ?? 'A mobile app',
        ios: { bundleIdentifier: 'com.test.app' },
        android: { package: 'com.test.app' },
      },
    }));
    fs.writeFileSync(path.join(tmpDir, 'eas.json'), JSON.stringify({ build: { production: {} } }));
  }

  if (opts.nextApi) {
    const apiDir = path.join(tmpDir, 'src', 'app', 'api', 'users');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'route.ts'), 'export async function GET() { return Response.json({}); }');
  }

  if (opts.prisma) {
    const prismaDir = path.join(tmpDir, 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });
    fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), 'model User { id String @id }');
  }

  if (opts.planFiles) {
    const planDir = path.join(tmpDir, '.plan');
    fs.mkdirSync(planDir, { recursive: true });
    for (const [name, content] of Object.entries(opts.planFiles)) {
      fs.writeFileSync(path.join(planDir, name), content);
    }
  }

  // Create basic directory structure
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'export {};');
  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
}

// --- Competitors ---

describe('competitors-gen', () => {
  it('collects project context from package.json', () => {
    setupProject({ name: 'my-saas', description: 'A project management tool' });
    const ctx = collectCompetitorContext(tmpDir);
    expect(ctx.projectName).toBe('my-saas');
    expect(ctx.projectDescription).toBe('A project management tool');
    expect(ctx.keywords).toContain('my-saas');
  });

  it('falls back to README for description', () => {
    setupProject({ description: '', readme: '# MyApp\n\nA task tracking tool for teams.' });
    const ctx = collectCompetitorContext(tmpDir);
    expect(ctx.projectDescription).toContain('task tracking');
  });

  it('detects category from deps', () => {
    setupProject({ deps: { expo: '^50.0.0', 'react-native': '^0.73.0' } });
    const ctx = collectCompetitorContext(tmpDir);
    expect(ctx.category).toBe('mobile app');
  });

  it('detects CLI category', () => {
    setupProject({ deps: { commander: '^12.0.0' } });
    const ctx = collectCompetitorContext(tmpDir);
    expect(ctx.category).toBe('CLI tool');
  });

  it('generates template with project context', () => {
    setupProject({ name: 'my-saas', description: 'Project management' });
    const ctx = collectCompetitorContext(tmpDir);
    const template = generateCompetitorTemplate(ctx);
    expect(template).toContain('my-saas');
    expect(template).toContain('Direct Competitors');
    expect(template).toContain('Feature Comparison Matrix');
    expect(template).toContain('Dead/Failed Competitors');
    expect(template).toContain('Competitive Advantage');
    expect(template).toContain('Risks from Competitors');
  });

  it('writes COMPETITORS.md to .plan/', () => {
    setupProject();
    const filePath = writeCompetitors(tmpDir, '# Competitors\n\nContent here');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('Content here');
  });

  it('handles empty project', () => {
    const ctx = collectCompetitorContext(tmpDir);
    expect(ctx.projectName).toBe('unknown');
    expect(ctx.category).toBe('software project');
  });
});

// --- Architecture ---

describe('architecture-gen', () => {
  it('collects directory tree', () => {
    setupProject({ nextApi: true });
    const ctx = collectArchitectureContext(tmpDir);
    expect(ctx.directoryTree).toContain('src/');
  });

  it('categorizes dependencies', () => {
    setupProject({ deps: { next: '^14.0.0', '@supabase/supabase-js': '^2.0.0', zod: '^3.0.0' } });
    const ctx = collectArchitectureContext(tmpDir);
    const framework = ctx.dependencies.find(d => d.name === 'next');
    expect(framework?.purpose).toBe('framework');
    const db = ctx.dependencies.find(d => d.name === '@supabase/supabase-js');
    expect(db?.purpose).toBe('database');
  });

  it('detects Docker', () => {
    setupProject();
    fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), 'FROM node:18');
    const ctx = collectArchitectureContext(tmpDir);
    expect(ctx.hasDocker).toBe(true);
  });

  it('detects GitHub Actions CI/CD', () => {
    setupProject();
    fs.mkdirSync(path.join(tmpDir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.github', 'workflows', 'ci.yml'), 'name: CI');
    const ctx = collectArchitectureContext(tmpDir);
    expect(ctx.hasCICD).toBe(true);
    expect(ctx.cicdPlatform).toBe('github-actions');
  });

  it('reads existing plan files', () => {
    setupProject({ planFiles: { 'SCHEMA.md': '# Schema\n\nUser table' } });
    const ctx = collectArchitectureContext(tmpDir);
    expect(ctx.existingPlanFiles.length).toBe(1);
    expect(ctx.existingPlanFiles[0]!.name).toBe('SCHEMA.md');
  });

  it('detects entry points', () => {
    setupProject();
    const ctx = collectArchitectureContext(tmpDir);
    expect(ctx.entryPoints).toContain('src/index.ts');
  });

  it('generates template with all sections', () => {
    setupProject({ deps: { next: '^14.0.0' } });
    const ctx = collectArchitectureContext(tmpDir);
    const template = generateArchitectureTemplate(ctx);
    expect(template).toContain('Architecture Review');
    expect(template).toContain('Directory Structure');
    expect(template).toContain('Request Flow');
    expect(template).toContain('Data Flow');
    expect(template).toContain('Strengths');
    expect(template).toContain('Weaknesses');
    expect(template).toContain('Scalability Analysis');
    expect(template).toContain('Security Posture');
    expect(template).toContain('Database Design Review');
  });

  it('writes ARCHITECTURE.md to .plan/', () => {
    setupProject();
    const filePath = writeArchitecture(tmpDir, '# Architecture\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('ARCHITECTURE.md');
  });
});

// --- Executive Summary ---

describe('executive-summary-gen', () => {
  it('reads existing plan files', () => {
    setupProject({
      planFiles: {
        'COMPETITORS.md': '# Competitors\nData here',
        'ARCHITECTURE.md': '# Architecture\nReview here',
      },
    });
    const ctx = collectExecutiveSummaryContext(tmpDir);
    expect(ctx.hasCompetitors).toBe(true);
    expect(ctx.hasArchitecture).toBe(true);
    expect(ctx.planFiles.length).toBe(2);
  });

  it('handles missing plan files', () => {
    setupProject();
    const ctx = collectExecutiveSummaryContext(tmpDir);
    expect(ctx.hasCompetitors).toBe(false);
    expect(ctx.hasArchitecture).toBe(false);
    expect(ctx.planFiles.length).toBe(0);
  });

  it('generates template with all sections', () => {
    setupProject({ name: 'my-app' });
    const ctx = collectExecutiveSummaryContext(tmpDir);
    const template = generateExecutiveSummaryTemplate(ctx);
    expect(template).toContain('Executive Summary');
    expect(template).toContain('What This Project Is');
    expect(template).toContain('Current State');
    expect(template).toContain('Cost Projection');
    expect(template).toContain('Launch Readiness');
    expect(template).toContain('Action Plan');
    expect(template).toContain('One Thing That Matters Most');
  });

  it('includes competitive landscape when competitors available', () => {
    setupProject({ planFiles: { 'COMPETITORS.md': '# Competitors\nData' } });
    const ctx = collectExecutiveSummaryContext(tmpDir);
    const template = generateExecutiveSummaryTemplate(ctx);
    expect(template).toContain('Competitive Landscape Summary');
  });

  it('writes EXECUTIVE_SUMMARY.md to .plan/', () => {
    setupProject();
    const filePath = writeExecutiveSummary(tmpDir, '# Executive Summary\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('EXECUTIVE_SUMMARY.md');
  });
});

// --- Risk Matrix ---

describe('risk-matrix-gen', () => {
  it('reads architecture and competitor files', () => {
    setupProject({
      planFiles: {
        'ARCHITECTURE.md': '# Architecture\n\n### Weaknesses\n| 1 | Missing rate limiting | high | Add rate limiter |',
        'COMPETITORS.md': '# Competitors\n\n| Risk | competitor has more features | high | medium |',
      },
    });
    const ctx = collectRiskMatrixContext(tmpDir);
    expect(ctx.architectureContent).not.toBeNull();
    expect(ctx.competitorContent).not.toBeNull();
  });

  it('extracts risks from content', () => {
    setupProject({
      planFiles: {
        'ARCHITECTURE.md': '# Architecture\n\nMissing input validation is a critical vulnerability\nNo rate limiting is a risk',
      },
    });
    const ctx = collectRiskMatrixContext(tmpDir);
    expect(ctx.extractedRisks.length).toBeGreaterThan(0);
    const critical = ctx.extractedRisks.find(r => r.suggestedSeverity === 'critical');
    expect(critical).toBeDefined();
  });

  it('generates template with four categories', () => {
    setupProject();
    const ctx = collectRiskMatrixContext(tmpDir);
    const template = generateRiskMatrixTemplate(ctx);
    expect(template).toContain('Critical (high probability + high impact)');
    expect(template).toContain('High (either high probability or high impact)');
    expect(template).toContain('Medium');
    expect(template).toContain('Accepted Risks');
    expect(template).toContain('Mitigation');
    expect(template).toContain('Owner');
  });

  it('shows source data availability', () => {
    setupProject();
    const ctx = collectRiskMatrixContext(tmpDir);
    const template = generateRiskMatrixTemplate(ctx);
    expect(template).toContain('NOT AVAILABLE');
  });

  it('writes RISK_MATRIX.md to .plan/', () => {
    setupProject();
    const filePath = writeRiskMatrix(tmpDir, '# Risk Matrix\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('RISK_MATRIX.md');
  });
});

// --- Dependency Graph ---

describe('dependency-graph-gen', () => {
  it('extracts action items from executive summary', () => {
    setupProject({
      planFiles: {
        'EXECUTIVE_SUMMARY.md': '# Summary\n\n| P0 | Fix auth vulnerability | urgent | critical |\n| P1 | Add monitoring | medium | high |\n| P2 | Improve onboarding | low | medium |',
      },
    });
    const ctx = collectDependencyGraphContext(tmpDir);
    expect(ctx.actionItems.length).toBeGreaterThanOrEqual(3);
    expect(ctx.actionItems.some(i => i.priority === 'P0')).toBe(true);
  });

  it('extracts checklist items', () => {
    setupProject({
      planFiles: {
        'EXECUTIVE_SUMMARY.md': '# Summary\n\n- [ ] Deploy to production\n- [x] Write tests\n- [ ] Add monitoring',
      },
    });
    const ctx = collectDependencyGraphContext(tmpDir);
    expect(ctx.actionItems.length).toBe(3);
  });

  it('handles missing executive summary', () => {
    setupProject();
    const ctx = collectDependencyGraphContext(tmpDir);
    expect(ctx.executiveSummaryContent).toBeNull();
    expect(ctx.actionItems.length).toBe(0);
  });

  it('generates template with critical path and parallel tracks', () => {
    setupProject();
    const ctx = collectDependencyGraphContext(tmpDir);
    const template = generateDependencyGraphTemplate(ctx);
    expect(template).toContain('Critical Path');
    expect(template).toContain('Parallel Tracks');
    expect(template).toContain('Blocked Items');
    expect(template).toContain('Execution Order');
  });

  it('writes DEPENDENCY_GRAPH.md to .plan/', () => {
    setupProject();
    const filePath = writeDependencyGraph(tmpDir, '# Dependency Graph\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('DEPENDENCY_GRAPH.md');
  });
});

// --- Monetization ---

describe('monetization-gen', () => {
  it('detects Stripe integration', () => {
    setupProject({ stripe: true });
    const ctx = collectMonetizationContext(tmpDir);
    expect(ctx.hasStripe).toBe(true);
    expect(ctx.hasPaymentDep).toBe(true);
    expect(ctx.pricingIndicators.some(p => p.includes('Stripe'))).toBe(true);
  });

  it('detects SaaS product type', () => {
    setupProject({ stripe: true });
    fs.mkdirSync(path.join(tmpDir, 'src', 'app', 'pricing'), { recursive: true });
    const ctx = collectMonetizationContext(tmpDir);
    expect(ctx.productType).toBe('SaaS');
    expect(ctx.pricingIndicators.some(p => p.includes('Pricing page'))).toBe(true);
  });

  it('reads competitor data when available', () => {
    setupProject({ planFiles: { 'COMPETITORS.md': '# Competitors\nPricing data' } });
    const ctx = collectMonetizationContext(tmpDir);
    expect(ctx.competitorContent).not.toBeNull();
  });

  it('generates template with revenue projections', () => {
    setupProject({ stripe: true });
    const ctx = collectMonetizationContext(tmpDir);
    const template = generateMonetizationTemplate(ctx);
    expect(template).toContain('Monetization Analysis');
    expect(template).toContain('Competitor Pricing Table');
    expect(template).toContain('Recommended Pricing Model');
    expect(template).toContain('Revenue Projections');
    expect(template).toContain('1K');
    expect(template).toContain('10K');
    expect(template).toContain('50K');
    expect(template).toContain('100K');
  });

  it('writes MONETIZATION.md to .plan/', () => {
    setupProject();
    const filePath = writeMonetization(tmpDir, '# Monetization\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('MONETIZATION.md');
  });

  it('handles no payment deps', () => {
    setupProject();
    const ctx = collectMonetizationContext(tmpDir);
    expect(ctx.hasStripe).toBe(false);
    expect(ctx.hasPaymentDep).toBe(false);
  });
});

// --- ASO Keywords ---

describe('aso-gen', () => {
  it('reads Expo app.json metadata', () => {
    setupProject({ expo: true, name: 'FitTracker', description: 'Fitness tracking app' });
    const ctx = collectAsoContext(tmpDir);
    expect(ctx.appName).toBe('FitTracker');
    expect(ctx.bundleId).toBe('com.test.app');
    expect(ctx.platforms).toContain('ios');
    expect(ctx.platforms).toContain('android');
  });

  it('falls back to package.json when no app.json', () => {
    setupProject({ name: 'my-app', description: 'A cool app' });
    fs.writeFileSync(path.join(tmpDir, 'eas.json'), '{}');
    const ctx = collectAsoContext(tmpDir);
    expect(ctx.appName).toBe('my-app');
    expect(ctx.platforms.length).toBeGreaterThan(0);
  });

  it('collects existing keywords from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'fit-app',
      keywords: ['fitness', 'health', 'tracker'],
      dependencies: { expo: '^50.0.0' },
    }));
    fs.writeFileSync(path.join(tmpDir, 'app.json'), JSON.stringify({ expo: { name: 'FitApp' } }));
    const ctx = collectAsoContext(tmpDir);
    expect(ctx.existingKeywords).toContain('fitness');
    expect(ctx.existingKeywords).toContain('health');
  });

  it('generates template with all ASO sections', () => {
    setupProject({ expo: true, name: 'FitTracker' });
    const ctx = collectAsoContext(tmpDir);
    const template = generateAsoTemplate(ctx);
    expect(template).toContain('ASO Keywords');
    expect(template).toContain('Primary Keywords');
    expect(template).toContain('Long-tail Keywords');
    expect(template).toContain('App Store Description Draft');
    expect(template).toContain('Screenshot Strategy');
    expect(template).toContain('Category Recommendation');
  });

  it('writes ASO_KEYWORDS.md to .plan/', () => {
    setupProject();
    const filePath = writeAso(tmpDir, '# ASO Keywords\n\nContent');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('ASO_KEYWORDS.md');
  });

  it('handles empty app.json', () => {
    setupProject();
    fs.writeFileSync(path.join(tmpDir, 'app.json'), '{}');
    const ctx = collectAsoContext(tmpDir);
    expect(ctx.appName).not.toBe('');
  });
});
