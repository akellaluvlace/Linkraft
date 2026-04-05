---
name: dreamroll
description: Overnight autonomous design generation with AI judges
---

# /dreamroll

Run autonomous design generation with three AI judges.

## Subcommands

### /dreamroll start --pages [N] --base [file] --hours [N]
Start a Dreamroll session. Generates N variations of the base page over the specified time budget.

### /dreamroll status
Show current progress: variations generated, gems found, time elapsed.

### /dreamroll stop
Gracefully stop after the current variation completes.

### /dreamroll gems
List all gems (high-scoring variations) with scores and metadata.

### /dreamroll report
Generate the full morning report: top gems, patterns, wildcard discoveries, statistics.

### /dreamroll resume
Continue a previously interrupted Dreamroll run from the last saved state.
