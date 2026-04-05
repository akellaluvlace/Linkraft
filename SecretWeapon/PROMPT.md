# PokingIsNewCoding V2 — Execution Instructions

## How To Run

Open Claude Code in the poking-is-new-coding project directory. Paste:

```
Follow qa/PROMPT.md
```

For overnight autonomous operation:

```bash
while true; do
  claude -p "Follow qa/PROMPT.md" --dangerously-skip-permissions
  sleep 10
done
```

The agent runs until context fills, writes state to MEMORY.md, exits. The loop restarts it. It reads MEMORY.md, picks up where it left off. Keeps going until every item in BUILD_PLAN.md is checked off.

---

## Boot Sequence

1. **Read context files** (in this order):
   ```
   Read CLAUDE.md
   Read SecretWeapon-V2-SPEC.md (skim for current phase, deep read for active task)
   Read qa/SYSTEM.md
   Read qa/MEMORY.md
   Read qa/BUILD_PLAN.md
   ```

2. **Assess current state**:
   - What was the last completed item?
   - Are all Phase 0 criticals fixed? (if not, Phase 0 continues)
   - Any incomplete items from previous session?
   - Any blockers in MEMORY.md? (check if they're still blocking or can be retried)
   - Is the repo clean? (`git status`)
   - Do all existing tests still pass? (`npx vitest run`)

3. **Determine next task**:
   - If Phase 0 has unchecked items: do those first, no exceptions
   - Otherwise: first uncompleted, unblocked item in BUILD_PLAN.md
   - If previous session was interrupted mid-task: resume it
   - If the next item is blocked: skip it (see Blocker Protocol below)

4. **Announce**:
   ```
   POKING V2 AGENT BOOT
   Session: {timestamp}
   V1 status: BUILT
   Phase 0 (criticals): {COMPLETE | IN PROGRESS | NOT STARTED}
   Last completed: {item}
   Next task: {item}
   Blocked items: {count} (skipped, will retry later)
   Starting cycle...
   ```

5. **Begin cycling.**

---

## NEVER STOP RULE

The agent does NOT stop when a phase is complete. It moves to the next phase immediately. The agent does NOT stop when it hits a blocker. It routes around it.

**The agent only stops when:**

1. **Every single item in BUILD_PLAN.md is either `[x]` (done) or `[BLOCKED]` (logged, retried, still stuck)** and there is literally nothing left to work on.
2. **Context window is full** (Claude Code will handle this automatically by ending the session, the restart loop picks it up).
3. **Repo is catastrophically broken** and cannot be recovered by reverting to last good commit.

That's it. Three conditions. Everything else, keep going.

---

## Blocker Protocol

When a task cannot be completed:

### Step 1: Diagnose
Is it actually blocked, or just hard? Try 5 different approaches before declaring it blocked:
- Approach 1: the obvious fix
- Approach 2: a different implementation strategy
- Approach 3: simplify scope (build a minimal version that compiles)
- Approach 4: stub it out (create the interface with a TODO implementation that returns mock data)
- Approach 5: break it into smaller pieces (maybe part of the task is doable)

### Step 2: If truly blocked (all 5 approaches failed)
Mark it in BUILD_PLAN.md:
```
- [BLOCKED] **4.6** Create judges.ts — BLOCKED: needs Anthropic API access for judge calls, no API key in environment. Stubbed with mock judge responses.
```

Log in MEMORY.md under `## Blocked Items`:
```
### 4.6 judges.ts - Claude API access
**Blocked since:** {timestamp}
**Reason:** Judge system needs to call Claude API to spawn judge personalities. No API key available in plugin context.
**Attempted:** 5 approaches including mock responses, local LLM fallback, deferred evaluation
**Stub status:** Interface created, mock implementation returns random scores. Real implementation ready, needs API key.
**Unblock condition:** User provides ANTHROPIC_API_KEY in environment or plugin gains API access
**Last retry:** {timestamp}
```

### Step 3: Skip and continue
Move to the NEXT unchecked item in BUILD_PLAN.md. Do not stop. If the next item depends on the blocked one, skip that too and find one that doesn't.

### Step 4: Retry blocked items
At the START of every new session (after boot), review all `[BLOCKED]` items. Conditions may have changed:
- A dependency might have been installed by the user
- A previous fix might have unblocked something
- A different approach might work now with more context

If a blocked item can now be completed, unmark it and do it.

### Step 5: When everything remaining is blocked
If every unchecked item is either done or blocked, write a comprehensive session report listing all blocked items with their unblock conditions. The user will review this and either provide what's needed or make architectural decisions.

Even in this state, look for productive work:
- Write more tests for existing code
- Improve documentation
- Add more design presets
- Add more wildcard mutations
- Refactor code that passed but could be cleaner
- Add error handling edge cases
- Add more detailed SKILL.md instructions

There is always something useful to do.

---

## Per-Cycle Steps

### Step 1: PLAN
- Read relevant section of SecretWeapon-V2-SPEC.md for this task
- Read CLAUDE.md for structural requirements
- Check MEMORY.md for previous notes
- If this is a Phase 0 fix: read the specific code review finding, locate the exact file and line
- Check if this task depends on any blocked items (if so, can it be partially done?)
- Outline files to create or modify
- Make all decisions autonomously. Log them. Do not ask.

### Step 2: BUILD

**For Phase 0 (critical fixes):**
- Write a failing test that reproduces the bug FIRST
- Then apply the minimal fix
- Then verify the test passes
- Then run ALL existing tests for regressions
- Do not refactor surrounding code, only fix the cited issue

**For Forge components:**
- Write in `src/forge/`
- Preset files go in `presets/*.json`
- Validate presets against schema
- Anti-slop rules go in the forge SKILL.md, not hardcoded
- Component browser reads from MCPancake router

**For Vault components:**
- Write in `src/vault/`
- GitHub API interactions use fetch (no heavy deps)
- Component packages follow the schema in SecretWeapon-V2-SPEC.md section 4.2
- Competition system is data-driven (JSON state files)

**For Dreamroll components:**
- Write in `src/dreamroll/`
- Judge prompts go in `agents/dreamroll-*.md`
- Wildcard mutations go in `src/dreamroll/wildcards.ts` as an exported array
- State persists to `.dreamroll/state.json`
- Each variation uses git worktree, cleaned up after
- Screenshots via Playwright (add as optional dependency)
- If Playwright not available: stub with placeholder screenshots, mark as BLOCKED but continue building everything else
- If Claude API not available for judges: stub with mock scoring, mark as BLOCKED but continue
- Evolution logic reads gems, detects patterns, adjusts params
- The generation loop MUST be resumable from state file

**For Launchpad components:**
- Write in `src/launchpad/`
- Planning output goes to `.launchpad/*.md` files
- Build phase uses Forge preset system
- Test phase: if Lighthouse CLI not available, stub scores, mark as BLOCKED but continue
- Distribution phase calls Linkraft MCPs if available, generates local drafts if not

**For MCP tools:**
- Add to `src/mcp/tools/` in the appropriate file
- Register in `src/mcp/server.ts`
- Every tool needs: clear name, description with examples, JSON schema for inputs/outputs
- Test with mock data

**For skills, agents, and commands:**
- Skills go in `skills/{feature}/SKILL.md`
- Agents go in `agents/{name}.md`
- Commands go in `commands/{name}.md`
- These are markdown files, not TypeScript

**For MCPancake router:**
- Write in `src/shared/mcpancake-router.ts`
- Every MCP is optional, never throw on unavailability
- Cache MCP availability on first check per session
- Route by intent, not by MCP name

### Step 3: TEST

```bash
# 1. Full compile
npx tsc --noEmit

# 2. Lint
npx eslint src/

# 3. ALL tests (V1 + V2, no regressions)
npx vitest run

# 4. Build overlay bundle
npx webpack --config webpack.overlay.config.js

# 5. Build extension bundle
npx webpack --config webpack.extension.config.js

# 6. Validate presets (if forge work done)
node scripts/validate-presets.js

# 7. Validate plugin structure (if plugin files changed)
node scripts/validate-plugin.js
```

### Step 4: FIX
- One fix at a time
- Re-run failing test only
- Phase 0 criticals: 5 attempts before declaring blocked
- All other items: 3 attempts, then try the 5-approach Blocker Protocol
- Never declare something blocked without trying all 5 approaches

### Step 5: VERIFY
- Re-run full test suite
- Confirm no V1 regressions

### Step 6: COMMIT
```bash
# Phase 0:
git commit -m "fix(component): description

- Root cause: what was wrong
- Fix: what was changed
- Test: test name that verifies"

# V2 features:
git commit -m "feat(forge|vault|dreamroll|launchpad): what was built

- Files: list
- Tests: count passing"

# Blocked stubs:
git commit -m "chore(component): stub implementation (blocked: reason)

- Interface: complete
- Implementation: mock/stub
- Unblock: what's needed"
```

### Step 7: LOG
Update MEMORY.md with cycle details. Mark BUILD_PLAN.md item as `[x]` or `[BLOCKED]`.

### Step 8: CONTINUE
Do NOT stop. Go back to Step 1 with the next unchecked, unblocked item. Cross phase boundaries freely. If Phase 1 is done, start Phase 2 immediately. No pauses, no waiting for permission.

---

## Session Report

At the END of each session (context full or everything done), write to MEMORY.md:

```markdown
## Session Report — {date}

### Summary
{One paragraph}

### Phase Progress
- Phase 0 (Criticals): {X/13 done}
- Phase 1 (Forge Foundation): {X/16 done}
- Phase 2 (Forge Full): {X/8 done}
- Phase 3 (Vault): {X/9 done}
- Phase 4 (Dreamroll): {X/20 done}
- Phase 5 (Launchpad): {X/12 done}
- Phase 6 (Polish): {X/9 done}
- TOTAL: {X/87 done, Y blocked, Z remaining}

### Completed This Session
- [x] {items with phase numbers}

### Blocked Items (current)
| Item | Reason | Stub Status | Unblock Condition |
|---|---|---|---|
| 4.6 | No API key | Mock scores | ANTHROPIC_API_KEY needed |

### Decisions Made
- {decision}: {reasoning}

### Test Results
| Component | Compile | Lint | Tests | Regressions |
|-----------|---------|------|-------|-------------|
| V1 (poke) | PASS    | PASS | 22/22 | none        |
| forge     | PASS    | PASS | 8/8   | n/a         |

### Commits This Session
- {hash} {message}

### Needs Human Action
- {things only the user can do: API keys, account setup, architectural decisions}

### Next Session Will
1. {first priority}
2. {second priority}
3. {third priority}
```

---

## Recovery Protocol

1. `git status` and `git log --oneline -10`
2. Uncommitted non-compiling changes: `git stash`
3. Find last good commit
4. If needed: `git reset --hard {good-commit}`
5. Run `npx vitest run` to confirm clean state
6. Log recovery in MEMORY.md
7. Check for orphaned Dreamroll worktrees: `git worktree list`, clean up stale ones
8. Resume from last completed BUILD_PLAN item
9. Do NOT stop after recovery. Keep building.