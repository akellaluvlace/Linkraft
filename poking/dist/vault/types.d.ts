export interface VaultComponent {
    name: string;
    author: string;
    description: string;
    framework: 'react' | 'vue' | 'svelte' | 'html';
    styling: 'tailwind' | 'css-modules' | 'css' | 'styled-components';
    tags: string[];
    designSystem: string | null;
    code: Record<string, string>;
    preview: string | null;
    dependencies: string[];
    props: Record<string, string>;
    downloads: number;
    stars: number;
    version: string;
    createdAt: string;
    updatedAt: string;
}
export interface VaultComponentMeta {
    name: string;
    author: string;
    description: string;
    framework: string;
    styling: string;
    tags: string[];
    designSystem: string | null;
    downloads: number;
    stars: number;
}
export interface VaultSearchOptions {
    query?: string;
    tags?: string[];
    framework?: string;
    styling?: string;
    designSystem?: string;
}
export interface Competition {
    id: string;
    name: string;
    description: string;
    deadline: string;
    prize: string | null;
    submissions: CompetitionSubmission[];
    createdAt: string;
}
export interface CompetitionSubmission {
    componentName: string;
    author: string;
    submittedAt: string;
    stars: number;
    downloads: number;
}
export interface CompetitionLeaderboard {
    competitionId: string;
    competitionName: string;
    entries: LeaderboardEntry[];
}
export interface LeaderboardEntry {
    rank: number;
    componentName: string;
    author: string;
    score: number;
    stars: number;
    downloads: number;
}
