# Linkraft Setup

## Prerequisites

- Node.js >= 18
- Claude Code (CLI, VS Code extension, or web app)

That's it. No API keys. No external services. No config files to create.

## Install

1. Clone and build:

```bash
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft/poking
npm install
npm run build
```

2. Add the MCP server to your project's `.mcp.json` (create if it doesn't exist):

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

Replace `/absolute/path/to/` with the actual path where you cloned the repo.

3. Restart Claude Code. The Linkraft tools are now available.

## First Commands to Try

### Generate a CLAUDE.md for your project

```
/linkraft plan claude-md
```

Scans your project, detects the stack, conventions, commands. Writes a CLAUDE.md that makes Claude understand your project from day one.

### Start visual inspection

```
/linkraft poke http://localhost:3000
```

First time: Linkraft detects your framework and offers to add the overlay.

- **Vite/Next.js**: Claude adds one line to your dev config (dev-only, auto-stripped in prod)
- **Any other framework**: generates a bookmarklet you drag to your bookmarks bar

### Run autonomous QA

```
/linkraft sheep
```

Reads your project, generates a QA plan, starts hunting bugs. Zero config.

## Overlay Injection (Poke Mode)

The poke overlay (11KB, zero dependencies) needs to run in your app's browser context.

### Option A: Auto-injection (recommended)

Run `/linkraft poke` and Linkraft will detect your framework:

**Vite**: adds a dev-only plugin to `vite.config.ts`:
```typescript
{
  name: 'poke-overlay',
  transformIndexHtml(html) {
    if (process.env.NODE_ENV === 'production') return html;
    return html.replace('</body>', '<script src="overlay.js"></script></body>');
  }
}
```

**Next.js**: adds a dev-only script to your layout:
```tsx
{process.env.NODE_ENV === 'development' && (
  <script src="overlay.js" />
)}
```

### Option B: Bookmarklet (any framework)

Run `/linkraft poke` on an unknown framework and it generates a bookmarklet. Drag it to your bookmarks bar, click it on any localhost page.

### Option C: Manual (if needed)

Add to your dev HTML:
```html
<script src="/path/to/Linkraft/poking/dist/overlay.js"></script>
<script>PokeOverlay.init();</script>
```

## Optional: React 19+ Babel Plugin

React 19 removed `_debugSource`. For exact file and line mapping:

```bash
npm install --save-dev poking-babel-plugin
```

**Vite:**
```typescript
react({ babel: { plugins: ['poking-babel-plugin'] } })
```

**Next.js (.babelrc):**
```json
{ "plugins": ["poking-babel-plugin"] }
```

Adds `data-poke-file` and `data-poke-line` attributes in dev mode. Stripped in production.

## Optional: MCP Connections

Linkraft works without any external MCPs. These are optional enhancements:

| MCP | What It Adds |
|-----|-------------|
| shadcn | Component browsing and installation via Forge |
| Context7 | Latest framework docs (instead of training knowledge) |
| Figma | Import design tokens from Figma files |
| Playwright | Screenshots for Dreamroll and Launchpad testing |

## Troubleshooting

**"No element selected"**: click an element in the preview first. Make sure poke mode is enabled.

**Overlay doesn't appear**: run `/linkraft poke` and follow the injection instructions. Check browser console for errors.

**Vault shows "bundled" components**: the vault repo may be unreachable. Bundled components still work. Run `/linkraft vault browse --retry` when online.

**Sheep says "no test suite detected"**: add a test script to your package.json, or Sheep runs build-only verification.

**TypeScript errors after build**: make sure you're on Node.js >= 18 and ran `npm install` first.
