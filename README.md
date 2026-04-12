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

## /linkraft dreamroll

Overnight autonomous design generator using an 18-dimension Style Genome: style archetype (30 options each with a CSS signature and anti-patterns), color harmony (7 algorithmic + 5 curated, with random base hue), typography pairing (25 Google Font pairs), type scale, layout, density, mood, era, animation, imagery, border radius, shadow system, CTA style, oblique constraint, **style mutation** (pure / mashup / invert / era-clash / material-swap / maximum / minimum / franken), **copy angle** (10 options for headline framing), **section variation** (uniform / subtle / dramatic), and **image treatment** (10 options: editorial-bleed, collage, masked-shapes, duotone-filter, peek-through, filmstrip, single-hero-only, background-ambient, device-mockup, scattered). Every variation tests design, messaging, AND image presentation simultaneously. Generates standalone HTML landing pages with Lucide icons (via CDN) and real Unsplash photos matched to the product brief. Three judges score desktop AND mobile (375x667) separately. Auto-deducts BRUTUS when required CSS is missing (pure mode only). CSS custom properties in :root make every variation instantly editable. Anti-convergence guardrails (diversity reset every 20 variations, unique style+harmony+mutation trios, chaos ramp, 5-variation style exclusion window, DIVERSITY DIRECTIVE prompt) prevent pages from looking similar. Evolves toward gems. Never stops until you say so.

```
/linkraft dreamroll                         Start or resume (runs until stopped)
/linkraft dreamroll --brief "..."            Start with an explicit product brief
/linkraft dreamroll --reference "a.com,b.com" Scrape sites, extract design DNA, bias rolls
/linkraft dreamroll --style-note "dark, minimal" Plain-text style constraint in the prompt
/linkraft dreamroll status                   Show progress
/linkraft dreamroll stop                     Graceful stop at next variation
/linkraft dreamroll gems                     List all gems
/linkraft dreamroll report                   Morning report with top 5 gems
/linkraft dreamroll overnight                Generate restart loop script (runs all night)
/linkraft dreamroll like [N]                 Mark variation N as a favorite (3x weight)
/linkraft dreamroll hate [N]                 Mark variation N as bad (0.25x weight)
/linkraft dreamroll breed [A] [B]            Cross two gems into 3 children
```

The judges (each scores desktop AND mobile separately):
- **BRUTUS** (clarity, 1-10 + mobile 1-10): ruthless minimalist. Desktop: 3 seconds to understand. Mobile: is CTA above the fold at 375x667?
- **VENUS** (aesthetics, 1-10 + mobile 1-10): obsessive aesthete. Desktop: every pixel considered. Mobile: designed layout, not a collapsed desktop.
- **MERCURY** (conversion, 1-10 + mobile 1-10): conversion machine. Desktop: would this page make money? Mobile: can you tap the CTA with a thumb?

Gem threshold: avg >= 7 or any single 10 (desktop + mobile averaged equally). A variation that aces desktop but flops on mobile cannot become a gem. Every 5 variations, evolution detects patterns. Anti-convergence guardrails kick in after variation 15 (chaos ramp, diversity resets at v20/v40/v60, style exclusion window, unique trio enforcement).

**User feedback overrides judges.** `/linkraft dreamroll like 14` multiplies every dimension value in that genome by 3x. `/linkraft dreamroll hate 7` multiplies by 0.25x. The system learns YOUR taste, not just what the judges think looks good. Multipliers stack across multiple liked/hated variations.

**Breeding.** `/linkraft dreamroll breed 14 6` crosses two gem genomes by alternating dimensions and rolling a fresh mutation per child. Three children get queued and consumed by the next 3 variations in the loop. This is genuine genetic selection on top of weighted random.

**Filenames encode the genome.** Files are named `{NNN}_{style}_{palette}_{mutation}.html` (e.g., `001_cyberpunk_neon-on-dark_pure.html`). You can scan `.dreamroll/variations/` and know what each one is without opening it.

**Reference-guided generation.** `--reference "linear.app, stripe.com"` scrapes each site's CSS, extracts design DNA (colors, fonts, radius, shadows, layout, mood), saves to `.dreamroll/references.json`, and biases evolution weights toward matching parameters. The prompt tells the generator: "extract the PRINCIPLES: their restraint, their color temperature, their spacing philosophy. Do NOT copy them." References persist across sessions.

**Style notes.** `--style-note "dark mode, minimal, big bold typography, no gradients"` injects plain text directly into the prompt as a hard constraint. If the genome conflicts with the note, the note wins. Simpler than references, no scraping needed. Both flags are optional and combinable.

**Lucide icons + Unsplash images.** Every variation uses Lucide icons via CDN (same set as shadcn/ui) for nav, features, trust signals, and CTAs. Real Unsplash photos are chosen to match the product brief (not generic placeholders). Images use the rolled IMAGE_TREATMENT dimension for consistent visual style.

**CSS custom properties.** Every variation uses design tokens in `:root` (colors, fonts, spacing, radii, shadows, transitions). Change 5 variables and the entire page updates. That is the bridge from "dreamroll output" to "production page."

**Every variation works on mobile.** Explicit 375x667 responsive rules: CTA above fold, 14px minimum text, 44x44 touch targets, no horizontal scroll. Judges score mobile separately.

Zero external dependencies beyond CDN (Google Fonts, Lucide, Unsplash). No Playwright. No screenshots. No API keys. Just HTML files on disk you open in a browser.

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

45 tools across four modes: 24 plan tools (16 Path A + 8 Path B), 4 preflight tools, 8 sheep tools, 9 dreamroll tools (the 6 originals plus `dreamroll_like`, `dreamroll_hate`, `dreamroll_breed`).

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

- 681 tests across 44 test files
- 4 modes (plan, preflight, sheep, dreamroll)
- 2 plan paths (A: scan existing code, B: generate from a rough idea .md + scaffold)
- 14 plan outputs in Path A, 15 + scaffold in Path B
- 3 preflight scores (security, health, readiness)
- 6 agent personalities (3 sheep, 3 dreamroll judges scoring desktop + mobile)
- 18 dreamroll Style Genome dimensions (220+ values total)
- 30 style archetypes, each with a CSS signature + required CSS declarations
- 25 Google Font typography pairings
- 40 oblique strategy constraints
- 8 style mutations (pure / mashup / invert / era-clash / material-swap / maximum / minimum / franken)
- 10 copy angles (pain-point-first / outcome-first / social-proof-first / contrarian / story / data-driven / question / comparison / minimal / bold-claim)
- 3 section variation modes (uniform / subtle / dramatic) for internal page rhythm
- 10 image treatments (editorial-bleed / collage / masked-shapes / duotone-filter / peek-through / filmstrip / single-hero-only / background-ambient / device-mockup / scattered)
- 5 anti-convergence guardrails (diversity reset, unique trios, chaos ramp, style exclusion window, DIVERSITY DIRECTIVE prompt)
- Lucide icons via CDN (200+ icons, same set as shadcn/ui)
- Real Unsplash images matched to the product brief
- CSS custom properties in :root (colors, fonts, spacing, radii, shadows, transitions)
- Mobile scoring on every judge (375x667 viewport)

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
    plan/              # 16 generators (Path A scan + Path B from-idea + scaffolder)
    preflight/         # Security, health, readiness scanners + runner
    sheep/             # Auto-config, hunter, personas, stats, content gen
    dreamroll/         # 18-dim params, genome, generator, judges, evolution, reporter, state, feedback, breeding, diversity
    shared/            # Scanner utilities, types, format
    mcp/
      server.ts        # MCP server (all four modes)
      tools/
        plan-tools.ts
        preflight-tools.ts
        sheep-tools.ts
        dreamroll-tools.ts
  tests/               # 681 tests across 44 files
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
