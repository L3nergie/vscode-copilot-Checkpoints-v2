import * as vscode from 'vscode';
import { Logger } from '../logger';

export class CommandManager {
    constructor(private context: vscode.ExtensionContext) {
        this.registerCommands();
    }

    private registerCommands() {
        // Commandes pour les paramètres
        this.register('mscode.settings.autoSave', this.toggleAutoSave);
        this.register('mscode.settings.saveInterval', this.setSaveInterval);

        // Commandes pour le backup initial
        this.register('mscode.restoreInitialBackup', this.restoreInitialBackup);
    }

    private register(command: string, callback: (...args: any[]) => any) {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(command, callback)
        );
        Logger.log(`Commande enregistrée: ${command}`);
    }

    private toggleAutoSave() {
        vscode.window.showQuickPick(
            ['Activé', 'Désactivé'],
            { placeHolder: 'Sauvegarde automatique' }
        ).then(choice => {
            if (choice) {
                vscode.window.showInformationMessage(`Sauvegarde automatique: ${choice}`);
            }
        });
    }

    private setSaveInterval() {
        vscode.window.showInputBox({
            prompt: 'Intervalle de sauvegarde (en minutes)',
            value: '5'
        }).then(value => {
            if (value) {
                vscode.window.showInformationMessage(`Intervalle de sauvegarde défini à ${value} minutes`);
            }
        });
    }

    private restoreInitialBackup() {
        vscode.window.showWarningMessage(
            'Êtes-vous sûr de vouloir restaurer le backup initial? Cette action est irréversible.',
            { modal: true },
            'Restaurer', 'Annuler'
        ).then(choice => {
            if (choice === 'Restaurer') {
                vscode.window.showInformationMessage('Restauration du backup initial en cours...');
                // Logique de restauration à implémenter
            }
        });
    }
}
