"use strict";
// Competition system: manages component competitions with JSON state files.
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
exports.loadCompetitions = loadCompetitions;
exports.saveCompetitions = saveCompetitions;
exports.createCompetition = createCompetition;
exports.submitToCompetition = submitToCompetition;
exports.getLeaderboard = getLeaderboard;
exports.listActiveCompetitions = listActiveCompetitions;
exports.listAllCompetitions = listAllCompetitions;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const COMPETITIONS_DIR = '.vault';
const COMPETITIONS_FILE = 'competitions.json';
function getCompetitionsPath(projectRoot) {
    return path.join(projectRoot, COMPETITIONS_DIR, COMPETITIONS_FILE);
}
function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
/**
 * Loads all competitions from the state file.
 */
function loadCompetitions(projectRoot) {
    const filePath = getCompetitionsPath(projectRoot);
    if (!fs.existsSync(filePath))
        return [];
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
/**
 * Saves competitions to the state file.
 */
function saveCompetitions(projectRoot, competitions) {
    const filePath = getCompetitionsPath(projectRoot);
    ensureDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(competitions, null, 2), 'utf-8');
}
/**
 * Creates a new competition.
 */
function createCompetition(projectRoot, name, description, deadline, prize) {
    const competitions = loadCompetitions(projectRoot);
    const competition = {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        name,
        description,
        deadline,
        prize,
        submissions: [],
        createdAt: new Date().toISOString(),
    };
    competitions.push(competition);
    saveCompetitions(projectRoot, competitions);
    return competition;
}
/**
 * Submits a component to a competition.
 */
function submitToCompetition(projectRoot, competitionId, componentName, author) {
    const competitions = loadCompetitions(projectRoot);
    const competition = competitions.find(c => c.id === competitionId);
    if (!competition)
        return null;
    // Check for duplicate submission
    if (competition.submissions.some(s => s.componentName === componentName && s.author === author)) {
        return null;
    }
    const submission = {
        componentName,
        author,
        submittedAt: new Date().toISOString(),
        stars: 0,
        downloads: 0,
    };
    competition.submissions.push(submission);
    saveCompetitions(projectRoot, competitions);
    return submission;
}
/**
 * Gets the leaderboard for a competition.
 * Sorts by combined score (stars * 2 + downloads).
 */
function getLeaderboard(projectRoot, competitionId) {
    const competitions = loadCompetitions(projectRoot);
    const competition = competitions.find(c => c.id === competitionId);
    if (!competition)
        return null;
    const entries = competition.submissions
        .map(s => ({
        rank: 0,
        componentName: s.componentName,
        author: s.author,
        score: s.stars * 2 + s.downloads,
        stars: s.stars,
        downloads: s.downloads,
    }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    return {
        competitionId: competition.id,
        competitionName: competition.name,
        entries,
    };
}
/**
 * Lists all active competitions (deadline not passed).
 */
function listActiveCompetitions(projectRoot) {
    const competitions = loadCompetitions(projectRoot);
    const now = new Date().toISOString();
    return competitions.filter(c => c.deadline >= now);
}
/**
 * Lists all competitions.
 */
function listAllCompetitions(projectRoot) {
    return loadCompetitions(projectRoot);
}
//# sourceMappingURL=competition.js.map