// SheepCalledShip Story Writer: generates the narrative field report.
// Writes to .sheep/story.md after each cycle in KAIROS format.

import * as fs from 'fs';
import * as path from 'path';
import type { SheepStats, CycleResult } from './types.js';

const SHEEP_DIR = '.sheep';
const STORY_FILE = 'story.md';

/**
 * Initializes the story file with a header and prologue.
 */
export function initStory(projectRoot: string, projectName: string): void {
  const dir = path.join(projectRoot, SHEEP_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const header = [
    `# SHEEP FIELD REPORT: ${projectName.toUpperCase()}`,
    `## Operation: ${generateCodename()}`,
    `## Started: ${new Date().toISOString().split('T')[0]}`,
    '',
    '---',
    '',
    '### Prologue',
    '',
    '*A sheep walked into a codebase. It looked peaceful. Green. Orderly.*',
    '*The package.json promised structure. The tsconfig promised types.*',
    '*But the sheep has learned not to trust promises. Especially unhandled ones.*',
    '',
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(dir, STORY_FILE), header, 'utf-8');
}

/**
 * Appends a cycle's narrative to the story in KAIROS format.
 */
export function appendCycle(projectRoot: string, cycle: CycleResult): void {
  const filePath = path.join(projectRoot, SHEEP_DIR, STORY_FILE);
  const time = new Date(cycle.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [
    `### Cycle ${cycle.cycleNumber} -- ${time}`,
    '',
    `**Target:** ${cycle.area}`,
    `**The Hunt:** ${cycle.target} (${cycle.filesScanned.length} files scanned)`,
  ];

  // The Kill
  if (cycle.bugsFound.length > 0) {
    lines.push(`**The Kill:** ${cycle.bugsFound.length} bug${cycle.bugsFound.length > 1 ? 's' : ''} found`);
    for (const bug of cycle.bugsFound) {
      const tag = bug.autoFixed ? 'AUTO-FIXED' : 'LOGGED';
      lines.push(`- [${tag}] \`${bug.file}${bug.line ? `:${bug.line}` : ''}\`: ${bug.description}`);
    }
  } else {
    lines.push('**The Kill:** Clean sweep. Nothing found.');
  }

  // The Fix
  if (cycle.bugsFixed.length > 0) {
    const files = [...new Set(cycle.bugsFixed.map(b => b.file))];
    lines.push(`**The Fix:** ${cycle.bugsFixed.length} fix${cycle.bugsFixed.length > 1 ? 'es' : ''} applied to ${files.join(', ')}`);
  }

  // Build + Tests
  lines.push(`**Build:** ${cycle.buildPassed ? 'PASS' : 'FAIL'}`);
  lines.push(`**Tests:** ${cycle.testCount} passing${cycle.testsPassed ? '' : ' (REGRESSIONS)'}`);

  if (cycle.commitHash) {
    lines.push(`**Commit:** ${cycle.commitHash}`);
  }

  lines.push('');

  // deezeebalz99 review
  if (cycle.deezeebalzRoast) {
    lines.push(`> **deezeebalz99:** "${cycle.deezeebalzRoast}"`);
    lines.push('');
  }

  // Martha moment
  if (cycle.marthaMessage) {
    lines.push(`> **Martha:** ${cycle.marthaMessage}`);
    lines.push('');
  }

  // Sheep monologue
  if (cycle.sheepMonologue) {
    lines.push(`*${cycle.sheepMonologue}*`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  fs.appendFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Appends the final summary to the story.
 */
export function appendSummary(projectRoot: string, stats: SheepStats): void {
  const filePath = path.join(projectRoot, SHEEP_DIR, STORY_FILE);

  const lines = [
    '### Epilogue',
    '',
    `*The sheep rests. ${stats.cycleCount} cycles. ${stats.bugs.discovered} bugs found.*`,
    `*${stats.bugs.autoFixed} were fixed on the spot. ${stats.bugs.logged} were logged for the humans.*`,
    `*${stats.areas.passed.length} areas passed clean. ${stats.areas.failed.length} needed work.*`,
    `*The codebase is better than it was. Not perfect. Never perfect. But better.*`,
    `*The sheep will return.*`,
    '',
    '### Final Stats',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Cycles | ${stats.cycleCount} |`,
    `| Runtime | ${stats.totalRuntimeMinutes}m |`,
    `| Bugs found | ${stats.bugs.discovered} |`,
    `| Bugs fixed | ${stats.bugs.autoFixed} |`,
    `| Bugs logged | ${stats.bugs.logged} |`,
    `| Files scanned | ${stats.files.scanned} |`,
    `| Files modified | ${stats.files.modified} |`,
    `| Commits | ${stats.commits} |`,
    `| Tests (final) | ${stats.tests.after} |`,
    '',
  ];

  // Items for human review reference
  const humanReviewPath = path.join(projectRoot, SHEEP_DIR, 'human-review.md');
  if (fs.existsSync(humanReviewPath)) {
    const content = fs.readFileSync(humanReviewPath, 'utf-8');
    const itemCount = (content.match(/^- \[/gm) ?? []).length;
    if (itemCount > 0) {
      lines.push(`### Items for Human Review: ${itemCount}`);
      lines.push(`See \`.sheep/human-review.md\` for details.`);
      lines.push('');
    }
  }

  fs.appendFileSync(filePath, lines.join('\n'), 'utf-8');
}

function generateCodename(): string {
  const adjectives = ['Silent', 'Midnight', 'Velvet', 'Iron', 'Crystal', 'Shadow', 'Golden', 'Phantom', 'Crimson', 'Arctic'];
  const nouns = ['Thunder', 'Whisper', 'Eclipse', 'Horizon', 'Tempest', 'Cascade', 'Ember', 'Vortex', 'Zenith', 'Drift'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]!;
  const noun = nouns[Math.floor(Math.random() * nouns.length)]!;
  return `${adj} ${noun}`;
}
