import * as vscode from 'vscode';

/**
 * Base class for AI view providers
 */
export abstract class BaseAIViewProvider implements vscode.WebviewViewProvider {
    protected _view?: vscode.WebviewView;
    protected responsibilities: any[] = [];

    protected _outputChannel: vscode.OutputChannel;

    constructor(
        protected readonly extensionUri: vscode.Uri,
        outputChannel: vscode.OutputChannel
    ) {
        this._outputChannel = outputChannel;
    }

    /**
     * Assigns a responsibility to this AI provider
     * @param responsibility The responsibility to assign
     */
    public async assignResponsibility(responsibility: any): Promise<void> {
        this.responsibilities.push(responsibility);
        // Notify the webview about the new responsibility
        if (this._view) {
            this._view.webview.postMessage({
                type: 'responsibilityAdded',
                name: responsibility.getName(),
                description: responsibility.getDescription()
            });
        }
    }

    /**
     * Gets the list of assigned responsibilities
     * @returns List of responsibilities
     */
    public getResponsibilities(): any[] {
        return [...this.responsibilities];
    }

    /**
     * Resolves the webview view
     * @param webviewView The webview view
     * @param context The resolve context
     * @param token The cancellation token
     */
    public abstract resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void>;

    /**
     * Gets the HTML for the webview
     * @param webview The webview
     * @returns HTML string
     */
    protected abstract _getHtmlForWebview(webview: vscode.Webview): string;
}
