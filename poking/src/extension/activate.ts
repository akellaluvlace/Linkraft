import * as vscode from 'vscode';
import { registerCommands } from './commands.js';
import { PokeBridge } from './bridge.js';

let bridge: PokeBridge | undefined;

export function activate(context: vscode.ExtensionContext): void {
  bridge = new PokeBridge();
  registerCommands(context, bridge);
}

export function deactivate(): void {
  bridge?.dispose();
}
