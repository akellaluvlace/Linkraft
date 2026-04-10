# Linkraft Setup

## Prerequisites

- [Claude Code](https://claude.com/claude-code) (CLI, desktop app, or IDE extension)
- A Claude account (Pro, Max, Team, or Enterprise)
- Node.js >= 18 (only needed for the `overnight` subcommand — the plugin itself ships pre-built)

No API keys. No external services. No config files.

## Install

The simplest path is the Claude Code Plugin Marketplace:

```
/plugin marketplace add akellaluvlace/Linkraft
/plugin install linkraft
/reload-plugins
```

That's it. Linkraft's four modes are now available as slash commands:

- `/linkraft plan` — before you build
- `/linkraft preflight` — before you ship
- `/linkraft sheep` — after you build
- `/linkraft dreamroll` — overnight design generator

Verify the install by running `/linkraft` on its own. You should see the four modes listed.

## First Commands to Try

### Generate a CLAUDE.md for your project

```
/linkraft plan claude-md
```

Scans your project, detects the stack, conventions, build/test commands, and writes a CLAUDE.md that makes future Claude sessions understand the project from day one. Idempotent: running it against an existing CLAUDE.md shows the diff and proposes additions without overwriting your custom sections.

### Run a 60-second health check

```
/linkraft preflight
```

Scans security (secrets, auth, rate limiting, injection, XSS), health (console.logs, TypeScript `any`, test coverage, TODOs), and ship readiness (error handling, loading states, 404, auth, deploy config). Outputs three scores and writes `.preflight/report.json` that sheep can read for prioritization.

### Run autonomous QA

```
/linkraft sheep
```

Reads your project, generates its own QA plan, and starts hunting. Finds bugs, auto-fixes safe ones, commits after each cycle with `[sheep]` prefix, writes a narrative field report with persona commentary, generates social media content at the end. Zero config.

### Generate design variations overnight

```
/linkraft dreamroll
/linkraft dreamroll --brief "your product description"
```

Rolls 15 random parameters per variation (style archetype + color harmony + typography + type scale + layout + density + mood + era + animation + imagery + border radius + shadow system + CTA style + oblique constraint + style mutation), generates a standalone HTML landing page, scores it with 3 judges (BRUTUS, VENUS, MERCURY), evolves toward gems every 5 variations, saves to `.dreamroll/variations/`. No API keys. No Playwright. No screenshots. Just HTML files you open in your browser.

## Running Overnight (Sheep and Dreamroll)

Claude Code sessions end when the context window fills. Neither sheep nor dreamroll can restart themselves from inside — something external has to relaunch Claude. Both modes ship a zero-friction generator for that:

```
/linkraft dreamroll overnight
/linkraft sheep overnight
```

These call the `dreamroll_overnight` and `sheep_overnight` MCP tools, which:

1. Detect your OS (Windows vs Mac/Linux)
2. Write a loop script to your project root:
   - Windows → `dreamroll-loop.ps1` or `sheep-loop.ps1`
   - Mac/Linux → `dreamroll-loop.sh` or `sheep-loop.sh` (chmod +x applied)
3. The script self-locates via `$PSScriptRoot` (Windows) or `cd "$(dirname ...)"` (Unix) so `claude` runs from the project directory regardless of where you invoke it
4. Return a single paste-ready command

You then paste that command into a **separate terminal** (not the one running Claude) and walk away. Example:

**Windows:**
```
powershell -ExecutionPolicy Bypass -File dreamroll-loop.ps1
```

**Mac/Linux:**
```
./dreamroll-loop.sh
```

The loop relaunches Claude every time the context fills. Each new session reads the mode's state file (`.dreamroll/state.json` or `.sheep/stats.json`) and continues where the previous session left off. Stop with Ctrl+C whenever.

**You don't need to remember this exists.** During a normal run, both modes automatically surface the `/linkraft dreamroll overnight` (or `sheep overnight`) reminder after you've done a few variations/cycles. One command, one paste, done.

### What the generated script looks like

```powershell
# Windows (dreamroll-loop.ps1)
Set-Location -Path $PSScriptRoot
while ($true) {
  claude -p "/linkraft dreamroll" --allowedTools 'Bash(*)' 'Read(*)' 'Write(*)' 'Edit(*)' 'Glob(*)' 'Grep(*)'
  Start-Sleep -Seconds 10
}
```

```bash
# Mac/Linux (dreamroll-loop.sh)
#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")"
while true; do
  claude -p "/linkraft dreamroll" --allowedTools 'Bash(*)' 'Read(*)' 'Write(*)' 'Edit(*)' 'Glob(*)' 'Grep(*)'
  sleep 10
done
```

No `plugin-dir` flag needed — when installed from the marketplace, Claude Code finds Linkraft automatically.

## Dreamroll Style Genome (15 Dimensions)

Each dreamroll variation rolls all 15 dimensions. The first 14 describe what the design looks like; the 15th (mutation) describes HOW the archetype is applied.

| # | Dimension | Options | Notes |
|---|---|---|---|
| 1 | Style archetype | 30 | Each carries a CSS signature and anti-patterns |
| 2 | Color harmony | 12 | 7 algorithmic (from random base hue) + 5 curated |
| 3 | Typography pairing | 25 | Google Font pairs with personality tags |
| 4 | Type scale | 6 | minor-second through golden-ratio |
| 5 | Layout pattern | 10 | single-column through bento-mosaic |
| 6 | Density | 5 | ultra-minimal through dense |
| 7 | Mood | 10 | corporate-trust through calm-zen |
| 8 | Era influence | 10 | 1920s-art-deco through timeless |
| 9 | Animation personality | 7 | none through glitch-digital |
| 10 | Imagery approach | 8 | no-images-pure-type through noise-texture |
| 11 | Border radius | 5 | sharp-zero through pill-full |
| 12 | Shadow system | 5 | no-shadows through soft-neumorphic |
| 13 | CTA style | 6 | solid-fill through brutalist-block |
| 14 | Oblique constraint | 40 | one-font-only, max-3-colors, etc. |
| 15 | **Style mutation** | 8 | See below |

### Dimension 15: Style Mutation

Controls how the style archetype is applied. Distribution: pure 30%, mashup 25%, invert 10%, era-clash 10%, material-swap 10%, maximum 5%, minimum 5%, franken 5%.

| Mutation | What it does |
|---|---|
| **pure** | Apply the archetype faithfully. Standard execution. CSS auto-deduction enforced. |
| **mashup** | Roll a second archetype. First provides layout/structure; second provides color/texture. |
| **invert** | Do the OPPOSITE of every rule. Neo-brutalism inverted = whisper-thin borders, pastels, no shadows. |
| **era-clash** | Apply the archetype but force it through the rolled era literally. |
| **material-swap** | Keep the layout; replace every surface with a physical material (concrete, silk, glass, paper, metal, water, marble, velvet). |
| **maximum** | Push every distinctive property to 200%. Every rule amplified. |
| **minimum** | Strip the archetype to its ONE most essential property. Everything else clean. |
| **franken** | Roll THREE archetypes. Colors from #1 + typography from #2 + layout from #3. Deliberately chimeric. |

For non-pure mutations, the CSS auto-deduction check is **skipped** (the mutation may legitimately violate the archetype's required CSS). The judges are told the variation is experimental and asked to evaluate whether the combination works, not whether it matches a known style.

## Optional: Preflight → Sheep Handoff

If `.preflight/report.json` exists when sheep starts, sheep reads it and prioritizes areas where preflight found issues. Areas that preflight scanned and found clean get deprioritized. You don't need to do anything for this to work — just run preflight before sheep.

## Troubleshooting

**"/linkraft not found"**: Run `/reload-plugins`. If still missing, check `/plugin list` for `linkraft`.

**Dreamroll variations look too generic**: The style archetype should dominate. If output looks like a template with different colors, the visual identity section wasn't honored. This is enforced by a programmatic check for distinctive CSS strings per archetype — if missing, BRUTUS auto-deducts 2 points. Non-pure mutations legitimately skip this check.

**Overnight script says "claude not found"**: Make sure the `claude` CLI is in your PATH. Verify with `which claude` (Mac/Linux) or `where claude` (Windows).

**Overnight script: PowerShell execution policy error**: Use the exact command the tool gave you, which includes `-ExecutionPolicy Bypass`. Running `dreamroll-loop.ps1` directly (without the wrapper) will fail if your execution policy is Restricted.

**Sheep says "no test suite detected"**: Sheep still runs build-only verification. To enable test-based validation, add a `test` script to `package.json`.

**Dreamroll state corrupted**: Both sheep and dreamroll rename a corrupted state file to `state.json.corrupted` and start fresh on the next boot. Safe to delete the corrupted file at any time.

**Where are my variations?**: `.dreamroll/variations/variation_NNN.html` in the project root. Open any file directly in a browser — no dev server needed.

## What Linkraft Does NOT Do

- Does not scrape any website
- Does not call external APIs (no keys required)
- Does not require any MCP servers beyond linkraft itself
- Does not modify your existing project files (except sheep, which commits its own fixes with `[sheep]` prefix)
- Does not use Playwright or take screenshots (dreamroll judges the HTML source directly)
- Does not push commits or create PRs on its own
