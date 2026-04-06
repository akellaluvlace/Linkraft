// SheepCalledShip Story Writer: generates the narrative field report.
// Writes to .sheep/story.md after each cycle.

import * as fs from 'fs';
import * as path from 'path';
import type { SheepStats, CycleResult } from './types.js';

const SHEEP_DIR = '.sheep';
const STORY_FILE = 'story.md';

/**
 * Initializes the story file with a header.
 */
export function initStory(projectRoot: string, projectName: string): void {
  const dir = path.join(projectRoot, SHEEP_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const header = [
    `# Field Report: ${projectName}`,
    `## SheepCalledShip QA Session`,
    `### ${new Date().toISOString().split('T')[0]}`,
    '',
    '---',
    '',
    '*A sheep walked into a codebase. What follows is what it found.*',
    '',
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(dir, STORY_FILE), header, 'utf-8');
}

/**
 * Appends a cycle's narrative to the story.
 */
export function appendCycle(projectRoot: string, cycle: CycleResult): void {
  const filePath = path.join(projectRoot, SHEEP_DIR, STORY_FILE);

  const lines: string[] = [
    `## Cycle ${cycle.cycleNumber}: ${cycle.area}`,
    '',
  ];

  // Sheep monologue
  if (cycle.sheepMonologue) {
    lines.push(`> ${cycle.sheepMonologue}`);
    lines.push('');
  }

  // Bugs found
  if (cycle.bugsFound.length > 0) {
    lines.push(`**Bugs discovered: ${cycle.bugsFound.length}**`);
    for (const bug of cycle.bugsFound) {
      const fixTag = bug.autoFixed ? ' [AUTO-FIXED]' : ' [LOGGED FOR HUMAN]';
      lines.push(`- \`${bug.file}${bug.line ? `:${bug.line}` : ''}\`: ${bug.description}${fixTag}`);
    }
    lines.push('');
  } else {
    lines.push('*No bugs found. Area is clean.*');
    lines.push('');
  }

  // Martha moment
  if (cycle.marthaMessage) {
    lines.push('**Martha tried to use it:**');
    lines.push(cycle.marthaMessage);
    lines.push('');
  }

  // deezeebalz99 review
  if (cycle.deezeebalzRoast) {
    lines.push('**deezeebalz99 (code review):**');
    lines.push(`> ${cycle.deezeebalzRoast}`);
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
    '## Final Report',
    '',
    `**Cycles completed:** ${stats.cycleCount}`,
    `**Bugs discovered:** ${stats.bugs.discovered}`,
    `**Bugs auto-fixed:** ${stats.bugs.autoFixed}`,
    `**Bugs logged for human:** ${stats.bugs.logged}`,
    `**Areas tested:** ${stats.areas.tested}`,
    `**Areas passed:** ${stats.areas.passed}`,
    '',
    '*The sheep rests. The codebase is a little better than it was. Not perfect. Never perfect. But better.*',
    '',
  ];

  fs.appendFileSync(filePath, lines.join('\n'), 'utf-8');
}
