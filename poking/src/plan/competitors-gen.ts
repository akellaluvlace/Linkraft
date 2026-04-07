// Competitors Generator: collects project context for competitive analysis.
// Returns a template for Claude to fill in using web_search.

import * as fs from 'fs';
import * as path from 'path';

export interface CompetitorContext {
  projectName: string;
  projectDescription: string;
  category: string;
  techStack: string[];
  keywords: string[];
}

export function collectCompetitorContext(projectRoot: string): CompetitorContext {
  let name = 'unknown';
  let description = '';
  const deps: string[] = [];

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      name = (pkg['name'] as string) ?? 'unknown';
      description = (pkg['description'] as string) ?? '';
      const d = pkg['dependencies'] as Record<string, string> | undefined;
      const dd = pkg['devDependencies'] as Record<string, string> | undefined;
      if (d) deps.push(...Object.keys(d));
      if (dd) deps.push(...Object.keys(dd));
    } catch {}
  }

  if (!description) {
    const readmePath = path.join(projectRoot, 'README.md');
    if (fs.existsSync(readmePath)) {
      try {
        const readme = fs.readFileSync(readmePath, 'utf-8');
        const match = readme.match(/^#[^\n]*\n+([^\n#]+)/);
        if (match) description = match[1]!.trim();
      } catch {}
    }
  }

  const category = detectCategory(projectRoot, deps);
  const words = description.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  const keywords = [...new Set([name, ...category.split(' '), ...words])];

  return { projectName: name, projectDescription: description, category, techStack: deps.slice(0, 20), keywords };
}

function detectCategory(projectRoot: string, deps: string[]): string {
  if (deps.includes('expo') || deps.includes('react-native')) return 'mobile app';
  if (deps.includes('electron') || deps.includes('tauri')) return 'desktop app';
  if (fs.existsSync(path.join(projectRoot, 'bin')) || deps.includes('commander') || deps.includes('yargs')) return 'CLI tool';
  if (deps.includes('next') || deps.includes('nuxt') || deps.includes('@sveltejs/kit')) return 'web application';
  if (deps.includes('express') || deps.includes('fastify') || deps.includes('hono')) return 'backend service';
  if (fs.existsSync(path.join(projectRoot, 'src', 'index.ts')) && !deps.includes('next')) return 'library';
  return 'software project';
}

export function generateCompetitorTemplate(ctx: CompetitorContext): string {
  const lines = [
    `# Competitor Analysis: ${ctx.projectName}`,
    '',
    '## Project Context (auto-detected)',
    '',
    `- **Name:** ${ctx.projectName}`,
    `- **Description:** ${ctx.projectDescription || 'not detected'}`,
    `- **Category:** ${ctx.category}`,
    `- **Key tech:** ${ctx.techStack.slice(0, 10).join(', ') || 'none detected'}`,
    '',
    '## Research Instructions',
    '',
    `Use web_search to research competitors for this ${ctx.category}.`,
    `Suggested search queries:`,
    ...ctx.keywords.slice(0, 5).map(k => `- "${k} alternatives""`),
    `- "${ctx.category} comparison ${new Date().getFullYear()}"`,
    `- "${ctx.projectName} vs"`,
    '',
    '## Template: Fill in below',
    '',
    '### Direct Competitors',
    '| Name | What it does | Pricing | Users/Revenue | Tech stack | Status |',
    '|------|-------------|---------|---------------|------------|--------|',
    '| | | | | | |',
    '',
    '### Feature Comparison Matrix',
    '| Feature | This Project | Competitor 1 | Competitor 2 | Competitor 3 |',
    '|---------|-------------|-------------|-------------|-------------|',
    '| | | | | |',
    '',
    '### Dead/Failed Competitors',
    '| Name | What happened | When | Lesson |',
    '|------|--------------|------|--------|',
    '| | | | |',
    '',
    '### Competitive Advantage',
    '- What this project does better:',
    '- What competitors do better:',
    '- Unfair advantages:',
    '',
    '### Risks from Competitors',
    '| Risk | Probability | Impact | Mitigation |',
    '|------|------------|--------|------------|',
    '| | | | |',
    '',
  ];

  return lines.join('\n');
}

export function writeCompetitors(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'COMPETITORS.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
