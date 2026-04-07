---
name: plan
description: Before-you-build mode. Scans project, generates CLAUDE.md, extracts schema, maps API, detects design tokens. Every future session benefits.
---

# Plan: Before You Build

## What This Does

Plan mode scans your project and produces everything a future Claude session needs to understand it from day one. The key output is CLAUDE.md. Additional outputs include database schema, API map, design tokens, and risk analysis.

## The Full Output Checklist

When user says "/linkraft plan", produce ALL applicable outputs:

### Always generated:
1. Call `plan_analyze_stack` to detect tech stack and conventions
2. Call `plan_features` to determine which outputs are applicable
3. Call `plan_generate_claude_md` to create/update CLAUDE.md (THE KEY OUTPUT)
4. Call `plan_schema` if database detected
5. Call `plan_api_map` if API routes detected
6. Call `plan_tokens` if design system detected

### CLAUDE.md is mandatory. Always generate it. It includes:
- Tech stack with versions
- Build/test/lint/dev commands (detected from package.json)
- Directory structure (auto-generated tree)
- Key files with "when to read" guidance
- Coding standards (detected: indentation, quotes, semicolons, naming)
- Hard constraints (detected from code + existing CLAUDE.md)
- Key patterns (framework-specific: Server Actions, Supabase client, Prisma workflow)
- Architecture notes
- Environment variables (names only, never values)
- Never-touch areas (migrations, secrets)
- Session protocol

### CLAUDE.md Merge Strategy:
When CLAUDE.md already exists:
1. `plan_generate_claude_md` reports which sections are new vs updated
2. Present the diff to the user
3. Ask: "I found N new sections and M updates. Want me to apply them?"
4. If yes: call `plan_write_claude_md` with merged content
5. Never delete user's custom sections. Only add or update.

## Subcommand Flows

### /linkraft plan claude-md
Just generate/update CLAUDE.md. Call `plan_generate_claude_md`.

### /linkraft plan stack
Just tech stack analysis. Call `plan_analyze_stack`.

### /linkraft plan schema
Just database schema. Call `plan_schema`.

### /linkraft plan api-map
Just API routes. Call `plan_api_map`.

### /linkraft plan tokens
Just design tokens. Call `plan_tokens`.

## Detection Rules

- Database: prisma/, supabase/, drizzle/, migrations/, or database deps in package.json
- API routes: app/api/, pages/api/, supabase/functions/
- Mobile app: app.json, eas.json, expo or react-native deps
- Design system: tailwind.config, theme files, CSS custom properties
- Product vs tool: app store config, landing page, pricing page, stripe deps

## Available Tools

- `plan_analyze_stack`: tech stack + conventions + features
- `plan_features`: which outputs are applicable
- `plan_generate_claude_md`: generate/diff CLAUDE.md (THE KEY TOOL)
- `plan_write_claude_md`: write reviewed CLAUDE.md content
- `plan_preview_claude_md`: preview without writing
- `plan_schema`: extract database schema to .plan/SCHEMA.md
- `plan_api_map`: map API endpoints to .plan/API_MAP.md
- `plan_tokens`: extract design tokens to .plan/DESIGN_TOKENS.md

## Zero Config

Plan mode reads only local files. No MCPs needed. No API keys. Just `/linkraft plan`.
