"use strict";
// Poke selection state: stores the current element selection.
// Deferred from v1.0 launch. Will be re-imported by server.ts when poke ships.
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentSelection = setCurrentSelection;
exports.getCurrentSelection = getCurrentSelection;
exports.getFormattedSelection = getFormattedSelection;
const format_js_1 = require("../shared/format.js");
let currentSelection = null;
function setCurrentSelection(ctx) {
    currentSelection = ctx;
}
function getCurrentSelection() {
    return currentSelection;
}
function getFormattedSelection() {
    if (!currentSelection)
        return 'No element selected. Click an element in the preview first.';
    return (0, format_js_1.formatPokeContext)(currentSelection);
}
//# sourceMappingURL=state.js.map