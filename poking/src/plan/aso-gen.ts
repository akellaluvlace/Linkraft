// ASO Keywords Generator: App Store Optimization for mobile apps.
// Only generated when Expo/React Native config is detected.

import * as fs from 'fs';
import * as path from 'path';

export interface AsoContext {
  appName: string;
  appDescription: string;
  bundleId: string | null;
  appCategory: string | null;
  platforms: string[];
  existingKeywords: string[];
}

export function collectAsoContext(projectRoot: string): AsoContext {
  let appName = 'unknown';
  let appDescription = '';
  let bundleId: string | null = null;
  let appCategory: string | null = null;
  const platforms: string[] = [];
  const existingKeywords: string[] = [];

  // Read app.json (Expo)
  const appJsonPath = path.join(projectRoot, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8')) as Record<string, unknown>;
      const expo = (appJson['expo'] ?? appJson) as Record<string, unknown>;
      appName = (expo['name'] as string) ?? appName;
      appDescription = (expo['description'] as string) ?? '';
      const ios = expo['ios'] as Record<string, unknown> | undefined;
      const android = expo['android'] as Record<string, unknown> | undefined;
      if (ios) {
        bundleId = (ios['bundleIdentifier'] as string) ?? null;
        platforms.push('ios');
        if (ios['infoPlist']) {
          const plist = ios['infoPlist'] as Record<string, unknown>;
          appCategory = (plist['LSApplicationCategoryType'] as string) ?? null;
        }
      }
      if (android) {
        if (!bundleId) bundleId = (android['package'] as string) ?? null;
        platforms.push('android');
      }
    } catch {}
  }

  // Read package.json for additional metadata
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      if (appName === 'unknown') appName = (pkg['name'] as string) ?? 'unknown';
      if (!appDescription) appDescription = (pkg['description'] as string) ?? '';
      const keywords = pkg['keywords'] as string[] | undefined;
      if (keywords) existingKeywords.push(...keywords);
    } catch {}
  }

  // Read eas.json for build profile info
  const easPath = path.join(projectRoot, 'eas.json');
  if (fs.existsSync(easPath) && platforms.length === 0) {
    platforms.push('ios', 'android'); // EAS implies both
  }

  return { appName, appDescription, bundleId, appCategory, platforms, existingKeywords };
}

export function generateAsoTemplate(ctx: AsoContext): string {
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

export function writeAso(projectRoot: string, content: string): string {
  const planDir = path.join(projectRoot, '.plan');
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
  const filePath = path.join(planDir, 'ASO_KEYWORDS.md');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}
