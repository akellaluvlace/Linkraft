"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInspectionTools = registerInspectionTools;
const zod_1 = require("zod");
const state_js_1 = require("../../poke/state.js");
function registerInspectionTools(server) {
    server.tool('poke_get_computed_styles', 'Returns all computed styles of the currently selected element.', {}, async () => {
        const selection = (0, state_js_1.getCurrentSelection)();
        if (!selection) {
            return {
                content: [{ type: 'text', text: 'No element selected. Click an element in the preview first.' }],
            };
        }
        const computed = selection.styles.computed;
        const lines = [
            'Computed Styles:',
            '',
            `  width: ${computed.width}`,
            `  height: ${computed.height}`,
            `  font-size: ${computed.fontSize}`,
            `  font-weight: ${computed.fontWeight}`,
            `  color: ${computed.color}`,
            `  background-color: ${computed.backgroundColor}`,
            `  padding: ${computed.padding}`,
            `  margin: ${computed.margin}`,
            `  border-radius: ${computed.borderRadius}`,
            `  display: ${computed.display}`,
            `  position: ${computed.position}`,
        ];
        if (computed.gap) {
            lines.push(`  gap: ${computed.gap}`);
        }
        if (selection.styles.tailwindClasses) {
            lines.push('');
            lines.push(`Tailwind Classes: "${selection.styles.tailwindClasses}"`);
        }
        if (selection.styles.cssModules) {
            lines.push(`CSS Module: ${selection.styles.cssModules}`);
        }
        const inlineEntries = Object.entries(selection.styles.inlineStyles);
        if (inlineEntries.length > 0) {
            lines.push('');
            lines.push('Inline Styles:');
            for (const [key, value] of inlineEntries) {
                lines.push(`  ${key}: ${value}`);
            }
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    });
    server.tool('poke_compare_elements', 'Compare computed styles of two elements by CSS selector. V2 feature.', {
        element_a: zod_1.z.string().describe('CSS selector for the first element (e.g. "#header", ".card:first-child")'),
        element_b: zod_1.z.string().describe('CSS selector for the second element (e.g. "#footer", ".card:last-child")'),
    }, async (_params) => {
        return {
            content: [{ type: 'text', text: 'Comparison mode requires two poke selections. Coming in V2.' }],
        };
    });
    server.tool('poke_get_element_by_selector', 'Look up an element by CSS selector and return its context. V2 feature.', {
        selector: zod_1.z.string().describe('CSS selector to find the element (e.g. ".navbar", "#main-content")'),
    }, async (_params) => {
        return {
            content: [{ type: 'text', text: 'Element lookup by selector coming in V2.' }],
        };
    });
}
//# sourceMappingURL=inspection.js.map