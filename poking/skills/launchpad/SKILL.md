---
name: launchpad
description: End-to-end landing page pipeline. Plan research, generate copy, build page, test quality, create distribution drafts.
---

# Launchpad: Landing Page Pipeline

## What This Does

Launchpad takes you from product idea to published landing page with distribution content. Five phases: Plan, Build, Test, Distribute, Launch.

## The Pipeline

### Phase 1: Plan
When user says "build me a landing page for X":
1. Call `launchpad_plan` with product details
2. Review generated files in .launchpad/:
   - brief.md: product summary, audience, value prop
   - wireframe.json: section structure
   - copy.json: headlines, features, testimonials, CTAs
   - seo.json: meta tags, OG tags, schema markup

### Phase 2: Build
1. Read the planning files
2. Select a Forge preset (user-chosen or auto-selected)
3. Use MCPancake to find and install components
4. Build the full page from wireframe + copy + preset

### Phase 3: Test
1. Call `launchpad_test` with the dev server URL
2. Review results: Lighthouse scores, responsive screenshots, CTA visibility
3. Fix any issues found

### Phase 4: Distribute
1. Call `launchpad_distribute` to generate drafts
2. Drafts saved to .launchpad/distribution/
3. Present drafts to user for review and editing
4. Drafts are NOT posted automatically

### Phase 5: Launch
User reviews everything and publishes manually.

## Available Tools

- `launchpad_plan`: generate planning documents
- `launchpad_test`: run quality checks
- `launchpad_distribute`: generate distribution drafts
- `launchpad_status`: check pipeline progress
