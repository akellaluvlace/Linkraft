// Monetization Generator: pricing analysis and revenue projections for products.
// Only generated for products (not libraries, CLI tools, or internal tools).

import * as fs from 'fs';
import * as path from 'path';

export interface MonetizationContext {
  projectName: string;
  projectDescription: string;
  productType: string;
  hasStripe: boolean;
  hasPaymentDep: boolean;
  competitorContent: string | null;
  pricingIndicators: string[];
}

export function collectMonetizationContext(projectRoot: string): MonetizationContext {
  let projectName = 'unknown';
  let projectDescription = '';
  let hasStripe = false;
  let hasPaymentDep = false;
  const pricingIndicators: string[] = [];

  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      projectName = (pkg['name'] as string) ?? 'unknown';
      projectDescription = (pkg['description'] as string) ?? '';
      const d = pkg['dependencies'] as Record<string, string> | undefined;
      const dd = pkg['devDependencies'] as Record<string, string> | undefined;
      const allDeps = { ...d, ...dd };
      hasStripe = !!allDeps['stripe'] || !!allDeps['@stripe/stripe-js'];
      hasPaymentDep = hasStripe || !!allDeps['@lemonsqueezy/wedges'] || !!allDeps['paddle-sdk'] || !!allDeps['razorpay'];
    } catch {}
  }

  if (hasStripe) pricingIndicators.push('Stripe SDK installed');
  if (fs.existsSync(path.join(projectRoot, 'src', 'app', 'pricing')) ||
      fs.existsSync(path.join(projectRoot, 'app', 'pricing'))) {
    pricingIndicators.push('Pricing page detected');
  }
  if (fs.existsSync(path.join(projectRoot, 'src', 'app', 'api', 'webhooks')) ||
      fs.existsSync(path.join(projectRoot, 'app', 'api', 'webhooks'))) {
    pricingIndicators.push('Webhook handlers detected (likely payment webhooks)');
  }

  const competitorContent = readPlanFile(projectRoot, 'COMPETITORS.md');
  const productType = detectProductType(projectRoot);

  return {
    projectName, projectDescription, productType,
    hasStripe, hasPaymentDep, competitorContent, pricingIndicators,
  };
}

function detectProductType(projectRoot: string): string {
  if (fs.existsSync(path.join(projectRoot, 'app.json')) || fs.existsSync(path.join(projectRoot, 'eas.json'))) return 'mobile app';
  if (fs.existsSync(path.join(projectRoot, 'src', 'app', 'pricing')) || fs.existsSync(path.join(projectRoot, 'app', 'pricing'))) return 'SaaS';
  if (fs.existsSync(path.join(projectRoot, 'landing'))) return 'web product';
  return 'product';
}

function readPlanFile(projectRoot: string, name: string): string | null {
  const fp = path.join(projectRoot, '.plan', name);
  if (fs.existsSync(fp)) {
    try { return fs.readFileSync(fp, 'utf-8'); } catch {}
  }
  return null;
}

export function generateMonetizationTemplate(ctx: MonetizationContext): string {
  const lines = [
    `# Monetization Analysis: ${ctx.projectName}`,
    '',
    '## Project Context (auto-detected)',
    '',
    `- **Product type:** ${ctx.productType}`,
    `- **Description:** ${ctx.projectDescription || 'not detected'}`,
    `- **Stripe integration:** ${ctx.hasStripe ? 'yes' : 'no'}`,
    `- **Payment processing:** ${ctx.hasPaymentDep ? 'yes' : 'no'}`,
    ...ctx.pricingIndicators.map(p => `- **Indicator:** ${p}`),
    '',
    ctx.competitorContent ? '## Competitor Pricing Data Available\n(Use COMPETITORS.md for reference when filling in the table below)\n' : '## No competitor data\n(Run plan_competitors first for better analysis)\n',
    '',
    '## Template: Complete the monetization analysis',
    '',
    '### Competitor Pricing Table',
    '| Competitor | Free tier | Starter | Pro | Enterprise | Model |',
    '|-----------|-----------|---------|-----|-----------|-------|',
    '| | | | | | |',
    '',
    '### Recommended Pricing Model',
    '(Freemium, usage-based, flat-rate, per-seat, hybrid)',
    '',
    '**Recommended model:**',
    '**Why:**',
    '',
    '### Suggested Pricing Tiers',
    '| Tier | Price | Includes | Target user |',
    '|------|-------|----------|-------------|',
    '| Free | $0 | | |',
    '| Starter | | | |',
    '| Pro | | | |',
    '| Enterprise | | | |',
    '',
    '### Revenue Projections',
    '| DAU | Conversion rate | ARPU | MRR | ARR |',
    '|-----|----------------|------|-----|-----|',
    '| 1K | | | | |',
    '| 10K | | | | |',
    '| 50K | | | | |',
    '| 100K | | | | |',
    '',
    '### Key Assumptions',
    '- Conversion rate assumption:',
    '- ARPU assumption:',
    '- Churn rate assumption:',
    '',
  ];

  return lines.join('\n');
}

export function writeMonetization(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'MONETIZATION.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
