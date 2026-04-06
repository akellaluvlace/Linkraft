---
name: plan
description: Before-you-build mode. Researches market, analyzes tech stacks, generates architecture, and creates project-specific CLAUDE.md files.
---

# Plan: Before You Build

## What This Does

Plan mode does what you'd spend 2-3 days doing manually. Researches competitors, evaluates tech stacks, proposes architecture, and generates a complete CLAUDE.md that makes Claude actually understand your project from day one.

## Key Feature: CLAUDE.md Generation

The single most impactful feature. When run on any existing project:
1. Scans package.json, tsconfig, file structure
2. Detects coding conventions (tabs/spaces, quotes, semicolons, naming)
3. Identifies the stack (framework, styling, database, auth)
4. Finds build/test/lint commands
5. Maps key files with their purpose
6. Detects hard constraints (Tailwind = no CSS modules, env vars = no hardcoded secrets)
7. Generates a CLAUDE.md that knows all of this

## How To Use

### When user says "/linkraft plan claude-md"
1. Call `plan_generate_claude_md` with the project root
2. Review the generated CLAUDE.md with the user
3. User can edit it, then it becomes the permanent project context

### When user says "/linkraft plan stack"
1. Call `plan_analyze_stack` to detect framework, language, styling, database
2. Present findings with coding conventions

### When user says "/linkraft plan"
1. Ask what they're building
2. Use web search for competitor research (if available)
3. Analyze stack options
4. Propose architecture
5. Generate CLAUDE.md
6. Save planning docs to .plan/

## Available Tools

- `plan_analyze_stack`: detect tech stack and conventions
- `plan_generate_claude_md`: scan project and write CLAUDE.md
- `plan_preview_claude_md`: preview without writing

## Zero Config

Plan mode uses only Claude's built-in capabilities and local file reading. No MCPs required. No API keys. Just `/linkraft plan` and it works.
