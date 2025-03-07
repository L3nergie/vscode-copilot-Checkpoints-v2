
import { BaseAIViewProvider } from './BaseAIViewProvider';
import { getApiConfig } from '../config/aiProviders';
import { Logger } from '../utils/logger';
import * as vscode from 'vscode';
export class MistralViewProvider extends BaseAIViewProvider {
    constructor(
        extensionUri: vscode.Uri,
        outputChannel: vscode.OutputChannel
    ) {
        super(extensionUri, outputChannel);
    }
    static viewType: any;
    protected _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mistral View</title>
</head>
<body>
    <h1>Mistral View</h1>
    <div id="content"></div>
    <script>
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'response':
                    document.getElementById('content').innerText = message.text;
                    break;
                case 'error':
                    document.getElementById('content').innerText = \`Error: \${message.text}\`;
                    break;
            }
        });
    </script>
</body>
</html>`;
    }

    private getWebviewContent(extensionUri: vscode.Uri): string {
        return this._getHtmlForWebview(this._view.webview);
    }

    private async callAPI(prompt: string): Promise<any> {
        // Implement the method to call the API
        return {};
    }

    private sendMessageToWebview(type: string, content: string): void {
        this._view?.webview.postMessage({ type, text: content });
    }

    private sendErrorToWebview(error: string): void {
        // Implement the method to send an error to the webview
    }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getWebviewContent(this.extensionUri);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'openSettings':
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'mistral');
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
                Logger.error(`Error in Mistral provider: ${error}`);
            }
        });
    }

    private extractResponseContent(response: any): string | undefined {
        if (!response || !response.choices?.[0]?.message?.content) {
            return undefined;
        }
        return response.choices[0].message.content;
    }

    protected prepareAPIRequest(prompt: string) {
        return {
            model: 'mistral-large-latest',
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