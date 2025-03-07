import * as vscode from 'vscode';
import { CheckpointManager } from '../checkpointManager/checkpointManager';

/**
 * Panel WebView pour afficher et gérer les checkpoints
 */
export class CheckpointPanel {
    public static readonly viewType = 'mscodePanel';
    
    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private readonly _checkpointManager: CheckpointManager;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext, checkpointManager: CheckpointManager) {
        this._context = context;
        this._checkpointManager = checkpointManager;

        // Crée et affiche le webview panel
        // this._panel = vscode.window.createWebviewPanel(
        //     CheckpointPanel.viewType,
        //     'Copilot LLM Checkpoints',
        //     vscode.ViewColumn.Two,
        //     {
        //         enableScripts: true,
        //         localResourceRoots: [
        //             vscode.Uri.file(context.extensionPath)
        //         ]
        //     }
        // );

        // Mettre à jour le contenu initial
        this._updateWebview();

        // Écouter les messages depuis le webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                if (message.command) {
                    if (message.command === 'createCheckpoint') {
                        this._createCheckpoint(message.name, message.description);
                        return;
                    }
                }
            },
            null,
            this._disposables
        );

        // Écouter lorsque le panel est fermé
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    /**
     * Révèle ou recrée le panel
     */
    public reveal(): void {
        this._panel.reveal();
    }

    /**
     * Nettoie les ressources
     */
    public dispose(): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Crée un nouveau checkpoint
     */
    private async _createCheckpoint(name: string, description?: string): Promise<void> {
        await this._checkpointManager.createCheckpoint(name, description);
        this._updateWebview();
    }

    /**
     * Met à jour le contenu du webview
     */
    private _updateWebview(): void {
        this._panel.webview.html = this._getWebviewContent();
    }

    /**
     * Génère le contenu HTML du webview
     */
    private _getWebviewContent(): string {
        const checkpoints = this._checkpointManager.getCheckpoints();
        
        return `<!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MSCode Checkpointss</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                }
                .checkpoint {
                    padding: 10px;
                    margin: 5px 0;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
                .checkpoint-blue {
                    border-left: 5px solid blue;
                }
                .checkpoint-red {
                    border-left: 5px solid red;
                }
                .checkpoint-yellow {
                    border-left: 5px solid yellow;
                }
                .checkpoint-green {
                    border-left: 5px solid green;
                }
                .new-checkpoint {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                }
                input, textarea, button {
                    display: block;
                    margin-bottom: 10px;
                    width: 100%;
                    padding: 5px;
                }
                button {
                    background-color: #007ACC;
                    color: white;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>MSCode CheckpointsS</h1>
            
            <div class="checkpoints-list">
                ${checkpoints.map((cp: any) => `
                    <div class="checkpoint checkpoint-red">
                        <h3>${cp?.name}</h3>
                        <p>${cp.description || 'Pas de description'}</p>
                        <small>${new Date(cp.timestamp).toLocaleString()}</small>
                    </div>
                `).join('')}
            </div>
            
            <div class="new-checkpoint">
                <h2>Nouveau Checkpoint</h2>
                <input type="text" id="checkpoint-name" placeholder="Nom du checkpoint">
                <textarea id="checkpoint-description" placeholder="Description (optionnel)"></textarea>
                <button id="create-checkpoint">Créer Checkpoint</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('create-checkpoint').addEventListener('click', () => {
                    const name = document.getElementById('checkpoint-name').value;
                    const description = document.getElementById('checkpoint-description').value;
                    
                    if (name) {
                        vscode.postMessage({
                            command: 'createCheckpoint',
                            name: name,
                            description: description
                        });
                    }
                });
            </script>
        </body>
        </html>`;
    }
}