# PokingIsNewCoding V2 — Autonomous Agent Philosophy & Architecture

## What This Is

An autonomous build agent for PokingIsNewCoding V2. V1 (Poke) is already built. This agent fixes V1 criticals, then builds five new systems: Forge, Vault, Dreamroll, Launchpad, and MCPancake. No human input required.

## The Loop

```
plan -> build -> test -> fix -> verify -> commit -> log -> repeat
```

Same KAIROS loop as V1. See V1 SYSTEM.md for base rules. V2 additions below.

## V2-Specific Build Rules

### Working With Existing Code
V1 is built. Do not rewrite V1 code unless fixing a code review critical. When extending (adding new MCP tools, new commands, new types), import from existing modules. Do not duplicate.

Key existing files to extend, not replace:
- `src/mcp/server.ts`: add new tool registrations for forge, vault, dreamroll, launchpad
- `src/shared/types.ts`: add new interfaces for presets, vault components, dreamroll state
- `.claude-plugin/plugin.json`: add new skills, agents, commands
- `package.json`: add new dependencies as needed

### Phase 0 Is Special
Phase 0 fixes code review criticals. Every fix must:
1. Read the specific file and line cited in the code review
2. Understand the root cause (not just patch the symptom)
3. Write a test that reproduces the bug FIRST
4. Apply the fix
5. Run the test to confirm
6. Run ALL existing tests to confirm no regressions
7. Commit with `fix(component): description of what was wrong`

### Design Preset Files
Presets are JSON. They must validate against the schema in `src/forge/preset-schema.ts` (you'll create this). Every preset must:
- Have all required fields (name, id, tokens, componentOverrides, forbiddenPatterns)
- Have valid Tailwind class strings in componentOverrides
- Have no contradictions (e.g., forbidding a class that's used in componentOverrides)
- Be tested: load, validate, generate expected Tailwind config output

### Agent Markdown Files
Judge personalities and sub-agent prompts go in `agents/*.md`. These are NOT code. They are prompt documents. Format:
```markdown
---
name: agent-name
description: what this agent does
---

# Agent Name

## Role
...

## Scoring Criteria
...

## Style
...
```

Do not hardcode these prompts as strings in TypeScript. The skill/command system reads them from disk.

### MCPancake Router
The router must handle every MCP being optional. Pattern:

```typescript
async function findComponent(query: string): Promise<Component[]> {
  const results: Component[] = [];

  if (this.hasMcp('shadcn')) {
    results.push(...await this.callMcp('shadcn', 'search', { query }));
  }
  if (this.hasMcp('magic-ui')) {
    results.push(...await this.callMcp('magic-ui', 'generate', { prompt: query }));
  }
  // Always works even if zero MCPs connected
  return results;
}
```

Never throw if an MCP is unavailable. Return partial results. Log what was skipped.

### Dreamroll State Machine
Dreamroll runs for hours. It MUST be resumable. State is persisted to `.dreamroll/state.json` after every variation cycle. If the agent crashes mid-run, the next boot reads state and continues from the last completed variation. State includes:
- Current variation number
- Seed parameters used so far
- Gems found so far
- Judge scores for all completed variations
- Evolution adjustments made
- Time elapsed

### Git Worktree Isolation (Dreamroll)
Each Dreamroll variation runs in a git worktree, not on the main branch. Pattern:
```bash
git worktree add .dreamroll/worktree/v{N} -b dreamroll/v{N}
# Make changes in worktree
# Screenshot via Playwright
# Score with judges
# If gem: copy files to .dreamroll/gems/v{N}/
# Always: git worktree remove .dreamroll/worktree/v{N}
```
Never leave worktrees lying around. Clean up after each variation.

### Vault GitHub Integration
The vault is a separate GitHub repo: `akellainmotion/poking-vault`. The plugin reads it as a marketplace. Component submission is via PR (automated by the plugin). For V2, read-only access is sufficient. Write access (save/share) is V2.1.

## Fix Scope Rules (same as V1)

- 30 lines or fewer: apply, test, commit
- 31-100 lines: apply if confident, test thoroughly
- 100+ lines: log in MEMORY.md, move on
- Exception for Phase 0: critical fixes can be any size, they must be fixed

## Time Budget

- 90 minutes per session
- Phase 0 (criticals): may take a full session. That's fine.
- Forge phases: 2-3 sessions
- Dreamroll: 3-4 sessions (most complex)
- Always leave repo compilable

## Quality Gates

Before moving to next BUILD_PLAN item:
1. TypeScript compiles (extension + overlay + new modules)
2. ESLint passes
3. Unit tests pass (all, not just new)
4. No regressions in existing V1 functionality
5. MEMORY.md updated
6. Git commit made

## File Authority

- **CLAUDE.md**: project context, structure, V2 architecture
- **SecretWeapon-V2-SPEC.md**: detailed requirements for all V2 features
- **MEMORY.md**: persistent state across sessions
- **BUILD_PLAN.md**: ordered task list
- **This file (SYSTEM.md)**: build philosophy
- **PROMPT.md**: execution instructions
