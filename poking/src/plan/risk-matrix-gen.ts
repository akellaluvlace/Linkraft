// Risk Matrix Generator: reads architecture and competitor analysis, categorizes all risks.

import * as fs from 'fs';
import * as path from 'path';

export interface RiskMatrixContext {
  projectName: string;
  architectureContent: string | null;
  competitorContent: string | null;
  executiveSummaryContent: string | null;
  extractedRisks: ExtractedRisk[];
}

export interface ExtractedRisk {
  description: string;
  source: string;
  suggestedSeverity: string;
}

export function collectRiskMatrixContext(projectRoot: string): RiskMatrixContext {
  let projectName = 'unknown';
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      projectName = (pkg['name'] as string) ?? 'unknown';
    } catch {}
  }

  const planDir = path.join(projectRoot, '.plan');
  const readPlan = (name: string): string | null => {
    const fp = path.join(planDir, name);
    if (fs.existsSync(fp)) {
      try { return fs.readFileSync(fp, 'utf-8'); } catch {}
    }
    return null;
  };

  const architectureContent = readPlan('ARCHITECTURE.md');
  const competitorContent = readPlan('COMPETITORS.md');
  const executiveSummaryContent = readPlan('EXECUTIVE_SUMMARY.md');

  const extractedRisks = extractRisksFromContent(architectureContent, competitorContent, executiveSummaryContent);

  return { projectName, architectureContent, competitorContent, executiveSummaryContent, extractedRisks };
}

function extractRisksFromContent(
  arch: string | null, comp: string | null, exec: string | null,
): ExtractedRisk[] {
  const risks: ExtractedRisk[] = [];
  const riskPatterns = [
    /(?:risk|vulnerability|weakness|issue|problem|concern|gap|missing|lack|no\s+\w+\s+(?:handling|validation|auth))/gi,
  ];

  function scanContent(content: string, source: string): void {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[|\-#*>\s]+/, '').trim();
      if (trimmed.length < 10 || trimmed.length > 200) continue;
      for (const pattern of riskPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(trimmed)) {
          const severity = trimmed.match(/critical/i) ? 'critical'
            : trimmed.match(/high/i) ? 'high'
            : trimmed.match(/medium/i) ? 'medium' : 'unrated';
          risks.push({ description: trimmed, source, suggestedSeverity: severity });
          break;
        }
      }
    }
  }

  if (arch) scanContent(arch, 'ARCHITECTURE.md');
  if (comp) scanContent(comp, 'COMPETITORS.md');
  if (exec) scanContent(exec, 'EXECUTIVE_SUMMARY.md');

  return risks;
}

export function generateRiskMatrixTemplate(ctx: RiskMatrixContext): string {
  const lines = [
    `# Risk Matrix: ${ctx.projectName}`,
    '',
    '## Source Data',
    '',
    `- Architecture review: ${ctx.architectureContent ? 'available' : 'NOT AVAILABLE (run plan_architecture first)'}`,
    `- Competitor analysis: ${ctx.competitorContent ? 'available' : 'NOT AVAILABLE (run plan_competitors first)'}`,
    `- Executive summary: ${ctx.executiveSummaryContent ? 'available' : 'optional'}`,
    '',
  ];

  if (ctx.extractedRisks.length > 0) {
    lines.push('## Auto-extracted Risk Mentions', '');
    lines.push('| Risk | Source | Suggested Severity |');
    lines.push('|------|--------|--------------------|');
    for (const r of ctx.extractedRisks.slice(0, 20)) {
      lines.push(`| ${r.description} | ${r.source} | ${r.suggestedSeverity} |`);
    }
    lines.push('');
  }

  lines.push(
    '## Template: Categorize all risks into the matrix below',
    '',
    '### Critical (high probability + high impact)',
    '| # | Risk | Probability | Impact | Mitigation | Owner |',
    '|---|------|------------|--------|------------|-------|',
    '| 1 | | | | | |',
    '',
    '### High (either high probability or high impact)',
    '| # | Risk | Probability | Impact | Mitigation | Owner |',
    '|---|------|------------|--------|------------|-------|',
    '| 1 | | | | | |',
    '',
    '### Medium',
    '| # | Risk | Probability | Impact | Mitigation | Owner |',
    '|---|------|------------|--------|------------|-------|',
    '| 1 | | | | | |',
    '',
    '### Accepted Risks (known, won\'t fix now)',
    '| # | Risk | Reason for accepting | Revisit condition |',
    '|---|------|---------------------|-------------------|',
    '| 1 | | | |',
    '',
  );

  return lines.join('\n');
}

export function writeRiskMatrix(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'RISK_MATRIX.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
