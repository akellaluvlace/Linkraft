# Linkraft

Autonomous project planning, preflight checks, and overnight QA for Claude Code.

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

One command, two modes. Auto-detects which to run.

**Path A — existing project.** When `package.json` is present at the root, plan scans the code and generates up to 14 planning documents. The chain is self-reinforcing: research phase (steps 1-12) feeds a synthesis step (13: HARDENING.md with prioritized action items) which feeds the capstone (14: CLAUDE.md).

**Path B — new project from a rough idea.** When there is no `package.json` but a `.md` file at the root (PLAN.md, IDEA.md, BRIEF.md, SPEC.md, PRD.md, or README.md), plan reads the rough idea, extracts product context (name, category, features, audience, tech hints), and generates the same documents from scratch — recommended stack with reasoning, designed schema, designed API map, proposed design tokens — followed by a runnable scaffold (package.json, tsconfig, folder structure, .env.example, framework config). No application code is written, and existing files are never overwritten. You go from rough idea to "Claude, build phase 1" in 10 minutes.

```
/linkraft plan               Full flow (auto Path A or Path B)
/linkraft plan claude-md     Generate CLAUDE.md (reads .plan/ if present)
/linkraft plan stack         Tech stack analysis
/linkraft plan competitors   Competitive analysis (uses web search)
/linkraft plan architecture  System architecture review
/linkraft plan risks         Risk matrix
/linkraft plan deps          Task dependency graph
/linkraft plan hardening     Synthesize prioritized action items from .plan/
/linkraft plan idea          Path B: read rough .md and write .plan/IDEA.md
/linkraft plan scaffold      Path B: generate project skeleton (preview/apply)
```

Research outputs in `.plan/`: stack, features, schema, API map, design tokens, competitors, architecture, executive summary, risk matrix, dependency graph, plus conditional monetization and ASO. Path B adds `IDEA.md` and a runnable scaffold.

Synthesis output: `HARDENING.md` — categorizes everything into **must-fix** (blocks launch), **should-fix** (improves quality), **nice-to-have** (polish). Each item is tagged with category, source doc, and effort estimate.

Capstone output: `CLAUDE.md` — tech stack, commands, directory structure, database, API endpoints, design system, architecture notes, hard constraints, and a Known Issues section that surfaces the top 10 items from HARDENING.md (must-fix first).

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
/linkraft sheep overnight     Generate restart loop script (runs all night)
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

## Running Overnight

Claude Code sessions can't outlive their context window. Sheep ships an `overnight` subcommand that generates an OS-appropriate restart loop script you paste into a separate terminal:

```
/linkraft sheep overnight       # writes sheep-loop.{ps1,sh} to project root
```

The generator detects your OS (Windows vs Mac/Linux), writes a self-locating script to the project root, and tells you the one command to paste into a new terminal:

- **Windows**: `powershell -ExecutionPolicy Bypass -File sheep-loop.ps1`
- **Mac/Linux**: `./sheep-loop.sh` (chmod +x applied automatically)

The loop relaunches Claude every time the context fills. Each new session reads `.sheep/state.json` and continues where it left off. Stop with Ctrl+C.

## Numbers

- 3 modes (plan, preflight, sheep)
- 2 plan paths (A: scan existing code, B: generate from a rough idea .md + scaffold)
- 14 plan outputs in Path A, 15 + scaffold in Path B
- 3 preflight scores (security, health, readiness)
- 3 agent personalities (SheepCalledShip, deezeebalz99, Martha)
- 26 MCP tools

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
    plan/              # 16 generators (Path A scan + Path B from-idea + scaffolder)
    preflight/         # Security, health, readiness scanners + runner
    sheep/             # Auto-config, hunter, personas, stats, content gen
    shared/            # Scanner utilities, types, format, overnight loop
    mcp/
      server.ts        # MCP server (three modes)
      tools/
        plan-tools.ts
        preflight-tools.ts
        sheep-tools.ts
  tests/
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
npm run build

# Test
npx vitest run

# Bundle MCP server (self-contained, no node_modules needed)
npm run bundle
```

## License

MIT

## Author

**Akella inMotion** (Nikita), Dublin
