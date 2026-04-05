---
name: poking
description: Visual element selector for frontend development. Click any element, get exact component, file, line, and style context.
---

# PokingIsNewCoding

## What This Gives You

When the user clicks an element in the preview panel, you receive a
structured POKE context block containing the element's DOM info, source
file and line, current styles, layout context, component props/state,
and a screenshot.

This eliminates all ambiguity about which element the user is
referring to. Use this context for every UI change request.

## How To Use Poke Context

### When source file and line are provided:
Open that exact file, go to that exact line. Make changes there.
Do NOT search for the element. You already know where it is.

### When Tailwind classes are listed:
Modify the Tailwind classes directly. Do not add inline styles
or CSS files. Reference the existing classes to understand the
current design intent.

### When source file is null (generic HTML):
Use the searchHints (class names, IDs, data-testid) to grep the
codebase and find the source file. Use the selectorPath to confirm
you found the right element.

### When making layout changes:
Always read the parent context. The parent's display, flex, grid,
and gap properties determine how children are laid out. You may
need to edit the parent component, not the selected element.

### When the user says "make it match" or "like that one":
Use poke_compare_elements to get both elements' styles. Calculate
the diff. Apply only the differing properties.

### When the user says "make it responsive":
Use poke_responsive_check to see the element at different
breakpoints. Add or modify responsive Tailwind classes
(sm:, md:, lg:, xl:) based on what needs to change.

### After every change:
Wait for hot reload. The user will visually confirm. If they
poke the same element again, they want further adjustments.

## Available Commands

- /poke <url>: open preview and enable poke mode
- /poke parent: select parent of current element
- /poke children: list children of current element
- /poke compare: compare two selected elements
- /poke responsive: check element at multiple breakpoints
- /poke tree: show component tree of current page
- /poke off: disable poke mode (normal browsing)

## Important Rules

- NEVER guess which element the user means. If no poke context
  is present, ask the user to click the element first.
- ALWAYS use the file and line from poke context, not your own search.
- ALWAYS check the parent layout before making size/position changes.
- When the element has Tailwind classes, stay in Tailwind. Do not
  switch to CSS modules or inline styles.
- When the element uses CSS modules, stay in CSS modules.
- Keep the same styling approach the project already uses.
