import * as vscode from 'vscode';
import type { PokeContext, PokeMessage } from '../shared/types.js';
export declare class PokeBridge {
    private panel;
    private currentSelection;
    private selectionListener;
    private outputChannel;
    constructor();
    openPreview(extensionUri: vscode.Uri, url: string): void;
    handleMessage(message: PokeMessage): void;
    getCurrentSelection(): PokeContext | null;
    getFormattedSelection(): string | null;
    setSelectionListener(listener: (ctx: PokeContext) => void): void;
    togglePokeMode(): void;
    selectParent(): void;
    closePreview(): void;
    dispose(): void;
}
