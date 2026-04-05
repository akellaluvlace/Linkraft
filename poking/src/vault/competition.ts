// Competition system: manages component competitions with JSON state files.

import * as fs from 'fs';
import * as path from 'path';
import type { Competition, CompetitionSubmission, CompetitionLeaderboard, LeaderboardEntry } from './types.js';

const COMPETITIONS_DIR = '.vault';
const COMPETITIONS_FILE = 'competitions.json';

function getCompetitionsPath(projectRoot: string): string {
  return path.join(projectRoot, COMPETITIONS_DIR, COMPETITIONS_FILE);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads all competitions from the state file.
 */
export function loadCompetitions(projectRoot: string): Competition[] {
  const filePath = getCompetitionsPath(projectRoot);
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Competition[];
  } catch {
    return [];
  }
}

/**
 * Saves competitions to the state file.
 */
export function saveCompetitions(projectRoot: string, competitions: Competition[]): void {
  const filePath = getCompetitionsPath(projectRoot);
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(competitions, null, 2), 'utf-8');
}

/**
 * Creates a new competition.
 */
export function createCompetition(
  projectRoot: string,
  name: string,
  description: string,
  deadline: string,
  prize: string | null,
): Competition {
  const competitions = loadCompetitions(projectRoot);

  const competition: Competition = {
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
export function submitToCompetition(
  projectRoot: string,
  competitionId: string,
  componentName: string,
  author: string,
): CompetitionSubmission | null {
  const competitions = loadCompetitions(projectRoot);
  const competition = competitions.find(c => c.id === competitionId);
  if (!competition) return null;

  // Check for duplicate submission
  if (competition.submissions.some(s => s.componentName === componentName && s.author === author)) {
    return null;
  }

  const submission: CompetitionSubmission = {
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
export function getLeaderboard(projectRoot: string, competitionId: string): CompetitionLeaderboard | null {
  const competitions = loadCompetitions(projectRoot);
  const competition = competitions.find(c => c.id === competitionId);
  if (!competition) return null;

  const entries: LeaderboardEntry[] = competition.submissions
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
export function listActiveCompetitions(projectRoot: string): Competition[] {
  const competitions = loadCompetitions(projectRoot);
  const now = new Date().toISOString();
  return competitions.filter(c => c.deadline >= now);
}

/**
 * Lists all competitions.
 */
export function listAllCompetitions(projectRoot: string): Competition[] {
  return loadCompetitions(projectRoot);
}
