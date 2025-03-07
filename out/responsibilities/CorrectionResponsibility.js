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
exports.CorrectionResponsibility = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
const logger_1 = require("../utils/logger");
class CorrectionResponsibility extends types_1.BaseResponsibility {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.info('Exécution de la correction/traduction...');
                const config = vscode.workspace.getConfiguration('mscode.correction');
                const targetLanguage = config.get('targetLanguage') || 'fr';
                const autoCorrect = config.get('autoCorrect') || false;
                const autoCorrectionDelay = config.get('autoCorrectionDelay') || 1000;
                if (autoCorrect) {
                    // Logique de correction automatique
                    logger_1.Logger.info(`Correction automatique activée (délai: ${autoCorrectionDelay}ms)`);
                    yield this.correctActiveDocument(targetLanguage);
                }
            }
            catch (error) {
                logger_1.Logger.error(`Erreur lors de la correction: ${error}`);
                throw error;
            }
        });
    }
    correctActiveDocument(targetLanguage) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const document = editor.document;
            const text = document.getText();
            // Extract comments and strings
            const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
            const comments = Array.from(text.matchAll(commentRegex));
            // Process each comment
            for (const match of comments) {
                const comment = match[0];
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + comment.length);
                const range = new vscode.Range(startPos, endPos);
                // Translate/correct the comment based on target language
                const correctedComment = yield this.translateText(comment, targetLanguage);
                if (correctedComment && correctedComment !== comment) {
                    // Apply the correction
                    yield editor.edit(editBuilder => {
                        editBuilder.replace(range, correctedComment);
                    });
                    logger_1.Logger.info(`Corrected comment from "${comment}" to "${correctedComment}"`);
                }
            }
            // Apply custom correction rules
            const config = vscode.workspace.getConfiguration('mscode.correction');
            const rules = config.get('correctionRules') || [];
            for (const rule of rules) {
                const regex = new RegExp(rule.pattern, 'g');
                const matches = Array.from(text.matchAll(regex));
                for (const match of matches) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    yield editor.edit(editBuilder => {
                        editBuilder.replace(range, rule.replacement);
                    });
                    logger_1.Logger.info(`Applied correction rule: ${rule.pattern} -> ${rule.replacement}`);
                }
            }
        });
    }
    translateText(text, targetLanguage) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove comment symbols and trim
            const cleanText = text.replace(/\/\*|\*\/|\/\//g, '').trim();
            // Simple mapping for common code terms
            const translations = {
                'fr': {
                    'function': 'fonction',
                    'return': 'retourne',
                    'if': 'si',
                    'else': 'sinon',
                    'for': 'pour',
                    'while': 'tant que',
                    'TODO': 'À FAIRE',
                    'FIXME': 'À CORRIGER',
                    'NOTE': 'NOTE',
                }
            };
            if (!translations[targetLanguage]) {
                return text;
            }
            let translatedText = cleanText;
            for (const [en, translated] of Object.entries(translations[targetLanguage])) {
                const regex = new RegExp(`\\b${en}\\b`, 'gi');
                translatedText = translatedText.replace(regex, translated);
            }
            // Preserve the original comment style
            if (text.startsWith('//')) {
                return `// ${translatedText}`;
            }
            else if (text.startsWith('/*')) {
                return `/* ${translatedText} */`;
            }
            return translatedText;
        });
    }
    getName() {
        return "Correction et Traduction";
    }
    getDescription() {
        return "Corrige et traduit automatiquement le code et les commentaires";
    }
    getPriority() {
        return 2;
    }
}
exports.CorrectionResponsibility = CorrectionResponsibility;
//# sourceMappingURL=CorrectionResponsibility.js.map