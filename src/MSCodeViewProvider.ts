import * as vscode from 'vscode';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { CheckpointManager } from './checkpointManager/checkpointManager';
import { Logger } from './logger';

// Mise à jour de l'interface pour correspondre au type Checkpoint utilisé par CheckpointManager
interface CheckpointHistory {
    id: string;
    name: string;
    description?: string;
    timestamp: string; // Changé de number à string
    files: Record<string, any>;
}

export class MSCodeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mscode-sidebar';
    private _view?: vscode.WebviewView;
    private readonly checkpointManager: CheckpointManager;
    private readonly outputChannel: vscode.OutputChannel;
    _extensionUri: vscode.Uri;

    constructor(
        private readonly extensionUri: vscode.Uri,
        checkpointManager: CheckpointManager,
        outputChannel: vscode.OutputChannel
    ) {
        this.checkpointManager = checkpointManager;
        this.outputChannel = outputChannel;
        this._extensionUri = extensionUri;
    }

    public async initialCheckpoints(): Promise<void> {
        const checkpoints = this.checkpointManager.getCheckpoints();
        this.updateWebviewContent(checkpoints as CheckpointHistory[]); // Ajout d'une conversion de type
    }

    public async refreshCheckpoints(): Promise<void> {
        const checkpoints = this.checkpointManager.getCheckpoints();
        this.updateWebviewContent(checkpoints as CheckpointHistory[]); // Ajout d'une conversion de type
    }

    private updateWebviewContent(checkpoints: CheckpointHistory[]): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateCheckpoints',
                checkpoints
            });
        }
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this.outputChannel.appendLine('=== Initialisation de la vue MSCode ===');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this.outputChannel.appendLine('Configuration des options du webview');

        webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        this.outputChannel.appendLine('Contenu HTML chargé dans le webview');

        webviewView.webview.onDidReceiveMessage(async message => {
            this.outputChannel.appendLine(`Message reçu du webview: ${message.command}`);

            switch (message.command) {
                case 'ready':
                    this.outputChannel.appendLine('Webview prêt - démarrage du rafraîchissement');
                    //   await this.refreshCheckpoints();
                    break;
                case 'getCheckpoints':
                    this.outputChannel.appendLine('Demande de checkpoints reçue');
                    //    await this.refreshCheckpoints();
                    break;
                case 'error':
                    this.outputChannel.appendLine(`Erreur dans le webview: ${message.error}`);
                    vscode.window.showErrorMessage(`Erreur webview: ${message.error}`);
                    break;
                case 'showDiff':
                    this.outputChannel.appendLine(`Affichage du diff pour ${message.filePath}`);
                    const checkpoint = this.checkpointManager.getCheckpointById(message.checkpointId) as CheckpointHistory; // Ajout d'une conversion de type
                    if (checkpoint && checkpoint.files[message.filePath]) {
                        const fileData = checkpoint.files[message.filePath];
                        if (fileData) {
                            const currentContent = await this.getCurrentFileContent(message.filePath);
                            const originalContent = fileData.content || '';
                            
                            if (message.filePath.endsWith('.json')) {
                                try {
                                    const originalJson = JSON.parse(originalContent);
                                    const currentJson = JSON.parse(currentContent);

                                    const diff = {
                                        additions: 0,
                                        deletions: 0,
                                        changes: 0,
                                        tokens: {
                                            original: this.countTokens(originalContent),
                                            modified: this.countTokens(currentContent),
                                            diff: 0
                                        }
                                    };

                                    // Compter les changements réels
                                    for (const key in currentJson) {
                                        if (!(key in originalJson)) {
                                            diff.additions++;
                                        } else if (JSON.stringify(currentJson[key]) !== JSON.stringify(originalJson[key])) {
                                            diff.changes++;
                                        }
                                    }

                                    for (const key in originalJson) {
                                        if (!(key in currentJson)) {
                                            diff.deletions++;
                                        }
                                    }

                                    // Corriger l'erreur de calcul numérique
                                    diff.tokens.diff = diff.tokens.modified - diff.tokens.original;

                                    // Formater pour l'affichage
                                    this.outputChannel.appendLine(`Diff JSON: +${diff.additions} -${diff.deletions} ~${diff.changes}`);
                                    webviewView.webview.postMessage({
                                        command: 'displayDiff',
                                        diff: {
                                            original: JSON.stringify(originalJson, null, 2),
                                            modified: JSON.stringify(currentJson, null, 2)
                                        },
                                        filePath: message.filePath,
                                        changes: diff
                                    });
                                } catch (error) {
                                    this.sendErrorToWebview(`Erreur de parsing JSON: ${error}`);
                                }
                                return;
                            }

                            // Garder la logique existante pour les fichiers non-JSON
                            if (originalContent.trim() === currentContent.trim()) {
                                // Contenu identique
                                return;
                            }

                            // Calculer les vrais changements
                            const diff = {
                                additions: 0,
                                deletions: 0,
                                changes: 0,
                                tokens: {
                                    original: this.countTokens(originalContent),
                                    modified: this.countTokens(currentContent),
                                    diff: 0
                                }
                            };

                            // Comparer ligne par ligne
                            const originalLines = originalContent.split('\n');
                            const currentLines = currentContent.split('\n');

                            // Corriger les erreurs de type dans les opérations arithmétiques
                            diff.additions = currentLines.length - originalLines.length > 0 ? 
                                currentLines.length - originalLines.length : 0;
                                
                            diff.deletions = originalLines.length - currentLines.length > 0 ? 
                                originalLines.length - currentLines.length : 0;
                                
                            // Corriger le problème de type implicite 'any'
                            diff.changes = currentLines.filter((line: string, i: number) => 
                                i < originalLines.length && line !== originalLines[i]).length;
                                
                            // Corriger l'erreur de calcul numérique
                            diff.tokens.diff = diff.tokens.modified - diff.tokens.original;

                            this.outputChannel.appendLine(`Différences: +${diff.additions} -${diff.deletions} ~${diff.changes} (Δtokens: ${diff.tokens.diff})`);

                            webviewView.webview.postMessage({
                                command: 'displayDiff',
                                diff: {
                                    original: originalContent,
                                    modified: currentContent
                                },
                                filePath: message.filePath,
                                changes: diff
                            });
                        }
                    }
                    break;

                case 'restoreCheckpoint':
                    this.outputChannel.appendLine(`Restauration du checkpoint: ${message.checkpointId}`);
                    await this.restoreCheckpoint(message.checkpointId);
                    break;

                case 'deleteCheckpoint':
                    this.outputChannel.appendLine(`Suppression du checkpoint: ${message.checkpointId}`);
                    await this.deleteCheckpoint(message.checkpointId);
                    await this.refreshCheckpoints();
                    break;
            }
        });

        this.outputChannel.appendLine('Écouteur de messages configuré');

        // Forcer un rafraîchissement initial
        this.refreshCheckpoints();
    }

    private async getCurrentFileContent(filePath: string): Promise<string> {
        try {
            // Vérifier si le fichier existe
            const exists = await fsExtra.pathExists(filePath);
            if (!exists) {
                return '';
            }
            
            // Lire le contenu du fichier
            return await fsExtra.readFile(filePath, 'utf8');
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la lecture du fichier ${filePath}: ${error}`);
            return '';
        }
    }

    _getWebviewContent(webview: vscode.Webview): string {
        return this._getHtmlForWebview(webview);
    }

    workspaceRoot(workspaceRoot: any, filePath: any): string {
        return path.join(workspaceRoot, filePath);
    }

    countTokens(text: string): number {
        // Implémentation simple de comptage de tokens
        if (!text) return 0;
        return text.split(/\s+/).length;
    }

    sendErrorToWebview(message: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'error',
                message
            });
        }
        this.outputChannel.appendLine(`Erreur envoyée au webview: ${message}`);
    }

    async restoreCheckpoint(checkpointId: string): Promise<void> {
        try {
            await this.checkpointManager.restoreCheckpoint(checkpointId);
            vscode.window.showInformationMessage(`Checkpoint ${checkpointId} restauré avec succès`);
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la restauration du checkpoint: ${error}`);
            vscode.window.showErrorMessage(`Erreur lors de la restauration: ${error}`);
        }
    }

    async deleteCheckpoint(checkpointId: string): Promise<void> {
        try {
            await this.checkpointManager.deleteCheckpoint(checkpointId);
            vscode.window.showInformationMessage(`Checkpoint ${checkpointId} supprimé avec succès`);
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la suppression du checkpoint: ${error}`);
            vscode.window.showErrorMessage(`Erreur lors de la suppression: ${error}`);
        }
    }
    
    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Créer des URI pour les ressources CSS et JS
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        
        // Récupérer les couleurs du thème actuel de VS Code
        const themeColor = vscode.window.activeColorTheme;
        const isDark = themeColor.kind === vscode.ColorThemeKind.Dark || themeColor.kind === vscode.ColorThemeKind.HighContrast;
        
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MSCode</title>
      <style>
        .header {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background-color: var(--vscode-sideBar-background);
          border-bottom: 1px solid var(--vscode-sideBar-border);
        }
        .footer {
          padding: 10px;
          background-color: var(--vscode-sideBar-background);
          border-top: 1px solid var(--vscode-sideBar-border);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <button onclick="openSettings()">⚙️ Paramètres</button>
        <button onclick="openApiKey()">🔑 Clé API</button>
      </div>
      <div id="content">
        <!-- Contenu principal ici -->
      </div>
      <div class="footer">
        <button onclick="openAssistant1()">Assistant 1</button>
        <button onclick="openAssistant2()">Assistant 2</button>
      </div>
      <script>
        function openSettings() {
          vscode.postMessage({ command: 'openSettings' });
        }
        function openApiKey() {
          vscode.postMessage({ command: 'openApiKey' });
        }
        function openAssistant1() {
          vscode.postMessage({ command: 'openAssistant1' });
        }
        function openAssistant2() {
          vscode.postMessage({ command: 'openAssistant2' });
        }
      </script>
    </body>
    </html>
        `;
        // Appliquer des styles personnalisés basés sur le thème
        // return `
        //     <!DOCTYPE html>
        //     <html lang="fr">
        //     <head>
        //         <meta charset="UTF-8">
        //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //         <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};">
        //         <title>MSCode</title>
        //         <style>
        //             :root {
        //                 --theme-bg: var(--vscode-editor-background);
        //                 --theme-fg: var(--vscode-editor-foreground);
        //                 --theme-border: var(--vscode-panel-border);
        //                 --theme-accent: var(--vscode-button-background);
        //                 --theme-accent-hover: var(--vscode-button-hoverBackground);
        //                 --theme-input-bg: var(--vscode-input-background);
        //                 --theme-input-fg: var(--vscode-input-foreground);
        //             }
                    
        //             body {
        //                 font-family: var(--vscode-font-family);
        //                 padding: 16px;
        //                 color: var(--theme-fg);
        //                 background-color: var(--theme-bg);
        //             }
                    
        //             .header {
        //                 display: flex;
        //                 align-items: center;
        //                 margin-bottom: 20px;
        //                 border-bottom: 1px solid var(--theme-border);
        //                 padding-bottom: 10px;
        //             }
                    
        //             .header h2 {
        //                 margin: 0;
        //                 flex: 1;
        //             }
                    
        //             .header .actions {
        //                 display: flex;
        //                 gap: 8px;
        //             }
                    
        //             button {
        //                 background-color: var(--theme-accent);
        //                 color: white;
        //                 border: none;
        //                 padding: 8px 16px;
        //                 border-radius: 4px;
        //                 cursor: pointer;
        //                 transition: background-color 0.2s;
        //             }
                    
        //             button:hover {
        //                 background-color: var(--theme-accent-hover);
        //             }
                    
        //             input, textarea {
        //                 width: 100%;
        //                 padding: 8px;
        //                 margin-bottom: 10px;
        //                 background-color: var(--theme-input-bg);
        //                 color: var(--theme-input-fg);
        //                 border: 1px solid var(--theme-border);
        //                 border-radius: 4px;
        //             }
                    
        //             .checkpoint-form {
        //                 background-color: rgba(0, 0, 0, 0.05);
        //                 padding: 16px;
        //                 border-radius: 8px;
        //                 margin-bottom: 20px;
        //                 border: 1px solid var(--theme-border);
        //             }
                    
        //             .checkpoint-form h3 {
        //                 margin-top: 0;
        //             }
                    
        //             .checkpoint-list {
        //                 margin-top: 20px;
        //             }
                    
        //             .checkpoint-item {
        //                 padding: 12px;
        //                 border: 1px solid var(--theme-border);
        //                 border-radius: 6px;
        //                 margin-bottom: 12px;
        //                 background-color: rgba(0, 0, 0, 0.03);
        //                 transition: transform 0.2s, box-shadow 0.2s;
        //             }
                    
        //             .checkpoint-item:hover {
        //                 transform: translateY(-1px);
        //                 box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        //             }
                    
        //             .checkpoint-item h3 {
        //                 margin: 0 0 5px 0;
        //                 color: var(--theme-accent);
        //             }
                    
        //             .checkpoint-item p {
        //                 margin: 0 0 8px 0;
        //                 font-size: 0.9em;
        //             }
                    
        //             .checkpoint-actions {
        //                 display: flex;
        //                 gap: 8px;
        //                 margin-top: 10px;
        //             }
                    
        //             .checkpoint-meta {
        //                 font-size: 0.8em;
        //                 color: var(--vscode-descriptionForeground);
        //                 display: flex;
        //                 justify-content: space-between;
        //                 margin-bottom: 8px;
        //             }
                    
        //             .badge {
        //                 display: inline-block;
        //                 padding: 2px 6px;
        //                 border-radius: 10px;
        //                 font-size: 0.7em;
        //                 font-weight: bold;
        //                 background-color: var(--theme-accent);
        //                 color: white;
        //             }
                    
        //             .loading {
        //                 display: flex;
        //                 align-items: center;
        //                 justify-content: center;
        //                 height: 100px;
        //             }
                    
        //             .loading-spinner {
        //                 border: 4px solid rgba(0, 0, 0, 0.1);
        //                 border-left-color: var(--theme-accent);
        //                 border-radius: 50%;
        //                 width: 24px;
        //                 height: 24px;
        //                 animation: spin 1s linear infinite;
        //             }
                    
        //             @keyframes spin {
        //                 to { transform: rotate(360deg); }
        //             }
                    
        //             /* Thème sombre ajustements */
        //             ${isDark ? `
        //             .checkpoint-item {
        //                 background-color: rgba(255, 255, 255, 0.03);
        //             }
                    
        //             .checkpoint-form {
        //                 background-color: rgba(255, 255, 255, 0.03);
        //             }
                    
        //             .loading-spinner {
        //                 border: 4px solid rgba(255, 255, 255, 0.1);
        //                 border-left-color: var(--theme-accent);
        //             }
        //             ` : ''}
        //         </style>
        //     </head>
        //     <body>
        //         <div class="header">
        //             <h2>Copilot LLM Checkpoints</h2>
        //             <div class="actions">
        //                 <button id="refresh-btn" title="Rafraîchir les checkpoints">
        //                     <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        //                         <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.111.033.139c.167.716.513 1.155.942 1.437.43.282.847.414 1.202.414.351 0 .836-.195 1.346-.21.62-.017 1.31.123 1.897.591.297.24.516.5.659.796.146.3.216.614.216.932 0 .32-.071.637-.214.941-.144.305-.362.568-.659.81-.65.513-1.367.684-1.953.686-.661.002-1.13-.125-1.478-.262-.347-.136-.617-.276-.78-.366-.364-.202-.685-.442-.915-.687-.13-.131-.236-.258-.312-.358-.096-.099-.167-.189-.213-.265-.121-.202-.202-.425-.214-.666-.012-.24.005-.48.12-.708l.168-.32.192-.351-.462.015-.195.015c.245-.077.461-.161.673-.251.515-.219 1.104-.519 1.613-.965.508-.448.864-1.054 1.028-1.793.102-.465.101-.945-.003-1.353-.106-.421-.299-.754-.529-.982-.23-.229-.484-.367-.697-.441-.214-.074-.386-.106-.466-.127l-.096-.026-.125.017-.358.049-.131.193-.518.76c.354.43.538.891.432 1.512-.078.444-.31.794-.631 1.042-.139.107-.29.192-.45.263l-.126.06-.1.053-.373.18.446.522c.186.033.33.126.52.3.156.144.333.37.494.688.155.318.236.651.178.998-.056.344-.245.642-.467.893-.223.253-.486.445-.739.597-.255.152-.491.264-.679.334l-.21.78.135.093c.122.084.286.183.487.29.575.306 1.455.584 2.416.5.958-.086 1.811-.437 2.334-1.059a2.13 2.13 0 0 0 .168-.201 2.827 2.827 0 0 0 .732-1.887 2.846 2.846 0 0 0-.732-1.886 2.638 2.638 0 0 0-.168-.201c-.523-.623-1.376-.973-2.334-1.059-.961-.083-1.841.194-2.416.5a5.28 5.28 0 0 0-.487.29l-.135.094.21.77c.188.7.424.181.679.334.253.152.516.344.739.597.222.251.41.55.467.893.058.347-.023.68-.178.998-.161.319-.338.544-.494.689-.19.173-.334.266-.52.3l-.446.521.373.181.1.052.126.06c.16.072.311.157.45.264.321.248.553.598.631 1.042.106.621-.078 1.082-.432 1.511l.518.761.131.193.358.049.096.026c.08-.02.252-.053.466-.127.213-.074.467-.212.697-.441.23-.228.423-.561.529-.982.104-.408.105-.888.003-1.353-.164-.739-.52-1.345-1.028-1.793-.509-.446-1.098-.746-1.613-.965a4.566 4.566 0 0 0-.673-.251l.195.015.462.015-.192-.352-.168-.32c-.115-.228-.132-.467-.12-.708.012-.24.093-.464.214-.666.046-.076.117-.166.213-.265.076-.1.182-.227.312-.357.23-.246.551-.486.915-.687.163-.09.433-.23.78-.366.348-.137.817-.264 1.478-.262.587.002 1.304.173 1.953.685.297.242.515.505.659.81.143.304.214.622.214.942 0 .318-.07.633-.216.932-.143.296-.362.556-.659.796-.587.468-1.277.608-1.897.591-.51-.015-.995-.21-1.346-.21-.355 0-.772.132-1.201.414-.43.282-.775.722-.942 1.437l-.033.139.02.111c.198 1.535.79 2.46 1.125 2.876l.076.094 1.068.812.579-.939c-.298-.186-.61-.43-.891-.73-.482-.494-.77-1.117-.77-1.859 0-.313.083-.572.205-.779.246-.417.716-.685 1.33-.683.414.002.808.105 1.071.18.262.075.536.17.863.275.327.105.599.195.804.254.205.06.356.093.485.119l.238.049.424.083-.26-.389c-.25.145-.518.26-.811.347a3.893 3.893 0 0 1-.913.172c-.153.015-.303.02-.448.017a2.758 2.758 0 0 1-1.098-.235l.126.246.17.339.223.451c.303.618.78 1.131 1.428 1.435a3.326 3.326 0 0 0 1.733.276 3.395 3.395 0 0 0 1.112-.281c.877-.392 1.417-1.159 1.482-2.145l.005-.15-.076-.088c-.18-.21-.35-.394-.505-.545-.156-.151-.325-.282-.518-.392-.194-.111-.356-.189-.467-.236a2.07 2.07 0 0 1-.15-.07z"/>
        //                     </svg>
        //                 </button>
        //             </div>
        //         </div>
                
        //         <div class="checkpoint-form">
        //             <h3>Créer un checkpoint</h3>
        //             <input type="text" id="checkpoint-name" placeholder="Nom du checkpoint" />
        //             <textarea id="checkpoint-description" placeholder="Description (optionnel)" rows="3"></textarea>
        //             <button id="create-checkpoint">Créer Checkpoint</button>
        //         </div>

        //         <div class="checkpoint-list">
        //             <h3>Checkpoints</h3>
        //             <div id="checkpoints-container" class="loading">
        //                 <div class="loading-spinner"></div>
        //             </div>
        //         </div>

        //         <script>
        //             const vscode = acquireVsCodeApi();
                    
        //             // Initialisation
        //             document.addEventListener('DOMContentLoaded', () => {
        //                 // Gestionnaire pour le bouton de création de checkpoint
        //                 document.getElementById('create-checkpoint').addEventListener('click', () => {
        //                     const name = document.getElementById('checkpoint-name').value;
        //                     const description = document.getElementById('checkpoint-description').value;
                            
        //                     if (!name) {
        //                         return alert('Le nom du checkpoint est obligatoire');
        //                     }
                            
        //                     // Afficher un indicateur de chargement
        //                     document.getElementById('checkpoints-container').innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
                            
        //                     vscode.postMessage({
        //                         command: 'createCheckpoint',
        //                         name,
        //                         description
        //                     });
                            
        //                     // Réinitialiser les champs
        //                     document.getElementById('checkpoint-name').value = '';
        //                     document.getElementById('checkpoint-description').value = '';
        //                 });
                        
        //                 // Gestionnaire pour le bouton de rafraîchissement
        //                 document.getElementById('refresh-btn').addEventListener('click', () => {
        //                     document.getElementById('checkpoints-container').innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
        //                     vscode.postMessage({
        //                         command: 'getCheckpoints'
        //                     });
        //                 });
                        
        //                 // Demander les checkpoints au chargement
        //                 vscode.postMessage({
        //                     command: 'getCheckpoints'
        //                 });
        //             });
                    
        //             // Gérer les messages depuis l'extension
        //             window.addEventListener('message', event => {
        //                 const message = event.data;
                        
        //                 switch (message.type) {
        //                     case 'checkpoints':
        //                     case 'refresh':
        //                     case 'updateCheckpoints':
        //                         renderCheckpoints(message.checkpoints);
        //                         break;
        //                 }
        //             });
                    
        //             // Fonction pour formater la date
        //             function formatDate(timestamp) {
        //                 const date = new Date(timestamp);
        //                 return date.toLocaleString();
        //             }
                    
        //             // Fonction pour render les checkpoints
        //             function renderCheckpoints(checkpoints) {
        //                 const container = document.getElementById('checkpoints-container');
                        
        //                 if (!checkpoints || checkpoints.length === 0) {
        //                     container.innerHTML = '<p>Aucun checkpoint trouvé.</p>';
        //                     return;
        //                 }
                        
        //                 container.innerHTML = checkpoints.map(cp => \`
        //                     <div class="checkpoint-item" data-id="\${cp.id}">
        //                         <div class="checkpoint-meta">
        //                             <span class="badge">Checkpoint</span>
        //                             <span><small>Créé le: \${formatDate(cp.timestamp)}</small></span>
        //                         </div>
        //                         <h3>\${cp.name}</h3>
        //                         <p>\${cp.description || 'Aucune description'}</p>
                                
        //                         <div class="checkpoint-actions">
        //                             <button onclick="restoreCheckpoint('\${cp.id}')">Restaurer</button>
        //                             <button onclick="deleteCheckpoint('\${cp.id}')" style="background-color: var(--vscode-errorForeground);">Supprimer</button>
        //                         </div>
        //                     </div>
        //                 \`).join('');
        //             }
                    
        //             // Fonction pour restaurer un checkpoint
        //             function restoreCheckpoint(checkpointId) {
        //                 if (confirm('Êtes-vous sûr de vouloir restaurer ce checkpoint? Les modifications non enregistrées seront perdues.')) {
        //                     vscode.postMessage({
        //                         command: 'restoreCheckpoint',
        //                         checkpointId
        //                     });
        //                 }
        //             }
                    
        //             // Fonction pour supprimer un checkpoint
        //             function deleteCheckpoint(checkpointId) {
        //                 if (confirm('Êtes-vous sûr de vouloir supprimer ce checkpoint? Cette action est irréversible.')) {
        //                     vscode.postMessage({
        //                         command: 'deleteCheckpoint',
        //                         checkpointId
        //                     });
        //                 }
        //             }
        //         </script>
        //     </body>
        //     </html>
        // `;
    }
}

