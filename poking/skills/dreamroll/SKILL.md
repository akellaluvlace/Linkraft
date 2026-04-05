---
name: dreamroll
description: Overnight autonomous design generation. Claude generates wildly different landing page variations, three AI judges score them, evolution refines the search.
---

# Dreamroll: Autonomous Design Generation

## What This Does

Dreamroll is a design casino. You set a target number of variations and a time budget. Claude generates landing page designs with random parameters, three AI judges (BRUTUS, VENUS, MERCURY) score each one, and evolution refines the search over time. By morning, you have a collection of gems and a report of discoveries.

## The Three Judges

- **BRUTUS**: Ruthless minimalist. Hates decoration. Every pixel must earn its place.
- **VENUS**: Obsessive aesthete. Lives for beauty, harmony, and emotional impact.
- **MERCURY**: Conversion machine. Only cares about CTAs, social proof, and click-through rates.

## Scoring

- 1-10 per judge
- Average >= 7: GEM (saved)
- Average >= 5: ITERATE (improve based on feedback)
- Average < 5: DISCARD
- Any single 10: INSTANT KEEP regardless of others

## How To Use

### Starting a Run
When user says "/dreamroll start":
1. Confirm parameters (base page, target count, time budget)
2. State is saved to `.dreamroll/state.json` after every variation
3. Run is resumable if interrupted

### Checking Progress
Use `dreamroll_status` to show current progress.
Use `dreamroll_gems` to list all high-scoring variations.

### Morning Report
Use `dreamroll_report` for the full summary including:
- Top gems with scores and judge comments
- Emerging patterns (which layouts/genres/moods score highest)
- Wildcard discoveries (which creative constraints produced gems)
- Full statistics

### Resuming
Dreamroll automatically resumes from `.dreamroll/state.json` if a previous run was interrupted.

## Available Tools

- `dreamroll_status`: current run progress
- `dreamroll_gems`: list all gems with scores
- `dreamroll_report`: full morning report
