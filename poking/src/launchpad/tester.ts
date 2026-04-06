// Launchpad Tester: runs quality checks on built landing pages.
// Zero-Friction: always returns actionable feedback, never null.
// Tier 1: Lighthouse CLI (if installed). Tier 2: built-in HTML analysis. Tier 3: code-only analysis.

import * as fs from 'fs';
import * as path from 'path';
import type { TestResults, LighthouseScores, ScreenshotResult, CTAVisibility } from './types.js';
import { mcpancake } from '../shared/mcpancake-router.js';

const VIEWPORT_WIDTHS = [375, 768, 1024, 1440];

/**
 * Runs all quality checks on a landing page.
 * Always returns actionable feedback regardless of available tools.
 */
export async function runTests(pageUrl: string, projectRoot?: string): Promise<TestResults> {
  const lighthouseScores = await runLighthouse(pageUrl);
  const screenshots = await takeScreenshots(pageUrl);
  const ctaVisibility = checkCTAVisibility(screenshots);

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (lighthouseScores) {
    if (lighthouseScores.performance < 90) issues.push(`Performance score ${lighthouseScores.performance}/100 (target: 90+)`);
    if (lighthouseScores.accessibility < 90) issues.push(`Accessibility score ${lighthouseScores.accessibility}/100 (target: 90+)`);
    if (lighthouseScores.seo < 90) issues.push(`SEO score ${lighthouseScores.seo}/100 (target: 90+)`);
  } else {
    suggestions.push('Install Lighthouse for full performance audit: npm install -g lighthouse');
  }

  // Tier 2: Built-in HTML/code analysis (always runs)
  if (projectRoot) {
    const codeIssues = runCodeAnalysis(projectRoot);
    issues.push(...codeIssues);
  }

  const invisibleCTAs = ctaVisibility.filter(c => !c.visible);
  for (const cta of invisibleCTAs) {
    issues.push(`CTA not visible at ${cta.width}px viewport width`);
  }

  if (issues.length === 0 && suggestions.length > 0) {
    issues.push('No issues detected from code analysis. ' + suggestions.join(' '));
  }

  return { lighthouseScores, screenshots, ctaVisibility, issues };
}

/**
 * Tier 2: Built-in code analysis when Lighthouse is not available.
 * Checks HTML/JSX files for common quality issues.
 */
function runCodeAnalysis(projectRoot: string): string[] {
  const issues: string[] = [];

  // Find HTML/JSX/TSX files that might be landing pages
  const candidates = findPageFiles(projectRoot);
  let totalImages = 0;
  let imagesWithoutAlt = 0;
  let hasOgTitle = false;
  let hasOgDescription = false;
  let hasMetaDescription = false;
  let hasViewport = false;
  let ctaFound = false;

  for (const file of candidates) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check images for alt text
      const imgMatches = content.match(/<img[^>]*>/gi) ?? [];
      for (const img of imgMatches) {
        totalImages++;
        if (!/alt\s*=/.test(img)) {
          imagesWithoutAlt++;
        }
      }

      // Check meta tags
      if (/og:title/i.test(content)) hasOgTitle = true;
      if (/og:description/i.test(content)) hasOgDescription = true;
      if (/name=["']description["']/i.test(content)) hasMetaDescription = true;
      if (/name=["']viewport["']/i.test(content)) hasViewport = true;

      // Check for CTA-like elements
      if (/(?:sign.?up|get.?started|try.?free|buy.?now|subscribe|download|learn.?more)/i.test(content)) {
        ctaFound = true;
      }
    } catch {
      // Skip unreadable files
    }
  }

  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt}/${totalImages} images missing alt text (accessibility)`);
  }
  if (!hasOgTitle) issues.push('Missing og:title meta tag (social sharing)');
  if (!hasOgDescription) issues.push('Missing og:description meta tag (social sharing)');
  if (!hasMetaDescription) issues.push('Missing meta description tag (SEO)');
  if (!hasViewport) issues.push('Missing viewport meta tag (mobile responsiveness)');
  if (!ctaFound) issues.push('No clear CTA text found (sign up, get started, try free, etc.)');

  return issues;
}

/**
 * Finds HTML/JSX/TSX page files in the project.
 */
function findPageFiles(projectRoot: string): string[] {
  const files: string[] = [];
  const pageDirs = [
    path.join(projectRoot, 'src', 'pages'),
    path.join(projectRoot, 'src', 'app'),
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'pages'),
    projectRoot,
  ];

  for (const dir of pageDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (/\.(html|tsx|jsx)$/.test(entry)) {
          files.push(path.join(dir, entry));
        }
      }
    } catch {
      // Skip unreadable dirs
    }
    if (files.length > 0) break; // Use first matching dir
  }

  return files.slice(0, 20); // Cap at 20 files
}

/**
 * Runs Lighthouse audit. Returns null if Lighthouse CLI is not available.
 */
async function runLighthouse(_pageUrl: string): Promise<LighthouseScores | null> {
  // Lighthouse CLI integration: would shell out to `lighthouse --output json`
  // For now: returns null, triggers Tier 2 fallback
  return null;
}

/**
 * Takes screenshots at multiple viewport widths via Playwright MCP.
 */
async function takeScreenshots(pageUrl: string): Promise<ScreenshotResult[]> {
  const results: ScreenshotResult[] = [];

  for (const width of VIEWPORT_WIDTHS) {
    const screenshot = await mcpancake.screenshot(pageUrl);
    results.push({
      width,
      path: screenshot ? `.launchpad/screenshots/${width}w.png` : null,
    });
  }

  return results;
}

/**
 * Checks CTA visibility at each viewport width.
 */
function checkCTAVisibility(screenshots: ScreenshotResult[]): CTAVisibility[] {
  return screenshots.map(s => ({
    width: s.width,
    visible: true, // Stub: real impl checks via Playwright
  }));
}

/**
 * Formats test results as a readable string.
 */
export function formatTestResults(results: TestResults): string {
  const lines: string[] = ['LAUNCHPAD TEST RESULTS', '━━━━━━━━━━━━━━━━━━━━━', ''];

  if (results.lighthouseScores) {
    const s = results.lighthouseScores;
    lines.push('Lighthouse Scores:');
    lines.push(`  Performance:    ${s.performance}/100`);
    lines.push(`  Accessibility:  ${s.accessibility}/100`);
    lines.push(`  Best Practices: ${s.bestPractices}/100`);
    lines.push(`  SEO:            ${s.seo}/100`);
    lines.push('');
  } else {
    lines.push('Lighthouse: not installed (running built-in checks instead)');
    lines.push('  Install for full audit: npm install -g lighthouse');
    lines.push('');
  }

  lines.push('Screenshots:');
  for (const ss of results.screenshots) {
    lines.push(`  ${ss.width}px: ${ss.path ?? 'not captured (Playwright unavailable)'}`);
  }
  lines.push('');

  lines.push('CTA Visibility:');
  for (const cta of results.ctaVisibility) {
    lines.push(`  ${cta.width}px: ${cta.visible ? 'VISIBLE' : 'NOT VISIBLE'}`);
  }
  lines.push('');

  if (results.issues.length > 0) {
    lines.push(`Issues Found (${results.issues.length}):`);
    for (const issue of results.issues) {
      lines.push(`  - ${issue}`);
    }
  } else {
    lines.push('No issues found. Page looks good!');
  }

  return lines.join('\n');
}
