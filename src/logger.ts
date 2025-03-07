import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    static initialize(): void {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel('MSCode Checkpoints');
        }
    }

    static get outputChannel(): vscode.OutputChannel {
        if (!this._outputChannel) {
            this.initialize();
        }
        return this._outputChannel;
    }

    static log(message: string): void {
        this.outputChannel.appendLine(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    static error(message: string, error?: any): void {
        this.outputChannel.appendLine(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (error) {
            if (error.stack) {
                this.outputChannel.appendLine(error.stack);
            } else {
                this.outputChannel.appendLine(String(error));
            }
        }
        this.outputChannel.show(true); // Montre le canal de sortie à l'utilisateur
    }

    static warning(message: string): void {
        this.outputChannel.appendLine(`[WARNING] ${new Date().toISOString()} - ${message}`);
    }

    static debug(message: string): void {
        // Pour mode debug seulement - ajouter une configuration pour activer/désactiver
        this.outputChannel.appendLine(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }

    static show(): void {
        this.outputChannel.show(true);
    }
}
