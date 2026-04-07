import * as vscode from 'vscode';
export declare class PreviewPanel {
    private panel;
    private messageHandler;
    private disposables;
    readonly extensionUri: vscode.Uri;
    constructor(extensionUri: vscode.Uri);
    open(url: string): void;
    close(): void;
    sendMessage(message: unknown): void;
    setMessageHandler(handler: (message: unknown) => void): void;
    isOpen(): boolean;
    dispose(): void;
    private cleanup;
    private buildHtml;
    private escapeHtmlAttribute;
}
