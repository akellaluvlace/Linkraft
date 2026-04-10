---
name: sheep
description: SheepCalledShip - autonomous QA operator. Scans, fixes, commits, narrates. Full KAIROS-style loop with deezeebalz99, Martha, and the Sheep narrator.
---

# SheepCalledShip: Autonomous QA Operator

## What This Does

An innocent sheep wanders into your codebase. Finds bugs. Fixes safe ones. Commits after each cycle. Writes a narrative field report with character commentary. Generates social media content from the results. Resumes from state on restart.

## The Loop

When user says "/linkraft sheep":

### Step 1: Initialize
Call `sheep_init`. This auto-detects the stack, generates a QA plan, creates .sheep/ with stats, story, and human-review files. If a running session exists, it resumes.

### Step 2: Get next target
Call `sheep_next`. Returns the next high-risk area with files to scan and instructions.

### Step 3: Analyze (YOU do this)
Read the listed files. Look for:
- Missing null/undefined checks
- Unhandled promise rejections (missing try/catch, no .catch())
- Missing error boundaries
- Type safety gaps (any types, missing validation)
- Security issues (unsanitized input, exposed secrets)
- Dead code, console.log statements
- Missing loading/error states
- Accessibility gaps

### Step 4: Categorize
For each finding, decide:

**FIX immediately** (safe, reversible):
- Missing null checks, unhandled rejections
- Missing try/catch wrappers
- Dead code, console.log cleanup
- Missing TypeScript types (removing `any`)
- Simple validation gaps
- Missing loading/error states (if straightforward)

**LOG for human** (risky, needs judgment):
- Architectural changes, database schema changes
- Breaking API changes
- Changes requiring env var changes
- Changes touching auth providers
- Significant behavior changes
- Performance optimizations requiring refactoring

### Step 5: Fix (YOU do this)
For each FIX item:
1. Edit the file to apply the fix
2. Run the build command (from auto-config)
3. If build fails: revert immediately, mark as LOG instead
4. Run the test command
5. If tests fail: revert, mark as LOG
6. If both pass: keep the fix

### Step 6: Commit (YOU do this)
If fixes were applied and build+tests pass:
```
git add [modified files]
git commit -m "[sheep] cycle N: description of fixes"
```
Rules: never push, never commit if build/tests fail, include cycle number.

### Step 7: Record
Call `sheep_record_cycle` with all the data: area, files scanned, bugs found (with severity, category, whether auto-fixed, why not fixed if logged), build/test status, commit hash.

The tool automatically:
- Updates stats.json with live numbers
- Writes the cycle to story.md with persona commentary
- Appends logged bugs to human-review.md
- Generates deezeebalz99 roast, Martha moment, sheep monologue

### Step 8: Repeat
Call `sheep_next` again. Keep going until it says all cycles are complete.

### Step 9: Complete
Call `sheep_complete` to generate content-pack.md and write the epilogue.

## Resume Behavior

If the session is interrupted (context window fills, crash, user stops):
- .sheep/stats.json has the exact state
- Next `/linkraft sheep` call detects the running session
- `sheep_init` resumes from the last completed cycle
- No work is repeated

### /linkraft sheep overnight

**Handle this exactly like this, every time:**

1. Call `sheep_overnight` with `projectRoot`. The tool detects the OS and writes a restart loop script to the project root:
   - Windows → `sheep-loop.ps1`
   - Mac/Linux → `sheep-loop.sh` (auto chmod +x)
   The script self-locates via `$PSScriptRoot` or `cd "$(dirname "${BASH_SOURCE[0]}")"` so `claude` runs from the project directory no matter where the user invokes it.

2. The tool returns a ready-to-paste `runCommand` plus the full script content.

3. Present the response to the user with ZERO rewriting. Critical: "Run this in a NEW terminal window" followed by the one command. Do not explain how PowerShell works. The user should see: one sentence, one command to paste, done.

4. Tell the user: "Open a new terminal and paste this. It will keep relaunching Claude until you Ctrl+C. You can close this Claude session once the loop is running."

Each relaunched session resumes from `.sheep/stats.json` at the next cycle — no work is repeated. The shame engine stays off. Stop with Ctrl+C.

Example generated Unix script:
```bash
#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")"
while true; do
  claude -p "/linkraft sheep" --allowedTools 'Bash(*)' 'Read(*)' 'Write(*)' 'Edit(*)' 'Glob(*)' 'Grep(*)'
  sleep 10
done
```

### Contextual overnight hints

During a normal `/linkraft sheep` run, the `sheep_next` MCP tool automatically surfaces an overnight hint block every 3 cycles (starting at cycle 4). When you see that block in the response, present it to the user alongside the next cycle instructions. Don't hide it. The user should see "you're on cycle 4, run this one command to keep going overnight".

## The Cast

**SheepCalledShip** (narrator): existential, dramatic. Narrates each cycle as a field report.
**deezeebalz99** (reviewer): Reddit mod, Arch user. 2-3 sentences of condescension per cycle.
**Martha** (tester): elderly lady, one finger. Reveals genuine UX problems through confusion.

## Available Tools

- `sheep_scan`: auto-detect stack, generate QA plan
- `sheep_init`: initialize or resume session
- `sheep_next`: get next area to test
- `sheep_record_cycle`: record cycle results (triggers persona commentary)
- `sheep_complete`: finalize session, generate content pack
- `sheep_status`: live stats
- `sheep_report`: full report with file locations
- `sheep_overnight`: generate OS restart loop script so the run survives context-fill boundaries

## Output Files

All in .sheep/:
- QA_PLAN.md: auto-generated test plan
- stats.json: live statistics (updated every cycle)
- story.md: narrative field report with persona commentary
- human-review.md: bugs that need human attention
- content-pack.md: LinkedIn post, Twitter thread, best moments (at session end)
