# Linkraft v1.1 Spec

## What v1.0 Ships With (this week)

Two working modes:
- `/linkraft plan` - project analysis, CLAUDE.md generation, 13 document outputs
- `/linkraft sheep` - autonomous QA, auto-fix, commit, narrate, content pack

Poke is cut from launch. Announced as "coming soon."

## What v1.1 Adds

### 1. /linkraft preflight (NEW MODE)

**What it is:** 60-second read-only scan. Three sections: security, health, ship readiness. No fixes, no commits, no story. Just a report that tells you what's wrong before you ship.

**Why it matters:** Sheep runs 20 cycles over hours. Most vibecoders don't want that before a quick deploy. They want a fast answer: "am I safe to ship?" Preflight is that answer. It's also the on-ramp to Sheep: preflight shows you the problems, Sheep fixes them.

**The chain:**
```
/linkraft plan        -> understand the project (10 min)
/linkraft preflight   -> see what's wrong (60 sec, read-only)
/linkraft sheep       -> fix what's wrong (hours, autonomous)
```

Each feeds the next. Preflight reads plan's outputs if they exist. Sheep reads preflight's report to prioritize its QA plan.

**Implementation:** NOT a new scanner. Extract Sheep's scanning logic into `src/shared/scanner.ts`. Preflight and Sheep both import from it. Zero code duplication.

**Output format:**

```markdown
# PREFLIGHT REPORT: [Project Name]
## Generated: [timestamp]
## Scan time: [seconds]

## SECURITY [score/10]

### Critical
- [FAIL] description                    file:line
- [FAIL] description                    file:line

### Warnings
- [WARN] description                    file:line

## HEALTH [score/100]

| Metric | Value | Status |
|--------|-------|--------|
| Dead code files | 2 | WARN |
| Console.logs | 0 | PASS |
| TypeScript any | 3 | WARN |
| Test count | 35 | LOW |
| Largest file | 647 lines | WARN |
| Dependencies | all current | PASS |
| Duplicate code | 2 instances | WARN |

## SHIP READINESS [percentage]

| Check | Status |
|-------|--------|
| Error handling on all routes | 4 missing |
| Loading states | 2 missing |
| Empty states | 1 missing |
| 404 page | present |
| Auth implemented | yes |
| Deploy config | present |
| Custom domain | not configured |
| TODOs remaining | 12 |
| FIXMEs remaining | 0 |

## NEXT STEPS
Run /linkraft sheep to auto-fix [N] issues.
[M] issues need manual attention (see details above).
```

**Scoring:**
- Security: count of critical (x3) + high (x2) + medium (x1) findings, inverted to 0-10 scale
- Health: weighted average of all metrics, 0-100
- Ship readiness: percentage of checks passing

**Subcommands:**
```
/linkraft preflight              Full scan (security + health + readiness)
/linkraft preflight security     Security only
/linkraft preflight health       Health only
/linkraft preflight ready        Ship readiness only
```

**MCP tools:**
- `preflight_full` - runs all three scans
- `preflight_security` - security scan only
- `preflight_health` - health metrics only
- `preflight_readiness` - ship readiness checks only

**Security checks (extracted from Sheep's patterns):**
- Hardcoded secrets in client code (API keys, DSNs, tokens in non-env files)
- API routes/endpoints missing auth
- API routes/endpoints missing rate limiting
- Fail-open patterns (catch blocks that return success)
- dangerouslySetInnerHTML usage
- SQL/query injection vectors (string interpolation in queries)
- Missing input validation on user-facing endpoints
- RLS not enabled on database tables (if Supabase detected)
- Env vars in client bundles that shouldn't be
- CORS misconfiguration (wildcard origins)

**Health checks:**
- Dead code (exported but never imported files)
- Console.log count (excluding operational logging)
- TypeScript `any` count
- Test file count vs source file count (rough coverage estimate)
- Largest file by line count (complexity smell)
- Dependency freshness (npm outdated)
- Known vulnerabilities (npm audit --json)
- Code duplication (files with >80% similarity)
- TODO/FIXME count

**Ship readiness checks:**
- Every API route has error handling (try/catch or error boundary)
- Async operations have loading states
- Lists/collections have empty states
- 404/not-found page exists
- Auth flow implemented (login, logout, protected routes)
- Deploy config present (vercel.json, netlify.toml, Dockerfile, etc.)
- Environment variables documented (.env.example or similar)
- Favicon present
- OG meta tags on main pages
- robots.txt present
- Custom domain configured (check deploy config)
- TODOs and FIXMEs count

---

### 2. Poke Fixes (POST-LAUNCH, not blocking v1.1)

Three fixes needed, in priority order:

**Fix 1: Overlay persistence (2 hours)**
The overlay dies when React re-renders. The persistence script (`generatePersistenceCode` in cdp-injector.ts) exists but wasn't injected during the test.

Fix: inject the persistence MutationObserver alongside the overlay. When the overlay root is removed from DOM (React re-render, page navigation), the observer detects it and re-injects within 100ms.

**Fix 2: CDP click bridge (1 hour)**
Chrome DevTools MCP's click dispatches CDP-level input events. The overlay listens for DOM-level click events with `capture: true`. These don't intersect.

Fix: create a `poke_click` tool that dispatches a real DOM MouseEvent via `evaluate_script` at specific coordinates. The overlay captures these normally.

**Fix 3: React 19 source resolution (significant work, defer to v1.2)**
React 19 removed `_debugSource` from fibers. The overlay resolves to `LayoutRouterContext` (Next.js internal) instead of the user's component. File and line are both null.

Three approaches:
1. **Babel plugin** (already built): adds `data-poke-file` to every JSX element. Works perfectly but requires user to add the plugin to their build config.
2. **Sourcemap-based resolution**: read the project's sourcemaps, map DOM element positions back to source. Complex but zero user setup.
3. **Class/text grep fallback**: when no source info, grep the codebase for the unique combination of Tailwind classes or text content. Already implemented.

For v1.1: ship approach 1 (Babel plugin) with Claude auto-installing it, plus approach 3 as fallback. Approach 2 is v1.2.

---

### 3. Plan + Sheep Integration

**`/linkraft sheep --with-plan`**

Runs plan's technical outputs first (stack, schema, api-map, tokens), then feeds them into Sheep's QA plan generation.

What runs: plan's 4 technical scans (not competitors, not research docs)
What doesn't run: competitors, architecture, executive summary, monetization, ASO

Implementation:
1. Check if `.plan/` exists with recent outputs (< 24 hours old)
2. If yes: skip plan, go straight to sheep
3. If no: run plan technical scans, write to `.plan/`, then start sheep
4. Sheep's auto-config reads `.plan/api-map.md` to know which endpoints exist
5. Sheep's auto-config reads `.plan/schema.md` to know which tables have RLS
6. Sheep's auto-config reads `.plan/tokens.md` to know the design system rules

**`/linkraft plan+sheep`** (interactive mode)

Runs FULL plan (all 13 documents). Pauses with summary. User reviews. Types continue. Sheep starts with full context.

---

### 4. Preflight to Sheep Handoff

When preflight finds issues, the report ends with:

```
Run /linkraft sheep to auto-fix 23 of 31 issues.
8 issues need manual attention.
```

If the user runs `/linkraft sheep` after a preflight, Sheep reads `.preflight/report.json` and uses it to:
1. Skip scanning areas that preflight found clean
2. Prioritize areas that preflight flagged critical
3. Include the specific findings in its QA plan

---

### 5. Quality of Life Improvements

**5.1 Content pack improvements**
The content pack should include the preflight score in the LinkedIn post:
"preflight score: 71/100 before sheep, 89/100 after."

**5.2 Marketplace.json verification**
Verify the cold install path works.

---

## Build Order

```
Phase 1: Ship blockers (before v1.0 launch)       [DONE]
  1.1  Fix plan SKILL.md to call all 13 generators
  1.2  Verify marketplace.json cold install
  1.3  Test sheep resume flow

Phase 2: Preflight mode (v1.1)
  2.1  Extract scanner.ts from sheep auto-config         [1 hour]
  2.2  Build security scanner                            [1 hour]
  2.3  Build health scanner                              [1 hour]
  2.4  Build readiness scanner                           [1 hour]
  2.5  Build preflight runner + report formatter         [1 hour]
  2.6  Add MCP tools, command, skill                     [30 min]
  2.7  Test on MahFah                                    [30 min]
  2.8  Wire preflight -> sheep handoff                   [30 min]

Phase 3: Plan + Sheep integration (v1.1)
  3.1  Build --with-plan flag for sheep                  [1 hour]
  3.2  Build plan+sheep interactive mode                 [1 hour]
  3.3  Test the full chain: plan -> preflight -> sheep   [30 min]

Phase 4: Poke fixes (v1.1 or v1.2)
  4.1  Overlay persistence (MutationObserver)            [2 hours]
  4.2  CDP click bridge (poke_click tool)                [1 hour]
  4.3  Babel plugin auto-install via Claude              [1 hour]
  4.4  Class/text grep fallback for no-source elements   [1 hour]
  4.5  Test on Next.js 15 + React 19 app                [1 hour]

Phase 5: Polish
  5.1  Content pack before/after preflight scores        [30 min]
  5.2  Error messages when MCPs missing                  [30 min]
  5.3  Update README with preflight mode                 [30 min]
  5.4  Update linkraft-complete-reference.md             [30 min]
```

## Success Criteria

**v1.0 launch (this week):**
- `/linkraft plan` generates all 13 documents
- `/linkraft sheep` runs full autonomous QA with fixes, commits, story, content pack
- Cold install works via marketplace

**v1.1 (next week):**
- `/linkraft preflight` gives a security/health/readiness score in 60 seconds
- Preflight feeds into sheep for targeted fixing
- `--with-plan` makes sheep smarter
- Before/after scores in content pack

**v1.2 (following week):**
- `/linkraft poke` works with overlay persistence and source resolution
- Full chain: plan -> preflight -> sheep -> poke (for visual fixes)
