// Poke selection state: stores the current element selection.
// Deferred from v1.0 launch. Will be re-imported by server.ts when poke ships.

import type { PokeContext } from '../shared/types.js';
import { formatPokeContext } from '../shared/format.js';

let currentSelection: PokeContext | null = null;

export function setCurrentSelection(ctx: PokeContext): void {
  currentSelection = ctx;
}

export function getCurrentSelection(): PokeContext | null {
  return currentSelection;
}

export function getFormattedSelection(): string {
  if (!currentSelection) return 'No element selected. Click an element in the preview first.';
  return formatPokeContext(currentSelection);
}
