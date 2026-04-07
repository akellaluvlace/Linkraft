---
name: plan
description: Before-you-build mode. Scans project, generates CLAUDE.md, competitive analysis, architecture review, executive summary, risk matrix, dependency graph, and conditional monetization/ASO analysis.
---

# Plan: Before You Build

## What This Does

Plan mode scans your project and produces 10-12 documents that give every future Claude session full context from day one.

## /linkraft plan — Full Execution Flow

When the user says "/linkraft plan", execute ALL steps below in order. Do not skip steps. Do not ask permission between steps. Run the full pipeline.

### Phase 1: Scan (deterministic, local-only)

**Step 1:** Call `plan_analyze_stack` with the project root.
This writes `.plan/STACK.md`. Note the detected stack, conventions, and features.

**Step 2:** Call `plan_features` with the project root.
This writes `.plan/FEATURES.md`. Read the output to know which conditional outputs to generate:
- `hasDatabase` → generate SCHEMA
- `hasApiRoutes` → generate API_MAP
- `hasDesignSystem` → generate DESIGN_TOKENS
- `isProduct` → generate MONETIZATION
- `hasMobileApp` → generate ASO_KEYWORDS

**Step 3:** Call `plan_schema` (ONLY if database detected). Writes `.plan/SCHEMA.md`.

**Step 4:** Call `plan_api_map` (ONLY if API routes detected). Writes `.plan/API_MAP.md`.

**Step 5:** Call `plan_tokens` (ONLY if design system detected). Writes `.plan/DESIGN_TOKENS.md`.

**Step 6:** Call `plan_generate_claude_md`.
If CLAUDE.md already exists: present the diff to the user, ask to apply. If new: writes directly.

### Phase 2: Research (needs web_search for competitors)

**Step 7: COMPETITORS.md**
1. Call `plan_competitors` WITHOUT content → get project context and template
2. Use web_search to research competitors. Search for: "[project name] alternatives", "[category] comparison [year]", competitor products, pricing, failures
3. Fill in the template: competitor table, feature matrix, dead competitors, advantages, risks
4. Call `plan_competitors` WITH content → writes `.plan/COMPETITORS.md`

### Phase 3: Analysis (reads earlier outputs)

**Step 8: ARCHITECTURE.md**
1. Call `plan_architecture` WITHOUT content → get directory tree, deps, infra, existing .plan/ files
2. Analyze: describe request flow, data flow, identify strengths and weaknesses with severity, estimate costs at 1K/10K/100K DAU, review security posture, review database design
3. Call `plan_architecture` WITH content → writes `.plan/ARCHITECTURE.md`

**Step 9: EXECUTIVE_SUMMARY.md**
1. Call `plan_executive_summary` WITHOUT content → get all .plan/ files synthesized
2. Write one-page summary: what the project is, current state, competitive landscape (from COMPETITORS.md), technical health (from ARCHITECTURE.md), cost projection table, launch readiness checklist, action plan with priority/task/effort columns, the one thing that matters most
3. Call `plan_executive_summary` WITH content → writes `.plan/EXECUTIVE_SUMMARY.md`

**Step 10: RISK_MATRIX.md**
1. Call `plan_risk_matrix` WITHOUT content → get extracted risks from architecture and competitors
2. Categorize ALL risks into four tiers:
   - Critical (high probability + high impact): with mitigation and owner
   - High (either high probability or high impact): with mitigation and owner
   - Medium: with mitigation
   - Accepted (known, won't fix now): with reason and revisit condition
3. Call `plan_risk_matrix` WITH content → writes `.plan/RISK_MATRIX.md`

**Step 11: DEPENDENCY_GRAPH.md**
1. Call `plan_dependency_graph` WITHOUT content → get action items from executive summary
2. Map dependencies: identify critical path (longest chain), parallel tracks that can run simultaneously, blocked items with unblock conditions, execution order by phase
3. Call `plan_dependency_graph` WITH content → writes `.plan/DEPENDENCY_GRAPH.md`

### Phase 4: Conditional (only if detected)

**Step 12: MONETIZATION.md** (ONLY if isProduct = true)
1. Call `plan_monetization` WITHOUT content → get pricing indicators and competitor data
2. Fill in: competitor pricing table, recommended pricing model with reasoning, suggested tiers, revenue projections at 1K/10K/50K/100K DAU with conversion rate and ARPU assumptions
3. Call `plan_monetization` WITH content → writes `.plan/MONETIZATION.md`

**Step 13: ASO_KEYWORDS.md** (ONLY if hasMobileApp = true)
1. Call `plan_aso` WITHOUT content → get app metadata
2. Use web_search for keyword research. Fill in: primary keywords with volume/difficulty/relevance, long-tail keywords, App Store description draft, screenshot strategy (what to show in each of 5 screenshots), category recommendation
3. Call `plan_aso` WITH content → writes `.plan/ASO_KEYWORDS.md`

### Phase 5: Summary

After all steps complete, present a summary:
```
Plan complete. Generated [N] documents in .plan/:
- STACK.md ✓
- FEATURES.md ✓
- SCHEMA.md ✓ (or skipped: no database)
- API_MAP.md ✓ (or skipped: no API routes)
- DESIGN_TOKENS.md ✓ (or skipped: no design system)
- CLAUDE.md ✓ (or updated)
- COMPETITORS.md ✓
- ARCHITECTURE.md ✓
- EXECUTIVE_SUMMARY.md ✓
- RISK_MATRIX.md ✓
- DEPENDENCY_GRAPH.md ✓
- MONETIZATION.md ✓ (or skipped: not a product)
- ASO_KEYWORDS.md ✓ (or skipped: not mobile)
```

## Subcommand Flows

Each subcommand runs only its specific output. Use when the user wants one document.

### /linkraft plan
Full pipeline. Execute ALL steps above.

### /linkraft plan stack
Call `plan_analyze_stack`. Writes `.plan/STACK.md`.

### /linkraft plan features
Call `plan_features`. Writes `.plan/FEATURES.md`.

### /linkraft plan claude-md
Call `plan_generate_claude_md`. Generates/updates CLAUDE.md.

### /linkraft plan schema
Call `plan_schema`. Writes `.plan/SCHEMA.md`.

### /linkraft plan api-map
Call `plan_api_map`. Writes `.plan/API_MAP.md`.

### /linkraft plan tokens
Call `plan_tokens`. Writes `.plan/DESIGN_TOKENS.md`.

### /linkraft plan competitors
Two-mode: call without content → web_search → call with content. Writes `.plan/COMPETITORS.md`.

### /linkraft plan architecture
Two-mode: call without content → analyze → call with content. Writes `.plan/ARCHITECTURE.md`.

### /linkraft plan executive-summary
Two-mode: call without content → synthesize → call with content. Writes `.plan/EXECUTIVE_SUMMARY.md`.

### /linkraft plan risks
Two-mode: call without content → categorize → call with content. Writes `.plan/RISK_MATRIX.md`.
(Alias: `/linkraft plan risk-matrix`)

### /linkraft plan deps
Two-mode: call without content → map dependencies → call with content. Writes `.plan/DEPENDENCY_GRAPH.md`.
(Alias: `/linkraft plan dependency-graph`)

### /linkraft plan monetization
Two-mode. ONLY for products. Writes `.plan/MONETIZATION.md`.

### /linkraft plan aso
Two-mode. ONLY for mobile apps. Uses web_search. Writes `.plan/ASO_KEYWORDS.md`.

## CLAUDE.md Details

CLAUDE.md is always generated. It includes:
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

## Detection Rules

- Database: prisma/, supabase/, drizzle/, migrations/, or database deps in package.json
- API routes: app/api/, pages/api/, supabase/functions/
- Mobile app: app.json, eas.json, expo or react-native deps
- Design system: tailwind.config, theme files, CSS custom properties
- Product vs tool: app store config, landing page, pricing page, stripe deps

## Available Tools

### Core (deterministic, single-mode):
- `plan_analyze_stack`: tech stack + conventions → .plan/STACK.md
- `plan_features`: which outputs applicable → .plan/FEATURES.md
- `plan_generate_claude_md`: generate/diff CLAUDE.md
- `plan_write_claude_md`: write reviewed CLAUDE.md content
- `plan_preview_claude_md`: preview without writing
- `plan_schema`: database schema → .plan/SCHEMA.md
- `plan_api_map`: API endpoints → .plan/API_MAP.md
- `plan_tokens`: design tokens → .plan/DESIGN_TOKENS.md

### Analytical (two-mode: call without content for context, call with content to write):
- `plan_competitors`: competitive analysis → .plan/COMPETITORS.md
- `plan_architecture`: architecture review → .plan/ARCHITECTURE.md
- `plan_executive_summary`: one-page overview → .plan/EXECUTIVE_SUMMARY.md
- `plan_risk_matrix`: categorized risks → .plan/RISK_MATRIX.md
- `plan_dependency_graph`: task dependencies → .plan/DEPENDENCY_GRAPH.md
- `plan_monetization`: pricing/revenue (products only) → .plan/MONETIZATION.md
- `plan_aso`: ASO keywords (mobile only) → .plan/ASO_KEYWORDS.md

## Zero Config

Plan mode reads only local files. No MCPs needed. No API keys. Just `/linkraft plan`.
Web search for competitors/ASO uses Claude's built-in web_search capability.
