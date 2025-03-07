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
exports.Logger = void 0;
const vscode = __importStar(require("vscode"));
class Logger {
    static initialize() {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel('MSCode Checkpoints');
        }
    }
    static get outputChannel() {
        if (!this._outputChannel) {
            this.initialize();
        }
        return this._outputChannel;
    }
    static log(message) {
        this.outputChannel.appendLine(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
    static error(message, error) {
        this.outputChannel.appendLine(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (error) {
            if (error.stack) {
                this.outputChannel.appendLine(error.stack);
            }
            else {
                this.outputChannel.appendLine(String(error));
            }
        }
        this.outputChannel.show(true); // Montre le canal de sortie à l'utilisateur
    }
    static warning(message) {
        this.outputChannel.appendLine(`[WARNING] ${new Date().toISOString()} - ${message}`);
    }
    static debug(message) {
        // Pour mode debug seulement - ajouter une configuration pour activer/désactiver
        this.outputChannel.appendLine(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
    static show() {
        this.outputChannel.show(true);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map