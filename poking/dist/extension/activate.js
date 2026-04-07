"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const commands_js_1 = require("./commands.js");
const bridge_js_1 = require("./bridge.js");
let bridge;
function activate(context) {
    bridge = new bridge_js_1.PokeBridge();
    (0, commands_js_1.registerCommands)(context, bridge);
}
function deactivate() {
    bridge?.dispose();
}
//# sourceMappingURL=activate.js.map