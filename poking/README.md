# Linkraft

One plugin. Three modes. Ship everything.

```
/linkraft plan     -> before you build (research, CLAUDE.md, architecture)
/linkraft poke     -> while you build (click elements, design systems, components)
/linkraft sheep    -> after you build (autonomous QA, overnight bug hunting)
```

## Install

```bash
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft/poking
npm install
npm run build
```

Add to your project's `.mcp.json`:
```json
{
  "mcpServers": {
    "linkraft": {
      "command": "node",
      "args": ["/absolute/path/to/Linkraft/poking/dist/mcp/server.js"]
    }
  }
}
```

Restart Claude Code. Done.

## /linkraft plan

Before you build. Scans your project and generates a CLAUDE.md that actually knows your stack.

```
/linkraft plan claude-md    # Generate CLAUDE.md from existing code
/linkraft plan stack        # Analyze tech stack and conventions
/linkraft plan              # Full planning flow with research
```

Detects: 15+ frameworks, styling, database, auth, testing, deployment, coding conventions (indentation, quotes, semicolons, state management). Zero external dependencies.

## /linkraft poke

While you build. Click any element, Claude gets full context.

```
/linkraft poke http://localhost:3000   # Start visual inspection
```

On first run, Linkraft detects your framework (Vite, Next.js, etc.) and offers to add the overlay automatically. One line in your dev config. Or use the bookmarklet fallback for any framework.

### Forge: Design Systems

```
/linkraft forge browse          # 10 built-in presets
/linkraft forge apply neo-brutalism   # Transform your project
/linkraft forge tokens          # Visual token editor
```

Presets: Neo Brutalism, Glassmorphism, Minimalist Swiss, Retro Terminal, Soft Pastel, Dark Luxe, Newspaper, Y2K, Organic Earth, Corporate Clean.

### Vault: Component Library

```
/linkraft vault browse          # 10+ community components
/linkraft vault search hero     # Search by keyword
/linkraft vault install hero-split   # Install into project
```

Works offline with bundled components. Online: reads from [poking-vault](https://github.com/akellaluvlace/poking-vault).

### Dreamroll: Overnight Design Generation

```
/linkraft dreamroll start       # Begin autonomous generation
/linkraft dreamroll report      # Morning report with top gems
```

Three AI judges (BRUTUS the minimalist, VENUS the aesthete, MERCURY the conversion machine) score every variation. 63 wildcard mutations force creative divergence. No separate API key needed: judges use Claude's own context.

### Launchpad: Landing Page Pipeline

```
/linkraft launchpad plan        # Brief, copy, wireframe, SEO
/linkraft launchpad test        # Quality checks
/linkraft launchpad distribute  # Social media drafts
```

## /linkraft sheep

After you build. Auto-configuring QA that hunts bugs while you sleep.

```
/linkraft sheep                 # Auto-configure and start hunting
/linkraft sheep report          # Session report with stats
/linkraft sheep content         # Social media content from results
```

Zero config. Reads your package.json, detects the stack, finds build/test commands, identifies high-risk areas, generates a QA plan, and starts hunting.

The cast:
- **SheepCalledShip**: the narrator. Existential. Dramatic. Finds bugs.
- **deezeebalz99**: code reviewer. Reddit mod energy. Suggests rewriting in Rust.
- **Martha**: beta tester. Sweet elderly lady. Tests with one finger. Finds real UX problems.

## Zero-Friction Doctrine

Every feature works with zero config on first run. If something is unavailable (offline, no CLI tool, no MCP), Linkraft degrades gracefully with a clear message and a useful fallback. Never returns empty. Never returns null silently.

## MCP Tools

40+ tools across three modes. Full list: `plan_analyze_stack`, `plan_generate_claude_md`, `poke_setup`, `poke_bookmarklet`, `forge_list_presets`, `forge_apply_preset`, `forge_get_tokens`, `forge_check_violations`, `vault_browse`, `vault_search`, `vault_install`, `dreamroll_judge`, `dreamroll_record_verdict`, `dreamroll_status`, `dreamroll_gems`, `dreamroll_report`, `launchpad_plan`, `launchpad_test`, `launchpad_distribute`, `sheep_scan`, `sheep_init`, `sheep_status`, `sheep_report`, and more.

## Numbers

- 265 tests across 25 test files
- 10 design presets
- 63 wildcard mutations
- 10 bundled vault components
- 5 agent personalities
- 6 skills, 7 commands

## License

MIT

## Author

[Akella inMotion](https://www.akellainmotion.com/legacy) (Nikita), Dublin
