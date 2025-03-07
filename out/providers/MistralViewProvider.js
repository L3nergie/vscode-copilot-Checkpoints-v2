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
exports.MistralViewProvider = void 0;
const BaseAIViewProvider_1 = require("./BaseAIViewProvider");
const logger_1 = require("../utils/logger");
const vscode = __importStar(require("vscode"));
class MistralViewProvider extends BaseAIViewProvider_1.BaseAIViewProvider {
    constructor(extensionUri, outputChannel) {
        super(extensionUri, outputChannel);
    }
    _getHtmlForWebview(webview) {
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
    getWebviewContent(extensionUri) {
        return this._getHtmlForWebview(this._view.webview);
    }
    callAPI(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement the method to call the API
            return {};
        });
    }
    sendMessageToWebview(type, content) {
        var _a;
        (_a = this._view) === null || _a === void 0 ? void 0 : _a.webview.postMessage({ type, text: content });
    }
    sendErrorToWebview(error) {
        // Implement the method to send an error to the webview
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
                            yield vscode.commands.executeCommand('workbench.action.openSettings', 'mistral');
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
                    logger_1.Logger.error(`Error in Mistral provider: ${error}`);
                }
            }));
        });
    }
    extractResponseContent(response) {
        var _a, _b, _c;
        if (!response || !((_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content)) {
            return undefined;
        }
        return response.choices[0].message.content;
    }
    prepareAPIRequest(prompt) {
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
exports.MistralViewProvider = MistralViewProvider;
//# sourceMappingURL=MistralViewProvider.js.map