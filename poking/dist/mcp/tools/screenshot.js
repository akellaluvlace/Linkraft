"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScreenshotTools = registerScreenshotTools;
const state_js_1 = require("../../poke/state.js");
function registerScreenshotTools(server) {
    server.tool('poke_screenshot_element', 'Returns a screenshot of the currently selected element.', {}, async () => {
        const selection = (0, state_js_1.getCurrentSelection)();
        if (!selection) {
            return {
                content: [{ type: 'text', text: 'No element selected. Click an element in the preview first.' }],
            };
        }
        if (!selection.screenshot) {
            return {
                content: [{ type: 'text', text: 'No screenshot available for the selected element.' }],
            };
        }
        return {
            content: [
                { type: 'text', text: 'Screenshot captured.' },
                {
                    type: 'image',
                    data: selection.screenshot,
                    mimeType: 'image/png',
                },
            ],
        };
    });
    server.tool('poke_screenshot_page', 'Captures a screenshot of the entire page. V2 feature.', {}, async () => {
        return {
            content: [{ type: 'text', text: 'Page screenshot coming in V2.' }],
        };
    });
}
//# sourceMappingURL=screenshot.js.map