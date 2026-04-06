---
name: linkraft
description: One plugin. Three modes. Ship everything.
---

# /linkraft

The complete development lifecycle plugin.

## Modes

### /linkraft plan
Before you build. Research competitors, analyze tech stacks, generate architecture, create CLAUDE.md.

### /linkraft poke [url]
While you build. Click elements, apply design systems, browse components, generate designs overnight.

### /linkraft sheep
After you build. Auto-configuring QA agent that hunts bugs while you sleep.

## Poke Subcommands

- `/linkraft poke <url>` - Open preview with element selection
- `/linkraft forge browse` - Browse design presets
- `/linkraft forge apply <preset>` - Apply a design system
- `/linkraft forge tokens` - View/edit design tokens
- `/linkraft vault browse` - Browse community components
- `/linkraft vault search <query>` - Search components
- `/linkraft dreamroll start` - Begin overnight design generation
- `/linkraft launchpad plan` - Plan a landing page

## Quick Start

```
/linkraft plan claude-md     # Generate CLAUDE.md for your project
/linkraft poke localhost:3000 # Click elements, get full context
/linkraft sheep               # Auto-QA your codebase
```
