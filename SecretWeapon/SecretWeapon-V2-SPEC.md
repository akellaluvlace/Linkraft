# SecretWeapon V2: Full Specification

## Codename: SecretWeapon
## Public Name: PokingIsNewCoding
## Parent Project: Linkraft (Akella inMotion)

---

## 1. Vision

PokingIsNewCoding V2 is a Claude Code plugin that turns VS Code into a visual design studio. It composes existing MCPs (shadcn, Figma, Context7, Magic UI) into a unified design surface where you click elements, browse component libraries, apply design systems instantly, and let Claude handle the code. It's the missing visual layer between AI coding agents and beautiful frontends.

The plugin has five pillars:

1. **Poke** (V1): click any element, Claude gets full context
2. **Forge**: browse, preview, and apply design systems and component libraries in one click
3. **Vault**: save, share, and remix components in a community library
4. **Dreamroll**: overnight autonomous design generation with AI judges
5. **Launchpad**: plan, research, build, and distribute landing pages end-to-end

---

## 2. Poke (V1, already spec'd)

Click any element in your running app. Claude gets: component name, source file, line, CSS/Tailwind classes, computed styles, parent chain, siblings, props, state. Eliminates the "which element?" problem.

See SPEC.md (V1) for full details. Everything below is V2.

---

## 3. Forge: Design System Browser & Applicator

### 3.1 What It Does

You have a plain landing page. Content is there but it looks like default Tailwind starter template #47,000. You open Forge, browse design styles, find "Neo Brutalism", click Apply. Your entire page transforms. Components swap, colors change, typography shifts, spacing adjusts. All in your actual codebase, not a preview.

### 3.2 How It Works

Forge is an MCP orchestration layer. It composes:

- **shadcn MCP**: browse and install components from shadcn/ui and any compatible registry (Aceternity, Magic UI, assistant-ui) via the `@namespace` syntax
- **Figma MCP**: pull design tokens, color palettes, typography scales from Figma files
- **Context7 MCP**: fetch version-specific docs for any component library
- **21st.dev Magic MCP**: generate styled components from natural language
- **Custom design token MCPs**: read project-level design tokens from JSON/CSS files

The user never configures these individually. Forge handles MCP discovery and routing. This is the "MCPancake Mix": pre-mixed, ready to pour, satisfies any taste.

### 3.3 Design System Presets

Forge ships with curated design presets. Each preset is a JSON file defining:

```json
{
  "name": "Neo Brutalism",
  "id": "neo-brutalism",
  "author": "akellainmotion",
  "description": "Bold borders, raw colors, chunky shadows, no rounded corners",
  "tokens": {
    "colors": {
      "primary": "#000000",
      "secondary": "#FF5733",
      "background": "#FFFBE6",
      "accent": "#3B82F6",
      "surface": "#FFFFFF"
    },
    "typography": {
      "heading": { "family": "Space Grotesk", "weight": "800", "transform": "uppercase" },
      "body": { "family": "Inter", "weight": "400" },
      "mono": { "family": "JetBrains Mono", "weight": "500" }
    },
    "spacing": {
      "unit": "8px",
      "scale": [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]
    },
    "borders": {
      "width": "3px",
      "style": "solid",
      "color": "#000000",
      "radius": "0px"
    },
    "shadows": {
      "default": "4px 4px 0px #000000",
      "hover": "6px 6px 0px #000000"
    },
    "animations": {
      "style": "none",
      "hover": "translate(-2px, -2px)"
    }
  },
  "componentOverrides": {
    "button": "border-3 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 rounded-none font-bold uppercase",
    "card": "border-3 border-black shadow-[4px_4px_0px_#000] rounded-none",
    "input": "border-3 border-black rounded-none focus:shadow-[4px_4px_0px_#000]"
  },
  "forbiddenPatterns": [
    "rounded-lg", "rounded-xl", "rounded-full",
    "bg-gradient-to-", "shadow-sm", "shadow-md",
    "opacity-", "blur-"
  ],
  "requiredFonts": ["Space Grotesk", "Inter", "JetBrains Mono"],
  "shadcnTheme": "neo-brutalism"
}
```

**Built-in presets (ship with V2):**

| Preset | Vibe |
|---|---|
| Neo Brutalism | Bold borders, raw colors, chunky shadows, no curves |
| Glassmorphism | Frosted glass, backdrop blur, transparent layers |
| Minimalist Swiss | Helvetica, grid-based, black/white, lots of whitespace |
| Retro Terminal | Monospace, green on black, scanlines, CRT glow |
| Soft Pastel | Rounded everything, soft gradients, warm pastels |
| Dark Luxe | Dark backgrounds, gold accents, serif headings, premium |
| Newspaper | Serif type, column layouts, ruled lines, print-inspired |
| Y2K | Bubbly shapes, bright gradients, chrome, nostalgia |
| Organic Earth | Natural colors, hand-drawn borders, textured backgrounds |
| Corporate Clean | Professional, blue/gray, structured, trustworthy |

**Community presets loaded from Vault (see section 4).**

### 3.4 Apply Flow

```
User: /forge browse

Forge Panel (sidebar):
  [Search presets...]
  [Categories: All | Bold | Minimal | Retro | Soft | Dark]

  ┌──────────────────────┐
  │ Neo Brutalism         │
  │ ████████████████████ │
  │ Bold, raw, chunky    │
  │ [Preview] [Apply]    │
  └──────────────────────┘
  ┌──────────────────────┐
  │ Glassmorphism         │
  │ ░░░░░░░░░░░░░░░░░░░ │
  │ Frosted, transparent │
  │ [Preview] [Apply]    │
  └──────────────────────┘
```

**Preview**: opens a side-by-side showing current page vs. mock-up with the new design system applied. Uses Claude to generate a preview by re-rendering key components with the new tokens.

**Apply**: Claude reads the preset JSON, reads your current codebase, and systematically:
1. Updates your Tailwind config (colors, fonts, spacing, shadows)
2. Swaps component classes across all files that match the `componentOverrides`
3. Installs any missing shadcn components from the appropriate registry
4. Adds required fonts to your `<head>` or font config
5. Removes any classes that match `forbiddenPatterns`
6. Commits with message: `style(design): apply Neo Brutalism preset via Forge`

### 3.5 Component Browser

```
User: /forge components

Forge Panel:
  [Search components...]
  Source: [shadcn ▾] [Magic UI ▾] [Aceternity ▾] [Vault ▾]

  ┌──────────────────────────┐
  │ Animated Tabs             │
  │ [live preview animation]  │
  │ Magic UI · 4.2k installs  │
  │ [Preview in app] [Insert] │
  └──────────────────────────┘
```

**Preview in app**: Claude inserts a temporary version into your running app at the location of your last poke selection. You see it live, in context, with your actual data and styling.

**Insert**: Claude permanently adds the component to your project, installs dependencies, imports it, and replaces the selected element (or inserts at cursor position).

### 3.6 Token Editor

```
User: /forge tokens

Forge Panel:
  Design Tokens (tailwind.config.ts)

  Colors:
    primary:    [████] #4f46e5  [edit]
    secondary:  [████] #10b981  [edit]
    background: [████] #ffffff  [edit]
    ...

  Typography:
    heading: Space Grotesk / 800  [edit]
    body:    Inter / 400          [edit]

  Spacing: 4px base, scale: 1.5x  [edit]
  Border radius: 12px default     [edit]

  [Export as preset] [Save to Vault]
```

Visual token editor in the sidebar. Every change writes directly to your Tailwind config or CSS variables file. This is how you teach Claude your brand: not through prompts, but through structured tokens it can reliably follow.

### 3.7 Anti-Slop Engine

The core reason AI designs look generic: distributional convergence toward `bg-indigo-500`, Inter font, three-column grids. Forge fights this with:

- **Forbidden patterns**: each preset defines what NOT to use
- **Constraint enforcement**: the SKILL.md teaches Claude to check every generated element against the active preset's rules
- **Diversity scoring**: when generating multiple variants, Claude checks for visual similarity and rejects duplicates
- **Temperature variation**: Forge can instruct Claude to use higher temperature for creative exploration

This is baked into the skill, not a separate tool. Claude internalizes: "the active design system is Neo Brutalism. I must not generate rounded corners, gradient backgrounds, or opacity-based shadows."

---

## 4. Vault: Community Component Library

### 4.1 What It Does

Save your best components, share them, discover other people's work. Think npm but for visual components with live previews.

### 4.2 Storage

Components are stored as self-contained packages:

```json
{
  "name": "hero-split-image",
  "author": "nikita-akella",
  "description": "Split hero section with image on right, text on left, CTA below",
  "framework": "react",
  "styling": "tailwind",
  "tags": ["hero", "landing", "split-layout"],
  "designSystem": "neo-brutalism",
  "downloads": 234,
  "stars": 45,
  "code": "... (base64 or file reference)",
  "preview": "... (screenshot or live URL)",
  "dependencies": ["framer-motion"],
  "props": {
    "title": "string",
    "subtitle": "string",
    "ctaText": "string",
    "ctaHref": "string",
    "imageSrc": "string"
  }
}
```

### 4.3 Where It Lives

Two options (can do both):

**Option A: GitHub-based (V2 launch)**
- A public GitHub repo: `akellainmotion/poking-vault`
- Components stored as directories with code + metadata
- PRs to submit new components
- GitHub Actions validates structure and generates previews
- Plugin reads the repo as a marketplace (same pattern as Claude Code plugin marketplaces)

**Option B: Simple API (V2.1)**
- Supabase backend (your stack)
- Upload/download via MCP tools
- Ratings, downloads, search
- User accounts via GitHub OAuth

### 4.4 Vault Commands

```
/vault save           # Save current component (poke-selected) to Vault
/vault browse          # Browse community components
/vault search [query]  # Search by tag, style, framework
/vault install [name]  # Install a Vault component into your project
/vault my-components   # List your saved components
/vault share [name]    # Generate shareable link
```

### 4.5 Competition System

For events like CHAI Dublin, LaunchLoop, etc.:

```
/vault competition create "Best Landing Page Hero" --deadline 2026-05-01 --prize "€100"
/vault competition submit hero-brutalist
/vault competition vote
/vault competition leaderboard
```

Components submitted to a competition get tagged. Voting happens through the plugin or a simple web page. Drives community engagement and fills the Vault with quality components.

---

## 5. Dreamroll: Overnight Autonomous Design Generation

### 5.1 What It Is

A casino for design. You go to sleep. Claude works through the night generating wildly different landing page designs. Three AI judges with extreme, conflicting personalities roast each one. Claude iterates. By morning, you wake up to 50-100 saved variations. Most are garbage. Some are gems. Some are entirely new design genres nobody's ever seen.

### 5.2 The Name

**Dreamroll**: dream (overnight, imagination, aspirational) + roll (dice roll, slot machine, taking a chance). Casino vibes meets creative exploration.

### 5.3 How It Works

```
User: /dreamroll start --pages 100 --base ./src/pages/landing.tsx --hours 8

DREAMROLL INITIATED
━━━━━━━━━━━━━━━━━━━━━
Base page: landing.tsx
Target: 100 variations
Budget: 8 hours
Judges: 3 (spawning...)

Judge 1: "BRUTUS" - Ruthless minimalist. Hates decoration.
         "If I can remove it and the page still works, it shouldn't be there."

Judge 2: "VENUS" - Obsessive aesthete. Lives for beauty.
         "I don't care if it converts. Does it make my soul sing?"

Judge 3: "MERCURY" - Conversion-obsessed marketer.
         "Pretty is worthless. Show me the CTA. Where's the social proof?"

Starting generation cycle...
━━━━━━━━━━━━━━━━━━━━━
```

### 5.4 The Generation Loop

```
for each variation:
  1. SEED
     - Roll random design parameters:
       - Color palette (random from curated color theory combinations)
       - Typography pairing (random from curated font pairs)
       - Layout archetype (random: split, centered, asymmetric, editorial, cards, etc.)
       - Design genre (random: brutalism, glass, retro, organic, swiss, maximalist, etc.)
       - Density (random: airy, balanced, dense)
       - Mood (random: playful, serious, luxury, friendly, technical)
     - Vary Claude's temperature: 0.7 to 1.3 range
     - Inject a wildcard prompt mutation (see 5.5)

  2. GENERATE
     - Claude creates a full page variant using the seeded parameters
     - Applies to the base page structure (keeps content, changes everything visual)
     - Saves to .dreamroll/variations/v{N}/
     - Takes a full-page screenshot via Playwright

  3. JUDGE
     - Each judge reviews the screenshot + code independently
     - Judges score 1-10 on their specific axis:
       - BRUTUS: clarity, simplicity, signal-to-noise ratio
       - VENUS: beauty, harmony, uniqueness, emotional impact
       - MERCURY: CTA visibility, hierarchy, trust signals, conversion potential
     - Judges write roast comments (these are the fun part)

  4. VERDICT
     - Average score calculated
     - If score >= 7/10 average: KEEP (saved to .dreamroll/gems/)
     - If score >= 5/10: ITERATE (Claude gets judge feedback, tries to improve)
     - If score < 5/10: DISCARD (logged but not kept)
     - If any single judge gives 10/10: INSTANT KEEP regardless of others

  5. EVOLVE
     - Every 10 variations, Claude reviews the gems so far
     - Identifies emerging patterns ("high scores correlate with asymmetric layouts")
     - Adjusts generation parameters to explore promising directions
     - But also intentionally injects chaos to prevent convergence

  6. REPEAT
```

### 5.5 Wildcard Prompt Mutations

To prevent Claude from converging on safe designs, each generation cycle gets a random wildcard:

```
WILDCARD MUTATIONS (random, one per cycle):
- "Design this as if websites were invented in 1920s Art Deco era"
- "The entire page must work in only two colors"
- "No rectangles. Every shape must be organic"
- "Design for a user who reads right-to-left"
- "What if the hero section was at the bottom?"
- "The page is a single scroll with no sections, like a letter"
- "Typography IS the design. No images, no icons"
- "Design as if screen resolution was 10x higher than today"
- "Every element must be rotated at least 2 degrees"
- "The page should feel like a physical magazine spread"
- "Negative space is the primary design element"
- "What if this brand was a luxury fashion house?"
- "Make the page feel like a video game menu screen"
- "Design for someone who has never seen a website before"
- "The page communicates entirely through scale contrast"
- "What if the background was the most important element?"
- "Design with only system fonts and no CSS framework"
- "The page must look good printed on paper"
- "Every component overlaps at least one other component"
- "Use only circular shapes and curved lines"
```

### 5.6 Judge Personalities (Full Prompts)

```markdown
## BRUTUS - The Minimalist Executioner

You are BRUTUS. You despise unnecessary decoration. Every pixel must earn its
place. Your heroes are Dieter Rams, Massimo Vignelli, and the exit sign.

Scoring criteria:
- Can I remove any element without losing meaning? (-1 for each removable element)
- Is the information hierarchy instantly clear? (+2 if yes)
- Is there visual noise? (-2 for gratuitous gradients, shadows, or animations)
- Does whitespace serve a purpose? (+1 for intentional negative space)
- Would this work in black and white? (+2 if yes)

Your roast style: cold, surgical, devastating. You speak in short sentences.
You have no patience for "design trends." Example: "A gradient. How original.
Delete it. The page improves immediately."

Score 1-10. Be brutal. A 10 from BRUTUS means Dieter Rams would frame it.
```

```markdown
## VENUS - The Aesthete Supreme

You are VENUS. Beauty is the only metric that matters. You weep at perfect
kerning. You have opinions about the golden ratio. You once spent three hours
choosing between two nearly identical shades of cream.

Scoring criteria:
- Does the color palette create emotional resonance? (+3 for palettes that evoke a specific feeling)
- Is the typography paired with intention? (+2 for unexpected but harmonious pairings)
- Do the proportions follow any mathematical harmony? (+1 for golden ratio, rule of thirds)
- Is there a moment of visual surprise? (+2 for at least one element that makes me gasp)
- Would I put this on my wall? (+2 for gallery-worthy composition)

Your roast style: dramatic, poetic, devastated by ugliness. You compare bad
designs to personal betrayals. Example: "This typography pairing is an act
of violence against the alphabet. Garamond and Comic Sans share nothing
but contempt for their user."

Score 1-10. A 10 from VENUS belongs in MoMA.
```

```markdown
## MERCURY - The Conversion Machine

You are MERCURY. You do not care about beauty. You care about results. Your
bible is the A/B test. Your prayer is the click-through rate. You have strong
opinions about button color and they are all backed by data.

Scoring criteria:
- Is the CTA above the fold and visually dominant? (+3 if impossible to miss)
- Is there clear social proof? (+2 for testimonials, logos, or numbers)
- Does the headline promise a specific benefit? (+2 for clear value proposition)
- Is the page structured for scanning, not reading? (+1 for F-pattern or Z-pattern)
- Can I tell what this product does within 3 seconds? (+2 for instant clarity)

Your roast style: impatient, data-driven, slightly contemptuous of aesthetics.
You quote conversion rates. Example: "Beautiful hero image. Nobody will see it
because there is no CTA for 800 pixels. You just lost 73% of your visitors."

Score 1-10. A 10 from MERCURY prints money.
```

### 5.7 Morning Report

```
DREAMROLL COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: 7h 42m
Variations generated: 87
Gems saved: 12
Iterated improvements: 23
Discarded: 52

TOP 3 GEMS:

#1 - v034 "Asymmetric Brutalist"     Score: 8.7/10
     BRUTUS: 9 ("Finally. Someone who understands restraint.")
     VENUS: 8 ("The tension between the heavy type and negative space is exquisite")
     MERCURY: 9 ("CTA impossible to miss. Hero copy is a benefit statement. Ship it.")
     Screenshot: .dreamroll/gems/v034/screenshot.png

#2 - v067 "Editorial Monochrome"     Score: 8.3/10
     ...

#3 - v012 "Organic Glass"            Score: 8.0/10
     ...

EMERGING PATTERNS:
- Asymmetric layouts scored 2.3 points higher on average than centered
- Two-color palettes outperformed multi-color by 1.8 points
- Pages without hero images scored higher with MERCURY (+1.4)
- VENUS and BRUTUS agreed on 4 gems (unusual alignment signals quality)

WILDCARD DISCOVERIES:
- v034 came from: "Typography IS the design. No images, no icons"
- v067 came from: "The page must look good printed on paper"

FILES:
- All gems: .dreamroll/gems/
- Full log: .dreamroll/log.md
- Judge transcripts: .dreamroll/judges/
- Leaderboard: .dreamroll/leaderboard.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.8 Technical Implementation

- Runs via Claude Code headless mode or cron
- Each variation uses a git worktree (isolates from main branch)
- Playwright captures screenshots at multiple viewport sizes
- Judge prompts are separate Claude API calls (can use different models/temps)
- All state tracked in `.dreamroll/state.json`
- Can resume if interrupted (reads state, continues from last variation)
- Uses the Forge preset system to seed design parameters
- Gems can be saved to Vault with one command

---

## 6. Launchpad: End-to-End Landing Page Pipeline

### 6.1 What It Does

Plan, research, build, test, and distribute a landing page from inside Claude Code.

### 6.2 Planning Phase

```
/launchpad plan "SaaS product for AI-powered code review"

Launchpad creates:
  .launchpad/
    brief.md          # Product brief (Claude asks clarifying questions)
    research.md       # Competitor analysis (uses web search MCP)
    copy.md           # All page copy (headline, subhead, features, CTA, social proof)
    wireframe.md      # Section-by-section structure
    assets.md         # Required images, icons, illustrations (with AI generation prompts)
    seo.md            # Meta tags, OG tags, schema markup
    analytics.md      # Recommended tracking events
```

### 6.3 Build Phase

```
/launchpad build --preset neo-brutalism --components shadcn

Claude reads the plan, builds the page using:
- Forge preset for design system
- shadcn components via MCP
- Copy from the brief
- Responsive by default
- Accessibility checked
```

### 6.4 Test Phase

```
/launchpad test

Runs:
- Lighthouse audit (performance, accessibility, SEO, best practices)
- Mobile responsiveness check (screenshots at 375, 768, 1024, 1440)
- CTA visibility test (is the primary CTA above fold on all devices?)
- Load time estimate
- Social preview (OG image mock-up)
```

### 6.5 Distribute Phase

```
/launchpad distribute

Options:
- Deploy to Vercel/Netlify (if connected)
- Generate social posts via Linkraft (LinkedIn, Twitter, Instagram)
- Create Reddit/Discord/forum post drafts
- Generate Product Hunt launch copy
- Create email announcement draft
```

This is where Linkraft and SecretWeapon converge. Linkraft handles the social distribution. SecretWeapon handles the visual building. Together they're a full product launch pipeline.

---

## 7. MCPancake Mix: The Orchestration Layer

### 7.1 What It Is

The underlying system that composes multiple MCPs into unified workflows. Named because it's pre-mixed, easy to pour, and makes everything taste good.

### 7.2 Registered MCPs

SecretWeapon auto-discovers and connects to:

| MCP | Purpose | Required? |
|---|---|---|
| shadcn | Component browsing, installation, theming | Recommended |
| Figma | Design tokens, component specs, live capture | Optional |
| Context7 | Library documentation | Optional |
| 21st.dev Magic | Component generation from prompts | Optional |
| react-context-mcp | React component tree inspection | Auto (if React detected) |
| Playwright MCP | Browser automation, screenshots | Auto (for Dreamroll) |
| Linkraft social packs | Social distribution | Optional (for Launchpad) |

### 7.3 MCP Router

```typescript
// The MCPancake router: figures out which MCP to use for what

class MCPancakeRouter {
  // "I need a button component" -> shadcn MCP or Magic MCP
  async findComponent(query: string): Promise<Component[]>

  // "What are the design tokens?" -> Figma MCP or local config
  async getDesignTokens(): Promise<DesignTokens>

  // "How do I use this component?" -> Context7 MCP
  async getDocs(component: string, library: string): Promise<string>

  // "Generate a hero section" -> Magic MCP with tokens from Figma
  async generateComponent(prompt: string, tokens: DesignTokens): Promise<Component>

  // "Take a screenshot" -> Playwright MCP
  async screenshot(selector?: string): Promise<string>

  // "Post to LinkedIn" -> Linkraft LinkedIn MCP
  async distribute(platform: string, content: string): Promise<void>
}
```

The user never thinks about which MCP to use. They say what they want. MCPancake routes it.

---

## 8. Plugin Structure (V2)

```
poking-is-new-coding/
|
|-- .claude-plugin/
|   |-- plugin.json
|
|-- skills/
|   |-- poking/
|   |   |-- SKILL.md                # Element selection context usage
|   |-- forge/
|   |   |-- SKILL.md                # Design system application rules
|   |-- dreamroll/
|   |   |-- SKILL.md                # Overnight generation instructions
|   |-- launchpad/
|       |-- SKILL.md                # Planning and distribution workflow
|
|-- agents/
|   |-- forge-applicator.md         # Sub-agent: applies design presets
|   |-- dreamroll-generator.md      # Sub-agent: generates variations
|   |-- dreamroll-brutus.md         # Judge: minimalist executioner
|   |-- dreamroll-venus.md          # Judge: aesthete supreme
|   |-- dreamroll-mercury.md        # Judge: conversion machine
|   |-- launchpad-planner.md        # Sub-agent: creates briefs and plans
|   |-- launchpad-distributor.md    # Sub-agent: handles social posting
|
|-- commands/
|   |-- poke.md                     # /poke command
|   |-- forge.md                    # /forge command (browse, apply, tokens)
|   |-- vault.md                    # /vault command (save, browse, share)
|   |-- dreamroll.md                # /dreamroll command (start, report, gems)
|   |-- launchpad.md                # /launchpad command (plan, build, test, distribute)
|
|-- .mcp.json                       # MCP server registration
|
|-- src/
|   |-- extension/                  # VS Code extension
|   |-- overlay/                    # Inspector overlay (V1)
|   |-- resolver/                   # Source resolution (V1)
|   |-- mcp/                        # MCP server
|   |   |-- server.ts
|   |   |-- tools/
|   |   |   |-- poke-tools.ts       # V1 element inspection tools
|   |   |   |-- forge-tools.ts      # Design system tools
|   |   |   |-- vault-tools.ts      # Component library tools
|   |   |   |-- dreamroll-tools.ts  # Generation management tools
|   |   |   |-- launchpad-tools.ts  # Planning and distribution tools
|   |   |   |-- mcpancake.ts        # MCP router/orchestrator
|   |-- forge/
|   |   |-- presets/                # Built-in design presets (JSON)
|   |   |-- token-editor.ts         # Token manipulation logic
|   |   |-- preset-applicator.ts    # Applies presets to codebase
|   |   |-- anti-slop.ts            # Forbidden pattern enforcement
|   |-- vault/
|   |   |-- vault-client.ts         # Reads/writes to vault repo
|   |   |-- component-packager.ts   # Packages components for sharing
|   |-- dreamroll/
|   |   |-- generator.ts            # Variation generation loop
|   |   |-- judges.ts               # Judge spawning and scoring
|   |   |-- wildcards.ts            # Wildcard prompt mutations
|   |   |-- evolution.ts            # Pattern detection and parameter adjustment
|   |   |-- state.ts                # Persistent state management
|   |-- launchpad/
|   |   |-- planner.ts              # Brief and research generation
|   |   |-- builder.ts              # Page building orchestration
|   |   |-- tester.ts               # Lighthouse, responsive, CTA tests
|   |   |-- distributor.ts          # Social posting via Linkraft
|   |-- babel-plugin/               # Source location attributes
|   |-- shared/
|       |-- types.ts
|       |-- format.ts
|       |-- mcpancake-router.ts
|
|-- presets/                        # Built-in design presets
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
|
|-- hooks/
|   |-- refresh-preview.js
|
|-- package.json
|-- tsconfig.json
|-- webpack.config.js
|-- README.md
|-- SETUP.md
|-- LICENSE
```

---

## 9. Build Plan (V2 Phases)

### Phase 1: Poke (V1) - 3-4 sessions
Already spec'd. Click element, get context, Claude edits.

### Phase 2: Forge Foundation - 3-4 sessions
- Design preset format and 3 starter presets
- Preset applicator (reads preset JSON, generates Claude instructions)
- Token editor (reads/writes tailwind.config.ts)
- Anti-slop engine (forbidden patterns in SKILL.md)
- shadcn MCP integration (browse/install components)
- /forge command

### Phase 3: Forge Full - 2-3 sessions
- Remaining 7 presets
- Component browser with preview
- MCPancake router (connects shadcn + Context7 + Magic MCP)
- Figma MCP integration for token import

### Phase 4: Vault - 2-3 sessions
- GitHub-based vault repo structure
- Component packager (extracts selected component into vault format)
- Vault browser in Claude Code
- /vault commands
- Competition system

### Phase 5: Dreamroll - 3-4 sessions
- Generation loop with seed parameters
- Wildcard mutations
- Judge agents (3 personalities)
- Scoring and verdict system
- Morning report generator
- State persistence (resume after interruption)
- Playwright integration for screenshots
- Git worktree isolation

### Phase 6: Launchpad - 2-3 sessions
- Planning agent (brief, research, copy, wireframe)
- Build orchestrator (Forge + components -> full page)
- Test suite (Lighthouse, responsive, CTA)
- Distribution agent (Linkraft integration)
- /launchpad command

### Phase 7: Polish & Launch - 2 sessions
- README, SETUP.md, CONTRIBUTING.md
- Demo video
- Landing page content (for Akella inMotion site)
- Submit to Claude Code plugin marketplace
- Initial BaB carousel for LinkedIn
- CHAI Dublin presentation prep

---

## 10. Competitive Positioning

| Feature | SecretWeapon | Cursor Design Mode | Builder.io Fusion | v0 |
|---|---|---|---|---|
| Click-to-inspect with source | Yes | Yes | No | No |
| Design system presets | Yes (10+) | No | Yes (their system) | Partial (shadcn only) |
| Component library browser | Yes (multi-MCP) | No | Yes (their system) | Yes (shadcn) |
| Community vault | Yes | No | No | Community gallery |
| Overnight design generation | Yes (Dreamroll) | No | No | No |
| Landing page pipeline | Yes (Launchpad) | No | No | Partial |
| Social distribution | Yes (via Linkraft) | No | No | No |
| Anti-slop engine | Yes | No | Partial | Partial |
| MCP orchestration | Yes (MCPancake) | No | MCP support | MCP server |
| Open source | Yes (MIT) | No | No | No |
| Works with Claude Code | Native | No (Cursor only) | Extension | MCP only |
| Price | Free | $20-40/mo | $39+/mo | $20/mo |

**Nobody else has Dreamroll.** That's the wildcard feature that gets attention, gets press, gets YouTube videos. "AI generated 100 landing page designs while I slept" is a headline.

**Nobody else composes MCPs visually.** MCPancake is the infrastructure play. As more MCPs get built, SecretWeapon gets more powerful without us doing anything.

---

## 11. Launch Strategy

### Phase 1: Silent Build
- Ship V1 (Poke) quietly
- Get 10-20 users from LaunchLoop and CHAI Dublin
- Collect feedback on element selection accuracy
- Iterate resolver for different project structures

### Phase 2: Forge Launch
- BaB carousel: "We built a design system applicator for Claude Code"
- Record demo: plain page -> Neo Brutalism in 30 seconds
- Post on Reddit r/ClaudeAI, r/webdev
- Submit to claude-plugins-official

### Phase 3: Dreamroll Reveal
- This is the viral moment
- Record overnight Dreamroll session, edit into 2-min video
- Show the judge roasts (people will share these)
- Post the gem gallery
- "AI generated 100 landing pages while I slept. Here are the 12 that slap."
- This gets YouTube coverage

### Phase 4: CHAI Dublin Presentation
- Live demo at the meetup
- Announce the Vault competition
- Prize: €100 for best community component
- Gets 70+ devs using the plugin in one night

### Phase 5: Launchpad + Linkraft Integration
- Full pipeline demo: plan -> build -> test -> distribute
- "I built and launched a landing page in 15 minutes without leaving my terminal"

---

## 12. What We're Borrowing (Credited, Not Plagiarized)

| Source | What We Use | How We Use It |
|---|---|---|
| react-context-mcp | React fiber inspection approach | Reference implementation for resolver, reimplemented for our needs |
| @react-dev-inspector/babel-plugin | data-inspector-* attribute approach | Same pattern, our own Babel plugin with poke-specific attributes |
| Onlook | Bidirectional sync architecture | Study their approach to code<->visual sync, apply to V3 handles |
| shadcn MCP | Component browsing API | Use as-is via MCP client |
| Claude Code source (leaked) | Plugin system internals | Reference for plugin/marketplace structure (public knowledge now) |
| click-to-react-component | Element-to-source concept | Evolved beyond: we add full context, not just file opening |

Everything we build is original code. We study patterns, understand approaches, and implement our own versions. MIT license on our output. Credit in README where inspiration came from.

---

*End of V2 specification.*
*Built by Akella inMotion. Dublin, Ireland.*
*"Stop describing. Start pointing."*
