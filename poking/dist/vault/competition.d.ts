import type { Competition, CompetitionSubmission, CompetitionLeaderboard } from './types.js';
/**
 * Loads all competitions from the state file.
 */
export declare function loadCompetitions(projectRoot: string): Competition[];
/**
 * Saves competitions to the state file.
 */
export declare function saveCompetitions(projectRoot: string, competitions: Competition[]): void;
/**
 * Creates a new competition.
 */
export declare function createCompetition(projectRoot: string, name: string, description: string, deadline: string, prize: string | null): Competition;
/**
 * Submits a component to a competition.
 */
export declare function submitToCompetition(projectRoot: string, competitionId: string, componentName: string, author: string): CompetitionSubmission | null;
/**
 * Gets the leaderboard for a competition.
 * Sorts by combined score (stars * 2 + downloads).
 */
export declare function getLeaderboard(projectRoot: string, competitionId: string): CompetitionLeaderboard | null;
/**
 * Lists all active competitions (deadline not passed).
 */
export declare function listActiveCompetitions(projectRoot: string): Competition[];
/**
 * Lists all competitions.
 */
export declare function listAllCompetitions(projectRoot: string): Competition[];
