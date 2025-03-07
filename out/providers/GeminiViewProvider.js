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
exports.GeminiViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseAIViewProvider_1 = require("./BaseAIViewProvider");
const aiProviders_1 = require("../config/aiProviders");
class GeminiViewProvider extends BaseAIViewProvider_1.BaseAIViewProvider {
    constructor(extensionUri) {
        const outputChannel = vscode.window.createOutputChannel('Gemini');
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
                <title>Gemini</title>
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
            try {
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            }
            catch (error) {
                this.outputChannel.appendLine(`Error setting webview HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
            webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    switch (message.command) {
                        case 'openSettings':
                            yield vscode.commands.executeCommand('workbench.action.openSettings', 'gemini');
                            break;
                        case 'sendMessage':
                            if (message.text) {
                                const response = yield this.callAPI(message.text);
                                if ((_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) {
                                    this.sendMessageToWebview('response', response.candidates[0].content.parts[0].text);
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
    callAPI(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = (0, aiProviders_1.getApiConfig)('gemini');
            if (!config) {
                const errorMessage = 'Gemini configuration not found';
                this.outputChannel.appendLine(`API Error: ${errorMessage}`);
                throw new Error(errorMessage);
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
                    const errorMessage = `API request failed: ${response.statusText}`;
                    this.outputChannel.appendLine(`API Error: ${errorMessage}`);
                    throw new Error(errorMessage);
                }
                const data = yield response.json();
                if (typeof data === 'object' && data !== null && 'candidates' in data && Array.isArray(data.candidates)) {
                    return data;
                }
                const errorMessage = 'Invalid API response format';
                this.outputChannel.appendLine(`API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            catch (error) {
                this.outputChannel.appendLine(`API Error: ${error}`);
                throw error;
            }
        });
    }
    sendMessageToWebview(type, content) {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({ type, content });
    }
    sendErrorToWebview(message) {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
            type: 'error',
            content: message
        });
    }
    prepareAPIRequest(prompt) {
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
exports.GeminiViewProvider = GeminiViewProvider;
GeminiViewProvider.viewType = 'geminiView';
//# sourceMappingURL=GeminiViewProvider.js.map