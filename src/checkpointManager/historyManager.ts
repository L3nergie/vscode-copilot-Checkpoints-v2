import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface pour un checkpoint
 */
export interface Checkpoint {
    id: string;
    name: string;
    description: string;
    timestamp: string;
    files: string[];
}

/**
 * Interface pour l'historique complet
 */
export interface History {
    checkpoints: Checkpoint[];
    currentVersion: string | null;
    lastValidatedVersion: string | null;
    initialVersion: string | null;
}

/**
 * Gère l'historique des checkpoints
 */
export class HistoryManager {
    private workspaceRoot: string | undefined;
    private historyFilePath: string | undefined;
    private history: History | null = null;

    constructor(workspaceRoot: string | undefined) {
        this.workspaceRoot = workspaceRoot;
        
        if (this.workspaceRoot) {
            this.historyFilePath = path.join(this.workspaceRoot, '.mscode', 'history.json');
            this.loadHistory();
        }
    }

    /**
     * Charge l'historique depuis le fichier
     */
    private loadHistory(): void {
        if (!this.historyFilePath || !fs.existsSync(this.historyFilePath)) {
            this.history = {
                checkpoints: [],
                currentVersion: null,
                lastValidatedVersion: null,
                initialVersion: null
            };
            return;
        }

        try {
            const historyData = fs.readFileSync(this.historyFilePath, 'utf8');
            this.history = JSON.parse(historyData);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            this.history = {
                checkpoints: [],
                currentVersion: null,
                lastValidatedVersion: null,
                initialVersion: null
            };
        }
    }

    /**
     * Sauvegarde l'historique dans le fichier
     */
    private saveHistory(): void {
        if (!this.historyFilePath || !this.history) {
            return;
        }

        try {
            fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }

    /**
     * Ajoute un nouveau checkpoint à l'historique
     */
    public addCheckpoint(checkpoint: Checkpoint): void {
        if (!this.history) {
            this.loadHistory();
        }

        if (this.history) {
            this.history.checkpoints.push(checkpoint);
            this.history.currentVersion = checkpoint.id;
            this.saveHistory();

            // Ajouter le md5 avant et après la modification
            const md5Before = this.calculateMD5(checkpoint.files);
            const md5After = this.calculateMD5(checkpoint.files);
            this.saveMD5(checkpoint.id, md5Before, md5After);
        }
    }

    private calculateMD5(files: string[]): string {
        const crypto = require('crypto');
        const md5 = crypto.createHash('md5');
        files.forEach(file => {
            const fileContent = fs.readFileSync(file, 'utf8');
            md5.update(fileContent);
        });
        return md5.digest('hex');
    }

    private saveMD5(checkpointId: string, md5Before: string, md5After: string): void {
        const md5Dir = path.join(this.workspaceRoot!, '.mscode', 'md5');
        if (!fs.existsSync(md5Dir)) {
            fs.mkdirSync(md5Dir, { recursive: true });
        }
        const md5FilePath = path.join(md5Dir, `${checkpointId}.json`);
        const md5Data = {
            before: md5Before,
            after: md5After
        };
        fs.writeFileSync(md5FilePath, JSON.stringify(md5Data, null, 2));
    }

    /**
     * Récupère tous les checkpoints
     */
    public getCheckpoints(): Checkpoint[] {
        if (!this.history) {
            this.loadHistory();
        }

        return this.history?.checkpoints || [];
    }

    /**
     * Définit la version actuelle
     */
    public setCurrentVersion(id: string): void {
        if (!this.history) {
            this.loadHistory();
        }

        if (this.history) {
            this.history.currentVersion = id;
            this.saveHistory();
        }
    }

    /**
     * Définit la dernière version validée
     */
    public setLastValidatedVersion(id: string): void {
        if (!this.history) {
            this.loadHistory();
        }

        if (this.history) {
            this.history.lastValidatedVersion = id;
            this.saveHistory();
        }
    }
}