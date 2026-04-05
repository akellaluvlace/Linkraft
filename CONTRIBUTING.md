# Contributing to Linkraft

Contributions welcome! Here's how to add a new pack or improve an existing one.

## Adding a New Pack

1. **Create the directory structure**

   ```bash
   mkdir -p packs/my-service/{src/{tools,auth},.claude-plugin,skills/my-service,tests}
   ```

2. **Follow the pack template**

   Every pack needs:
   - `src/server.ts` - MCP server entry point
   - `src/tools/*.ts` - Tool definitions (one file per resource group)
   - `src/auth/*.ts` - Auth handler (extends core auth modules)
   - `package.json` - Dependencies and scripts
   - `tsconfig.json` - TypeScript config (extend `../../tsconfig.base.json`)
   - `config.example.json` - Example configuration
   - `.mcp.json` - MCP server registration
   - `.claude-plugin/plugin.json` - Plugin metadata
   - `skills/my-service/SKILL.md` - Tool documentation for LLM context
   - `README.md` - User-facing documentation
   - `SETUP.md` - Step-by-step auth setup guide
   - `tests/health.test.ts` - Auth validation tests
   - `tests/tools.test.ts` - Tool handler tests

3. **Use existing packs as reference**

   - Bot token auth: see `packs/telegram/` or `packs/discord/`
   - OAuth 2.0: see `packs/twitter-x/` or `packs/gmail/`
   - Bearer token: see `packs/notion/`

## Coding Standards

- TypeScript strict mode, no `any` types
- All tool names: `{resource}_{action}` in snake_case
- Every Zod schema field must have `.describe()`
- No `console.log` in production code (use `process.stderr.write`)
- All API calls go through the shared `HttpClient` from `@linkraft/core`
- Every pack must have tests

## Writing Style

- No em dashes in docs. Use colons, commas, or restructure.
- Concise, direct language
- Code examples over prose
- Every SETUP.md must have numbered steps

## Git Workflow

1. Fork the repo
2. Create a feature branch: `git checkout -b pack/my-service`
3. Make your changes
4. Run tests: `npm test`
5. Run lint: `npm run lint`
6. Commit with a descriptive message
7. Push and open a PR

## Commit Messages

Use conventional commits:
- `feat(pack): add my-service pack`
- `fix(core): handle rate limit edge case`
- `test(telegram): add webhook tool tests`
- `docs: update README with new pack`

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Single pack
cd packs/telegram && npm test
```

## Questions?

Open an issue at [github.com/akellaluvlace/Linkraft/issues](https://github.com/akellaluvlace/Linkraft/issues).
