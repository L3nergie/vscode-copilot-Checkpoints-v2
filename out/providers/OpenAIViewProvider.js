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
exports.OpenAIViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseAIViewProvider_1 = require("./BaseAIViewProvider");
const aiProviders_1 = require("../config/aiProviders");
const logger_1 = require("../utils/logger");
class OpenAIViewProvider extends BaseAIViewProvider_1.BaseAIViewProvider {
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'panel.js'));
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
    constructor(extensionUri, outputChannel) {
        super(extensionUri, outputChannel);
        this.config = (0, aiProviders_1.getApiConfig)('openai');
        if (!this.config) {
            throw new Error('OpenAI configuration not found');
        }
        this.outputChannel = outputChannel;
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
                            yield vscode.commands.executeCommand('workbench.action.openSettings', 'openai');
                            break;
                        case 'sendMessage':
                            if (message.text) {
                                const response = yield this.callAPI(message.text);
                                const content = this.extractResponseContent(response);
                                if (content) {
                                    this.sendMessageToWebview('response', content);
                                }
                                else {
                                    this.sendErrorToWebview('No valid response content received');
                                }
                            }
                            break;
                    }
                }
                catch (error) {
                    this.sendErrorToWebview(error instanceof Error ? error.message : 'Une erreur est survenue');
                    logger_1.Logger.error(`Error in OpenAI provider: ${error}`);
                }
            }));
        });
    }
    extractResponseContent(response) {
        var _a;
        if (typeof response !== 'object' || response === null) {
            return undefined;
        }
        const res = response;
        if (!res.choices || !res.choices[0]) {
            return undefined;
        }
        const choice = res.choices[0];
        return ((_a = choice.message) === null || _a === void 0 ? void 0 : _a.content) || choice.text;
    }
    callAPI(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this.prepareAPIRequest(prompt);
            const config = (0, aiProviders_1.getApiConfig)('openai');
            if (!(config === null || config === void 0 ? void 0 : config.apiKey)) {
                throw new Error('OpenAI API key not configured');
            }
            try {
                const response = yield fetch(config.endpoint, {
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
                return yield response.json();
            }
            catch (error) {
                logger_1.Logger.error(`OpenAI API call failed: ${error}`);
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
exports.OpenAIViewProvider = OpenAIViewProvider;
OpenAIViewProvider.viewType = 'openaiView';
//# sourceMappingURL=OpenAIViewProvider.js.map