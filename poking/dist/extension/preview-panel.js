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
exports.PreviewPanel = void 0;
const vscode = __importStar(require("vscode"));
class PreviewPanel {
    panel;
    messageHandler;
    disposables = [];
    extensionUri;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    open(url) {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            this.panel.webview.html = this.buildHtml(url);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('pokingPreview', 'Poking Preview', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.html = this.buildHtml(url);
        const messageDisposable = this.panel.webview.onDidReceiveMessage((message) => {
            if (this.messageHandler) {
                this.messageHandler(message);
            }
        });
        this.disposables.push(messageDisposable);
        const disposeDisposable = this.panel.onDidDispose(() => {
            this.cleanup();
        });
        this.disposables.push(disposeDisposable);
    }
    close() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
    sendMessage(message) {
        if (this.panel) {
            void this.panel.webview.postMessage(message);
        }
    }
    setMessageHandler(handler) {
        this.messageHandler = handler;
    }
    isOpen() {
        return this.panel !== undefined;
    }
    dispose() {
        this.close();
    }
    cleanup() {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
        this.panel = undefined;
    }
    buildHtml(url) {
        const escapedUrl = this.escapeHtmlAttribute(url);
        return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src *; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
</head>
<body style="margin:0;padding:0;overflow:hidden;">
  <iframe id="app-frame" src="${escapedUrl}" style="width:100%;height:100vh;border:none;"></iframe>
  <script>
    const vscode = acquireVsCodeApi();
    const appFrame = document.getElementById('app-frame');
    const frameOrigin = new URL('${escapedUrl}').origin;

    // Listen for messages from the iframe only.
    // Validate event.source matches the app iframe to prevent spoofing.
    window.addEventListener('message', (event) => {
      if (event.source === appFrame.contentWindow && event.data && event.data.type) {
        vscode.postMessage(event.data);
      }
    });

    // Forward messages from the extension to the iframe with origin check.
    window.addEventListener('message', (event) => {
      if (appFrame && event.data && event.data._fromExtension) {
        appFrame.contentWindow.postMessage(event.data, frameOrigin);
      }
    });
  </script>
</body>
</html>`;
    }
    escapeHtmlAttribute(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
exports.PreviewPanel = PreviewPanel;
//# sourceMappingURL=preview-panel.js.map