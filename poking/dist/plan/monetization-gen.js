"use strict";
// Monetization Generator: pricing analysis and revenue projections for products.
// Only generated for products (not libraries, CLI tools, or internal tools).
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectMonetizationContext = collectMonetizationContext;
exports.generateMonetizationTemplate = generateMonetizationTemplate;
exports.writeMonetization = writeMonetization;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectMonetizationContext(projectRoot) {
    let projectName = 'unknown';
    let projectDescription = '';
    let hasStripe = false;
    let hasPaymentDep = false;
    const pricingIndicators = [];
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            projectName = pkg['name'] ?? 'unknown';
            projectDescription = pkg['description'] ?? '';
            const d = pkg['dependencies'];
            const dd = pkg['devDependencies'];
            const allDeps = { ...d, ...dd };
            hasStripe = !!allDeps['stripe'] || !!allDeps['@stripe/stripe-js'];
            hasPaymentDep = hasStripe || !!allDeps['@lemonsqueezy/wedges'] || !!allDeps['paddle-sdk'] || !!allDeps['razorpay'];
        }
        catch { }
    }
    if (hasStripe)
        pricingIndicators.push('Stripe SDK installed');
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
function detectProductType(projectRoot) {
    if (fs.existsSync(path.join(projectRoot, 'app.json')) || fs.existsSync(path.join(projectRoot, 'eas.json')))
        return 'mobile app';
    if (fs.existsSync(path.join(projectRoot, 'src', 'app', 'pricing')) || fs.existsSync(path.join(projectRoot, 'app', 'pricing')))
        return 'SaaS';
    if (fs.existsSync(path.join(projectRoot, 'landing')))
        return 'web product';
    return 'product';
}
function readPlanFile(projectRoot, name) {
    const fp = path.join(projectRoot, '.plan', name);
    if (fs.existsSync(fp)) {
        try {
            return fs.readFileSync(fp, 'utf-8');
        }
        catch { }
    }
    return null;
}
function generateMonetizationTemplate(ctx) {
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
function writeMonetization(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'MONETIZATION.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=monetization-gen.js.map