---
name: forge
description: Design system browser and applicator
---

# /forge

Apply design systems and manage design tokens.

## Subcommands

### /forge browse
List all available design presets with descriptions and key characteristics.

### /forge apply [preset-id]
Apply a design preset to the current project. Generates a changeset covering tailwind.config updates, component class replacements, and forbidden pattern cleanup.

### /forge tokens
Display the current project's design tokens extracted from tailwind.config: colors, fonts, spacing, borders, shadows.

### /forge check
Scan project files for violations of the active preset's forbidden patterns. Reports file, line, pattern, and suggested fix.

### /forge components
Search for components across available MCP sources (shadcn, Magic UI, Vault). Requires MCPancake router (Phase 2).
