// Dreamroll State: persistent state manager for resumable generation.
// Saves/loads .dreamroll/state.json after every variation cycle.

import * as fs from 'fs';
import * as path from 'path';
import type { DreamrollState, DreamrollConfig, Variation } from './types.js';

const STATE_DIR = '.dreamroll';
const STATE_FILE = 'state.json';

function getStatePath(projectRoot: string): string {
  return path.join(projectRoot, STATE_DIR, STATE_FILE);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a new Dreamroll state from config.
 */
export function createState(config: DreamrollConfig): DreamrollState {
  return {
    config,
    currentVariation: 0,
    variations: [],
    gems: [],
    evolutionAdjustments: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    elapsedMs: 0,
    status: 'running',
  };
}

/**
 * Loads state from disk. Returns null if no state file exists or it's corrupted.
 */
export function loadState(projectRoot: string): DreamrollState | null {
  const filePath = getStatePath(projectRoot);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as DreamrollState;

    // Basic validation
    if (!data.config || typeof data.currentVariation !== 'number' || !Array.isArray(data.variations)) {
      process.stderr.write('[dreamroll] State file corrupted, ignoring\n');
      return null;
    }

    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[dreamroll] Error loading state: ${msg}\n`);
    return null;
  }
}

/**
 * Saves state to disk.
 */
export function saveState(projectRoot: string, state: DreamrollState): void {
  const filePath = getStatePath(projectRoot);
  ensureDir(filePath);
  state.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Adds a completed variation to state and saves.
 */
export function addVariation(
  projectRoot: string,
  state: DreamrollState,
  variation: Variation,
): void {
  state.variations.push(variation);
  state.currentVariation = variation.id;

  if (variation.verdict?.verdict === 'gem') {
    state.gems.push(variation.id);
  }

  saveState(projectRoot, state);
}

/**
 * Updates the elapsed time and saves state.
 */
export function updateElapsed(projectRoot: string, state: DreamrollState, elapsedMs: number): void {
  state.elapsedMs = elapsedMs;
  saveState(projectRoot, state);
}

/**
 * Marks the run as stopped.
 */
export function stopRun(projectRoot: string, state: DreamrollState): void {
  state.status = 'stopped';
  saveState(projectRoot, state);
}

/**
 * Marks the run as completed.
 */
export function completeRun(projectRoot: string, state: DreamrollState): void {
  state.status = 'completed';
  saveState(projectRoot, state);
}

/**
 * Checks if a previous run can be resumed.
 */
export function canResume(projectRoot: string): boolean {
  const state = loadState(projectRoot);
  if (!state) return false;
  return state.status === 'running' || state.status === 'paused';
}
