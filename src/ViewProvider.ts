import * as vscode from 'vscode';

export class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

export class ViewProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private viewId: string = '';

    constructor(
        private context: vscode.ExtensionContext,
        viewId?: string
    ) {
        if (viewId) {
            this.viewId = viewId;
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
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

    private getInitialBackupItems(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new TreeItem("Status du backup initial", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Restaurer le backup initial", vscode.TreeItemCollapsibleState.None, {
                command: 'mscode.restoreInitialBackup',
                title: 'Restaurer le backup initial'
            })
        ]);
    }

    private getStatisticsItems(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new TreeItem("Nombre total de checkpoints: 0", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Dernière sauvegarde: N/A", vscode.TreeItemCollapsibleState.None),
            new TreeItem("Fichiers surveillés: 0", vscode.TreeItemCollapsibleState.None)
        ]);
    }

    private getSettingsItems(): Thenable<TreeItem[]> {
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

    private getCheckpointsItems(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new TreeItem("Aucun checkpoint disponible", vscode.TreeItemCollapsibleState.None)
        ]);
    }

    private getChangesItems(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new TreeItem("Aucun changement détecté", vscode.TreeItemCollapsibleState.None)
        ]);
    }

    private getTimelinesItems(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new TreeItem("Aucune timeline disponible", vscode.TreeItemCollapsibleState.None)
        ]);
    }
}
