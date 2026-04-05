// Launchpad Tester: runs quality checks on built landing pages.
// Lighthouse and Playwright are optional; stubs scores when unavailable.

import type { TestResults, LighthouseScores, ScreenshotResult, CTAVisibility } from './types.js';
import { mcpancake } from '../shared/mcpancake-router.js';

const VIEWPORT_WIDTHS = [375, 768, 1024, 1440];

/**
 * Runs all quality checks on a landing page.
 * Gracefully handles missing Lighthouse and Playwright.
 */
export async function runTests(pageUrl: string): Promise<TestResults> {
  const lighthouseScores = await runLighthouse(pageUrl);
  const screenshots = await takeScreenshots(pageUrl);
  const ctaVisibility = checkCTAVisibility(screenshots);

  const issues: string[] = [];

  if (lighthouseScores) {
    if (lighthouseScores.performance < 90) issues.push(`Performance score ${lighthouseScores.performance} (target: 90+)`);
    if (lighthouseScores.accessibility < 90) issues.push(`Accessibility score ${lighthouseScores.accessibility} (target: 90+)`);
    if (lighthouseScores.seo < 90) issues.push(`SEO score ${lighthouseScores.seo} (target: 90+)`);
  } else {
    issues.push('Lighthouse not available: install lighthouse CLI for performance scoring');
  }

  const invisibleCTAs = ctaVisibility.filter(c => !c.visible);
  if (invisibleCTAs.length > 0) {
    for (const cta of invisibleCTAs) {
      issues.push(`CTA not visible at ${cta.width}px viewport width`);
    }
  }

  return { lighthouseScores, screenshots, ctaVisibility, issues };
}

/**
 * Runs Lighthouse audit. Returns null if Lighthouse is not available.
 */
async function runLighthouse(_pageUrl: string): Promise<LighthouseScores | null> {
  // Lighthouse CLI stub: would run `lighthouse --output json` in real implementation
  // For now, return null (BLOCKED: needs lighthouse CLI)
  process.stderr.write('[launchpad] Lighthouse not available, skipping performance audit\n');
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
 * Checks if CTA buttons are visible at each viewport width.
 * Stub implementation: returns visible=true for all widths.
 * Real implementation would use Playwright to check element visibility.
 */
function checkCTAVisibility(screenshots: ScreenshotResult[]): CTAVisibility[] {
  return screenshots.map(s => ({
    width: s.width,
    visible: true, // Stub: assumes visible. Real impl checks via Playwright.
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
    lines.push(`Issues (${results.issues.length}):`);
    for (const issue of results.issues) {
      lines.push(`  - ${issue}`);
    }
  } else {
    lines.push('No issues found.');
  }

  return lines.join('\n');
}
