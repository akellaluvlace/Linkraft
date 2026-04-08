// SheepCalledShip Stats: tracks QA session progress in .sheep/stats.json

import * as fs from 'fs';
import * as path from 'path';
import type { SheepStats } from './types.js';

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
    totalRuntimeMinutes: 0,
    bugs: { discovered: 0, autoFixed: 0, logged: 0, falsePositives: 0 },
    files: { scanned: 0, modified: 0, linesAdded: 0, linesRemoved: 0 },
    tests: { before: 0, after: 0, added: 0 },
    commits: 0,
    areas: { tested: [], passed: [], failed: [] },
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
 * Mid-session callers should use this — corruption is left in place
 * so the issue surfaces instead of being silently overwritten.
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
 * Loads stats with corruption recovery. Used at session init only.
 *
 * If stats.json exists but is corrupted (invalid JSON, truncated write,
 * etc.), renames it to stats.json.corrupted and returns corrupted=true.
 * This lets the overnight restart loop survive crash-during-write without
 * permanently breaking: the next init starts a fresh session and preserves
 * the corrupted file as a trace for debugging.
 */
export function loadStatsOrRecover(projectRoot: string): {
  stats: SheepStats | null;
  corrupted: boolean;
} {
  const filePath = getStatsPath(projectRoot);
  if (!fs.existsSync(filePath)) return { stats: null, corrupted: false };

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { stats: JSON.parse(raw) as SheepStats, corrupted: false };
  } catch {
    // Rename the corrupted file so a trace remains and the next run starts clean
    const corruptedPath = filePath + '.corrupted';
    try {
      // If a previous corrupted file exists, overwrite it
      if (fs.existsSync(corruptedPath)) fs.unlinkSync(corruptedPath);
      fs.renameSync(filePath, corruptedPath);
    } catch {
      // Best effort: if rename fails, delete the bad file so next init is clean
      try { fs.unlinkSync(filePath); } catch {}
    }
    return { stats: null, corrupted: true };
  }
}

/**
 * Saves stats to disk. Called after EVERY cycle.
 */
export function saveStats(projectRoot: string, stats: SheepStats): void {
  const filePath = getStatsPath(projectRoot);
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
}

/**
 * Marks the session as completed.
 */
export function completeSession(projectRoot: string, stats: SheepStats): void {
  stats.sessionEnd = new Date().toISOString();
  stats.status = 'completed';
  const startTime = new Date(stats.sessionStart).getTime();
  stats.totalRuntimeMinutes = Math.round((Date.now() - startTime) / 60000);
  saveStats(projectRoot, stats);
}

/**
 * Checks if a previous session can be resumed.
 */
export function canResume(projectRoot: string): boolean {
  const stats = loadStats(projectRoot);
  return stats !== null && stats.status === 'running';
}
