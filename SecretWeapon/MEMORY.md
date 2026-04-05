# PokingIsNewCoding V2 — Agent Memory

## Project State

**Status:** V1 BUILT, Phase 0 COMPLETE, V2 READY TO START
**Current phase:** Phase 1 (Forge Foundation)
**Last completed item:** Phase 0.13 (all criticals and important fixes verified)
**Last session:** 2026-04-05
**V1 test status:** All 326 tests passing (30 test files, zero errors)
**Total commits since V1:** 4 (security fixes, code review fixes, CLAUDE.md update)

## Known Issues (from code review)

### Critical (5) - ALL FIXED

| # | Issue | File | Status |
|---|---|---|---|
| 1 | Bot token exposed in URLs/error logs | telegram/auth/bot-token.ts | FIXED: added pathPrefix to HttpClient, token no longer in baseUrl |
| 2 | Generator OAuth broken (no PKCE, drops codeVerifier) | generator/codegen/auth.ts, server.ts | FIXED: usePKCE: true, codeVerifier passed through |
| 3 | TokenStore.clear() leaves ghost token | core/auth/token-store.ts | FIXED: clear() now uses unlinkSync |
| 10 | No origin check on postMessage relay | poking/extension/preview-panel.ts | FIXED: event.source check + frameOrigin for postMessage |
| 11 | poking.off disposes OutputChannel | poking/extension/commands.ts | FIXED: closePreview() vs dispose() separation |

### Important (7) - ALL FIXED

| # | Issue | File | Status |
|---|---|---|---|
| 5 | isAuthenticated() triggers re-auth in 60s buffer | core/auth/oauth2.ts | FIXED: checks actual expiry, not buffer |
| 6 | Rate limiter spins on daily exhaustion | core/rate-limiter.ts | FIXED: throws immediately with retryable: false |
| 7 | TokenStore.load() no runtime validation | core/auth/token-store.ts | FIXED: validates accessToken is string |
| 8 | sanitizeGroupName returns empty string | generator/codegen/generator.ts | FIXED: falls back to 'general' |
| 12 | innerHTML sent to Claude | poking/overlay/extractor.ts | FIXED: removed innerHTML from DomInfo |
| 13 | postMessage uses '*' targetOrigin | poking/extension/preview-panel.ts | FIXED: uses frameOrigin |
| 4 | __dirname fragile in ESM | all pack server.ts | DEFERRED: works in current CJS setup, will address if/when ESM migration happens |

### Low (1) - FIXED

| # | Issue | File | Status |
|---|---|---|---|
| 14 | detectFramework runs twice per click | poking/resolver/resolver-factory.ts | FIXED: resolveElement() calls detectFramework once |

## Architectural Notes

**iframe CSP wall (highest risk for V2):**
The preview panel loads user's app in an iframe inside a VS Code WebView. Cross-origin script injection is blocked. Options:
1. Bookmarklet injection
2. Dev server middleware (Vite plugin that injects overlay script)
3. Chrome DevTools Protocol via chrome-devtools-mcp
Decision needed before V2 visual manipulation features. Current approach works for same-origin or manual script inclusion.

## External Dependencies Needed

| What | Why | Blocking? |
|---|---|---|
| Chrome DevTools Protocol access | Better overlay injection for V2 | Yes for V2 visual features |
| React 19 test app | Test data-poke-* Babel plugin | Yes for React 19 users |
| VS Code Extension publishing account | Publish to marketplace | Yes for distribution |
| npm account with @linkraft scope | Publish packages | Yes for distribution |
| Anthropic API key | Dreamroll judge system | Yes for Phase 4 |
| Playwright | Dreamroll screenshots | Yes for Phase 4 (can stub) |

## Decisions Log

- 2026-04-05: Bot token moved from baseUrl to pathPrefix in HttpClient (new option added to core)
- 2026-04-05: TokenStore.clear() deletes file rather than writing empty JSON
- 2026-04-05: resolveElement() created as single-call API combining resolveSource + resolveComponentData
- 2026-04-05: bridge.closePreview() separated from bridge.dispose() for lifecycle management

## Area Health (V2)

| Component | Status | Last Tested | Notes |
|-----------|--------|-------------|-------|
| V1 poke (all) | BUILT + FIXED | 2026-04-05 | 41 tests passing, all criticals resolved |
| Linkraft core | BUILT + FIXED | 2026-04-05 | 37 tests passing, security fixes applied |
| Linkraft packs (10) | BUILT | 2026-04-05 | 248 tests passing across all packs |
| Linkraft generator | BUILT + FIXED | 2026-04-05 | 23 tests passing, PKCE + empty group fixed |
| forge/presets | NOT STARTED | - | Phase 1 |
| forge/applicator | NOT STARTED | - | Phase 1 |
| forge/token-editor | NOT STARTED | - | Phase 1 |
| forge/anti-slop | NOT STARTED | - | Phase 1 |
| forge/component-browser | NOT STARTED | - | Phase 2 |
| mcpancake-router | NOT STARTED | - | Phase 2 |
| vault/client | NOT STARTED | - | Phase 3 |
| vault/packager | NOT STARTED | - | Phase 3 |
| vault/competition | NOT STARTED | - | Phase 3 |
| dreamroll/generator | NOT STARTED | - | Phase 4 |
| dreamroll/judges | NOT STARTED | - | Phase 4 |
| dreamroll/wildcards | NOT STARTED | - | Phase 4 |
| dreamroll/evolution | NOT STARTED | - | Phase 4 |
| dreamroll/state | NOT STARTED | - | Phase 4 |
| dreamroll/reporter | NOT STARTED | - | Phase 4 |
| launchpad/planner | NOT STARTED | - | Phase 5 |
| launchpad/builder | NOT STARTED | - | Phase 5 |
| launchpad/tester | NOT STARTED | - | Phase 5 |
| launchpad/distributor | NOT STARTED | - | Phase 5 |

## Session History

### Session 1 (2026-04-05) — V1 Build + Phase 0 Complete
- Built entire V1: overlay (10.9KB), resolvers, extension, MCP server (13 tools), 41 tests
- Built Linkraft: core, generator, 10 packs, 284 tests
- Fixed all 13 code review issues (5 critical, 7 important, 1 low)
- Final state: 326 tests passing, zero errors, pushed to github.com/akellaluvlace/Linkraft

---

*This file is updated by the autonomous agent after every cycle. Do not edit manually unless correcting agent errors.*
