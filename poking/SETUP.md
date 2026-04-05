# PokingIsNewCoding Setup

## Prerequisites

- Node.js >= 18
- VS Code with Claude Code extension
- A running dev server (React, Next.js, Vite, or any web app)

## Steps

1. **Clone and build**

   ```bash
   git clone https://github.com/akellaluvlace/Linkraft.git
   cd Linkraft/poking
   npm install
   npm run build
   ```

2. **Add MCP server to Claude Code**

   Add this to your project's `.mcp.json`:
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

3. **Start your dev server**

   ```bash
   npm run dev
   ```

4. **Open poke mode**

   In Claude Code, type:
   ```
   /poke http://localhost:3000
   ```

5. **Click an element**

   Click any element in the preview. Claude receives full context.

6. **Tell Claude what to change**

   "Make it wider, change the background to emerald green"

   Claude edits the right file, right line.

## Enhanced Setup (React 19+)

React 19 removed `_debugSource`. For exact file/line mapping:

```bash
npm install --save-dev poking-babel-plugin
```

**Vite:**
```typescript
// vite.config.ts
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['poking-babel-plugin'] }
    })
  ]
});
```

**Next.js:**
```javascript
// .babelrc
{ "plugins": ["poking-babel-plugin"] }
```

The plugin adds `data-poke-file` and `data-poke-line` attributes to JSX elements in dev mode. Automatically stripped in production.

## Troubleshooting

**"No element selected"**: Click an element in the preview first. Make sure poke mode is enabled.

**No source file shown**: Your framework may not expose component source info. Try the Babel plugin for React 19+.

**Preview doesn't load**: Check that your dev server is running and the URL is correct.

**Overlay doesn't appear**: Make sure the overlay script is loaded. Check browser console for errors.
