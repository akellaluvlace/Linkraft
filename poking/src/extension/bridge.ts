import * as vscode from 'vscode';
import type { PokeContext, PokeMessage, ElementSelectedPayload } from '../shared/types.js';
import { formatPokeContext } from '../shared/format.js';
import { PreviewPanel } from './preview-panel.js';

export class PokeBridge {
  private panel: PreviewPanel | undefined;
  private currentSelection: PokeContext | null = null;
  private selectionListener: ((ctx: PokeContext) => void) | undefined;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Poking');
  }

  openPreview(extensionUri: vscode.Uri, url: string): void {
    if (!this.panel) {
      this.panel = new PreviewPanel(extensionUri);
      this.panel.setMessageHandler((message: unknown) => {
        this.handleMessage(message as PokeMessage);
      });
    }
    this.panel.open(url);
    this.outputChannel.appendLine(`Preview opened: ${url}`);
  }

  handleMessage(message: PokeMessage): void {
    this.outputChannel.appendLine(`Message received: ${message.type}`);

    switch (message.type) {
      case 'element-selected': {
        const payload = message.payload as ElementSelectedPayload;
        this.currentSelection = payload.context;
        this.outputChannel.appendLine(
          `Element selected: <${payload.context.dom.tag}>${payload.context.dom.id ? '#' + payload.context.dom.id : ''}`,
        );
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

  getCurrentSelection(): PokeContext | null {
    return this.currentSelection;
  }

  getFormattedSelection(): string | null {
    if (!this.currentSelection) {
      return null;
    }
    return formatPokeContext(this.currentSelection);
  }

  setSelectionListener(listener: (ctx: PokeContext) => void): void {
    this.selectionListener = listener;
  }

  togglePokeMode(): void {
    if (this.panel) {
      this.panel.sendMessage({ _fromExtension: true, type: 'toggle-poke-mode' });
    }
  }

  selectParent(): void {
    if (this.panel) {
      this.panel.sendMessage({ _fromExtension: true, type: 'select-parent' });
    }
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
    this.currentSelection = null;
    this.selectionListener = undefined;
    this.outputChannel.dispose();
  }
}
