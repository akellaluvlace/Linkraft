import * as vscode from 'vscode';
import { PokeBridge } from './bridge.js';

export function registerCommands(
  context: vscode.ExtensionContext,
  bridge: PokeBridge,
): void {
  const openCommand = vscode.commands.registerCommand('poking.open', async () => {
    const url = await vscode.window.showInputBox({
      prompt: 'Enter the URL of your app to preview',
      placeHolder: 'http://localhost:3000',
      value: 'http://localhost:3000',
      validateInput: (value: string) => {
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'URL must start with http:// or https://';
        }
        return undefined;
      },
    });

    if (url) {
      bridge.openPreview(context.extensionUri, url);
    }
  });

  const toggleCommand = vscode.commands.registerCommand('poking.toggle', () => {
    bridge.togglePokeMode();
  });

  const parentCommand = vscode.commands.registerCommand('poking.parent', () => {
    bridge.selectParent();
  });

  const offCommand = vscode.commands.registerCommand('poking.off', () => {
    bridge.dispose();
  });

  context.subscriptions.push(openCommand, toggleCommand, parentCommand, offCommand);
}
