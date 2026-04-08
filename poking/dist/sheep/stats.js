"use strict";
// SheepCalledShip Stats: tracks QA session progress in .sheep/stats.json
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
exports.createStats = createStats;
exports.loadStats = loadStats;
exports.loadStatsOrRecover = loadStatsOrRecover;
exports.saveStats = saveStats;
exports.completeSession = completeSession;
exports.canResume = canResume;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SHEEP_DIR = '.sheep';
const STATS_FILE = 'stats.json';
function getStatsPath(projectRoot) {
    return path.join(projectRoot, SHEEP_DIR, STATS_FILE);
}
function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
/**
 * Creates a new stats object for a session.
 */
function createStats(projectName) {
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
function loadStats(projectRoot) {
    const filePath = getStatsPath(projectRoot);
    if (!fs.existsSync(filePath))
        return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
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
function loadStatsOrRecover(projectRoot) {
    const filePath = getStatsPath(projectRoot);
    if (!fs.existsSync(filePath))
        return { stats: null, corrupted: false };
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return { stats: JSON.parse(raw), corrupted: false };
    }
    catch {
        // Rename the corrupted file so a trace remains and the next run starts clean
        const corruptedPath = filePath + '.corrupted';
        try {
            // If a previous corrupted file exists, overwrite it
            if (fs.existsSync(corruptedPath))
                fs.unlinkSync(corruptedPath);
            fs.renameSync(filePath, corruptedPath);
        }
        catch {
            // Best effort: if rename fails, delete the bad file so next init is clean
            try {
                fs.unlinkSync(filePath);
            }
            catch { }
        }
        return { stats: null, corrupted: true };
    }
}
/**
 * Saves stats to disk. Called after EVERY cycle.
 */
function saveStats(projectRoot, stats) {
    const filePath = getStatsPath(projectRoot);
    ensureDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
}
/**
 * Marks the session as completed.
 */
function completeSession(projectRoot, stats) {
    stats.sessionEnd = new Date().toISOString();
    stats.status = 'completed';
    const startTime = new Date(stats.sessionStart).getTime();
    stats.totalRuntimeMinutes = Math.round((Date.now() - startTime) / 60000);
    saveStats(projectRoot, stats);
}
/**
 * Checks if a previous session can be resumed.
 */
function canResume(projectRoot) {
    const stats = loadStats(projectRoot);
    return stats !== null && stats.status === 'running';
}
//# sourceMappingURL=stats.js.map