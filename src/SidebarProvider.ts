import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly extensionUri: vscode.Uri) { }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Copilot Checkpoints</title>
            <style>
                body { font-family: var(--vscode-font-family); margin: 0; padding: 10px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                h1 { font-size: 1.2rem; margin-bottom: 10px; }
                .container { padding: 5px; }
                button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 5px 10px; cursor: pointer; }
                button:hover { background-color: var(--vscode-button-hoverBackground); }
            </style>
        </head>
        <body>
            <h1>Copilot Checkpoints</h1>
            <div class="container">
                <p>Bienvenue dans Copilot Checkpoints</p>
                <p>Cette extension vous permet de créer et gérer des points de sauvegarde dans votre code.</p>
                <button id="createCheckpoint">Créer un checkpoint</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('createCheckpoint').addEventListener('click', () => {
                    vscode.postMessage({ command: 'createCheckpoint' });
                });
            </script>
        </body>
        </html>`;
    }
}
