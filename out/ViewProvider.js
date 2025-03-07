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
exports.ViewProvider = exports.TreeItem = void 0;
const vscode = __importStar(require("vscode"));
class TreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
    }
}
exports.TreeItem = TreeItem;
class ViewProvider {
    constructor(context, viewId) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.viewId = '';
        if (viewId) {
            this.viewId = viewId;
        }
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        else {
            // Retourne différents éléments selon la vue
            switch (this.viewId) {
                case 'mscode-initial-backup':
                    return this.getInitialBackupItems();
                case 'mscode-statistics':
                    return this.getStatisticsItems();
                case 'mscode-settings':
                    return this.getSettingsItems();
                case 'mscode-checkpoints':
                    return this.getCheckpointsItems();
                case 'mscode-changes':
                    return this.getChangesItems();
                case 'mscode-timelines':
                    return this.getTimelinesItems();
                default:
                    return Promise.resolve([
                        new TreeItem("Aucun élément disponible", vscode.TreeItemCollapsibleState.None)
                    ]);
            }
        }
    }
    getInitialBackupItems() {
        return Promise.resolve([
            new TreeItem("Status du backup initial", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Restaurer le backup initial", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.restoreInitialBackup',
                title: 'Restaurer le backup initial'
            })
        ]);
    }
    getStatisticsItems() {
        return Promise.resolve([
            new TreeItem("Nombre total de checkpoints: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Dernière sauvegarde: N/A", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Fichiers surveillés: 0", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getSettingsItems() {
        return Promise.resolve([
            new TreeItem("Configuration", vscode.TreeItemCollapsibleState.Collapsed),
            new TreeItem("Mode de sauvegarde automatique", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.settings.autoSave',
                title: 'Mode de sauvegarde automatique'
            }),
            new TreeItem("Intervalle de sauvegarde", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.settings.saveInterval',
                title: 'Intervalle de sauvegarde'
            })
        ]);
    }
    getCheckpointsItems() {
        return Promise.resolve([
            new TreeItem("Aucun checkpoint disponible", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getChangesItems() {
        return Promise.resolve([
            new TreeItem("Aucun changement détecté", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getTimelinesItems() {
        return Promise.resolve([
            new TreeItem("Aucune timeline disponible", vscode.TreeItemCollapsibleState.None)
        ]);
    }
}
exports.ViewProvider = ViewProvider;
//# sourceMappingURL=ViewProvider.js.map