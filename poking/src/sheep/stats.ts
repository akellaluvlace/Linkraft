// SheepCalledShip Stats: tracks QA session progress in .sheep/stats.json

import * as fs from 'fs';
import * as path from 'path';
import type { SheepStats, CycleResult } from './types.js';

const SHEEP_DIR = '.sheep';
const STATS_FILE = 'stats.json';

function getStatsPath(projectRoot: string): string {
  return path.join(projectRoot, SHEEP_DIR, STATS_FILE);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a new stats object for a session.
 */
export function createStats(projectName: string): SheepStats {
  return {
    project: projectName,
    sessionStart: new Date().toISOString(),
    sessionEnd: null,
    cycleCount: 0,
    bugs: { discovered: 0, autoFixed: 0, logged: 0, falsePositives: 0 },
    files: { scanned: 0, modified: 0, linesChanged: 0 },
    tests: { before: 0, after: 0, added: 0 },
    commits: 0,
    areas: { tested: 0, passed: 0, failed: 0 },
    worstBug: null,
    funniestBug: null,
    marthaMessages: [],
    deezeebalzRoasts: [],
    sheepMonologues: [],
    status: 'running',
  };
}

/**
 * Loads stats from disk. Returns null if not found.
 */
export function loadStats(projectRoot: string): SheepStats | null {
  const filePath = getStatsPath(projectRoot);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as SheepStats;
  } catch {
    return null;
  }
}

/**
 * Saves stats to disk.
 */
export function saveStats(projectRoot: string, stats: SheepStats): void {
  const filePath = getStatsPath(projectRoot);
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
}

/**
 * Updates stats with a completed cycle's results.
 */
export function recordCycle(
  projectRoot: string,
  stats: SheepStats,
  cycle: CycleResult,
): void {
  stats.cycleCount++;
  stats.bugs.discovered += cycle.bugsFound.length;
  stats.bugs.autoFixed += cycle.bugsFixed.length;
  stats.bugs.logged += cycle.bugsLogged.length;

  if (cycle.marthaMessage) stats.marthaMessages.push(cycle.marthaMessage);
  if (cycle.deezeebalzRoast) stats.deezeebalzRoasts.push(cycle.deezeebalzRoast);
  if (cycle.sheepMonologue) stats.sheepMonologues.push(cycle.sheepMonologue);

  saveStats(projectRoot, stats);
}

/**
 * Marks the session as completed.
 */
export function completeSession(projectRoot: string, stats: SheepStats): void {
  stats.sessionEnd = new Date().toISOString();
  stats.status = 'completed';
  saveStats(projectRoot, stats);
}

/**
 * Checks if a previous session can be resumed.
 */
export function canResume(projectRoot: string): boolean {
  const stats = loadStats(projectRoot);
  return stats !== null && stats.status === 'running';
}
