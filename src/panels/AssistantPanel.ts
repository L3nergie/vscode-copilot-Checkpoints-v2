import * as vscode from "vscode";

interface TabInfo {
    name: string;
    content: string;
}

export class AssistantPanel {
    public static currentPanel: AssistantPanel | undefined;
    public readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _tabs: TabInfo[] = [];
    private _tabCounter: number = 1;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview initial content
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);

        // Listen for the panel to be disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "alert":
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case "deleteTab":
                        this.deleteTab(message.tabName);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static render(extensionUri: vscode.Uri) {
        const panel = vscode.window.createWebviewPanel(
            "copilotCheckpoints",
            'Chat',
            vscode.ViewColumn.Two,
            {
                // Enable javascript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `out` and `webview-ui/public` directories
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'webview-ui/public')
                ]
            }
        );

        AssistantPanel.currentPanel = new AssistantPanel(panel, extensionUri);
        return AssistantPanel.currentPanel;
    }

    public addTab(assistantName: string) {
        const tabName = `${assistantName} ${this._tabCounter++}`;
        this._tabs.push({ name: tabName, content: `<h1>Assistant: ${tabName}</h1><p>This is the panel for assistant: ${tabName}</p>` });
        this.updateWebviewContent();
    }

    public deleteTab(tabName: string) {
        this._tabs = this._tabs.filter(tab => tab.name !== tabName);
        this.updateWebviewContent();
    }

    public dispose() {
        AssistantPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Chat</title>
              <style>
                body {
                    display: flex;
                    height: 100vh;
                }
                #tab-menu {
                    width: 200px;
                    background-color: #f0f0f0;
                    padding: 10px;
                }
                #tab-menu button {
                    display: block;
                    margin-bottom: 5px;
                    width: 100%;
                    text-align: left;
                }
                #content {
                    flex-grow: 1;
                    padding: 20px;
                }
                .tab-button {
                    position: relative;
                }
                .tab-close {
                    position: absolute;
                    top: 0;
                    right: 0;
                    cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div id="tab-menu">
                <h2>Tabs</h2>
                ${this._tabs.map(tab => `
                    <div class="tab-button">
                        <button>${tab.name}</button>
                        <span class="tab-close" data-tab="${tab.name}">x</span>
                    </div>
                `).join('')}
              </div>
              <div id="content">
                ${this._tabs.map(tab => `<div>${tab.content}</div>`).join('')}
              </div>
              <script>
                const vscode = acquireVsCodeApi();
                document.querySelectorAll('.tab-close').forEach(button => {
                    button.addEventListener('click', () => {
                        const tabName = button.dataset.tab;
                        vscode.postMessage({
                            command: 'deleteTab',
                            tabName: tabName
                        });
                    });
                });
              </script>
            </body>
          </html>
        `;
    }

    private updateWebviewContent() {
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);
    }
}
