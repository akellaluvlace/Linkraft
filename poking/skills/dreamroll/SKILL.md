---
name: dreamroll
description: Overnight autonomous design generator. Rolls 10 random parameters per variation, generates standalone HTML, scores with 3 judges, evolves toward gems. Runs until stopped.
---

# Dreamroll: Overnight Design Generator

## What This Is

Dreamroll generates standalone HTML landing page variations overnight. Each variation rolls 10 random design parameters (style, palette, typography, layout, density, mood, era, animation, imagery, wildcard constraint), generates a self-contained HTML file, and scores it with three judge personas. Every 5 variations, it detects patterns in gems and biases future rolls toward winning parameter combinations.

Zero config. Zero external dependencies. No API keys. No Playwright. No screenshots. Just HTML files on disk that you open in a browser.

## Never Stop Rule

**Dreamroll does NOT stop after one variation.** It generates, scores, saves, and immediately starts the next variation. No pauses. No confirmation prompts.

The agent stops only when:
1. Context window fills (restart loop handles this — state.json is read on next boot)
2. User runs `/linkraft dreamroll stop` (stop flag set in state)
3. Disk is full (can't write HTML files)

On every boot: read `.dreamroll/state.json`. If it exists and is valid, continue from the last variation + 1. If corrupted, rename to `state.json.corrupted` and start fresh. If missing, start from variation 001.

## /linkraft dreamroll — Full Execution Flow

When the user says `/linkraft dreamroll`, execute this loop continuously until stopped.

### Step 1: Initialize or resume

Call `dreamroll_start` with `projectRoot`. Pass `brief` if the user provided one via `--brief`, otherwise the tool auto-detects from package.json/README.

The tool returns either INITIALIZED (fresh session) or RESUMED (existing running session continuing). Note the brief. Reset stopRequested flag.

### Step 2: Loop forever

Repeat until stop flag or context runs out:

**2a. Get next variation parameters**

Call `dreamroll_next` with `projectRoot`. Returns:
- Variation number (e.g., 7)
- Output path (e.g., `.dreamroll/variations/variation_007.html`)
- Brief for content generation
- 10 rolled parameters (style, palette, typography, layout, density, mood, era, animation, imagery, wildcard)

If `dreamroll_next` returns "Stop requested", exit the loop.

**2b. Generate the HTML file**

Write a single standalone HTML file to the output path. Requirements:
- Complete valid HTML5 document
- All CSS inline in a `<style>` tag. No external stylesheets. No CDN imports. No framework.
- Opens directly in any browser
- HTML comment at the top documenting all 10 parameters (used for grep/compare)
- Real content about the product from the brief (not lorem ipsum)
- Clear CTA in the first viewport
- The design must visibly reflect all 10 rolled parameters

HTML comment template:
```html
<!--
  DREAMROLL VARIATION #NNN
  Style: {genre}
  Palette: {colorPalette}
  Typography: {typography}
  Layout: {layoutArchetype}
  Density: {density}
  Mood: {mood}
  Era: {era}
  Animation: {animation}
  Imagery: {imagery}
  Wildcard: {wildcard}
  Brief: {brief}
-->
```

**2c. Judge the variation**

Call `dreamroll_judge` with:
- `variationDescription`: the HTML file path plus a short summary of the design choices
- `pluginRoot`: the linkraft plugin root (contains `agents/dreamroll-*.md`)

Returns three evaluation prompts, one per judge. Read each prompt and adopt the persona to score the HTML you just wrote.

The three judges:
- **BRUTUS** (clarity, 1-10): Ruthless minimalist. Cares only about communication efficiency. Can you understand what it sells in 3 seconds? Is the CTA obvious? Is there visual noise? Is the hierarchy clear?
- **VENUS** (aesthetics, 1-10): Obsessive aesthete. Cares about beauty and craft. Is the palette harmonious? Is typography considered? Is there visual rhythm? Is there one moment of delight?
- **MERCURY** (conversion, 1-10): Conversion machine. Cares whether this page would make money. Is the value prop clear? Is the CTA visually dominant? Are trust signals present? Does the page flow toward the CTA?

Score each 1-10. Write a 1-2 sentence comment per judge. Be honest. Score harshly.

**2d. Record the verdict**

Call `dreamroll_record_verdict` with:
- `projectRoot`
- `variationId` (from step 2a)
- `filePath` (the HTML file you wrote)
- `scores`: array of 3 objects `{ judge, score, comment }`

The tool calculates the average and assigns a verdict:
- `gem`: avg >= 7 OR any single score of 10
- `iterate`: avg >= 5
- `discard`: avg < 5

Every 5 variations, evolution detects patterns in gems and adjusts weights. You don't need to do anything — the roller uses weighted selection automatically on the next `dreamroll_next` call.

**2e. Loop**

Go back to step 2a. Immediately. No confirmation. No pause.

### Step 3: Context fills

When your context runs low, the session naturally ends. State persists in `.dreamroll/state.json`. The restart loop starts a new session, calls `dreamroll_start` (which detects the running session and resumes), and continues from the next variation.

## Subcommands

### /linkraft dreamroll
Start or resume the overnight loop. Runs until stopped.

### /linkraft dreamroll --brief "product description"
Same but with an explicit brief for content generation.

### /linkraft dreamroll status
Call `dreamroll_status`. Show progress without interrupting.

### /linkraft dreamroll stop
Call `dreamroll_stop`. Sets stop flag. The current variation finishes, then the loop exits gracefully.

### /linkraft dreamroll gems
Call `dreamroll_gems`. List all gems with scores and parameters.

### /linkraft dreamroll report
Call `dreamroll_report`. Generate the morning report: top 5 gems, patterns detected, wildcard discoveries, recommendation.

## MCP Tools

8 tools total:
- `dreamroll_start` — init or resume a session
- `dreamroll_next` — roll and return next variation parameters (skill calls in loop)
- `dreamroll_judge` — get judge evaluation prompts for Claude to score in-context
- `dreamroll_record_verdict` — save scores, run evolution, update gems list
- `dreamroll_stop` — set stop flag (graceful)
- `dreamroll_status` — show current state
- `dreamroll_gems` — list all gems
- `dreamroll_report` — generate morning report

## The 10 Parameter Pools

Each variation rolls one value from each. See `src/dreamroll/params.ts` for the full lists.

1. **STYLE** (14 values): glassmorphism, neo-brutalism, minimalist-swiss, retro-terminal, soft-pastel, dark-luxe, newspaper, y2k, organic-earth, corporate-clean, vaporwave, art-deco, memphis, scandinavian
2. **PALETTE** (10 values): monochrome, complementary, analogous, triadic, split-complementary, earth-tones, neon-on-dark, pastels, jewel-tones, black-plus-one-accent
3. **TYPOGRAPHY** (8 values): serif-classic, geometric-sans, mono-terminal, display-chunky, handwritten, slab-serif, thin-elegant, mixed-serif-sans
4. **LAYOUT** (9 values): single-column-hero, split-50-50, asymmetric-grid, full-bleed-sections, card-grid, sidebar, stacked-blocks, overlapping-layers, z-pattern
5. **DENSITY** (5 values): ultra-minimal, sparse, balanced, information-rich, dense
6. **MOOD** (10 values): corporate-trust, playful, premium-luxury, raw-authentic, techy-hacker, warm-friendly, cold-clinical, mysterious, energetic, calm
7. **ERA** (9 values): 1920s-art-deco, 1960s-psychedelic, 1970s-warm, 1980s-neon, 1990s-grunge, 2000s-web2, 2010s-flat, 2020s-modern, far-future
8. **ANIMATION** (6 values): none, subtle-fade, moderate-scroll-reveals, bold-parallax, kinetic-moving, micro-interactions-only
9. **IMAGERY** (7 values): no-images-pure-type, geometric-shapes, gradients-only, illustrated-icons, photo-placeholders, single-hero-image, abstract-patterns
10. **WILDCARD** (30 values): one-font-only, no-borders, all-rounded, all-sharp-corners, max-3-colors, dark-mode-only, brutally-honest-copy, all-uppercase, and many more

## Evolution

Every 5 variations, dreamroll analyzes gems and detects dominant patterns (parameter values that appear in >= 30% of gems). Those values get weighted 2x in subsequent rolls. Mandatory chaos: at least 2 of every 5 variations ignore weights entirely, preventing the generator from getting stuck on one direction.

## What Dreamroll Does NOT Do

- Does not use Playwright or take screenshots
- Does not call external APIs (no separate Anthropic key)
- Does not require any MCP servers
- Does not modify your existing project files
- Does not need a running dev server
- Does not use git worktrees

## The Overnight Loop

```powershell
while ($true) {
  claude -p "/linkraft dreamroll --brief 'your product description'" --plugin-dir C:\path\to\linkraft\poking --allowedTools 'Bash(*)' 'Read(*)' 'Write(*)' 'Edit(*)' 'Glob(*)' 'Grep(*)'
  Start-Sleep -Seconds 10
}
```
