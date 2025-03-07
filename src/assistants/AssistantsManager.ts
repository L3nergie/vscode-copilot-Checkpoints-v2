import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface Assistant {
    id: string;
    name: string;
    description: string;
    apiProvider: string;
    apiKey?: string;
    model?: string;
    isDefault: boolean;
    created: string;
    lastUsed?: string;
}

export class AssistantsManager {
    private readonly workspaceRoot: string | undefined;
    private readonly assistantsFilePath: string | undefined;
    private assistants: Assistant[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(
        workspaceRoot: string | undefined,
        outputChannel: vscode.OutputChannel
    ) {
        this.workspaceRoot = workspaceRoot;
        this.outputChannel = outputChannel;

        if (this.workspaceRoot) {
            // Définir le chemin vers le fichier de configuration des assistants
            const mscodeDir = path.join(this.workspaceRoot, '.mscode');
            this.assistantsFilePath = path.join(mscodeDir, 'assistants.json');

            // Créer le dossier .mscode s'il n'existe pas
            if (!fs.existsSync(mscodeDir)) {
                fs.mkdirSync(mscodeDir, { recursive: true });
            }

            // Charger les assistants existants ou créer un fichier par défaut
            this.loadAssistants();
        }
    }

    private loadAssistants(): void {
        if (!this.assistantsFilePath) return;

        try {
            if (fs.existsSync(this.assistantsFilePath)) {
                const assistantsData = fs.readFileSync(this.assistantsFilePath, 'utf8');
                this.assistants = JSON.parse(assistantsData);
            } else {
                // Créer un assistant par défaut
                this.assistants = [{
                    id: 'default',
                    name: 'Assistant par défaut',
                    description: 'Assistant principal configuré avec les paramètres par défaut',
                    apiProvider: 'openai',
                    isDefault: true,
                    created: new Date().toISOString()
                }];

                // Sauvegarder l'assistant par défaut
                this.saveAssistants();
            }
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors du chargement des assistants: ${error}`);

            // En cas d'erreur, initialiser avec un tableau vide
            this.assistants = [];
        }
    }

    private saveAssistants(): void {
        if (!this.assistantsFilePath) return;

        try {
            fs.writeFileSync(this.assistantsFilePath, JSON.stringify(this.assistants, null, 2));
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la sauvegarde des assistants: ${error}`);
        }
    }

    public getAssistants(): Assistant[] {
        return [...this.assistants];
    }

    public getDefaultAssistant(): Assistant | undefined {
        return this.assistants.find(assistant => assistant.isDefault);
    }

    public addAssistant(assistant: Omit<Assistant, 'id' | 'created'>): Assistant {
        const newAssistant: Assistant = {
            ...assistant,
            id: `assistant_${Date.now()}`,
            created: new Date().toISOString()
        };

        // Si le nouvel assistant est défini comme par défaut, désactiver l'assistant par défaut actuel
        if (newAssistant.isDefault) {
            this.assistants.forEach(a => {
                if (a.isDefault) {
                    a.isDefault = false;
                }
            });
        }

        this.assistants.push(newAssistant);
        this.saveAssistants();

        return newAssistant;
    }

    public updateAssistant(id: string, updates: Partial<Assistant>): Assistant | undefined {
        const assistantIndex = this.assistants.findIndex(a => a.id === id);

        if (assistantIndex === -1) {
            return undefined;
        }

        // Si l'assistant est mis à jour comme par défaut, désactiver l'assistant par défaut actuel
        if (updates.isDefault) {
            this.assistants.forEach(a => {
                if (a.isDefault) {
                    a.isDefault = false;
                }
            });
        }

        // Mettre à jour l'assistant
        this.assistants[assistantIndex] = {
            ...this.assistants[assistantIndex],
            ...updates
        };

        this.saveAssistants();

        return this.assistants[assistantIndex];
    }

    public deleteAssistant(id: string): boolean {
        const initialLength = this.assistants.length;
        this.assistants = this.assistants.filter(a => a.id !== id);

        if (this.assistants.length < initialLength) {
            this.saveAssistants();
            return true;
        }

        return false;
    }
}
