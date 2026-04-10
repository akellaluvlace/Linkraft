---
name: dreamroll
description: Overnight autonomous design generator using a 14-dimension Style Genome. Generates standalone HTML landing page variations, scores them with 3 judges, evolves toward gems. Runs until stopped.
---

# Dreamroll: Overnight Design Generator

## What This Is

Dreamroll generates standalone HTML landing page variations overnight using a **Style Genome** — 14 randomizable parameter dimensions that combine into design DNA. Each variation rolls all 14 dimensions, generates a self-contained HTML file with inline CSS only, and scores it with three judge personas (BRUTUS, VENUS, MERCURY). Every 5 variations, it detects patterns in gems and biases future rolls toward winning combinations. Mandatory chaos keeps at least 2 of every 5 variations fully random.

Zero config. Zero external dependencies beyond Google Fonts. No API keys. No Playwright. No screenshots. Just HTML files on disk that open in any browser.

Part of Linkraft. Fourth mode after plan, preflight, sheep.

## Never Stop Rule

**Dreamroll does NOT stop after one variation.** It generates, scores, saves, and immediately starts the next variation. No pauses. No confirmation prompts.

The agent stops only when:
1. Context window fills (the restart loop relaunches and resumes from state)
2. User runs `/linkraft dreamroll stop` (stop flag in state.json)
3. Disk is full (can't write HTML files)

On every boot: read `.dreamroll/state.json`. If valid, continue from `currentVariation + 1`. If corrupted, recovery handled by state module. If missing, start from variation_001.

## /linkraft dreamroll — Full Execution Flow

When the user says `/linkraft dreamroll` (optionally with `--brief "..."`), execute this loop continuously until stopped.

### Step 1: First call

Call `dreamroll_start` with:
- `projectRoot`
- `brief` (optional, otherwise auto-detected from package.json/README)
- `pluginRoot` (the linkraft plugin root, so judge prompts can be returned inline)

The tool returns:
- INITIALIZED status
- A complete generation prompt for variation #001 with the full 14-dimension genome, CSS signatures, Google Fonts link, content template, and CSS quality rules
- Judge prompts for BRUTUS, VENUS, MERCURY

### Step 2: Generate the HTML

Read the generation prompt carefully. Write a single standalone HTML file to the path specified in the prompt (e.g., `.dreamroll/variations/variation_001.html`). Requirements:

- Complete valid HTML5 document
- All CSS inline in a `<style>` tag inside `<head>`
- Only the Google Fonts `<link>` is allowed as an external resource
- Opens directly in any browser, no build step
- HTML comment at the top documenting all 14 genome dimensions (use the template the prompt provides)
- 9-section page content from the brief (real content, not lorem ipsum)
- 60-30-10 color distribution
- 8px spacing grid
- WCAG AA contrast (4.5:1 minimum on all text)
- Responsive at 375/768/1024/1440
- `prefers-reduced-motion` media query
- Total file size under 50KB
- The design must visibly reflect ALL 14 genome dimensions

### Step 3: Score the variation

The dreamroll_start response includes three judge prompts. Adopt each persona and score the HTML you just wrote:

- **BRUTUS** (clarity, 1-10): Ruthless minimalist. Communication efficiency. Can you understand it in 3 seconds? Is the CTA dominant? Is the hierarchy clear? Deduct points for visual noise, unclear CTAs, walls of text.
- **VENUS** (aesthetics, 1-10): Obsessive aesthete. Color harmony, typography, visual rhythm. Are shadows consistent? Do border-radii follow a system? Is spacing on a grid? Deduct for default-looking design, clashing weights.
- **MERCURY** (conversion, 1-10): Conversion machine. Value prop in first viewport, dominant CTA, trust signals, flow toward CTA. Deduct for vague headlines, no social proof, weak CTAs.

Write 1-2 sentences per judge. Be specific. Score harshly. The scoring rubrics are deduction-based — start at 10, lose points for problems.

### Step 4: Loop

Call `dreamroll_start` again, this time passing the `completed` parameter with the previous variation's results:

```json
{
  "projectRoot": "...",
  "pluginRoot": "...",
  "completed": {
    "variationId": 1,
    "filePath": "/path/to/variation_001.html",
    "scores": [
      { "judge": "brutus", "score": 8, "comment": "..." },
      { "judge": "venus", "score": 7, "comment": "..." },
      { "judge": "mercury", "score": 6, "comment": "..." }
    ]
  }
}
```

The tool records the previous variation, updates gems list (avg >= 7 OR any single 10), runs evolution check (every 5 variations), and returns the next variation prompt + judge prompts.

Go back to step 2. Loop forever until the response says "Stop requested".

### Step 5: Context fills

When your context runs low, the session naturally ends. State persists in `.dreamroll/state.json`. The PowerShell restart loop launches a new Claude session, which calls `dreamroll_start` again. The tool detects the existing running state and continues from `currentVariation + 1`.

## The Style Genome (14 Dimensions)

See `src/dreamroll/params.ts` for full pool definitions and metadata.

```
1.  STYLE ARCHETYPE (30 options) — glassmorphism, neo-brutalism, art-deco, synthwave...
                                    Each carries a CSS signature the generator must follow
2.  COLOR HARMONY (12 options)   — algorithmic schemes (monochromatic, complementary, triadic,
                                    split-complementary, tetradic, golden-ratio) computed from
                                    a random base hue 0-360, plus curated presets (jewel-tones,
                                    neon-on-dark, earth-tones, pastels, black-plus-accent)
3.  TYPOGRAPHY PAIRING (25 options) — Google Font pairs with personality tags
                                       (playfair-source = editorial-luxury,
                                        bebas-heebo = bold-impact, ...)
4.  TYPE SCALE (6 options)       — minor-second through golden-ratio (ratios from 1.067 to 1.618)
5.  LAYOUT PATTERN (10 options)  — single-column-hero, bento-mosaic, asymmetric-golden, ...
6.  DENSITY (5 options)          — ultra-minimal through dense
7.  MOOD (10 options)            — corporate-trust, premium-luxury, raw-authentic, ...
8.  ERA INFLUENCE (10 options)   — 1920s-art-deco through timeless
9.  ANIMATION (7 options)        — none, subtle-fade, cinematic-reveal, glitch-digital, ...
10. IMAGERY (8 options)          — no-images-pure-type, abstract-blobs, noise-texture, ...
11. BORDER RADIUS (5 options)    — sharp-zero through pill-full
12. SHADOW SYSTEM (5 options)    — no-shadows through soft-neumorphic
13. CTA STYLE (6 options)        — solid-fill, brutalist-block, gradient-button, ...
14. OBLIQUE CONSTRAINT (40 options) — one-font-only, max-3-colors, dark-mode-only, empty-hero,
                                       what-would-a-child-draw, the-last-page-on-earth, ...
```

## Judges (Anti-Self-Bias)

Claude judges its own work. To counteract optimism bias:
- Judges score AFTER generation, not during
- Each judge prompt emphasizes deduction (start at 10, lose points), not addition
- Reports note "scores are self-evaluated"
- Score deductions are mandatory for visible flaws

The three persona files live in `agents/dreamroll-brutus.md`, `agents/dreamroll-venus.md`, `agents/dreamroll-mercury.md`. The dreamroll_start tool loads them and includes them inline in its response when `pluginRoot` is provided.

## Scoring Rules

```
Average >= 7.0:  GEM (highlighted in morning report, featured)
Average >= 5.0:  decent (kept for reference)
Average < 5.0:   weak (file kept but not featured)
Any single 10:   INSTANT KEEP regardless of average
```

## Subcommands

### /linkraft dreamroll
Start or resume the loop. Runs until stopped.

### /linkraft dreamroll --brief "product description"
Same with explicit brief.

### /linkraft dreamroll status
Call `dreamroll_status`. Show progress without interrupting.

### /linkraft dreamroll stop
Call `dreamroll_stop`. Sets stop flag. Current variation finishes, then halts.

### /linkraft dreamroll gems
Call `dreamroll_gems`. List all gems with full genomes.

### /linkraft dreamroll report
Call `dreamroll_report`. Generate the morning report. Writes `.dreamroll/report.md`.

### /linkraft dreamroll overnight

**Handle this exactly like this, every time:**

1. Call `dreamroll_overnight` with `projectRoot`. The tool detects the OS and writes a restart loop script to the project root:
   - Windows → `dreamroll-loop.ps1`
   - Mac/Linux → `dreamroll-loop.sh` (auto chmod +x)
   The script self-locates via `$PSScriptRoot` or `cd "$(dirname "${BASH_SOURCE[0]}")"` so it runs `claude` from the project directory no matter where the user invokes it.

2. The tool returns a ready-to-paste `runCommand` plus the full script contents.

3. Present the response to the user with ZERO rewriting. The critical part is the "Run this in a NEW terminal window" block followed by the exact command. Do NOT explain how PowerShell works. Do NOT explain what `Start-Sleep` is. The user should see: one sentence, one command to paste, done.

4. Tell the user: "Open a new terminal and paste this. It will keep relaunching Claude until you Ctrl+C. You can close this Claude session as soon as the loop starts."

The loop is the closest thing to "dreamroll restarts itself" that Claude Code allows — a session can't outlive its context window, so the relaunch has to happen externally. The user never needs to know what PowerShell is. They run one command, paste what you tell them, and go to sleep.

### Contextual overnight hints

During a normal `/linkraft dreamroll` run, the `dreamroll_start` MCP tool will automatically surface an overnight hint block every few variations (every 5, starting after variation 3). When you see that block in the tool response, present it to the user alongside the next variation's prompt — don't hide it. That's how we communicate "your session is about to end, here's the zero-friction path to continuing overnight."

## MCP Tools

6 user-facing tools:

- `dreamroll_start` — multi-purpose: init, record-previous, return-next genome + judge prompts
- `dreamroll_status` — current state with top weights
- `dreamroll_stop` — set stop flag
- `dreamroll_gems` — list gems with full genomes
- `dreamroll_report` — generate morning report (writes .dreamroll/report.md)
- `dreamroll_overnight` — generate OS restart loop script so the run survives context-fill boundaries

The single `dreamroll_start` tool drives the entire generation loop. The skill calls it repeatedly, passing the previous variation's scores via the `completed` parameter on each call after the first.

## Output Structure

```
.dreamroll/
  state.json                live state, updated after every variation
  report.md                 morning report (generated on demand or session end)
  variations/
    variation_001.html      standalone, opens in any browser
    variation_002.html
    ...
```

## Evolution Engine

Every 5 variations, dreamroll analyzes gems and detects dominant patterns (parameter values appearing in >= 30% of gems). Those values get weight 2x in subsequent rolls. Mandatory chaos: at least 2 of every 5 variations IGNORE all weights and roll fully random, preventing convergence to one safe aesthetic.

Anti-bias measure: if average creeps above 8.0 across all variations, the system is likely biased and should be recalibrated.

## What Dreamroll Does NOT Do

- Does not use Playwright or take screenshots
- Does not call external APIs (no Anthropic key needed)
- Does not require any MCP servers beyond linkraft
- Does not modify your existing project files
- Does not need a running dev server
- Does not use git worktrees

## The Overnight Loop

Claude Code sessions can't outlive their context window — when it fills, the session ends. Something external has to relaunch Claude to keep dreamroll running. Dreamroll ships a zero-friction generator for that:

```
/linkraft dreamroll overnight
```

That calls `dreamroll_overnight`, which:
1. Detects the OS (Windows vs Mac/Linux)
2. Writes `dreamroll-loop.ps1` or `dreamroll-loop.sh` to the project root
3. Returns a single paste-ready command

The script self-locates via `$PSScriptRoot` (Windows) or `cd "$(dirname ...)"` (Unix) so it runs claude from the right directory regardless of where the user calls it from.

Example generated Unix script:

```bash
#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")"
while true; do
  claude -p "/linkraft dreamroll" --allowedTools 'Bash(*)' 'Read(*)' 'Write(*)' 'Edit(*)' 'Glob(*)' 'Grep(*)'
  sleep 10
done
```

The user runs it in a separate terminal. Each relaunched session reads `.dreamroll/state.json` and continues from the next variation. No maximum. Runs until Ctrl+C.

## Session ending gracefully

When `dreamroll_start` detects the run has accumulated variations (3+), its response automatically includes an overnight hint block. Present it to the user verbatim. It looks like:

```
Tip: you have N variations so far.
To keep dreamroll running after this session ends:

    /linkraft dreamroll overnight

That generates a restart loop script you paste into a separate
terminal. Each new session reads .dreamroll/state.json and continues
where the previous one left off. Leaves you to sleep. Stop with Ctrl+C.
```

Don't rewrite it. Don't explain it. Just show it.
