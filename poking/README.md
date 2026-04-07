# Linkraft

Autonomous QA and project analysis for Claude Code.

```
/linkraft plan        -> before you build (research, CLAUDE.md, architecture)
/linkraft preflight   -> before you ship (security, health, readiness in 60 sec)
/linkraft sheep       -> after you build (autonomous QA, overnight bug hunting)
```

## Install

```bash
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft/poking
npm install
npm run build
```

Add to your project's `.mcp.json`:
```json
{
  "mcpServers": {
    "linkraft": {
      "command": "node",
      "args": ["/absolute/path/to/Linkraft/poking/dist/mcp/server.js"]
    }
  }
}
```

Restart Claude Code. Done.

## /linkraft plan

Before you build. Scans your project and generates 10-12 planning documents.

```
/linkraft plan               # Full planning flow (all outputs)
/linkraft plan claude-md     # Generate CLAUDE.md from existing code
/linkraft plan stack         # Analyze tech stack and conventions
/linkraft plan competitors   # Competitive analysis (uses web search)
/linkraft plan architecture  # System architecture review
/linkraft plan risks         # Risk matrix
/linkraft plan deps          # Task dependency graph
```

Outputs written to `.plan/`: stack, features, schema, API map, design tokens, competitors, architecture, executive summary, risk matrix, dependency graph, plus conditional monetization and ASO.

CLAUDE.md is the key output: tech stack, commands, directory structure, coding standards, hard constraints, architecture notes, environment variables, never-touch areas.

## /linkraft preflight

Before you ship. 60-second read-only scan. Three scores.

```
/linkraft preflight           # Full scan
/linkraft preflight security  # Security only (0-10)
/linkraft preflight health    # Health only (0-100)
/linkraft preflight ready     # Ship readiness only (0-100%)
```

Security: hardcoded secrets, missing auth, rate limiting, fail-open patterns, XSS, injection vectors, env leaks, RLS.
Health: console.logs, TypeScript any, test coverage, file complexity, TODOs, empty catches.
Readiness: error handling, loading states, 404, auth, deploy config, env docs, favicon, OG tags, robots.txt.

## /linkraft sheep

After you build. Auto-configuring QA that hunts bugs while you sleep.

```
/linkraft sheep               # Auto-configure and start hunting
/linkraft sheep report        # Session report with stats
```

Zero config. Reads your package.json, detects the stack, finds build/test commands, identifies high-risk areas, generates a QA plan, and starts hunting. Fixes what's safe, commits after each cycle, logs what needs human review.

The cast:
- **SheepCalledShip**: the narrator. Existential. Dramatic. Finds bugs.
- **deezeebalz99**: code reviewer. Reddit mod energy. Suggests rewriting in Rust.
- **Martha**: beta tester. Sweet elderly lady. Tests with one finger. Finds real UX problems.

Proven: 122 bugs found across 4 runs, 94 auto-fixed, 0 tests broken.

## The Chain

```
/linkraft plan        -> understand the project
/linkraft preflight   -> see what's wrong (60 sec)
/linkraft sheep       -> fix what's wrong (autonomous)
```

## Zero-Friction Doctrine

Every feature works with zero config on first run. No API keys. No MCPs required. If something is unavailable, Linkraft degrades gracefully with a clear message and a useful fallback.

## MCP Tools

26 tools across three modes: 15 plan tools, 4 preflight tools, 7 sheep tools.

## Numbers

- 370 tests across 29 test files
- 3 modes (plan, preflight, sheep)
- 13 plan outputs (10 always + 3 conditional)
- 3 preflight scores (security, health, readiness)
- 3 agent personalities

## License

MIT

## Author

[Akella inMotion](https://www.akellainmotion.com/legacy) (Nikita), Dublin
