# PokingIsNewCoding

Click any element in your app. Claude gets the exact component, file, line, styles, props. Stop describing. Start pointing.

## The Problem

```
You: "Make the header text bigger"
Claude: *changes the wrong h1*
You: "No, the one in the hero section"
Claude: *changes the right h1 but breaks the layout*
```

This happens 10-15 times per UI task. PokingIsNewCoding kills this loop.

## How It Works

1. Start your dev server (`npm run dev`)
2. Run `/poke http://localhost:3000` in Claude Code
3. Click any element in the preview
4. Claude receives: component name, source file, line number, Tailwind classes, computed styles, parent chain, props, state
5. Say what you want changed. Claude edits the right file, right line. One shot.

## Install

```bash
# Clone and build
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft/poking
npm install
npm run build
```

Add to your Claude Code MCP settings (`.mcp.json`):
```json
{
  "mcpServers": {
    "poking": {
      "command": "node",
      "args": ["path/to/Linkraft/poking/dist/mcp/server.js"]
    }
  }
}
```

## For React 19+ (optional Babel plugin)

React 19 removed `_debugSource`. For exact source locations, add the Babel plugin:

```bash
npm install --save-dev poking-babel-plugin
```

```typescript
// vite.config.ts
react({ babel: { plugins: ['poking-babel-plugin'] } })
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `poke_get_selected_element` | Full context of clicked element |
| `poke_get_parent` | Parent element info |
| `poke_get_siblings` | Sibling elements |
| `poke_get_children` | Child elements |
| `poke_get_computed_styles` | All computed CSS properties |
| `poke_screenshot_element` | Screenshot with highlight |
| `poke_compare_elements` | Compare two elements (V2) |
| `poke_navigate` | Navigate to URL |

## Supported Frameworks

- React (full support: component name, file, line, props, state)
- Vue, Svelte (generic support, component mapping in V2)
- Plain HTML/CSS (DOM context, selector path, search hints)

## Tech

- Overlay: 10.9KB vanilla TypeScript bundle, zero dependencies, Shadow DOM isolated
- Extension: VS Code WebView with message bridge
- MCP Server: stdio transport, 13 tools
- 41 tests

## License

MIT

## Author

[Akella inMotion](https://www.akellainmotion.com/legacy) (Nikita), Dublin
