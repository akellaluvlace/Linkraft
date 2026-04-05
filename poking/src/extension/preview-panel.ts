import * as vscode from 'vscode';

export class PreviewPanel {
  private panel: vscode.WebviewPanel | undefined;
  private messageHandler: ((message: unknown) => void) | undefined;
  private disposables: vscode.Disposable[] = [];

  readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  open(url: string): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      this.panel.webview.html = this.buildHtml(url);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'pokingPreview',
      'Poking Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.panel.webview.html = this.buildHtml(url);

    const messageDisposable = this.panel.webview.onDidReceiveMessage(
      (message: unknown) => {
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      },
    );
    this.disposables.push(messageDisposable);

    const disposeDisposable = this.panel.onDidDispose(() => {
      this.cleanup();
    });
    this.disposables.push(disposeDisposable);
  }

  close(): void {
    if (this.panel) {
      this.panel.dispose();
    }
  }

  sendMessage(message: unknown): void {
    if (this.panel) {
      void this.panel.webview.postMessage(message);
    }
  }

  setMessageHandler(handler: (message: unknown) => void): void {
    this.messageHandler = handler;
  }

  isOpen(): boolean {
    return this.panel !== undefined;
  }

  dispose(): void {
    this.close();
  }

  private cleanup(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this.panel = undefined;
  }

  private buildHtml(url: string): string {
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

  private escapeHtmlAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
