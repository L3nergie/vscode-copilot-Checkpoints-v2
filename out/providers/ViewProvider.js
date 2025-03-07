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
        this.contextValue = 'treeItem';
        if (command) {
            this.command = command;
        }
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
        if (this.viewId === 'mscode-account') {
            return Promise.resolve([
                new TreeItem('Statut de connexion: Non connecté', vscode.TreeItemCollapsibleState.None),
                new TreeItem('Saisir votre adresse courriel', vscode.TreeItemCollapsibleState.None, {
                    command: 'mscode.account.enterEmail',
                    title: 'Saisir votre adresse courriel',
                    arguments: []
                })
            ]);
        }
        if (this.viewId === 'mscode-assistants') {
            return Promise.resolve([
                new TreeItem('OpenAI', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['OpenAI'], title: 'Open OpenAI assistant' }),
                new TreeItem('Mistral', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['Mistral'], title: 'Open Mistral assistant' }),
                new TreeItem('Groq', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['Groq'], title: 'Open Groq assistant' }),
                new TreeItem('Gemini', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['Gemini'], title: 'Open Gemini assistant' }),
                new TreeItem('DeepSeek', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['DeepSeek'], title: 'Open DeepSeek assistant' }),
                new TreeItem('Claude', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistant.openPanel', arguments: ['Claude'], title: 'Open Claude assistant' }),
                new TreeItem('Ajouter un assistant...', vscode.TreeItemCollapsibleState.None, { command: 'mscode.assistants.manage', arguments: [], title: 'Add a new assistant' })
            ]);
        }
        if (element) {
            // Si l'élément est fourni, retourner ses enfants
            switch (element.label) {
                case "Configuration des assistants":
                    return Promise.resolve([
                        new TreeItem("Définir l'assistant par défaut", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.assistants.configure',
                            title: 'Définir l\'assistant par défaut',
                            arguments: ['default']
                        }),
                        new TreeItem("Ajouter un nouvel assistant", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.assistants.manage',
                            title: 'Ajouter un nouvel assistant',
                            arguments: []
                        })
                    ]);
                case "Statistiques:":
                    return Promise.resolve([
                        new TreeItem("Problèmes: 0", vscode.TreeItemCollapsibleState.None),
                        new TreeItem("Dernier commit Git: N/A", vscode.TreeItemCollapsibleState.None)
                    ]);
                case "Actions Git":
                    return Promise.resolve([
                        new TreeItem("Effectuer un commit", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.git.commit',
                            title: 'Effectuer un commit',
                            arguments: []
                        }),
                        new TreeItem("Créer une branche", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.git.createBranch',
                            title: 'Créer une branche',
                            arguments: []
                        })
                    ]);
                case "Configuration":
                    return Promise.resolve([
                        new TreeItem("Mode de sauvegarde automatique", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.settings.autoSave',
                            title: 'Mode de sauvegarde automatique',
                            arguments: []
                        }),
                        new TreeItem("Intervalle de sauvegarde", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.settings.saveInterval',
                            title: 'Intervalle de sauvegarde',
                            arguments: []
                        })
                    ]);
                case "Actions Git":
                    return Promise.resolve([
                        new TreeItem("Effectuer un commit", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.git.commit',
                            title: 'Effectuer un commit',
                            arguments: []
                        }),
                        new TreeItem("Créer une branche", vscode.TreeItemCollapsibleState.None, {
                            command: 'mscode.git.createBranch',
                            title: 'Créer une branche',
                            arguments: []
                        })
                    ]);
                default:
                    return Promise.resolve([]);
            }
        }
        else {
            // Return different items based on the view
            switch (this.viewId) {
                case 'mscode-assistants':
                    return this.getAssistantsItems();
                case 'mscode-initial-backup':
                    return this.getInitialBackupItems();
                case 'mscode-statistics':
                    return this.getStatisticsItems();
                case 'mscode-settings':
                    return this.getSettingsItems();
                case 'mscode-checkpoints':
                    return this.getCheckpointsItems();
                case 'mscode-structure':
                    return this.getStructureItems();
                case 'mscode-tools':
                    return this.getToolsItems();
                case 'mscode-tasks':
                    return this.getTasksItems();
                case 'mscode-donations':
                    return this.getDonationsItems();
                case 'mscode-changes':
                    return this.getChangesItems();
                case 'mscode-timelines':
                    return this.getTimelinesItems();
                case 'mscode-git-status':
                    return this.getGitStatusItems();
                case 'mscode-problem-stats':
                    return this.getProblemStatsItems();
                case 'mscode-server':
                    return this.getServerItems();
                default:
                    return Promise.resolve([
                        new TreeItem("No items available", vscode.TreeItemCollapsibleState.None)
                    ]);
            }
        }
    }
    getAssistantsItems() {
        return Promise.resolve([
            new TreeItem("Assistant par défaut", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Assistant personnalisé 1", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Assistant personnalisé 2", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Configuration des assistants", vscode.TreeItemCollapsibleState.Collapsed),
            new TreeItem("Gérer les assistants", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.assistants.manage',
                title: 'Gérer les assistants',
                arguments: []
            })
        ]);
    }
    getInitialBackupItems() {
        return Promise.resolve([
            new TreeItem("Initial backup status", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Restore initial backup", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.restoreInitialBackup',
                title: 'Restore initial backup',
                arguments: []
            })
        ]);
    }
    getStatisticsItems() {
        return Promise.resolve([
            new TreeItem("Total checkpoints: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Last save: N/A", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Tracked files: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Total problems: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Changed since last checkpoint: 0", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getSettingsItems() {
        return Promise.resolve([
            new TreeItem("Configuration", vscode.TreeItemCollapsibleState.Collapsed)
        ]);
    }
    getCheckpointsItems() {
        return Promise.resolve([
            new TreeItem("No checkpoints available", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Create checkpoint", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.checkpoint.create',
                title: 'Create checkpoint',
                arguments: []
            })
        ]);
    }
    getChangesItems() {
        return Promise.resolve([
            new TreeItem("No changes detected", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getTimelinesItems() {
        // Check if initial backup exists
        const hasInitialBackup = true; // À remplacer par une vérification réelle 
        if (!hasInitialBackup) {
            return Promise.resolve([
                new TreeItem("Aucune timeline disponible - Créez d'abord une sauvegarde initiale", vscode.TreeItemCollapsibleState.None),
                new TreeItem("Créer une sauvegarde initiale", vscode.TreeItemCollapsibleState.None, {
                    command: 'mscode.initialBackup.create',
                    title: 'Créer une sauvegarde initiale',
                    arguments: []
                })
            ]);
        }
        return Promise.resolve([
            new TreeItem("Timeline initiale (point de départ)", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Statistiques:", vscode.TreeItemCollapsibleState.Collapsed),
            new TreeItem("Créer un nouveau point sur la timeline", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.timeline.createPoint',
                title: 'Créer un nouveau point sur la timeline',
                arguments: []
            })
        ]);
    }
    getGitStatusItems() {
        return Promise.resolve([
            new TreeItem("État Git actuel:", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Branche: main", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Fichiers modifiés: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Fichiers non suivis: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Actions Git", vscode.TreeItemCollapsibleState.Collapsed)
        ]);
    }
    getProblemStatsItems() {
        return Promise.resolve([
            new TreeItem("Statistiques des problèmes", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Problèmes actuels: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Erreurs: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Avertissements: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Informations: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Historique des problèmes:", vscode.TreeItemCollapsibleState.Collapsed),
            new TreeItem("Actualiser les statistiques", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.problems.refresh',
                title: 'Actualiser les statistiques',
                arguments: []
            })
        ]);
    }
    getServerItems() {
        return Promise.resolve([
            new TreeItem("Serveur MCP", vscode.TreeItemCollapsibleState.None),
            new TreeItem("État: Inactif", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Données stockées: 0 Ko", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Options du serveur", vscode.TreeItemCollapsibleState.Collapsed),
            new TreeItem("Démarrer le serveur", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.server.start',
                title: 'Démarrer le serveur',
                arguments: []
            }),
            new TreeItem("Arrêter le serveur", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.server.stop',
                title: 'Arrêter le serveur',
                arguments: []
            })
        ]);
    }
    getStructureItems() {
        return Promise.resolve([
            new TreeItem("Graphique des imports", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Relations entre les classes", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Fonctions", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getToolsItems() {
        return Promise.resolve([
            new TreeItem("Outil 1", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Outil 2", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Outil 3", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getTasksItems() {
        return Promise.resolve([
            new TreeItem("Tâche 1", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Tâche 2", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Tâche 3", vscode.TreeItemCollapsibleState.None)
        ]);
    }
    getDonationsItems() {
        return Promise.resolve([
            new TreeItem("Faire un don", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Remerciements", vscode.TreeItemCollapsibleState.None)
        ]);
    }
}
exports.ViewProvider = ViewProvider;
//# sourceMappingURL=ViewProvider.js.map