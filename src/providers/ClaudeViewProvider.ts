import * as vscode from 'vscode';
import { BaseAIViewProvider } from './BaseAIViewProvider';
import { getApiConfig } from '../config/aiProviders';

interface APIResponse {
    completion?: string;
    // Add other expected fields here
}

export class ClaudeViewProvider extends BaseAIViewProvider {
    public static readonly viewType = 'claudeView';
    private outputChannel: vscode.OutputChannel;
    protected _view?: vscode.WebviewView;

    constructor(extensionUri: vscode.Uri, outputChannel: vscode.OutputChannel) {
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
                <title>Claude</title>
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
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'openSettings':
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'claude');
                        break;
                    case 'sendMessage':
                        if (message.text) {
                            const response = await this.callAPI(message.text);
                            if (response.completion) {
                                this.sendMessageToWebview('response', response.completion);
                            }
                        }
                        break;
                }
            } catch (error) {
                this.sendErrorToWebview(error instanceof Error ? error.message : 'Une erreur est survenue');
            }
        });
    }

    protected prepareAPIRequest(prompt: string): object {
        return {
            model: 'claude-3-sonnet',
            prompt: prompt,
            max_tokens_to_sample: 2000,
            temperature: 0.7,
        };
    }

    private async callAPI(prompt: string): Promise<APIResponse> {
        const config = getApiConfig('claude');
        if (!config) {
            throw new Error('Claude configuration not found');
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
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return await response.json() as APIResponse;
        } catch (error) {
            this.outputChannel.appendLine(`API Error: ${error}`);
            throw error;
        }
    }

    private sendMessageToWebview(type: string, message: string): void {
        if (this._view) {
            this._view.webview.postMessage({ type, message });
        }
    }

    private sendErrorToWebview(error: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'error',
                message: error
            });
        }
    }
}
