# Linkraft — CLAUDE.md

## What This Is

Linkraft is an open-source toolkit that connects Claude Code to any service. Three components: a Generator CLI (creates MCP servers from API specs), pre-built Packs (ready-to-install integrations for LinkedIn, Instagram, Twitter/X, Gmail, Notion, Telegram, Discord, and more), and a Claude Code Plugin Marketplace for distribution.

**Owner:** Akella inMotion (Nikita), Dublin
**License:** MIT
**Repo:** akellaluvlace/Linkraft
**Landing page:** https://www.akellainmotion.com/legacy

## Tech Stack

- TypeScript (strict mode), Node.js >= 18
- `@modelcontextprotocol/sdk` for all MCP servers
- OAuth 2.0 (PKCE) for auth flows
- stdio transport (local) + Streamable HTTP (remote)
- npm package: `linkraft`
- ESLint + Prettier, conventional commits

## Repo Structure

```
linkraft/
|-- generator/              # CLI tool
|   |-- src/
|   |   |-- cli.ts          # Entry point, commander setup
|   |   |-- commands/       # generate, validate, test, publish
|   |   |-- parsers/        # openapi, swagger, manual-config
|   |   |-- codegen/        # template engine, server gen, plugin gen
|   |   |-- templates/      # Handlebars/EJS templates for generated code
|   |-- bin/
|   |-- package.json
|   |-- tsconfig.json
|
|-- core/                   # Shared modules used by all packs
|   |-- src/
|   |   |-- auth/
|   |   |   |-- oauth2.ts
|   |   |   |-- api-key.ts
|   |   |   |-- token-store.ts
|   |   |-- rate-limiter.ts
|   |   |-- error-handler.ts
|   |   |-- config.ts
|   |   |-- http-client.ts
|   |-- package.json
|   |-- tsconfig.json
|
|-- packs/                  # Pre-built plugin packs
|   |-- telegram/           # Tier 1 (simplest, build first)
|   |-- discord/
|   |-- twitter-x/
|   |-- linkedin/
|   |-- instagram/
|   |-- gmail/
|   |-- notion/
|   |-- slack/
|   |-- google-calendar/
|   |-- google-sheets/
|   |-- (more...)
|
|-- marketplace.json        # Claude Code marketplace manifest
|-- .claude-plugin/
|   |-- plugin.json         # Root plugin metadata
|
|-- landing/                # Static landing page
|-- docs/                   # Documentation
|-- tests/                  # Integration tests
|-- SPEC.md                 # Full product specification
|-- CLAUDE.md               # This file
|-- README.md
|-- LICENSE
|-- CONTRIBUTING.md
|-- package.json            # Root workspace
|-- tsconfig.base.json
|-- .eslintrc.json
|-- .prettierrc
```

## Pack Structure (every pack follows this)

```
packs/{name}/
|-- .claude-plugin/
|   |-- plugin.json
|-- skills/
|   |-- {name}/
|       |-- SKILL.md
|-- agents/                 # Optional sub-agents
|-- .mcp.json               # MCP server registration
|-- src/
|   |-- server.ts           # Main MCP server entry
|   |-- tools/              # One file per tool group
|   |-- auth/               # Pack-specific auth (extends core)
|-- mcpkit.config.json      # User config
|-- config.example.json
|-- package.json
|-- tsconfig.json
|-- README.md
|-- SETUP.md                # Auth setup guide
|-- tests/
|   |-- health.test.ts
|   |-- tools.test.ts
```

## Tool Naming Convention

All tools: `{resource}_{action}` in snake_case.
Examples: `posts_create`, `comments_reply`, `analytics_get_engagement`

## Coding Standards

- TypeScript strict mode, no `any` types
- All async functions must have try/catch with proper error propagation
- Every API call goes through the shared http-client (which wraps rate limiter + error handler)
- Every pack must export a health check function
- No console.log in production code (use proper logging to stderr)
- No hardcoded credentials anywhere, ever
- Config loaded from `mcpkit.config.json`, fallback to env vars, fallback to defaults
- All MCP tool descriptions must be clear, concise, optimized for LLM understanding
- Include parameter descriptions with examples in tool schemas

## Writing Style (docs, README, SKILL.md)

- No em dashes. Use colons, commas, or restructure.
- Concise, direct language
- Code examples over prose where possible
- Every SETUP.md must have numbered steps a junior dev can follow

## Build Order (reference for autonomous agent)

Phase 1: Foundation
1. Root workspace setup (package.json, tsconfig, eslint, prettier)
2. Core module (auth, rate-limiter, error-handler, config, http-client)
3. Core module tests

Phase 2: First Pack (Telegram, simplest auth)
4. Telegram pack: server.ts, tools, bot-token auth
5. Telegram pack: SKILL.md, README, SETUP.md
6. Telegram pack: health test, tool tests
7. Plugin structure (.claude-plugin, .mcp.json, marketplace.json)
8. End-to-end test: marketplace add, plugin install, use tools

Phase 3: Social Media Packs
9. Discord pack (bot token, similar to Telegram)
10. Twitter/X pack (OAuth 2.0 PKCE, free tier write tools)
11. LinkedIn pack (OAuth 2.0, Community Management API)
12. Instagram pack (OAuth 2.0 via Facebook, Graph API)

Phase 4: Productivity Packs
13. Gmail pack (Google OAuth 2.0)
14. Notion pack (Bearer token)
15. Slack pack (OAuth 2.0)
16. Google Calendar pack (Google OAuth 2.0)
17. Google Sheets pack (Google OAuth 2.0)

Phase 5: Generator CLI
18. CLI skeleton (commander, commands)
19. OpenAPI parser
20. Swagger 2.0 parser
21. Manual config parser
22. Code generator (server, tools, auth, plugin structure)
23. Validate command
24. Test command
25. Generator integration tests

Phase 6: Polish
26. Landing page
27. README, CONTRIBUTING.md
28. CI/CD (GitHub Actions)
29. npm publish setup

## What NOT To Do

- Never scrape. Official APIs only.
- Never store user tokens in code, git, or logs
- Never push to git without running tests first
- Never write console.log to stdout in MCP servers (breaks stdio transport)
- Never skip writing SKILL.md for a pack (it's what makes the pack useful)
- Never batch multiple fixes in one commit
- Never create a pack without config.example.json
- Never hardcode API versions (use config)
- Never cosign commits (no `Co-Authored-By` lines, no `--gpg-sign`, no `-S` flag)
