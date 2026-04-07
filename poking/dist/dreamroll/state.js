"use strict";
// Dreamroll State: persistent state manager for resumable generation.
// Saves/loads .dreamroll/state.json after every variation cycle.
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
exports.createState = createState;
exports.loadState = loadState;
exports.saveState = saveState;
exports.addVariation = addVariation;
exports.updateElapsed = updateElapsed;
exports.stopRun = stopRun;
exports.completeRun = completeRun;
exports.canResume = canResume;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const STATE_DIR = '.dreamroll';
const STATE_FILE = 'state.json';
function getStatePath(projectRoot) {
    return path.join(projectRoot, STATE_DIR, STATE_FILE);
}
function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
/**
 * Creates a new Dreamroll state from config.
 */
function createState(config) {
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
function loadState(projectRoot) {
    const filePath = getStatePath(projectRoot);
    if (!fs.existsSync(filePath))
        return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        // Basic validation
        if (!data.config || typeof data.currentVariation !== 'number' || !Array.isArray(data.variations)) {
            process.stderr.write('[dreamroll] State file corrupted, ignoring\n');
            return null;
        }
        return data;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[dreamroll] Error loading state: ${msg}\n`);
        return null;
    }
}
/**
 * Saves state to disk.
 */
function saveState(projectRoot, state) {
    const filePath = getStatePath(projectRoot);
    ensureDir(filePath);
    state.lastUpdatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}
/**
 * Adds a completed variation to state and saves.
 */
function addVariation(projectRoot, state, variation) {
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
function updateElapsed(projectRoot, state, elapsedMs) {
    state.elapsedMs = elapsedMs;
    saveState(projectRoot, state);
}
/**
 * Marks the run as stopped.
 */
function stopRun(projectRoot, state) {
    state.status = 'stopped';
    saveState(projectRoot, state);
}
/**
 * Marks the run as completed.
 */
function completeRun(projectRoot, state) {
    state.status = 'completed';
    saveState(projectRoot, state);
}
/**
 * Checks if a previous run can be resumed.
 */
function canResume(projectRoot) {
    const state = loadState(projectRoot);
    if (!state)
        return false;
    return state.status === 'running' || state.status === 'paused';
}
//# sourceMappingURL=state.js.map