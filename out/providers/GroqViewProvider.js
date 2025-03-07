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
exports.GroqViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseAIViewProvider_1 = require("./BaseAIViewProvider");
const logger_1 = require("../utils/logger");
class GroqViewProvider extends BaseAIViewProvider_1.BaseAIViewProvider {
    _getHtmlForWebview(webview) {
        throw new Error('Method not implemented.');
    }
    constructor(extensionUri) {
        super(extensionUri, vscode.window.createOutputChannel('Groq'));
        this.outputChannel = vscode.window.createOutputChannel('Gemini');
    }
    resolveWebviewView(webviewView, _context, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            this._view = webviewView;
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this.extensionUri]
            };
            webviewView.webview.html = this.getWebviewContent(this.extensionUri);
            webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    switch (message.command) {
                        case 'openSettings':
                            yield vscode.commands.executeCommand('workbench.action.openSettings', 'groq');
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
                    logger_1.Logger.error(`Error in Groq provider: ${error}`);
                }
            }));
        });
    }
    getWebviewContent(extensionUri) {
        throw new Error('Method not implemented.');
    }
    callAPI(text) {
        throw new Error('Method not implemented.');
    }
    sendMessageToWebview(arg0, content) {
        throw new Error('Method not implemented.');
    }
    sendErrorToWebview(arg0) {
        throw new Error('Method not implemented.');
    }
    extractResponseContent(response) {
        if (!response || !response.choices || !response.choices[0]) {
            return undefined;
        }
        return response.choices[0].text || undefined;
    }
    prepareAPIRequest(prompt) {
        return {
            model: 'mixtral-8x7b-32768',
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
exports.GroqViewProvider = GroqViewProvider;
GroqViewProvider.viewType = 'groqView';
//# sourceMappingURL=GroqViewProvider.js.map