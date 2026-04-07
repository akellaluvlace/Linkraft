---
name: poking
description: Visual element selector for frontend development. Click any element in your browser, get exact component, file, line, and style context. Uses Chrome DevTools Protocol for zero-config injection.
---

# PokingIsNewCoding

## What This Does

User clicks any element in their running app. Claude gets: component name, source file, line, CSS/Tailwind classes, computed styles, parent chain, props, state. Eliminates "which element?" conversations.

## How To Start Poke Mode (CDP Flow)

When user says "/linkraft poke http://localhost:3000":

### Step 1: Navigate to the page
Use chrome-devtools-mcp `navigate_page` to open the URL in the user's browser.

### Step 2: Inject the overlay
Call `poke_inject_code` to get the injection JavaScript, then execute it via chrome-devtools-mcp `evaluate_script`. This injects an 11KB overlay that highlights elements on hover and captures clicks.

### Step 3: Set up hot-reload persistence
Call `poke_persist` to get persistence code, execute via `evaluate_script`. This re-injects the overlay automatically when the dev server hot-reloads.

### Step 4: Tell the user
"Poke mode active. Click any element in your browser."

### Step 5: Poll for selections
When the user says they clicked something (or you need to check), call `poke_poll` to get the polling code, execute via `evaluate_script`. If it returns JSON, call `poke_receive_selection` with the JSON to parse and store the context.

### Step 6: Use the context
Now use the selection context: file, line, component, classes, props. Make changes.

## Fallback: No Chrome DevTools MCP

If chrome-devtools-mcp is not connected:
1. Call `poke_setup` to detect the framework and generate injection instructions
2. For Vite/Next.js: Claude adds one dev-only line to the config
3. For any framework: call `poke_bookmarklet` to generate a bookmarklet
4. User drags bookmarklet to bookmarks bar, clicks it on their page

## How To Use Poke Context

### When source file and line are provided:
Open that exact file, go to that exact line. Make changes there.
Do NOT search for the element. You already know where it is.

### When Tailwind classes are listed:
Modify the Tailwind classes directly. Do not add inline styles.

### When source file is null (generic HTML):
Use the searchHints (class names, IDs, data-testid) to grep the
codebase and find the source file.

### When making layout changes:
Read the parent context first. The parent's display/flex/grid
properties determine children layout.

## Available Tools

### CDP Flow (primary):
- `poke_inject_code`: get overlay injection JavaScript
- `poke_poll`: get polling JavaScript to check for selections
- `poke_receive_selection`: parse and store selection data
- `poke_enable`: re-enable poke mode after navigating
- `poke_disable`: disable poke mode
- `poke_remove`: remove overlay entirely
- `poke_persist`: set up hot-reload persistence

### Fallback:
- `poke_setup`: framework detection + injection instructions
- `poke_bookmarklet`: generate bookmarklet for any framework

### Selection tools (work after receiving selection):
- `poke_get_selected_element`: full context of current selection
- `poke_get_parent`: parent element info
- `poke_get_siblings`: sibling elements
- `poke_get_children`: child elements
- `poke_get_computed_styles`: all computed CSS

## Important Rules

- NEVER guess which element the user means. If no poke context, ask them to click.
- ALWAYS use the file and line from poke context, not your own search.
- ALWAYS check the parent layout before making size/position changes.
- Stay in the project's existing styling approach (Tailwind, CSS modules, etc.).
