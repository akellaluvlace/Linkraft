# Linkraft

Autonomous QA, project analysis, and overnight design generation for Claude Code.

```
/linkraft plan        before you build (research, CLAUDE.md, architecture)
/linkraft preflight   before you ship (security, health, readiness in 60 sec)
/linkraft sheep       after you build (autonomous QA, overnight bug hunting)
/linkraft dreamroll   design overnight (HTML variations, judged by 3 personas)
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
/linkraft sheep overnight     Generate restart loop script (runs all night)
```

The cast:
- **SheepCalledShip**: the agent. Finds bugs. Documents the journey.
- **deezeebalz99**: code reviewer. Reddit mod energy. Suggests rewriting in Rust.
- **Martha**: beta tester. Sweet elderly lady. Tests with one finger. Finds real UX problems.

Proven: 122 bugs found across 4 runs, 94 auto-fixed, 0 tests broken.

## /linkraft dreamroll

Overnight autonomous design generator using a 15-dimension Style Genome: style archetype (30 options each with a CSS signature and anti-patterns), color harmony (7 algorithmic + 5 curated, with random base hue), typography pairing (25 Google Font pairs), type scale, layout, density, mood, era, animation, imagery, border radius, shadow system, CTA style, oblique constraint, and **style mutation** (pure / mashup / invert / era-clash / material-swap / maximum / minimum / franken). The mutation dimension controls HOW the archetype is applied — pure is faithful, mashup fuses two archetypes, franken fuses three, maximum pushes every property to 200%, and so on. Generates standalone HTML landing pages, scores each with three judges, auto-deducts BRUTUS when required CSS is missing (pure mode only), evolves toward gems. Never stops until you say so.

```
/linkraft dreamroll               Start or resume (runs until stopped)
/linkraft dreamroll --brief "..."  Start with an explicit product brief
/linkraft dreamroll status        Show progress
/linkraft dreamroll stop          Graceful stop at next variation
/linkraft dreamroll gems          List all gems
/linkraft dreamroll report        Morning report with top 5 gems
/linkraft dreamroll overnight     Generate restart loop script (runs all night)
```

The judges:
- **BRUTUS** (clarity, 1-10): ruthless minimalist. Can you understand it in 3 seconds?
- **VENUS** (aesthetics, 1-10): obsessive aesthete. Is every pixel considered?
- **MERCURY** (conversion, 1-10): conversion machine. Would this page make money?

Gem threshold: avg >= 7 or any single 10. Every 5 variations, evolution detects patterns in gems and biases future rolls toward winning parameter combinations. Mandatory chaos keeps the generator from getting stuck.

Zero external dependencies. No Playwright. No screenshots. No API keys. Just HTML files on disk you open in a browser.

## The Chain

```
/linkraft plan        understand the project
        |
/linkraft preflight   see what's wrong (60 sec)
        |
/linkraft sheep       fix what's wrong (autonomous)
        |
/linkraft dreamroll   explore design variations overnight
```

Each mode feeds the next. Plan generates the CLAUDE.md that sheep reads. Preflight's report tells sheep which areas to prioritize. Dreamroll runs independently after you have something to design.

## Zero-Friction Doctrine

Every feature works with zero config on first run. No API keys. No MCPs required. If something is unavailable, Linkraft degrades gracefully with a clear message and a useful fallback.

## MCP Tools

33 tools across four modes: 15 plan tools, 4 preflight tools, 8 sheep tools, 6 dreamroll tools.

## Running Overnight

Claude Code sessions can't outlive their context window. Both sheep and dreamroll ship an `overnight` subcommand that generates an OS-appropriate restart loop script you paste into a separate terminal:

```
/linkraft dreamroll overnight   # writes dreamroll-loop.{ps1,sh} to project root
/linkraft sheep overnight       # writes sheep-loop.{ps1,sh} to project root
```

The generator detects your OS (Windows vs Mac/Linux), writes a self-locating script to the project root, and tells you the one command to paste into a new terminal:

- **Windows**: `powershell -ExecutionPolicy Bypass -File dreamroll-loop.ps1`
- **Mac/Linux**: `./dreamroll-loop.sh` (chmod +x applied automatically)

The loop relaunches Claude every time the context fills. Each new session reads the mode's state file and continues where it left off. Stop with Ctrl+C.

Bonus: during a normal run, sheep and dreamroll automatically surface a reminder after a few variations/cycles so you don't have to remember this feature exists. You never touch PowerShell directly.

## Numbers

- 464 tests across 34 test files
- 4 modes (plan, preflight, sheep, dreamroll)
- 13 plan outputs (10 always + 3 conditional)
- 3 preflight scores (security, health, readiness)
- 6 agent personalities (3 sheep, 3 dreamroll judges)
- 15 dreamroll Style Genome dimensions (180+ values total)
- 30 style archetypes, each with a CSS signature + required CSS declarations
- 25 Google Font typography pairings
- 40 oblique strategy constraints
- 8 style mutations (pure / mashup / invert / era-clash / material-swap / maximum / minimum / franken)

## Project Structure

```
poking/
  .claude-plugin/
    plugin.json
  skills/
    plan/SKILL.md
    preflight/SKILL.md
    sheep/SKILL.md
    dreamroll/SKILL.md
  commands/
    linkraft.md
    plan.md
    preflight.md
    sheep.md
    dreamroll.md
  src/
    plan/              # 12 generators + scaffolder + memory config
    preflight/         # Security, health, readiness scanners + runner
    sheep/             # Auto-config, hunter, personas, stats, content gen
    dreamroll/         # 14-dim params, genome, generator, judges, evolution, reporter, state
    shared/            # Scanner utilities, types, format
    mcp/
      server.ts        # MCP server (all four modes)
      tools/
        plan-tools.ts
        preflight-tools.ts
        sheep-tools.ts
        dreamroll-tools.ts
  tests/               # 464 tests across 34 files
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
