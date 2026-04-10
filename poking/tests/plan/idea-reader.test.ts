import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readIdeaFile,
  writeIdeaSummary,
  loadIdeaSummary,
  formatIdeaSummary,
} from '../../src/plan/idea-reader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idea-reader-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeIdea(name: string, content: string): void {
  fs.writeFileSync(path.join(tmpDir, name), content, 'utf-8');
}

describe('readIdeaFile', () => {
  it('returns null when the file does not exist', () => {
    expect(readIdeaFile(tmpDir, 'PLAN.md')).toBeNull();
  });

  it('extracts product name from the H1', () => {
    writeIdea('PLAN.md', '# TaskPilot\n\nAn AI copilot for product managers.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.productName).toBe('TaskPilot');
    expect(ctx?.description).toContain('AI copilot');
    expect(ctx?.oneLiner).toContain('AI copilot');
  });

  it('strips tagline suffix after a colon in the H1', () => {
    writeIdea('PLAN.md', '# Linkraft: MCP toolkit for Claude\n\nConnect Claude to anything.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.productName).toBe('Linkraft');
  });

  it('falls back to filename when no H1 present', () => {
    writeIdea('MyIdea.md', 'Just a paragraph.\n');
    const ctx = readIdeaFile(tmpDir, 'MyIdea.md');
    expect(ctx?.productName).toBe('MyIdea');
  });

  it('extracts features from a Features section', () => {
    writeIdea('PLAN.md', `# Example

A thing.

## Features

- Offline mode
- Real-time collaboration
- AI summarization

## Other

- not a feature
`);
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.features).toEqual([
      'Offline mode',
      'Real-time collaboration',
      'AI summarization',
    ]);
  });

  it('extracts features from MVP or Scope section heading', () => {
    writeIdea('PLAN.md', `# X

short

## MVP

- Login
- Dashboard
`);
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.features).toEqual(['Login', 'Dashboard']);
  });

  it('extracts target audience from an Audience heading', () => {
    writeIdea('PLAN.md', `# X

blurb

## Target Audience

- Solo founders
- Indie devs shipping side projects
`);
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.targetAudience).toContain('Solo founders');
  });

  it('infers mobile app category from react native', () => {
    writeIdea('PLAN.md', '# Runner\n\nA React Native app for iOS and Android with Expo.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.category).toBe('mobile app');
    expect(ctx?.techHints).toContain('expo');
    expect(ctx?.techHints).toContain('react-native');
  });

  it('infers web application category from Next.js mention', () => {
    writeIdea('PLAN.md', '# SaaSly\n\nA SaaS dashboard built with Next.js and Postgres.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.category).toBe('web application');
    expect(ctx?.techHints).toContain('next');
    expect(ctx?.techHints).toContain('postgres');
  });

  it('infers backend service from FastAPI mention', () => {
    writeIdea('PLAN.md', '# LogPipe\n\nA backend service for log ingestion. Built with FastAPI.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.category).toBe('backend service');
    expect(ctx?.techHints).toContain('fastapi');
  });

  it('infers CLI tool from command-line mention', () => {
    writeIdea('PLAN.md', '# dotctl\n\nA command-line tool for managing dotfiles.\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx?.category).toBe('CLI tool');
  });

  it('defaults to software project when category unclear', () => {
    writeIdea('IDEA.md', '# Thing\n\nSomething vague.\n');
    const ctx = readIdeaFile(tmpDir, 'IDEA.md');
    expect(ctx?.category).toBe('software project');
  });
});

describe('writeIdeaSummary and loadIdeaSummary', () => {
  it('writes .plan/IDEA.md and loads it back', () => {
    writeIdea('PLAN.md', '# MyApp\n\nAn app that does things.\n\n## Features\n\n- Thing one\n- Thing two\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    expect(ctx).not.toBeNull();
    const filePath = writeIdeaSummary(tmpDir, ctx!);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toContain('.plan');
    expect(filePath).toContain('IDEA.md');

    const loaded = loadIdeaSummary(tmpDir);
    expect(loaded).toContain('MyApp');
    expect(loaded).toContain('Thing one');
  });

  it('loadIdeaSummary returns null when not written', () => {
    expect(loadIdeaSummary(tmpDir)).toBeNull();
  });
});

describe('formatIdeaSummary', () => {
  it('formats known sections', () => {
    writeIdea('PLAN.md', '# Z\n\ndesc\n');
    const ctx = readIdeaFile(tmpDir, 'PLAN.md');
    const out = formatIdeaSummary(ctx!);
    expect(out).toContain('# Idea: Z');
    expect(out).toContain('## One-liner');
    expect(out).toContain('## Category');
    expect(out).toContain('## Core Features');
  });
});
