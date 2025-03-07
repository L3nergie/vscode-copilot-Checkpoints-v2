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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const childProcess = __importStar(require("child_process"));
/**
 * Provides the webview implementation for the DeepSeek panel.
 * This class handles all interactions between the webview and the extension.
 */
class DeepSeekViewProvider {
    constructor(_extensionUri, outputChannel) {
        this._extensionUri = _extensionUri;
        this.pendingChanges = new Map();
        this._outputChannel = outputChannel;
        this.setupFileWatcher();
    }
    /**
     * Initializes and sets up the webview panel
     */
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        // Écouter tous les messages du webview
        webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            this._outputChannel.appendLine(`Message reçu du webview: ${JSON.stringify(message)}`);
            try {
                switch (message.command) {
                    case 'openSettings':
                        this._outputChannel.appendLine('Ouverture des paramètres');
                        yield vscode.commands.executeCommand('mscode.configureDeepSeek');
                        break;
                    case 'deepseekAction':
                        this._outputChannel.appendLine(`Action DeepSeek reçue: ${JSON.stringify(message.data)}`);
                        if (message.data) {
                            yield this.handleDeepSeekAction(message.data);
                        }
                        else {
                            this._outputChannel.appendLine('ERREUR: Données manquantes dans le message');
                            this.sendErrorToWebview('Message invalide reçu');
                        }
                        break;
                    case 'sendMessage':
                        console.log('Message texte reçu:', message.text);
                        yield this.handleUserMessage(message.text);
                        break;
                    default:
                        console.error('Commande inconnue reçue:', message.command);
                        this.sendErrorToWebview('Commande non reconnue');
                }
            }
            catch (error) {
                console.error('Erreur lors du traitement du message:', error);
                this.sendErrorToWebview('Une erreur est survenue lors du traitement de votre demande.');
            }
        }));
    }
    /**
     * Génère un nonce aléatoire pour la sécurité du contenu
     */
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    /**
     * Génère le contenu HTML du webview avec les styles et scripts nécessaires
     */
    _getWebviewContent(_webview) {
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DeepSeek Chat</title>
            <style>
                body {
                    padding: 15px;
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    height: 100vh;
                    margin: 0;
                }
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 30px);
                    position: relative;
                }
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    background: var(--vscode-editor-background);
                }
                .message {
                    margin-bottom: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    word-wrap: break-word;
                }
                .user-message {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    margin-left: 20%;
                    color: var(--vscode-editor-foreground);
                }
                .bot-message {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    margin-right: 20%;
                }
                .input-container {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-top: 1px solid var(--vscode-panel-border);
                    position: sticky;
                    bottom: 0;
                }
                textarea {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    resize: vertical;
                    min-height: 60px;
                    border-radius: 4px;
                    font-family: inherit;
                }
                button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .error {
                    color: var(--vscode-errorForeground);
                    padding: 8px;
                    margin: 8px 0;
                    border-radius: 4px;
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                }
                .settings-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 8px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .settings-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <button class="settings-button" onclick="openSettings()">
                ⚙️ Configurer l'API
            </button>
            <div class="chat-container">
                <div class="messages" id="messages">
                    <div class="message bot-message">Bonjour ! Je suis prêt à vous aider. Si vous n'avez pas encore configuré votre clé API, cliquez sur ⚙️ en haut à droite.</div>
                </div>
                <div class="input-container">
                    <textarea 
                        id="userInput" 
                        placeholder="Posez votre question..."
                        onkeydown="handleKeyDown(event)"
                    ></textarea>
                    <button onclick="sendMessage()">Envoyer</button>
                </div>
            </div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                const messagesContainer = document.getElementById('messages');
                const userInput = document.getElementById('userInput');

                // Fonction pour ajouter un message dans l'interface
                function addMessage(content, isUser = false, isError = false) {
                    console.log('Ajout d\'un message:', { content, isUser, isError });
                    const messageDiv = document.createElement('div');
                    messageDiv.className = isError ? 'message error' : 
                                         'message ' + (isUser ? 'user-message' : 'bot-message');
                    messageDiv.textContent = content;
                    messagesContainer.appendChild(messageDiv);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }

                // Fonction pour envoyer un message
                function sendMessage() {
                    const message = userInput.value.trim();
                    if (message) {
                        console.log('Envoi du message:', message);
                        addMessage(message, true);
                        vscode.postMessage({
                            command: 'deepseekAction',
                            data: message
                        });
                        userInput.value = '';
                    }
                }

                // Gérer la touche Entrée pour envoyer le message
                function handleKeyDown(event) {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                    }
                }

                // Fonction pour ouvrir les paramètres
                function openSettings() {
                    console.log('Ouverture des paramètres');
                    vscode.postMessage({
                        command: 'openSettings'
                    });
                }

                // Écouter les messages de l'extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    console.log('Message reçu:', message);
                    
                    switch (message.command) {
                        case 'response':
                            console.log('Ajout réponse:', message.data);
                            addMessage(message.data, false);
                            break;
                        case 'error':
                            console.log('Ajout erreur:', message.data);
                            addMessage(message.data, false, true);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
    /**
     * Gère les actions DeepSeek envoyées depuis le webview
     * @param data Les données envoyées depuis le webview
     */
    handleDeepSeekAction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!data || typeof data !== 'string' || data.trim() === '') {
                    throw new Error('Données invalides ou vides reçues');
                }
                // Envoyer un message de confirmation immédiat
                this.sendMessageToWebview('response', 'Traitement de votre demande...');
                // Vérifier si la clé API est configurée avant d'envoyer la requête
                const apiKey = yield this.getApiKey();
                if (!apiKey) {
                    this.sendErrorToWebview('Veuillez configurer votre clé API DeepSeek. Cliquez sur le bouton ⚙️ en haut à droite.');
                    yield vscode.commands.executeCommand('mscode.configureDeepSeek');
                    return;
                }
                console.log('Envoi de la requête à DeepSeek:', data);
                try {
                    const response = yield this.processDeepSeekQuery(data);
                    console.log('Réponse reçue de DeepSeek:', response);
                    if (response) {
                        this.sendMessageToWebview('response', response);
                    }
                    else {
                        throw new Error('Réponse vide reçue de DeepSeek');
                    }
                }
                catch (error) {
                    console.error('Erreur API:', error);
                    throw error;
                }
            }
            catch (error) {
                console.error('Erreur lors du traitement de l\'action DeepSeek:', error);
                const errorMessage = error.message;
                if (errorMessage.includes('non configurée')) {
                    this.sendErrorToWebview('Veuillez configurer votre clé API DeepSeek. Cliquez sur le bouton ⚙️ en haut à droite.');
                }
                else {
                    this.sendErrorToWebview(`Erreur: ${errorMessage}`);
                }
            }
        });
    }
    /**
     * Appelle l'API DeepSeek
     * @param query La requête à envoyer à l'API
     */
    callDeepSeekAPI(query, codeChanges) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiKey = yield this.getApiKey();
            const apiUrl = this.getDeepSeekApiUrl();
            const requestData = {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful coding assistant that can validate code changes and provide detailed feedback. When reviewing code changes, analyze for: 1) Syntax errors 2) Logic issues 3) Best practices 4) Potential improvements'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                stream: false
            };
            if (codeChanges) {
                requestData.codeValidation = true;
                requestData.codeChanges = codeChanges;
            }
            console.log('Envoi de la requête à:', apiUrl);
            console.log('Données de la requête:', JSON.stringify(requestData));
            try {
                const response = yield fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    console.error('Erreur API:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText
                    });
                    throw new Error(`Erreur API DeepSeek (${response.status}): ${errorText}`);
                }
                const data = yield response.json();
                console.log('Réponse API brute:', data);
                // Type guard function to validate response structure
                const isDeepSeekResponse = (obj) => {
                    return obj
                        && typeof obj === 'object'
                        && 'choices' in obj
                        && Array.isArray(obj.choices)
                        && obj.choices.length > 0
                        && 'message' in obj.choices[0];
                };
                if (!isDeepSeekResponse(data)) {
                    console.error('Format de réponse invalide:', data);
                    throw new Error('Format de réponse API invalide');
                }
                return data;
            }
            catch (error) {
                console.error('Erreur lors de l\'appel API:', error);
                throw error;
            }
        });
    }
    /**
     * Récupère la clé API depuis les paramètres de l'extension
     */
    getApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = vscode.workspace.getConfiguration('deepseek');
            const apiKey = config.get('apiKey');
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('Clé API DeepSeek non configurée');
            }
            return apiKey;
        });
    }
    /**
     * Récupère l'URL de l'API DeepSeek depuis les paramètres
     */
    getDeepSeekApiUrl() {
        const config = vscode.workspace.getConfiguration('deepseek');
        return config.get('apiUrl') || 'https://api.deepseek.com/v1/chat/completions';
    }
    /**
     * Traite une requête DeepSeek
     * @param query La requête à traiter
     */
    processDeepSeekQuery(query, codeChanges) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Traitement de la requête DeepSeek:', query);
                // Si pas de clé API, renvoyer un message d'erreur
                const apiKey = yield this.getApiKey();
                if (!apiKey) {
                    return "Veuillez d'abord configurer votre clé API.";
                }
                // Tentative d'appel à l'API
                try {
                    const apiResponse = yield this.callDeepSeekAPI(query, codeChanges);
                    console.log('Réponse API reçue:', apiResponse);
                    if (apiResponse.choices && apiResponse.choices.length > 0 && apiResponse.choices[0].message) {
                        return apiResponse.choices[0].message.content;
                    }
                    else {
                        console.error('Format de réponse invalide:', apiResponse);
                        return 'Désolé, je n\'ai pas pu générer une réponse appropriée.';
                    }
                }
                catch (apiError) {
                    console.error('Erreur API:', apiError);
                    return `Erreur lors de l'appel à l'API: ${apiError.message}`;
                }
            }
            catch (error) {
                console.error('Erreur lors du traitement de la requête DeepSeek:', error);
                throw new Error(`Impossible de traiter la requête: ${error.message}`);
            }
        });
    }
    validateCodeChanges(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationQuery = `Please validate the following code changes:\n${JSON.stringify(changes, null, 2)}`;
                const response = yield this.processDeepSeekQuery(validationQuery, changes);
                return response;
            }
            catch (error) {
                console.error('Error validating code changes:', error);
                throw new Error(`Failed to validate code changes: ${error.message}`);
            }
        });
    }
    setupFileWatcher() {
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.fileWatcher.onDidChange((uri) => __awaiter(this, void 0, void 0, function* () {
            yield this.handleFileChange(uri);
        }));
        this.fileWatcher.onDidCreate((uri) => __awaiter(this, void 0, void 0, function* () {
            yield this.handleFileChange(uri);
        }));
        this.fileWatcher.onDidDelete((uri) => __awaiter(this, void 0, void 0, function* () {
            this.pendingChanges.delete(uri.fsPath);
        }));
    }
    handleFileChange(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const repositoryPath = (_a = vscode.workspace.getWorkspaceFolder(uri)) === null || _a === void 0 ? void 0 : _a.uri.fsPath;
                if (!repositoryPath) {
                    return;
                }
                const document = yield vscode.workspace.openTextDocument(uri);
                const filePath = uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                // Get git status for the file
                const gitCommand = `cd "${repositoryPath}" && git diff --unified=0 "${relativePath}"`;
                const result = yield new Promise((resolve, reject) => {
                    childProcess.exec(gitCommand, (error, stdout) => {
                        if (error && error.code !== 1) { // git diff returns 1 if there are changes
                            reject(error);
                        }
                        else {
                            resolve(stdout);
                        }
                    });
                });
                const change = {
                    filePath: filePath,
                    addedLines: [],
                    removedLines: [],
                    modifiedLines: []
                };
                // Parse git diff output
                const diffLines = result.split('\n');
                let currentHunk = null;
                for (const line of diffLines) {
                    if (line.startsWith('@@')) {
                        // Parse hunk header
                        const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
                        if (match) {
                            currentHunk = {
                                oldStart: parseInt(match[1]),
                                oldLines: match[2] ? parseInt(match[2]) : 1,
                                newStart: parseInt(match[3]),
                                newLines: match[4] ? parseInt(match[4]) : 1
                            };
                        }
                    }
                    else if (currentHunk) {
                        if (line.startsWith('-')) {
                            change.removedLines.push(line.substring(1));
                        }
                        else if (line.startsWith('+')) {
                            change.addedLines.push(line.substring(1));
                        }
                        else if (line.startsWith(' ')) {
                            // Context line, can be used to detect modified lines
                            const contextLine = line.substring(1);
                            const lastRemoved = change.removedLines[change.removedLines.length - 1];
                            const lastAdded = change.addedLines[change.addedLines.length - 1];
                            if (lastRemoved && lastAdded) {
                                change.modifiedLines.push({
                                    old: lastRemoved,
                                    new: lastAdded
                                });
                                // Clear the added/removed lines since we've converted them to a modification
                                change.removedLines.pop();
                                change.addedLines.pop();
                            }
                        }
                    }
                }
                if (change.addedLines.length > 0 || change.removedLines.length > 0 || change.modifiedLines.length > 0) {
                    this.pendingChanges.set(filePath, change);
                    // Debounce validation
                    if (this.validationTimeout) {
                        clearTimeout(this.validationTimeout);
                    }
                    this.validationTimeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        const changes = Array.from(this.pendingChanges.values());
                        if (changes.length > 0) {
                            try {
                                const validation = yield this.validateCodeChanges(changes);
                                this.sendMessageToWebview('response', `Code Change Validation:\n${validation}`);
                                this.pendingChanges.clear();
                            }
                            catch (error) {
                                console.error('Error during code validation:', error);
                                this.sendErrorToWebview(`Code validation failed: ${error.message}`);
                            }
                        }
                    }), 2000);
                }
            }
            catch (error) {
                console.error('Error handling file change:', error);
                this.sendErrorToWebview(`Failed to analyze code changes: ${error.message}`);
            }
        });
    }
    dispose() {
        var _a;
        (_a = this.fileWatcher) === null || _a === void 0 ? void 0 : _a.dispose();
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
    }
    /**
     * Journalise les erreurs de manière centralisée
     */
    logError(error) {
        console.error('Erreur DeepSeek:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        // TODO: Implémenter l'envoi vers un service de journalisation externe si nécessaire
    }
    /**
     * Gère les messages utilisateur
     * @param text Le texte du message
     */
    handleUserMessage(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!text || typeof text !== 'string') {
                    throw new Error('Message invalide');
                }
                // TODO: Implémenter la logique de traitement du message
                const response = `Réponse à: ${text}`;
                this.sendMessageToWebview('response', response);
            }
            catch (error) {
                console.error('Erreur lors du traitement du message:', error);
                this.sendErrorToWebview('Erreur lors du traitement de votre message');
            }
        });
    }
    /**
     * Envoie un message au webview
     */
    sendMessageToWebview(command, data) {
        if (this._view) {
            console.log('Envoi du message au webview:', { command, data });
            try {
                this._view.webview.postMessage({ command, data });
            }
            catch (error) {
                console.error('Erreur lors de l\'envoi du message au webview:', error);
            }
        }
        else {
            console.error('Webview non disponible pour envoyer le message');
        }
    }
    /**
     * Envoie un message d'erreur au webview
     */
    sendErrorToWebview(errorMessage) {
        this.sendMessageToWebview('error', errorMessage);
    }
}
exports.DeepSeekViewProvider = DeepSeekViewProvider;
DeepSeekViewProvider.viewType = 'deepseekView';
//# sourceMappingURL=DeepSeekViewProvider.js.map