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
exports.CommandManager = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../logger");
class CommandManager {
    constructor(context) {
        this.context = context;
        this.registerCommands();
    }
    registerCommands() {
        // Commandes pour les paramètres
        this.register('mscode.settings.autoSave', this.toggleAutoSave);
        this.register('mscode.settings.saveInterval', this.setSaveInterval);
        // Commandes pour le backup initial
        this.register('mscode.restoreInitialBackup', this.restoreInitialBackup);
    }
    register(command, callback) {
        this.context.subscriptions.push(vscode.commands.registerCommand(command, callback));
        logger_1.Logger.log(`Commande enregistrée: ${command}`);
    }
    toggleAutoSave() {
        vscode.window.showQuickPick(['Activé', 'Désactivé'], { placeHolder: 'Sauvegarde automatique' }).then(choice => {
            if (choice) {
                vscode.window.showInformationMessage(`Sauvegarde automatique: ${choice}`);
            }
        });
    }
    setSaveInterval() {
        vscode.window.showInputBox({
            prompt: 'Intervalle de sauvegarde (en minutes)',
            value: '5'
        }).then(value => {
            if (value) {
                vscode.window.showInformationMessage(`Intervalle de sauvegarde défini à ${value} minutes`);
            }
        });
    }
    restoreInitialBackup() {
        vscode.window.showWarningMessage('Êtes-vous sûr de vouloir restaurer le backup initial? Cette action est irréversible.', { modal: true }, 'Restaurer', 'Annuler').then(choice => {
            if (choice === 'Restaurer') {
                vscode.window.showInformationMessage('Restauration du backup initial en cours...');
                // Logique de restauration à implémenter
            }
        });
    }
}
exports.CommandManager = CommandManager;
//# sourceMappingURL=CommandManager.js.map