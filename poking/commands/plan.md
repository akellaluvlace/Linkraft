---
name: plan
description: Plan any project. Path A analyzes an existing codebase, Path B plans from a rough idea .md. Generates CLAUDE.md, schema, API map, tokens, research docs, plus (Path B) a runnable scaffold.
---

# /linkraft plan

One command, two modes. Go from rough idea to a complete technical blueprint in 10 minutes, or go from an existing codebase to fully documented in 10 minutes. Same command.

## Path detection (automatic)

Always run `plan_detect_path` first. It decides which path to run:

1. **`package.json` at project root** -> **Path A** (analyze existing code).
2. **No package.json, but a rough idea `.md` at the root** (PLAN.md, IDEA.md, BRIEF.md, SPEC.md, PRD.md, or README.md) -> **Path B** (plan from rough idea).
3. **Neither** -> tell the user to create a `.md` with their idea and re-run.

Never ask the user which path to use. Detect and proceed.

---

## Path A — existing project

For repos that already have code. Analytical flow: scan, summarize, surface gaps.

1. `plan_analyze_stack` -> `.plan/STACK.md`
2. `plan_features` -> `.plan/FEATURES.md`
3. `plan_schema` -> `.plan/SCHEMA.md` (if database detected)
4. `plan_api_map` -> `.plan/API_MAP.md` (if API routes detected)
5. `plan_tokens` -> `.plan/DESIGN_TOKENS.md` (if design system detected)
6. `plan_competitors` -> `.plan/COMPETITORS.md` (web_search then write with content)
7. `plan_architecture` -> `.plan/ARCHITECTURE.md`
8. `plan_risk_matrix` -> `.plan/RISK_MATRIX.md`
9. `plan_dependency_graph` -> `.plan/DEPENDENCY_GRAPH.md`
10. `plan_monetization` -> `.plan/MONETIZATION.md` (if product)
11. `plan_aso` -> `.plan/ASO_KEYWORDS.md` (if mobile app)
12. `plan_executive_summary` -> `.plan/EXECUTIVE_SUMMARY.md`
13. `plan_generate_hardening` -> `.plan/HARDENING.md`
14. `plan_generate_claude_md` -> project root `CLAUDE.md`

---

## Path B — new project from a rough idea

For a directory that only contains a markdown file with a rough idea. Generative flow: design from the description.

1. `plan_read_idea` -> reads the rough `.md`, extracts context, writes `.plan/IDEA.md`.
2. `plan_competitors` -> `.plan/COMPETITORS.md` (research the market for this product type).
3. `plan_design_stack` -> `.plan/STACK.md` (recommended stack with reasoning and alternatives).
4. `plan_design_schema` -> `.plan/SCHEMA.md` (tables, columns, relationships, RLS).
5. `plan_design_api_map` -> `.plan/API_MAP.md` (endpoints, auth, I/O contracts).
6. `plan_design_tokens` -> `.plan/DESIGN_TOKENS.md` (colors, typography, spacing).
7. `plan_architecture` -> `.plan/ARCHITECTURE.md` (how the pieces fit; data and auth flow).
8. `plan_risk_matrix` -> `.plan/RISK_MATRIX.md` (technical, market, regulatory, operational).
9. `plan_dependency_graph` -> `.plan/DEPENDENCY_GRAPH.md` (build order, critical path).
10. `plan_monetization` -> `.plan/MONETIZATION.md` (revenue model).
11. `plan_aso` -> `.plan/ASO_KEYWORDS.md` (only if mobile app).
12. `plan_design_features` -> `.plan/FEATURES.md` (feature list extracted from the idea).
13. `plan_executive_summary` -> `.plan/EXECUTIVE_SUMMARY.md` (one-page synthesis).
14. `plan_generate_hardening` -> `.plan/HARDENING.md` (prioritized phase 1/2/3 plan).
15. `plan_generate_claude_md` -> project root `CLAUDE.md` (the complete project guide).
16. `plan_scaffold` -> generates skeleton files (package.json, tsconfig, folders, .env.example, framework config). No application code. Existing files are never overwritten.

The output of Path B is a complete project plan, CLAUDE.md, and a runnable scaffold. The user reviews CLAUDE.md then tells Claude to start building phase 1.

---

## Subcommands

### /linkraft plan
Full planning flow. Auto-detects Path A or Path B.

### /linkraft plan claude-md
Generate or update CLAUDE.md. The key feature. Distills `.plan/*.md` when available, otherwise scans the project directly.

### /linkraft plan stack
Path A: `plan_analyze_stack`. Writes `.plan/STACK.md`.

### /linkraft plan schema
Path A: `plan_schema`. Writes `.plan/SCHEMA.md`.

### /linkraft plan api-map
Path A: `plan_api_map`. Writes `.plan/API_MAP.md`.

### /linkraft plan tokens
Path A: `plan_tokens`. Writes `.plan/DESIGN_TOKENS.md`.

### /linkraft plan features
Path A: `plan_features`. Writes `.plan/FEATURES.md`.

### /linkraft plan competitors
Competitive analysis via web_search. Writes `.plan/COMPETITORS.md`.

### /linkraft plan architecture
System architecture review. Writes `.plan/ARCHITECTURE.md`.

### /linkraft plan executive-summary
One-page overview with action plan. Writes `.plan/EXECUTIVE_SUMMARY.md`.

### /linkraft plan risks
Categorized risk matrix. Writes `.plan/RISK_MATRIX.md`.
(Alias: /linkraft plan risk-matrix)

### /linkraft plan deps
Task dependency graph with critical path. Writes `.plan/DEPENDENCY_GRAPH.md`.
(Alias: /linkraft plan dependency-graph)

### /linkraft plan monetization
Pricing and revenue analysis. Only for products. Writes `.plan/MONETIZATION.md`.

### /linkraft plan aso
App Store Optimization keywords. Only for mobile apps. Writes `.plan/ASO_KEYWORDS.md`.

### /linkraft plan idea
Path B: `plan_read_idea`. Reads the rough `.md` and writes `.plan/IDEA.md`.

### /linkraft plan scaffold
Path B: `plan_scaffold`. Previews the scaffold. Pass `apply` to write files.
