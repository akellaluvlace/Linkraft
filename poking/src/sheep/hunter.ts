// SheepCalledShip Hunter: the QA loop engine.
// Orchestrates auto-config, area scanning, persona generation, and stats tracking.

import * as fs from 'fs';
import * as path from 'path';
import type { SheepConfig, SheepStats, CycleResult, QAPlanEntry, BugReport } from './types.js';
import { autoConfig, generateQAPlan, identifyHighRiskAreas } from './auto-config.js';
import { createStats, loadStats, saveStats, recordCycle, completeSession } from './stats.js';
import { generateDeezeebalzRoast, generateMarthaMessage, generateSheepMonologue } from './personas.js';
import { initStory, appendCycle, appendSummary } from './story-writer.js';
import { generateContentPack, formatContentPack } from './content-gen.js';

export interface HunterCallbacks {
  onCycleStart?: (cycleNumber: number, area: string) => void;
  onCycleEnd?: (cycle: CycleResult) => void;
  onComplete?: (stats: SheepStats) => void;
  analyzeArea?: (area: QAPlanEntry) => Promise<BugReport[]>;
}

/**
 * Initializes a Sheep session: auto-config, QA plan, baseline.
 */
export function initSession(projectRoot: string): {
  config: SheepConfig;
  qaPlan: string;
  stats: SheepStats;
} {
  const config = autoConfig(projectRoot);
  const qaPlan = generateQAPlan(config);
  const projectName = path.basename(projectRoot);

  // Write QA plan
  const sheepDir = path.join(projectRoot, '.sheep');
  if (!fs.existsSync(sheepDir)) fs.mkdirSync(sheepDir, { recursive: true });
  fs.writeFileSync(path.join(sheepDir, 'QA_PLAN.md'), qaPlan, 'utf-8');

  // Initialize stats and story
  const stats = createStats(projectName);
  saveStats(projectRoot, stats);
  initStory(projectRoot, projectName);

  return { config, qaPlan, stats };
}

/**
 * Runs the full QA hunt loop.
 * If analyzeArea callback is provided, uses it for real bug detection.
 * Otherwise, runs a demonstration loop with placeholder results.
 */
export async function runHunt(
  projectRoot: string,
  callbacks?: HunterCallbacks,
): Promise<SheepStats> {
  // Resume or init
  let stats = loadStats(projectRoot);
  if (!stats || stats.status !== 'running') {
    const session = initSession(projectRoot);
    stats = session.stats;
  }

  const config = autoConfig(projectRoot);
  const areas = identifyHighRiskAreas(projectRoot);

  for (let i = stats.cycleCount; i < Math.min(config.maxCycles, areas.length * 2); i++) {
    const area = areas[i % areas.length]!;

    callbacks?.onCycleStart?.(i + 1, area.area);

    // Analyze the area (real or stub)
    let bugsFound: BugReport[];
    if (callbacks?.analyzeArea) {
      bugsFound = await callbacks.analyzeArea(area);
    } else {
      bugsFound = []; // No bugs without real analysis
    }

    const bugsFixed = bugsFound.filter(b => b.autoFixed);
    const bugsLogged = bugsFound.filter(b => !b.autoFixed);

    // Generate persona commentary
    const firstBug = bugsFound[0];
    const deezeebalzRoast = firstBug ? generateDeezeebalzRoast(firstBug) : null;
    const marthaMessage = generateMarthaMessage(area.area);
    const sheepMonologue = generateSheepMonologue(i + 1, bugsFound.length, area.area);

    const cycle: CycleResult = {
      cycleNumber: i + 1,
      area: area.area,
      bugsFound,
      bugsFixed,
      bugsLogged,
      marthaMessage,
      deezeebalzRoast,
      sheepMonologue,
      timestamp: new Date().toISOString(),
    };

    // Record and narrate
    recordCycle(projectRoot, stats, cycle);
    appendCycle(projectRoot, cycle);
    stats.areas.tested = Math.min(stats.areas.tested + 1, areas.length);

    callbacks?.onCycleEnd?.(cycle);
  }

  // Complete session
  completeSession(projectRoot, stats);
  appendSummary(projectRoot, stats);

  // Generate content pack
  const contentPack = generateContentPack(stats);
  const contentPath = path.join(projectRoot, '.sheep', 'content-pack.md');
  fs.writeFileSync(contentPath, formatContentPack(contentPack), 'utf-8');

  callbacks?.onComplete?.(stats);

  return stats;
}

/**
 * Generates a session report from current stats.
 */
export function getReport(projectRoot: string): string {
  const stats = loadStats(projectRoot);
  if (!stats) return 'No Sheep session found. Run /linkraft sheep to start.';

  const lines = [
    'SHEEPCALLEDSHIP SESSION REPORT',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `Project: ${stats.project}`,
    `Status: ${stats.status}`,
    `Cycles: ${stats.cycleCount}`,
    `Bugs discovered: ${stats.bugs.discovered}`,
    `Bugs auto-fixed: ${stats.bugs.autoFixed}`,
    `Bugs logged for review: ${stats.bugs.logged}`,
    `Areas tested: ${stats.areas.tested}`,
    `Areas clean: ${stats.areas.passed}`,
    '',
  ];

  if (stats.sheepMonologues.length > 0) {
    lines.push('Latest from the sheep:');
    lines.push(`> ${stats.sheepMonologues[stats.sheepMonologues.length - 1]!}`);
    lines.push('');
  }

  if (stats.marthaMessages.length > 0) {
    lines.push('Latest Martha moment:');
    lines.push(stats.marthaMessages[stats.marthaMessages.length - 1]!);
    lines.push('');
  }

  return lines.join('\n');
}
