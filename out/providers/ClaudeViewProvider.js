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
exports.ClaudeViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseAIViewProvider_1 = require("./BaseAIViewProvider");
const aiProviders_1 = require("../config/aiProviders");
class ClaudeViewProvider extends BaseAIViewProvider_1.BaseAIViewProvider {
    constructor(extensionUri, outputChannel) {
        super(extensionUri, outputChannel);
        this.outputChannel = outputChannel;
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.css'));
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
    resolveWebviewView(webviewView, _context, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            this._view = webviewView;
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.extensionUri]
            };
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    switch (message.command) {
                        case 'openSettings':
                            yield vscode.commands.executeCommand('workbench.action.openSettings', 'claude');
                            break;
                        case 'sendMessage':
                            if (message.text) {
                                const response = yield this.callAPI(message.text);
                                if (response.completion) {
                                    this.sendMessageToWebview('response', response.completion);
                                }
                            }
                            break;
                    }
                }
                catch (error) {
                    this.sendErrorToWebview(error instanceof Error ? error.message : 'Une erreur est survenue');
                }
            }));
        });
    }
    prepareAPIRequest(prompt) {
        return {
            model: 'claude-3-sonnet',
            prompt: prompt,
            max_tokens_to_sample: 2000,
            temperature: 0.7,
        };
    }
    callAPI(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = (0, aiProviders_1.getApiConfig)('claude');
            if (!config) {
                throw new Error('Claude configuration not found');
            }
            try {
                const response = yield fetch(config.endpoint, {
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
                return yield response.json();
            }
            catch (error) {
                this.outputChannel.appendLine(`API Error: ${error}`);
                throw error;
            }
        });
    }
    sendMessageToWebview(type, message) {
        if (this._view) {
            this._view.webview.postMessage({ type, message });
        }
    }
    sendErrorToWebview(error) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'error',
                message: error
            });
        }
    }
}
exports.ClaudeViewProvider = ClaudeViewProvider;
ClaudeViewProvider.viewType = 'claudeView';
//# sourceMappingURL=ClaudeViewProvider.js.map