# Contributing to Linkraft

Contributions welcome. Here's how Linkraft works and how to add to it.

## Architecture

Linkraft is a Claude Code plugin with three modes. Each mode has:
- A skill file (`skills/{mode}/SKILL.md`) that teaches Claude how to use it
- A command file (`commands/{mode}.md`) that defines the slash command
- MCP tools (`src/mcp/tools/{mode}-tools.ts`) that expose functionality
- Source code (`src/{mode}/`) with the actual logic
- Tests (`tests/{mode}/`) covering all generators and scanners

The MCP server (`src/mcp/server.ts`) registers all tools from all three modes.

## Adding a Plan Generator

Plan mode has 12 generators. To add a new one:

1. Create `src/plan/your-gen.ts` following the pattern in existing generators
2. Export two functions:
   - `generateYourContext(projectRoot: string): string` (returns context + template)
   - `writeYourOutput(projectRoot: string, content: string): string` (writes to .plan/)
3. Add MCP tools in `src/mcp/tools/plan-tools.ts` (two tools: generate context, write output)
4. Update `skills/plan/SKILL.md` with the new step in the generation order
5. Write tests in `tests/plan/your-gen.test.ts`
6. Run `npx vitest run` and confirm zero regressions

## Adding Preflight Checks

Preflight has three scanners: security, health, readiness. To add checks:

1. Open `src/preflight/{scanner}-scanner.ts`
2. Add your check function following the existing pattern
3. Add it to the scanner's main function
4. Write tests in `tests/preflight/`
5. Verify the scoring still makes sense (security 0-10, health 0-100, readiness 0-100%)

## Improving Sheep

Sheep's fix/log rules are in `skills/sheep/SKILL.md`. To add new bug detection patterns:

1. Add the pattern to the skill file's "what to look for" section
2. Classify it as FIX (safe to auto-fix) or LOG (needs human)
3. If adding code-level scanning: update `src/shared/scanner.ts`

## Coding Standards

- TypeScript strict mode, no `any` types
- No `console.log` in production code
- No em dashes in docs or comments. Use colons, commas, or restructure.
- All MCP tool names: `{mode}_{action}` in snake_case
- Every Zod schema field must have `.describe()`
- All tests must pass before committing

## Git Workflow

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes
4. Run tests: `cd poking && npx vitest run`
5. Commit with conventional message: `feat(plan): add new generator`
6. Push and open a PR

## Running Tests

```bash
cd poking

# All tests
npx vitest run

# Watch mode
npx vitest

# Single file
npx vitest run tests/plan/your-gen.test.ts
```

## Questions

Open an issue at github.com/akellaluvlace/Linkraft/issues
