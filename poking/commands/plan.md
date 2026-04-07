---
name: plan
description: Scan project, generate CLAUDE.md, extract schema, map API, detect design tokens
---

# /linkraft plan

Before you build. Scans your project and generates everything future sessions need.

## Subcommands

### /linkraft plan
Full planning flow: stack analysis, CLAUDE.md generation, schema, API map, tokens.

### /linkraft plan claude-md
Generate or update CLAUDE.md from existing code. The key feature.

### /linkraft plan stack
Analyze tech stack, coding conventions, and project features.

### /linkraft plan schema
Extract database schema from migrations, Prisma, or Drizzle.

### /linkraft plan api-map
Map all API routes, Edge Functions, and server actions.

### /linkraft plan tokens
Extract design tokens from Tailwind config or CSS variables.

### /linkraft plan features
Detect which plan outputs are applicable for this project.

### /linkraft plan review
Walk through all generated docs in .plan/.
