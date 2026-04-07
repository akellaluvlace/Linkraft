// Executive Summary Generator: reads all .plan/ outputs and synthesizes a one-page overview.

import * as fs from 'fs';
import * as path from 'path';

export interface ExecutiveSummaryContext {
  projectName: string;
  projectDescription: string;
  planFiles: { name: string; content: string }[];
  hasCompetitors: boolean;
  hasArchitecture: boolean;
  hasSchema: boolean;
  hasApiMap: boolean;
}

export function collectExecutiveSummaryContext(projectRoot: string): ExecutiveSummaryContext {
  let projectName = 'unknown';
  let projectDescription = '';

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      projectName = (pkg['name'] as string) ?? 'unknown';
      projectDescription = (pkg['description'] as string) ?? '';
    } catch {}
  }

  const planFiles: { name: string; content: string }[] = [];
  const planDir = path.join(projectRoot, '.plan');
  if (fs.existsSync(planDir)) {
    try {
      for (const f of fs.readdirSync(planDir)) {
        if (f.endsWith('.md')) {
          try {
            planFiles.push({ name: f, content: fs.readFileSync(path.join(planDir, f), 'utf-8') });
          } catch {}
        }
      }
    } catch {}
  }

  const fileNames = planFiles.map(f => f.name);

  return {
    projectName, projectDescription, planFiles,
    hasCompetitors: fileNames.includes('COMPETITORS.md'),
    hasArchitecture: fileNames.includes('ARCHITECTURE.md'),
    hasSchema: fileNames.includes('SCHEMA.md'),
    hasApiMap: fileNames.includes('API_MAP.md'),
  };
}

export function generateExecutiveSummaryTemplate(ctx: ExecutiveSummaryContext): string {
  const fileList = ctx.planFiles.map(f => `- ${f.name} (${f.content.length} chars)`).join('\n');
  const planContent = ctx.planFiles.map(f =>
    `### ${f.name}\n${f.content.slice(0, 800)}${f.content.length > 800 ? '\n...(truncated)' : ''}`
  ).join('\n\n');

  const lines = [
    `# Executive Summary: ${ctx.projectName}`,
    '',
    '## Available Plan Data',
    '',
    fileList || '(no plan files found yet)',
    '',
    planContent,
    '',
    '## Template: Synthesize into one-page summary',
    '',
    '### What This Project Is',
    `${ctx.projectDescription || '(Describe the project in 2-3 sentences)'}`,
    '',
    '### Current State',
    '(Where the project stands: MVP, beta, production, early development)',
    '',
    ctx.hasCompetitors ? '### Competitive Landscape Summary\n(Summarize key findings from COMPETITORS.md: how many competitors, market state, this project\'s position)\n' : '',
    ctx.hasArchitecture ? '### Technical Health\n(Summarize from ARCHITECTURE.md: overall quality rating, critical issues, security posture)\n' : '',
    '### Cost Projection',
    '| DAU | Monthly Cost | Notes |',
    '|-----|-------------|-------|',
    '| 1K | | |',
    '| 10K | | |',
    '| 100K | | |',
    '',
    '### Launch Readiness Checklist',
    '- [ ] Core features complete',
    '- [ ] Authentication/authorization',
    '- [ ] Error handling and monitoring',
    '- [ ] Performance baseline',
    '- [ ] Security review',
    '- [ ] CI/CD pipeline',
    '- [ ] Documentation',
    '- [ ] Landing page / marketing',
    '',
    '### Recommended Action Plan',
    '| Priority | Task | Effort | Impact |',
    '|----------|------|--------|--------|',
    '| P0 | | | |',
    '| P1 | | | |',
    '| P2 | | | |',
    '',
    '### The One Thing That Matters Most',
    '(Single most impactful action to take right now)',
    '',
  ];

  return lines.filter(l => l !== undefined).join('\n');
}

export function writeExecutiveSummary(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'EXECUTIVE_SUMMARY.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
