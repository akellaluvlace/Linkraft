---
name: plan
description: Scan project, generate CLAUDE.md, extract schema, map API, detect tokens, plus research docs (competitors, architecture, executive summary, risk matrix, dependency graph, monetization, ASO)
---

# /linkraft plan

Before you build. Scans your project and generates everything future sessions need.

## Subcommands

### /linkraft plan
Full planning flow: stack, features, CLAUDE.md, schema, API map, tokens, plus research documents.

### /linkraft plan claude-md
Generate or update CLAUDE.md from existing code. The key feature.

### /linkraft plan stack
Analyze tech stack, coding conventions, and project features. Writes to .plan/STACK.md.

### /linkraft plan schema
Extract database schema from migrations, Prisma, or Drizzle. Writes to .plan/SCHEMA.md.

### /linkraft plan api-map
Map all API routes, Edge Functions, and server actions. Writes to .plan/API_MAP.md.

### /linkraft plan tokens
Extract design tokens from Tailwind config or CSS variables. Writes to .plan/DESIGN_TOKENS.md.

### /linkraft plan features
Detect which plan outputs are applicable. Writes to .plan/FEATURES.md.

### /linkraft plan competitors
Competitive analysis using web search. Writes to .plan/COMPETITORS.md.

### /linkraft plan architecture
System architecture review. Writes to .plan/ARCHITECTURE.md.

### /linkraft plan executive-summary
One-page overview with action plan. Writes to .plan/EXECUTIVE_SUMMARY.md.

### /linkraft plan risks
Categorized risk matrix. Writes to .plan/RISK_MATRIX.md.
(Alias: /linkraft plan risk-matrix)

### /linkraft plan deps
Task dependency graph with critical path. Writes to .plan/DEPENDENCY_GRAPH.md.
(Alias: /linkraft plan dependency-graph)

### /linkraft plan monetization
Pricing and revenue analysis. Only for products. Writes to .plan/MONETIZATION.md.

### /linkraft plan aso
App Store Optimization keywords. Only for mobile apps. Writes to .plan/ASO_KEYWORDS.md.
