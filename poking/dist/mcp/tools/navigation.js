"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNavigationTools = registerNavigationTools;
const zod_1 = require("zod");
function registerNavigationTools(server) {
    server.tool('poke_navigate', 'Navigate the preview panel to a URL.', {
        url: zod_1.z.string().describe('The URL to navigate to (e.g. "http://localhost:3000/about")'),
    }, async (_params) => {
        return {
            content: [{ type: 'text', text: 'Navigation command sent. Use the preview panel to navigate.' }],
        };
    });
    server.tool('poke_scroll_to', 'Scroll the preview to bring a specific element into view. V2 feature.', {
        selector: zod_1.z.string().describe('CSS selector of the element to scroll to (e.g. "#footer", ".section-3")'),
    }, async (_params) => {
        return {
            content: [{ type: 'text', text: 'Scroll command coming in V2.' }],
        };
    });
}
//# sourceMappingURL=navigation.js.map