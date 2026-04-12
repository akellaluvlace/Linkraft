---
name: dreamroll
description: Overnight autonomous design generator. Rolls 10 parameters per variation, generates standalone HTML, scores with 3 judges. Runs until stopped.
---

# /linkraft dreamroll

Overnight landing page variation generator.

## Subcommands

### /linkraft dreamroll
Start or resume the generation loop. Runs continuously until stopped.

### /linkraft dreamroll --brief "product description"
Start with an explicit brief for content generation. Otherwise auto-detects from package.json.

### /linkraft dreamroll --brief "..." --reference "linear.app, stripe.com, vercel.com"
Start with reference URLs. Before calling `dreamroll_start`, use `web_fetch` to scrape each URL. For each site, extract: colors (hex values for bg, text, accent), font families, border-radius values, shadow style (none/subtle/medium/dramatic), layout pattern (single-column, split, bento, etc.), and overall mood (1-3 words). Pass the extracted data as the `references` parameter to `dreamroll_start`. The data is saved to `.dreamroll/references.json`, injected into every variation's prompt, and used to bias evolution weights. References persist across sessions.

### /linkraft dreamroll --brief "..." --style-note "dark mode, minimal, big bold typography"
Start with a plain-text style constraint. The note is injected directly into the generation prompt. Simpler than --reference (no scraping). If the genome conflicts with the style note, the note wins. Pass as the `styleNote` parameter to `dreamroll_start`. Persists across the session.

Both --reference and --style-note are optional and combinable. Without them, dreamroll uses pure genome randomness.

### /linkraft dreamroll status
Show progress: variations generated, gems found, elapsed time.

### /linkraft dreamroll stop
Set stop flag. Current variation finishes, then the loop halts gracefully.

### /linkraft dreamroll gems
List all gems (variations with avg score >= 7 or any 10).

### /linkraft dreamroll report
Generate the morning report: top 5 gems, patterns, wildcard discoveries.

### /linkraft dreamroll overnight
Generate an OS-appropriate restart loop script (.ps1 on Windows, .sh on Mac/Linux) into `.dreamroll/` so the run can survive context-fill boundaries. Prints exact run instructions for a separate terminal.

### /linkraft dreamroll like [variationId]
Mark a variation as a favorite. Every dimension value in the liked genome gets a 3x weight multiplier on top of evolution weights, so future rolls bias toward what you actually want. Calls `dreamroll_like`.

### /linkraft dreamroll hate [variationId]
Mark a variation as bad. Every dimension value gets a 0.25x multiplier so future rolls steer away from it. Calls `dreamroll_hate`.

### /linkraft dreamroll breed [parentA] [parentB]
Cross two existing variations into 3 child genomes by alternating dimensions and rolling a fresh mutation per child. Children are queued and consumed by the next 3 variations in the loop. Calls `dreamroll_breed`.
