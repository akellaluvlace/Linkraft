---
name: forge
description: Browse, preview, and apply design system presets to any project. Transform generic Tailwind UIs into distinctive, opinionated designs in one step.
---

# Forge: Design System Browser & Applicator

## What This Does

Forge applies curated design systems to your project. Instead of tweaking individual classes, you select a preset (Neo Brutalism, Glassmorphism, Minimalist Swiss, etc.) and Forge transforms your entire codebase to match.

## Available Tools

- `forge_list_presets`: list all available design presets
- `forge_get_preset`: get full details of a specific preset
- `forge_apply_preset`: generate a changeset for applying a preset
- `forge_get_tokens`: read the current project's design tokens from tailwind.config
- `forge_set_tokens`: update a specific design token
- `forge_check_violations`: scan files for forbidden pattern violations

## When User Says "Apply [preset name]"

1. Call `forge_get_preset` with the preset id
2. Call `forge_apply_preset` with the preset and project files
3. Review the changeset:
   - Update tailwind.config with new token values
   - Replace component classes according to componentOverrides
   - Remove any forbidden pattern violations
   - Install required fonts
4. Apply changes file by file, starting with tailwind.config
5. After all changes, call `forge_check_violations` to verify no forbidden patterns remain

## When User Says "Show My Tokens"

1. Call `forge_get_tokens` to read the current tailwind.config
2. Present tokens in a readable format:
   - Colors with hex values
   - Font families and weights
   - Spacing scale
   - Border radius and width
   - Shadow values

## When User Says "Change [token] to [value]"

1. Call `forge_set_tokens` with the section, key, and new value
2. Confirm the change was applied

## Anti-Slop Rules

Every preset defines `forbiddenPatterns`: classes and patterns that violate the design system. Before generating ANY code while a preset is active:

1. Check the active preset's forbiddenPatterns
2. Never use any class that matches a forbidden pattern
3. Always use componentOverrides from the active preset for matching elements
4. When in doubt, use the preset's token values, not default Tailwind classes

### Common Violations to Avoid

- Neo Brutalism: no rounded corners (rounded-lg, rounded-xl), no gradients, no soft shadows
- Glassmorphism: no hard borders (border-3), no offset shadows, no sharp corners
- Minimalist Swiss: no decorative elements, no gradients, no blur, no italic text

## Browsing Presets

When user says "browse presets" or "/forge browse":

1. Call `forge_list_presets`
2. Present each preset with name, description, and key visual characteristics
3. Group by style category if helpful

## Design Token Format

Tokens follow a consistent structure across all presets:
- `colors`: primary, secondary, background, accent, surface (+ custom)
- `typography`: heading, body, mono (each with family, weight, optional transform)
- `spacing`: unit base + numeric scale
- `borders`: width, style, color, radius
- `shadows`: default, hover
- `animations`: style, hover
