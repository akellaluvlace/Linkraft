"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokeBridge = void 0;
const vscode = __importStar(require("vscode"));
const format_js_1 = require("../shared/format.js");
const preview_panel_js_1 = require("./preview-panel.js");
class PokeBridge {
    panel;
    currentSelection = null;
    selectionListener;
    outputChannel;
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Poking');
    }
    openPreview(extensionUri, url) {
        if (!this.panel) {
            this.panel = new preview_panel_js_1.PreviewPanel(extensionUri);
            this.panel.setMessageHandler((message) => {
                this.handleMessage(message);
            });
        }
        this.panel.open(url);
        this.outputChannel.appendLine(`Preview opened: ${url}`);
    }
    handleMessage(message) {
        this.outputChannel.appendLine(`Message received: ${message.type}`);
        switch (message.type) {
            case 'element-selected': {
                const payload = message.payload;
                this.currentSelection = payload.context;
                this.outputChannel.appendLine(`Element selected: <${payload.context.dom.tag}>${payload.context.dom.id ? '#' + payload.context.dom.id : ''}`);
                if (this.selectionListener) {
                    this.selectionListener(payload.context);
                }
                break;
            }
            case 'poke-mode-changed': {
                this.outputChannel.appendLine(`Poke mode changed: ${JSON.stringify(message.payload)}`);
                break;
            }
            case 'navigate': {
                this.outputChannel.appendLine(`Navigation: ${JSON.stringify(message.payload)}`);
                break;
            }
            case 'error': {
                this.outputChannel.appendLine(`Error: ${JSON.stringify(message.payload)}`);
                break;
            }
        }
    }
    getCurrentSelection() {
        return this.currentSelection;
    }
    getFormattedSelection() {
        if (!this.currentSelection) {
            return null;
        }
        return (0, format_js_1.formatPokeContext)(this.currentSelection);
    }
    setSelectionListener(listener) {
        this.selectionListener = listener;
    }
    togglePokeMode() {
        if (this.panel) {
            this.panel.sendMessage({ _fromExtension: true, type: 'toggle-poke-mode' });
        }
    }
    selectParent() {
        if (this.panel) {
            this.panel.sendMessage({ _fromExtension: true, type: 'select-parent' });
        }
    }
    closePreview() {
        this.panel?.dispose();
        this.panel = undefined;
        this.currentSelection = null;
        this.selectionListener = undefined;
    }
    dispose() {
        this.closePreview();
        this.outputChannel.dispose();
    }
}
exports.PokeBridge = PokeBridge;
//# sourceMappingURL=bridge.js.map