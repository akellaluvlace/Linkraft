# PokingIsNewCoding V2 — CLAUDE.md

## What This Is

PokingIsNewCoding is a Claude Code plugin that turns VS Code into a visual design studio. Five pillars:

1. **Poke** (V1, BUILT): click any element, Claude gets full context
2. **Forge**: browse, preview, and apply design systems and component libraries instantly
3. **Vault**: community component library (save, share, remix, compete)
4. **Dreamroll**: overnight autonomous design generation with AI judges
5. **Launchpad**: plan, research, build, test, and distribute landing pages end-to-end

**MCPancake Mix** is the underlying MCP orchestration layer that composes shadcn, Figma, Context7, Magic UI, Playwright, and Linkraft MCPs into unified workflows.

**Owner:** Akella inMotion (Nikita), Dublin
**License:** MIT
**Repo:** akellainmotion/poking-is-new-coding
**Parent project:** Linkraft

## Current State

V1 (Poke) is built and passing tests. Code review found 5 critical issues and 7 important issues that must be fixed before V2 work begins. See BUILD_PLAN.md Phase 0.

## Tech Stack

- TypeScript (strict mode)
- VS Code Extension API (webview, commands, messaging)
- @modelcontextprotocol/sdk for MCP server
- Vanilla TS for inspector overlay (zero deps, Shadow DOM isolated)
- Webpack for bundling (overlay + extension separate)
- React DevTools fiber protocol + Babel plugin for source resolution
- Playwright for screenshots (Dreamroll)
- Git worktrees for isolation (Dreamroll)

## Repo Structure (V2)

```
poking-is-new-coding/
|-- .claude-plugin/
|   |-- plugin.json
|-- skills/
|   |-- poking/SKILL.md
|   |-- forge/SKILL.md
|   |-- dreamroll/SKILL.md
|   |-- launchpad/SKILL.md
|-- agents/
|   |-- forge-applicator.md
|   |-- dreamroll-generator.md
|   |-- dreamroll-brutus.md
|   |-- dreamroll-venus.md
|   |-- dreamroll-mercury.md
|   |-- launchpad-planner.md
|   |-- launchpad-distributor.md
|-- commands/
|   |-- poke.md
|   |-- forge.md
|   |-- vault.md
|   |-- dreamroll.md
|   |-- launchpad.md
|-- src/
|   |-- extension/              # VS Code extension (V1, exists)
|   |   |-- activate.ts
|   |   |-- preview-panel.ts
|   |   |-- bridge.ts
|   |   |-- commands.ts
|   |-- overlay/                # Inspector overlay (V1, exists)
|   |-- resolver/               # Source resolution (V1, exists)
|   |-- mcp/
|   |   |-- server.ts           # MCP server (V1, exists, extend for V2)
|   |   |-- tools/
|   |   |   |-- poke-tools.ts   # V1, exists
|   |   |   |-- forge-tools.ts  # V2 new
|   |   |   |-- vault-tools.ts  # V2 new
|   |   |   |-- dreamroll-tools.ts  # V2 new
|   |   |   |-- launchpad-tools.ts  # V2 new
|   |   |   |-- mcpancake.ts    # V2 new: MCP router
|   |-- forge/
|   |   |-- presets/            # Built-in design preset JSONs
|   |   |-- preset-applicator.ts
|   |   |-- token-editor.ts
|   |   |-- anti-slop.ts
|   |   |-- component-browser.ts
|   |-- vault/
|   |   |-- vault-client.ts
|   |   |-- component-packager.ts
|   |   |-- competition.ts
|   |-- dreamroll/
|   |   |-- generator.ts
|   |   |-- judges.ts
|   |   |-- wildcards.ts
|   |   |-- evolution.ts
|   |   |-- state.ts
|   |   |-- reporter.ts
|   |-- launchpad/
|   |   |-- planner.ts
|   |   |-- builder.ts
|   |   |-- tester.ts
|   |   |-- distributor.ts
|   |-- babel-plugin/           # V1, exists
|   |-- shared/
|       |-- types.ts            # V1 exists, extend for V2
|       |-- format.ts           # V1 exists
|       |-- mcpancake-router.ts # V2 new
|-- presets/                    # Built-in design system presets
|   |-- neo-brutalism.json
|   |-- glassmorphism.json
|   |-- minimalist-swiss.json
|   |-- retro-terminal.json
|   |-- soft-pastel.json
|   |-- dark-luxe.json
|   |-- newspaper.json
|   |-- y2k.json
|   |-- organic-earth.json
|   |-- corporate-clean.json
|-- hooks/
|-- tests/
|-- package.json
|-- tsconfig.json
|-- webpack.config.js
|-- README.md
|-- SETUP.md
|-- LICENSE
```

## Design Preset Format

Every preset is a JSON file in `/presets/` with:
- `name`, `id`, `author`, `description`
- `tokens`: colors, typography, spacing, borders, shadows, animations
- `componentOverrides`: Tailwind class strings per component type
- `forbiddenPatterns`: classes/patterns the AI must never use with this preset
- `requiredFonts`: fonts to install
- `shadcnTheme`: matching shadcn theme name if applicable

See SecretWeapon-V2-SPEC.md section 3.3 for full schema.

## Dreamroll Judge System

Three judges with extreme personalities:
- **BRUTUS**: ruthless minimalist. Scores clarity, simplicity, signal-to-noise.
- **VENUS**: obsessive aesthete. Scores beauty, harmony, surprise, emotion.
- **MERCURY**: conversion machine. Scores CTA visibility, hierarchy, trust signals.

Full judge prompts in SecretWeapon-V2-SPEC.md section 5.6.

Scoring: 1-10 per judge. Average >= 7 = gem. Average >= 5 = iterate. < 5 = discard. Any single 10 = instant keep.

## Coding Standards

- TypeScript strict mode, no `any`
- Overlay: zero-dependency vanilla TS, Shadow DOM, never touch host DOM
- MCP tools: clear descriptions optimized for LLM consumption, JSON schema with examples
- Design presets: validated against a schema before use
- Agent prompts (judges, planners): stored as .md files in agents/, not hardcoded
- No console.log in production (stderr only for MCP)
- No hardcoded credentials anywhere
- Validate postMessage origins (fix from code review)
- Never embed tokens in URLs (fix from code review)
- Token storage must validate on load (fix from code review)

## Build Order Reference

Phase 0: Fix V1 criticals (code review findings)
Phase 1: Forge Foundation (presets, applicator, token editor, anti-slop)
Phase 2: Forge Full (component browser, MCPancake router, MCP integrations)
Phase 3: Vault (GitHub-based library, packager, competition system)
Phase 4: Dreamroll (generator loop, judges, wildcards, evolution, reporter)
Phase 5: Launchpad (planner, builder, tester, distributor)
Phase 6: Polish (docs, demo, marketplace submission)

## What NOT To Do

- Never skip Phase 0. Criticals must be fixed before new features.
- Never hardcode judge personalities in code. They live in agents/*.md files.
- Never make MCPancake depend on any single MCP being available. Everything optional with graceful fallback.
- Never generate design output without checking it against the active preset's forbiddenPatterns.
- Never store Dreamroll variations on disk without git worktree isolation.
- Never send innerHTML to Claude (code review finding #12).
- Never use '*' as postMessage targetOrigin (code review finding #13).
- Never write to Vault without validating component structure first.
