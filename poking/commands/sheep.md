---
name: sheep
description: Auto-configuring autonomous QA agent. Scans your codebase, generates a QA plan, hunts bugs.
---

# /linkraft sheep

SheepCalledShip: autonomous QA that configures itself.

## Subcommands

### /linkraft sheep
Auto-configure and start hunting. Reads your project, generates a QA plan, runs cycles.

### /linkraft sheep plan
Generate the QA plan without running. Review .sheep/QA_PLAN.md first.

### /linkraft sheep status
Check progress: cycles completed, bugs found/fixed, areas tested.

### /linkraft sheep report
Full session report with narrative highlights and content pack.

### /linkraft sheep resume
Continue a previous session from .sheep/stats.json.

### /linkraft sheep content
Generate social media content from the session results.

### /linkraft sheep overnight
Generate an OS-appropriate restart loop script (.ps1 on Windows, .sh on Mac/Linux) into `.sheep/` so the QA run can survive context-fill boundaries. Prints exact run instructions for a separate terminal.
