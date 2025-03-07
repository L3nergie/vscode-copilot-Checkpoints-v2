import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import * as crypto from 'crypto';
import { FileStorage } from './fileStorage';
import { HistoryManager } from './historyManager';
import { isAnyArrayBuffer } from 'util/types';

/**
 * Gestionnaire principal des checkpoints
 */
export class CheckpointManager {
    [x: string]: any;
    private context: vscode.ExtensionContext;
    private fileStorage: FileStorage;
    private historyManager: HistoryManager;
    private workspaceRoot: string | undefined;
    private isInitialized: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        
        // Initialiser les gestionnaires
        this.fileStorage = new FileStorage(this.workspaceRoot);
        this.historyManager = new HistoryManager(this.workspaceRoot);

        // Initialiser le dossier .mscode si nécessaire
        this.initMSCodeFolder();
        this.checkInitialization();
    }

    /**
     * Initialise la structure de dossiers nécessaire
     */
    private async initMSCodeFolder(): Promise<void> {
        if (!this.workspaceRoot) {
            return;
        }

        const mscodeDir = path.join(this.workspaceRoot, '.mscode');
        const dirs = [
            mscodeDir,
            path.join(mscodeDir, 'changes'),
            path.join(mscodeDir, 'initial-backup'),
            path.join(mscodeDir, 'branches')
        ];

        // Création des dossiers
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        // Création du backup initial si non existant
        const backupPath = path.join(mscodeDir, 'initial-backup', 'project.zip');
        if (!fs.existsSync(backupPath)) {
            // await this.createInitialBackup(backupPath);
        }

        // Initialisation de la structure des branches
        const branchesFile = path.join(mscodeDir, 'branches.json');
        if (!fs.existsSync(branchesFile)) {
            const initialBranchStructure = {
                main: {
                    id: 'main',
                    checkpoints: isAnyArrayBuffer, // Changed 'any []' to empty array notation
                    branches: {}
                }
            };
            fs.writeFileSync(branchesFile, JSON.stringify(initialBranchStructure, null, 2));
        }
    }

    /**
     * Crée une sauvegarde initiale du projet
     */
    private async createInitialBackup(backupPath: string): Promise<void> {
        const zip = new AdmZip();
        const excludedDirs = ['.mscode', 'node_modules', '.git'];

        const addFilesToZip = (dirPath: string, zip: AdmZip) => {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                if (excludedDirs.some(dir => fullPath.includes(dir))) {
                    continue;
                }
                
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    addFilesToZip(fullPath, zip);
                } else {
                    const zipPath = path.relative(this.workspaceRoot!, fullPath);
                    zip.addLocalFile(fullPath, path.dirname(zipPath));
                }
            }
        };

        addFilesToZip(this.workspaceRoot!, zip);
        zip.writeZip(backupPath);
    }

    /**
     * Vérifie si le projet est déjà initialisé
     */
    private checkInitialization(): boolean {
        if (!this.workspaceRoot) {
            return false;
        }
        const mscodeDir = path.join(this.workspaceRoot, '.mscode');
        this.isInitialized = fs.existsSync(mscodeDir);
        return this.isInitialized;
    }

    /**
     * Initialise un nouveau projet
     */
    public async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            vscode.window.showInformationMessage('Le projet est déjà initialisé');
            return true;
        }

        try {
            this.initMSCodeFolder();
            this.isInitialized = true;
            vscode.window.showInformationMessage('Projet initialisé avec succès');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'initialisation: ${error}`);
            return false;
        }
    }

    /**
     * Vérifie si le projet est initialisé
     */
    public isProjectInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * Crée un nouveau checkpoint avec gestion des branches
     */
    public async createCheckpoint(name: string, description?: string, branchName: string = 'main'): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Le projet doit être initialisé avant de créer un checkpoint');
        }

        try {
            const branchesPath = path.join(this.workspaceRoot!, '.mscode', 'branches.json');
            const branches = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));

            // Création du checkpoint
            const checkpoint = await this.fileStorage.saveChanges(name);
            const checkpointData = {
                id: checkpoint.id,
                name,
                description: description || '',
                timestamp: new Date().toISOString(),
                files: checkpoint.files,
                branches: {}
            };

            // Ajout du checkpoint à la branche
            if (!branches[branchName]) {
                branches[branchName] = {
                    id: branchName,
                    checkpoints: [],
                    branches: {}
                };
            }

            branches[branchName].checkpoints.push(checkpointData);
            fs.writeFileSync(branchesPath, JSON.stringify(branches, null, 2));

            // Mise à jour de l'historique
            this.historyManager.addCheckpoint(checkpointData);

            // Génération des hash MD5 pour les fichiers
            const md5Hashes = this.generateMD5Hashes(checkpoint.files);
            const md5HashesPath = path.join(this.workspaceRoot!, '.mscode', 'md5hashes.json');
            fs.writeFileSync(md5HashesPath, JSON.stringify(md5Hashes, null, 2));

            // Enregistrement des fichiers ajoutés et supprimés
            const addedFiles = this.fileStorage.getAddedFiles();
            const removedFiles = this.fileStorage.getRemovedFiles();
            const changesPath = path.join(this.workspaceRoot!, '.mscode', 'changes.json');
            const changes = {
                added: addedFiles,
                removed: removedFiles,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(changesPath, JSON.stringify(changes, null, 2));

            vscode.window.showInformationMessage(`Checkpoint "${name}" créé dans la branche "${branchName}"`);
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la création du checkpoint: ${error}`);
        }
    }

    private generateMD5Hashes(files: string[]): { [key: string]: string } {
        const md5Hashes: { [key: string]: string } = {};
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot!, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const hash = crypto.createHash('md5').update(fileContent).digest('hex');
            md5Hashes[file] = hash;
        }
        return md5Hashes;
    }

    /**
     * Récupère tous les checkpoints
     */
    public getCheckpoints() {
        return this.historyManager.getCheckpoints();
    }
}