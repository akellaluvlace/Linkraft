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

## How Judging Works (Zero API Key)

The judges use Claude itself. No separate Anthropic API key needed.

For each variation:
1. Call `dreamroll_judge` with the variation description and plugin root
2. The tool returns evaluation prompts with each judge's personality loaded
3. YOU (Claude) evaluate the variation as each judge, staying in character
4. Call `dreamroll_record_verdict` with the three scores and comments
5. The verdict is recorded to state and the loop continues

This works because you ARE Claude. You adopt each judge personality and score honestly. The judge prompts in agents/dreamroll-*.md give you the personality, scoring criteria, and roast style.

**In headless/automated mode** (overnight cron): the system uses self-evaluation with mock scores. The morning report notes this. Interactive runs produce real judging.

## The Generation Loop

For each variation:
1. Roll random seed parameters (color, typography, layout, genre, density, mood)
2. Select a random wildcard mutation from the 63 available
3. Generate the variation
4. Judge it (call dreamroll_judge, evaluate, call dreamroll_record_verdict)
5. If gem: save to .dreamroll/gems/
6. Every 10 variations: evolution analyzes gems, adjusts parameters
7. Save state after every variation (resumable)

## Available Tools

- `dreamroll_judge`: get judge evaluation prompts for a variation (YOU evaluate)
- `dreamroll_record_verdict`: record scores after judging
- `dreamroll_status`: current run progress
- `dreamroll_gems`: list all gems with scores
- `dreamroll_report`: full morning report

## Resuming

Dreamroll automatically resumes from `.dreamroll/state.json` if a previous run was interrupted.
