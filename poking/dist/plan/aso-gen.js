"use strict";
// ASO Keywords Generator: App Store Optimization for mobile apps.
// Only generated when Expo/React Native config is detected.
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
exports.collectAsoContext = collectAsoContext;
exports.generateAsoTemplate = generateAsoTemplate;
exports.writeAso = writeAso;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function collectAsoContext(projectRoot) {
    let appName = 'unknown';
    let appDescription = '';
    let bundleId = null;
    let appCategory = null;
    const platforms = [];
    const existingKeywords = [];
    // Read app.json (Expo)
    const appJsonPath = path.join(projectRoot, 'app.json');
    if (fs.existsSync(appJsonPath)) {
        try {
            const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
            const expo = (appJson['expo'] ?? appJson);
            appName = expo['name'] ?? appName;
            appDescription = expo['description'] ?? '';
            const ios = expo['ios'];
            const android = expo['android'];
            if (ios) {
                bundleId = ios['bundleIdentifier'] ?? null;
                platforms.push('ios');
                if (ios['infoPlist']) {
                    const plist = ios['infoPlist'];
                    appCategory = plist['LSApplicationCategoryType'] ?? null;
                }
            }
            if (android) {
                if (!bundleId)
                    bundleId = android['package'] ?? null;
                platforms.push('android');
            }
        }
        catch { }
    }
    // Read package.json for additional metadata
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (appName === 'unknown')
                appName = pkg['name'] ?? 'unknown';
            if (!appDescription)
                appDescription = pkg['description'] ?? '';
            const keywords = pkg['keywords'];
            if (keywords)
                existingKeywords.push(...keywords);
        }
        catch { }
    }
    // Read eas.json for build profile info
    const easPath = path.join(projectRoot, 'eas.json');
    if (fs.existsSync(easPath) && platforms.length === 0) {
        platforms.push('ios', 'android'); // EAS implies both
    }
    return { appName, appDescription, bundleId, appCategory, platforms, existingKeywords };
}
function generateAsoTemplate(ctx) {
    const lines = [
        `# ASO Keywords: ${ctx.appName}`,
        '',
        '## App Context (auto-detected)',
        '',
        `- **App name:** ${ctx.appName}`,
        `- **Description:** ${ctx.appDescription || 'not detected'}`,
        `- **Bundle ID:** ${ctx.bundleId ?? 'not detected'}`,
        `- **Category:** ${ctx.appCategory ?? 'not detected'}`,
        `- **Platforms:** ${ctx.platforms.join(', ') || 'not detected'}`,
        ctx.existingKeywords.length > 0 ? `- **Existing keywords:** ${ctx.existingKeywords.join(', ')}` : '',
        '',
        '## Research Instructions',
        '',
        `Use web_search to research App Store keywords for: "${ctx.appName}" "${ctx.appDescription}"`,
        'Suggested searches:',
        `- "${ctx.appName} app store keywords"`,
        `- "${ctx.appDescription} app alternatives"`,
        `- "top ${ctx.appCategory ?? 'productivity'} apps ${new Date().getFullYear()}"`,
        '',
        '## Template: Complete the ASO analysis',
        '',
        '### Primary Keywords',
        '| Keyword | Search Volume | Difficulty | Relevance |',
        '|---------|-------------|------------|-----------|',
        '| | high/medium/low | high/medium/low | high/medium/low |',
        '',
        '### Long-tail Keywords',
        '| Keyword phrase | Search Volume | Competition |',
        '|---------------|-------------|-------------|',
        '| | | |',
        '',
        '### App Store Description Draft',
        '',
        '**Subtitle (30 chars):**',
        '',
        '**Promotional text (170 chars):**',
        '',
        '**Description:**',
        '(First 3 lines are most important, shown before "Read More")',
        '',
        '### Screenshot Strategy',
        '| # | What to show | Caption | Key feature highlighted |',
        '|---|-------------|---------|------------------------|',
        '| 1 | | | |',
        '| 2 | | | |',
        '| 3 | | | |',
        '| 4 | | | |',
        '| 5 | | | |',
        '',
        '### Category Recommendation',
        `**Current:** ${ctx.appCategory ?? 'not set'}`,
        '**Recommended primary:**',
        '**Recommended secondary:**',
        '**Why:**',
        '',
    ];
    return lines.filter(Boolean).join('\n');
}
function writeAso(projectRoot, content) {
    const planDir = path.join(projectRoot, '.plan');
    if (!fs.existsSync(planDir))
        fs.mkdirSync(planDir, { recursive: true });
    const filePath = path.join(planDir, 'ASO_KEYWORDS.md');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=aso-gen.js.map