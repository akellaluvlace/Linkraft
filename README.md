# Linkraft

Autonomous QA and project analysis for Claude Code.

```
/linkraft plan        before you build (research, CLAUDE.md, architecture)
/linkraft preflight   before you ship (security, health, readiness in 60 sec)
/linkraft sheep       after you build (autonomous QA, overnight bug hunting)
```

## Install

```
/plugin marketplace add akellaluvlace/Linkraft
/plugin install linkraft
/reload-plugins
```

Requirements: Claude Code, Claude Pro/Max/Team/Enterprise, Node.js 18+

## /linkraft plan

Scans your project and generates up to 13 planning documents.

```
/linkraft plan               Full flow (all outputs)
/linkraft plan claude-md     Generate CLAUDE.md from existing code
/linkraft plan stack         Tech stack analysis
/linkraft plan competitors   Competitive analysis (uses web search)
/linkraft plan architecture  System architecture review
/linkraft plan risks         Risk matrix
/linkraft plan deps          Task dependency graph
```

Outputs written to `.plan/`: stack, features, schema, API map, design tokens, competitors, architecture, executive summary, risk matrix, dependency graph, plus conditional monetization and ASO.

CLAUDE.md is the key output: tech stack, commands, directory structure, coding standards, hard constraints, architecture notes, environment variables, areas to avoid.

## /linkraft preflight

60-second read-only codebase health check. Three scores.

```
/linkraft preflight           Full scan
/linkraft preflight security  Security only (0-10)
/linkraft preflight health    Health only (0-100)
/linkraft preflight ready     Ship readiness only (0-100%)
```

Security: hardcoded secrets, missing auth, rate limiting, fail-open patterns, XSS, injection vectors, env leaks, RLS.
Health: console.logs, TypeScript any, test coverage, file complexity, TODOs, empty catches.
Readiness: error handling, loading states, 404, auth, deploy config, env docs, favicon, OG tags, robots.txt.

## /linkraft sheep

Autonomous QA agent. Zero config. Reads your codebase, generates its own test plan, fixes what's safe, reverts if build breaks, logs what needs human review.

```
/linkraft sheep               Full autonomous run
/linkraft sheep plan          Generate QA plan only (review before running)
/linkraft sheep status        Check progress mid-run
/linkraft sheep report        Generate session report
```

The cast:
- **SheepCalledShip**: the agent. Finds bugs. Documents the journey.
- **deezeebalz99**: code reviewer. Reddit mod energy. Suggests rewriting in Rust.
- **Martha**: beta tester. Sweet elderly lady. Tests with one finger. Finds real UX problems.

Proven: 122 bugs found across 4 runs, 94 auto-fixed, 0 tests broken.

## The Chain

```
/linkraft plan        understand the project
        |
/linkraft preflight   see what's wrong (60 sec)
        |
/linkraft sheep       fix what's wrong (autonomous)
```

Each mode feeds the next. Plan generates the CLAUDE.md that sheep reads. Preflight's report tells sheep which areas to prioritize.

## Zero-Friction Doctrine

Every feature works with zero config on first run. No API keys. No MCPs required. If something is unavailable, Linkraft degrades gracefully with a clear message and a useful fallback.

## MCP Tools

26 tools across three modes: 15 plan tools, 4 preflight tools, 7 sheep tools.

## Numbers

- 379 tests across 29 test files
- 3 modes (plan, preflight, sheep)
- 13 plan outputs (10 always + 3 conditional)
- 3 preflight scores (security, health, readiness)
- 3 agent personalities

## Project Structure

```
poking/
  .claude-plugin/
    plugin.json
  skills/
    plan/SKILL.md
    preflight/SKILL.md
    sheep/SKILL.md
  commands/
    linkraft.md
    plan.md
    preflight.md
    sheep.md
  src/
    plan/              # 12 generators + scaffolder + memory config
    preflight/         # Security, health, readiness scanners + runner
    sheep/             # Auto-config, hunter, personas, stats, content gen
    shared/            # Scanner utilities, types, format
    mcp/
      server.ts        # MCP server (plan + preflight + sheep tools)
      tools/
        plan-tools.ts
        preflight-tools.ts
        sheep-tools.ts
  tests/               # 379 tests across 29 files
  README.md
  LICENSE
```

## Development

```bash
# Clone
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft/poking

# Install
npm install

# Build
npx tsc

# Test
npx vitest run

# Build MCP server
npx tsc && node dist/mcp/server.js
```

## License

MIT

## Author

**Akella inMotion** (Nikita), Dublin
