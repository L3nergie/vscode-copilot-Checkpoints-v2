import * as vscode from 'vscode';
import { BaseAIViewProvider } from './BaseAIViewProvider';
import { getApiConfig } from '../config/aiProviders';

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string
            }>
        }
    }>
}

export class GeminiViewProvider extends BaseAIViewProvider {
    public static readonly viewType = 'geminiView';
    private outputChannel: vscode.OutputChannel;
    protected _view?: vscode.WebviewView;

    constructor(extensionUri: vscode.Uri) {
        const outputChannel = vscode.window.createOutputChannel('Gemini');
        super(extensionUri, outputChannel);
        this.outputChannel = outputChannel;
    }

    protected _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.css')
        );

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Gemini</title>
            </head>
            <body>
                <div id="app"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        try {
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        } catch (error) {
            this.outputChannel.appendLine(`Error setting webview HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }

        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'openSettings':
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'gemini');
                        break;
                    case 'sendMessage':
                        if (message.text) {
                            const response = await this.callAPI(message.text);
                            if (response.candidates?.[0]) {
                                this.sendMessageToWebview('response', response.candidates[0].content.parts[0].text);
                            }
                        }
                        break;
                }
            } catch (error) {
                this.sendErrorToWebview(error instanceof Error ? error.message : 'Une erreur est survenue');
            }
        });
    }

    protected async callAPI(prompt: string): Promise<GeminiResponse> {
        const config = getApiConfig('gemini');
        if (!config) {
            const errorMessage = 'Gemini configuration not found';
            this.outputChannel.appendLine(`API Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(this.prepareAPIRequest(prompt))
            });

            if (!response.ok) {
                const errorMessage = `API request failed: ${response.statusText}`;
                this.outputChannel.appendLine(`API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const data: unknown = await response.json();
            if (typeof data === 'object' && data !== null && 'candidates' in data && Array.isArray(data.candidates)) {
                return data as GeminiResponse;
            }
            const errorMessage = 'Invalid API response format';
            this.outputChannel.appendLine(`API Error: ${errorMessage}`);
            throw new Error(errorMessage);
        } catch (error) {
            this.outputChannel.appendLine(`API Error: ${error}`);
            throw error;
        }
    }

    protected sendMessageToWebview(type: string, content: string): void {
        this._view?.webview.postMessage({ type, content });
    }

    protected sendErrorToWebview(message: string): void {
        this._view?.webview.postMessage({
            type: 'error',
            content: message
        });
    }

    protected prepareAPIRequest(prompt: string): object {
        return {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        };
    }
}
