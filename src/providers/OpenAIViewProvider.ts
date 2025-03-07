
import * as vscode from 'vscode';
import { BaseAIViewProvider } from './BaseAIViewProvider';
import { getApiConfig } from '../config/aiProviders';
import { Logger } from '../utils/logger';

export class OpenAIViewProvider extends BaseAIViewProvider {
    public static readonly viewType = 'openaiView';
    
    protected config: ReturnType<typeof getApiConfig>;
    protected outputChannel: vscode.OutputChannel;

    protected _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js')
        );
        
        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OpenAI</title>
            </head>
            <body>
                <div id="app"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    constructor(
        extensionUri: vscode.Uri,
        outputChannel: vscode.OutputChannel
    ) {
        super(extensionUri, outputChannel);
        this.config = getApiConfig('openai');
        if (!this.config) {
            throw new Error('OpenAI configuration not found');
        }
        this.outputChannel = outputChannel;
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext<unknown>,
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
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'openai');
                        break;
                    case 'sendMessage':
                        if (message.text) {
                            const response = await this.callAPI(message.text);
                            const content = this.extractResponseContent(response);
                            if (content) {
                                this.sendMessageToWebview('response', content);
                            } else {
                                this.sendErrorToWebview('No valid response content received');
                            }
                        }
                        break;
                }
            } catch (error) {
                this.sendErrorToWebview(error instanceof Error ? error.message : 'Une erreur est survenue');
                Logger.error(`Error in OpenAI provider: ${error}`);
            }
        });
    }

    private extractResponseContent(response: unknown): string | undefined {
        if (typeof response !== 'object' || response === null) {
            return undefined;
        }
        
        const res = response as {
            choices?: Array<{
                message?: { content?: string },
                text?: string
            }>
        };
        
        if (!res.choices || !res.choices[0]) {
            return undefined;
        }

        const choice = res.choices[0];
        return choice.message?.content || choice.text;
    }

    protected async callAPI(prompt: string): Promise<unknown> {
        const request = this.prepareAPIRequest(prompt);
        const config = getApiConfig('openai');
        
        if (!config?.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            Logger.error(`OpenAI API call failed: ${error}`);
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
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
    }
}
