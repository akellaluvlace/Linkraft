# PokingIsNewCoding V2 — Build Plan

## Phase 0: Fix V1 Criticals (from code review)

### Critical Fixes (must fix, no exceptions)

- [x] **0.1** FIX: Bot token exposed in URLs and error logs. `packs/telegram/src/auth/bot-token.ts:23`. The `getApiBaseUrl()` embeds the token in the URL, which leaks via error messages to Claude through `toMcpToolError`. Fix: separate the token from the URL, inject it as an Authorization header or in the request body. Write test: trigger an API error, verify token is NOT in the error message string.

- [x] **0.2** FIX: Generator emits broken OAuth, no PKCE, drops codeVerifier. `generator/src/codegen/auth.ts:45` hardcodes `usePKCE: false`. `generator/src/codegen/server.ts:62` destructures only `{ url, state }`, discarding `codeVerifier`. Fix: set `usePKCE: true`, destructure `{ url, state, codeVerifier }`, pass `codeVerifier` to token exchange. Write test: generate an OAuth pack, verify output includes PKCE flow with code_verifier.

- [x] **0.3** FIX: TokenStore.clear() writes `{}` instead of deleting. `core/src/auth/token-store.ts:68`. After clearing, `load()` returns `{}` cast as TokenData, so `isAuthenticated()` returns true. Fix: `clear()` should delete the file, and `load()` should return `null` when file doesn't exist. Write test: clear tokens, verify `isAuthenticated()` returns false.

- [x] **0.4** FIX: No origin check on message relay in Poking. `preview-panel.ts:95`. Any origin can inject fake poke data via postMessage. Fix: check `event.origin` matches the expected dev server URL or the webview's own origin. Write test: send a message with wrong origin, verify it's rejected.

- [x] **0.5** FIX: `poking.off` disposes OutputChannel but commands still reference it. `commands.ts:34`. After `bridge.dispose()`, calling `poking.open` again throws. Fix: either don't dispose the OutputChannel on `off` (just clear it), or re-create it on next `open`. Write test: call off then open, verify no throw.

### Important Fixes (should fix before V2)

- [x] **0.6** FIX: `isAuthenticated()` triggers unnecessary re-auth in 60s buffer window. `core/src/auth/oauth2.ts:54`. Fix: buffer should trigger refresh, not full re-auth. Write test.

- [x] **0.7** FIX: Rate limiter spins uselessly on daily exhaustion. Fix: throw immediately with `retryable: false` when daily quota is hit. Write test.

- [x] **0.8** FIX: TokenStore.load() does no runtime validation. Fix: add Zod or manual validation of loaded JSON against TokenData shape. Return null on invalid data. Write test with corrupted token file.

- [x] **0.9** FIX: sanitizeGroupName can return empty string. Fix: if sanitized result is empty, use a fallback like `"unnamed_group"`. Write test with `"@!#"` input.

- [x] **0.10** FIX: innerHTML sent to Claude unnecessarily. `poking/overlay/extractor.ts:65`. Fix: remove innerHTML from extraction. The formatter doesn't use it. Write test.

- [x] **0.11** FIX: postMessage uses `'*'` targetOrigin. `poking/extension/preview-panel.ts:105`. Fix: use the specific origin of the loaded page. Write test.

- [x] **0.12** FIX: detectFramework runs full DOM queries on every click. `resolver-factory.ts`. Fix: cache the result after first detection, invalidate on page navigation. Write test.

- [x] **0.13** Run full test suite, confirm all V1 tests pass plus new regression tests. Zero failures before proceeding.

---

## Phase 1: Forge Foundation

- [x] **1.1** Create `src/forge/preset-schema.ts`: define the TypeScript interface and validation function for design presets. Fields: name, id, author, description, tokens (colors, typography, spacing, borders, shadows, animations), componentOverrides, forbiddenPatterns, requiredFonts, shadcnTheme. Validation: all required fields present, Tailwind classes in overrides are syntactically valid, no contradictions between overrides and forbidden patterns.

- [x] **1.2** Create `presets/neo-brutalism.json`: first design preset. Bold borders (3px solid black), no rounded corners, chunky offset shadows, uppercase headings in Space Grotesk, raw background colors. Full component overrides for button, card, input, link, badge, alert. Forbidden: rounded-lg, rounded-xl, bg-gradient-to-*, shadow-sm, shadow-md, opacity-*, blur-*.

- [x] **1.3** Create `presets/glassmorphism.json`: frosted glass effects, backdrop-blur, semi-transparent backgrounds, subtle borders, soft shadows, rounded corners, Inter font. Forbidden: border-3, shadow-[*px_*px], uppercase.

- [x] **1.4** Create `presets/minimalist-swiss.json`: Helvetica/Arial, strict grid, black/white/red only, lots of whitespace, no decorative elements, no shadows, thin borders. Forbidden: gradient, shadow, rounded-full, text-transform except uppercase for headings.

- [x] **1.5** Create `scripts/validate-presets.js`: reads all JSON files in `presets/`, validates each against the schema, reports errors. Exit 1 if any fail.

- [x] **1.6** Write `tests/forge/preset-schema.test.ts`: test validation with valid preset, invalid preset (missing fields), preset with contradictions, preset with invalid Tailwind classes.

- [x] **1.7** Create `src/forge/preset-applicator.ts`: given a preset and a project root, generates instructions for Claude to apply the preset. Reads tailwind.config.ts/js, outputs the token changes needed. Reads all .tsx/.jsx files, identifies component classes that match override targets, outputs the class replacements. Does NOT make changes directly, it produces a structured changeset that Claude applies.

- [x] **1.8** Create `src/forge/token-editor.ts`: reads the current project's tailwind.config, extracts design tokens (colors, fonts, spacing, radii, shadows), returns them as structured data. Also: writes updated tokens back to tailwind config when given new values.

- [x] **1.9** Create `src/forge/anti-slop.ts`: given a preset's forbiddenPatterns and a file's content, detects violations. Returns list of { file, line, pattern, suggestion }. Used by the SKILL.md to teach Claude what not to do.

- [x] **1.10** Write `skills/forge/SKILL.md`: teaches Claude how to use Forge. When user says "apply neo-brutalism", read the preset, use the applicator, apply changes systematically. Always check forbiddenPatterns before generating any code. When editing existing elements, check the active preset's rules. When user says "show me my tokens", use the token editor to read and display.

- [x] **1.11** Write `commands/forge.md`: defines /forge command with subcommands: browse, apply, tokens, components.

- [x] **1.12** Create `src/mcp/tools/forge-tools.ts`: MCP tools: `forge_list_presets`, `forge_get_preset`, `forge_apply_preset`, `forge_get_tokens`, `forge_set_tokens`, `forge_check_violations`. Register in server.ts.

- [x] **1.13** Write `tests/forge/preset-applicator.test.ts`: mock a simple tailwind.config and .tsx file, apply neo-brutalism preset, verify output changeset is correct.

- [x] **1.14** Write `tests/forge/token-editor.test.ts`: mock tailwind.config, read tokens, modify a color, write back, verify config is updated correctly.

- [x] **1.15** Write `tests/forge/anti-slop.test.ts`: provide code with forbidden patterns, verify violations are detected with correct file/line/pattern.

- [x] **1.16** Verify Phase 1: all tests pass, presets validate, applicator produces correct output, no V1 regressions.

---

## Phase 2: Forge Full + MCPancake

- [x] **2.1** Create remaining 7 presets: retro-terminal, soft-pastel, dark-luxe, newspaper, y2k, organic-earth, corporate-clean. Each with full tokens, overrides, forbidden patterns. Validate all.

- [x] **2.2** Create `src/shared/mcpancake-router.ts`: MCP orchestration layer. On init, discovers which MCPs are available (shadcn, figma, context7, magic-ui, playwright, linkraft). Exposes intent-based methods: `findComponent(query)`, `getDesignTokens()`, `getDocs(component, library)`, `generateComponent(prompt, tokens)`, `screenshot(selector?)`, `distribute(platform, content)`. Every method handles MCP unavailability gracefully (returns empty array or null, logs warning).

- [x] **2.3** Create `src/forge/component-browser.ts`: uses MCPancake to search components across all available MCPs. Returns unified results with: name, source library, preview URL (if available), install command, description. Filters by tag, framework, styling approach.

- [x] **2.4** Create `src/mcp/tools/mcpancake.ts`: MCP tools that expose the router: `mcpancake_search_components`, `mcpancake_get_docs`, `mcpancake_available_mcps`. Register in server.ts.

- [x] **2.5** Write `tests/forge/component-browser.test.ts`: mock MCP responses from shadcn and magic-ui, verify unified results format, verify graceful handling when one MCP is unavailable.

- [x] **2.6** Write `tests/shared/mcpancake-router.test.ts`: test with zero MCPs available (should work), one MCP, multiple MCPs. Test fallback behavior.

- [x] **2.7** Update `skills/forge/SKILL.md` with component browsing instructions: when user says "find me a hero component", use mcpancake to search. When user says "install this component", use the appropriate MCP's install tool.

- [x] **2.8** Verify Phase 2: all presets valid, MCPancake works with mocked MCPs, component browser returns unified results, no regressions.

---

## Phase 3: Vault

- [ ] **3.1** Define vault component schema in `src/vault/types.ts`: name, author, description, framework, styling, tags, designSystem, code (file contents as record), preview (screenshot base64 or URL), dependencies, props interface, downloads count, stars count.

- [ ] **3.2** Create `src/vault/component-packager.ts`: given a source file path (from poke selection or manual input), extracts the component and its local dependencies into a self-contained vault package. Reads imports, resolves relative imports, bundles them. Strips project-specific paths. Generates metadata from the component's props/exports.

- [ ] **3.3** Create `src/vault/vault-client.ts`: reads the vault GitHub repo (`akellainmotion/poking-vault`). Lists available components, searches by tag/name/style, downloads a component package. For V2: read-only. Uses GitHub raw content URLs (no API key needed for public repos).

- [ ] **3.4** Create `src/vault/competition.ts`: manages competition state in `.vault/competitions.json`. Create competition (name, deadline, prize). Submit component (links to vault entry). List submissions. Leaderboard (sorted by stars/downloads).

- [ ] **3.5** Create `src/mcp/tools/vault-tools.ts`: MCP tools: `vault_browse`, `vault_search`, `vault_install`, `vault_save` (packages current poke selection), `vault_my_components`, `vault_competition_list`, `vault_competition_submit`. Register in server.ts.

- [ ] **3.6** Write `commands/vault.md`: /vault command with subcommands: browse, search, save, install, my-components, share, competition.

- [ ] **3.7** Write `tests/vault/component-packager.test.ts`: mock a React component with local imports, package it, verify output is self-contained and metadata is correct.

- [ ] **3.8** Write `tests/vault/vault-client.test.ts`: mock GitHub API responses, test browse, search, download. Test offline/unavailable gracefully.

- [ ] **3.9** Verify Phase 3: vault client reads mock repo, packager produces valid packages, competition system tracks state, no regressions.

---

## Phase 4: Dreamroll

- [ ] **4.1** Create `src/dreamroll/types.ts`: interfaces for DreamrollConfig, DreamrollState, Variation, JudgeScore, JudgeVerdict, SeedParameters, WildcardMutation, EvolutionAdjustment, MorningReport.

- [ ] **4.2** Create `src/dreamroll/wildcards.ts`: exported array of 50+ wildcard prompt mutations. Each is a string that gets injected into the generation prompt to force creative divergence. Include all wildcards from SecretWeapon-V2-SPEC.md section 5.5 plus at least 30 more covering: era-specific (1920s, 1960s, 1980s, 2000s, far future), medium-specific (magazine, poster, billboard, book cover, album art), constraint-specific (one font only, no images, monochrome, only circles), culture-specific (Japanese minimalism, Scandinavian, Bauhaus, Memphis), emotion-specific (anxiety, joy, nostalgia, urgency, calm).

- [ ] **4.3** Create `agents/dreamroll-brutus.md`: full judge personality prompt per SecretWeapon-V2-SPEC.md section 5.6. Ruthless minimalist. Scoring criteria, roast style, examples.

- [ ] **4.4** Create `agents/dreamroll-venus.md`: full aesthete personality per spec.

- [ ] **4.5** Create `agents/dreamroll-mercury.md`: full conversion machine personality per spec.

- [ ] **4.6** Create `src/dreamroll/judges.ts`: loads judge prompts from `agents/dreamroll-*.md`. Spawns a Claude API call for each judge (using Anthropic API via the plugin's context). Parses scores (1-10) and roast comments from responses. Returns JudgeVerdict with per-judge scores and overall average.

- [ ] **4.7** Create `src/dreamroll/generator.ts`: the main generation loop. For each variation: roll random seed parameters (color palette, typography, layout archetype, genre, density, mood), select a random wildcard, vary temperature (0.7-1.3), generate a prompt, call Claude to create the variation, save to worktree, take screenshot via Playwright. This is the core engine.

- [ ] **4.8** Create `src/dreamroll/state.ts`: persistent state manager. Saves/loads `.dreamroll/state.json`. Tracks: current variation number, all seed params used, all gems, all scores, evolution adjustments, elapsed time. Enables resume after crash.

- [ ] **4.9** Create `src/dreamroll/evolution.ts`: every N variations (configurable, default 10), analyze the gems so far. Detect patterns: which layout archetypes score highest? which color approaches? which wildcards produced gems? Adjust seed parameter weights to explore promising directions. BUT: also inject mandatory chaos (at least 20% of variations use fully random params regardless of evolution).

- [ ] **4.10** Create `src/dreamroll/reporter.ts`: generates the morning report. Reads state, formats top gems, emerging patterns, wildcard discoveries, full statistics. Writes to `.dreamroll/report.md`. Also generates a compact summary for MEMORY.md.

- [ ] **4.11** Create `src/mcp/tools/dreamroll-tools.ts`: MCP tools: `dreamroll_start` (begins a run with config), `dreamroll_status` (shows current progress), `dreamroll_stop` (gracefully stops after current variation), `dreamroll_gems` (lists all gems with scores), `dreamroll_report` (generates/shows morning report), `dreamroll_resume` (continues from state file). Register in server.ts.

- [ ] **4.12** Write `commands/dreamroll.md`: /dreamroll command with subcommands: start, status, stop, gems, report, resume.

- [ ] **4.13** Write `skills/dreamroll/SKILL.md`: teaches Claude when and how to run Dreamroll. Explains the generation loop, judge system, evolution, resume capability. Instructs Claude on how to present results to user.

- [ ] **4.14** Write `tests/dreamroll/wildcards.test.ts`: verify all wildcards are unique strings, no duplicates, minimum 50 entries.

- [ ] **4.15** Write `tests/dreamroll/judges.test.ts`: mock Claude API responses, test judge prompt loading, score parsing, verdict calculation. Test: average >= 7 = gem, average >= 5 = iterate, < 5 = discard, any single 10 = instant keep.

- [ ] **4.16** Write `tests/dreamroll/state.test.ts`: test save/load cycle, test resume from partial state, test corruption handling.

- [ ] **4.17** Write `tests/dreamroll/evolution.test.ts`: provide mock gem data, verify pattern detection produces reasonable adjustments, verify chaos injection (>= 20% random).

- [ ] **4.18** Write `tests/dreamroll/reporter.test.ts`: provide mock state, verify report output contains top gems, patterns, stats.

- [ ] **4.19** Integration test: run a mini Dreamroll (3 variations, mocked Claude + mocked Playwright). Verify full loop: generate -> judge -> score -> state update -> report.

- [ ] **4.20** Verify Phase 4: all tests pass, judge prompts load correctly, state persists and resumes, evolution adjusts, reporter produces readable output, no regressions.

---

## Phase 5: Launchpad

- [ ] **5.1** Create `src/launchpad/types.ts`: interfaces for LaunchBrief, CompetitorAnalysis, PageCopy, Wireframe, AssetList, SEOConfig, AnalyticsConfig, TestResults, DistributionPlan.

- [ ] **5.2** Create `src/launchpad/planner.ts`: generates the `.launchpad/` directory with planning documents. Takes a product description as input. Uses web search MCP (if available) for competitor analysis. Generates: brief.md, research.md, copy.md (headline, subhead, features, testimonials, CTA), wireframe.md (section-by-section structure), assets.md (image/icon/illustration requirements), seo.md (meta tags, OG tags, schema), analytics.md (tracking events).

- [ ] **5.3** Create `src/launchpad/builder.ts`: reads the plan files, selects a Forge preset (user-chosen or auto-selected based on product type), uses MCPancake to find and install components, orchestrates Claude to build the full page. Output: a complete page file in the user's project.

- [ ] **5.4** Create `src/launchpad/tester.ts`: runs quality checks on the built page. Lighthouse CLI for performance/accessibility/SEO/best-practices scores. Playwright for screenshots at 375, 768, 1024, 1440px widths. CTA visibility check (is primary CTA in viewport at each width?). Social preview mock (OG image rendering). Returns TestResults with scores, screenshots, and recommendations.

- [ ] **5.5** Create `src/launchpad/distributor.ts`: generates distribution content. Uses Linkraft MCPs (if available) to draft posts for LinkedIn, Twitter, Instagram. Generates Reddit/forum post drafts. Generates Product Hunt launch copy. Generates email announcement draft. All drafts saved to `.launchpad/distribution/`. Does NOT post automatically (drafts for human review).

- [ ] **5.6** Create `src/mcp/tools/launchpad-tools.ts`: MCP tools: `launchpad_plan`, `launchpad_build`, `launchpad_test`, `launchpad_distribute`, `launchpad_status`. Register in server.ts.

- [ ] **5.7** Write `commands/launchpad.md`: /launchpad command with subcommands: plan, build, test, distribute, status.

- [ ] **5.8** Write `skills/launchpad/SKILL.md`: teaches Claude the full pipeline. When user says "build me a landing page for X", run the full plan -> build -> test -> distribute flow. When user says "just plan", stop after planning. When user says "test my page", run tester on existing page.

- [ ] **5.9** Write `tests/launchpad/planner.test.ts`: mock web search results, verify plan output has all required files with non-empty content.

- [ ] **5.10** Write `tests/launchpad/tester.test.ts`: mock Lighthouse and Playwright, verify TestResults structure, verify CTA check logic.

- [ ] **5.11** Write `tests/launchpad/distributor.test.ts`: mock Linkraft MCPs, verify draft generation for each platform. Verify graceful handling when Linkraft not available.

- [ ] **5.12** Verify Phase 5: all tests pass, plan generates complete docs, builder produces a page, tester returns scores, distributor generates drafts, no regressions.

---

## Phase 6: Polish & Launch

- [ ] **6.1** Update README.md: V2 features (Forge, Vault, Dreamroll, Launchpad), install instructions, usage examples for each feature, MCPancake explanation, contributing guide, credits section.

- [ ] **6.2** Update SETUP.md: zero-config setup, enhanced setup with Babel plugin, optional MCP connections (shadcn, Figma, etc.), Dreamroll requirements (Playwright).

- [ ] **6.3** Write CONTRIBUTING.md: how to create a preset, how to add a vault component, how to write a new judge personality, how to add MCP support to MCPancake, code standards, PR process.

- [ ] **6.4** Update `.claude-plugin/plugin.json`: add all V2 skills, agents, commands. Verify plugin structure validates.

- [ ] **6.5** Update `marketplace.json` entry (in Linkraft repo) with V2 description and keywords.

- [ ] **6.6** Create the vault repo skeleton: `akellainmotion/poking-vault` with marketplace.json, README, CONTRIBUTING, and 3 example components.

- [ ] **6.7** Create `scripts/validate-plugin.js`: validates the entire plugin structure (all skills exist, all agents exist, all commands exist, plugin.json is valid, .mcp.json is valid).

- [ ] **6.8** Final verification: full compile, full lint, ALL tests pass (V1 + V2), all presets validate, plugin structure valid, overlay bundles, extension bundles. Zero failures.

- [ ] **6.9** Prepare launch: demo video script (Forge apply in 30 seconds, Dreamroll morning report reveal, Launchpad full pipeline), BaB carousel outline, CHAI Dublin presentation notes.
