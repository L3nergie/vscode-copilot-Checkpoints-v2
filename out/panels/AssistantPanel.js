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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantPanel = void 0;
const vscode = __importStar(require("vscode"));
class AssistantPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._tabs = [];
        this._tabCounter = 1;
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview initial content
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);
        // Listen for the panel to be disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "alert":
                    vscode.window.showErrorMessage(message.text);
                    return;
                case "deleteTab":
                    this.deleteTab(message.tabName);
                    return;
            }
        }, null, this._disposables);
    }
    static render(extensionUri) {
        const panel = vscode.window.createWebviewPanel("copilotCheckpoints", 'Chat', vscode.ViewColumn.Two, {
            // Enable javascript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `out` and `webview-ui/public` directories
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'out'),
                vscode.Uri.joinPath(extensionUri, 'webview-ui/public')
            ]
        });
        AssistantPanel.currentPanel = new AssistantPanel(panel, extensionUri);
        return AssistantPanel.currentPanel;
    }
    addTab(assistantName) {
        const tabName = `${assistantName} ${this._tabCounter++}`;
        this._tabs.push({ name: tabName, content: `<h1>Assistant: ${tabName}</h1><p>This is the panel for assistant: ${tabName}</p>` });
        this.updateWebviewContent();
    }
    deleteTab(tabName) {
        this._tabs = this._tabs.filter(tab => tab.name !== tabName);
        this.updateWebviewContent();
    }
    dispose() {
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
    _getWebviewContent(webview, extensionUri) {
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
    updateWebviewContent() {
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);
    }
}
exports.AssistantPanel = AssistantPanel;
//# sourceMappingURL=AssistantPanel.js.map