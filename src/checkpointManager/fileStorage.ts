import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Gère le stockage des fichiers pour les checkpoints
 */
export class FileStorage {
    private readonly workspaceRoot: string | undefined;

    constructor(workspaceRoot: string | undefined) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Sauvegarde les changements actuels dans un nouveau checkpoint
     */
    public async saveChanges(name: string): Promise<{ id: string, files: string[] }> {
        if (!this.workspaceRoot) {
            throw new Error('Aucun espace de travail ouvert');
        }

        try {
            // Génère un ID unique pour ce checkpoint
            const checkpointId = crypto.randomUUID();

            // Crée le dossier pour ce checkpoint
            const checkpointDir = path.join(this.workspaceRoot, '.mscode', 'changes', checkpointId);
            fs.mkdirSync(checkpointDir, { recursive: true });

            // Obtient tous les fichiers modifiés (à implémenter: logique plus sophistiquée)
            const modifiedFiles = await this.getModifiedFiles();

            // Crée un dossier pour les fichiers modifiés
            const modifiedFilesDir = path.join(checkpointDir, 'modified');
            fs.mkdirSync(modifiedFilesDir, { recursive: true });

            // Crée un dossier pour les fichiers supprimés
            const deletedFilesDir = path.join(checkpointDir, 'deleted');
            fs.mkdirSync(deletedFilesDir, { recursive: true });

            // Copie chaque fichier modifié dans le dossier du checkpoint
            for (const file of modifiedFiles) {
                const relativePath = path.relative(this.workspaceRoot, file);
                const targetPath = path.join(modifiedFilesDir, relativePath);
            
                // S'assurer que le dossier parent existe
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            
                // Copier le fichier
                fs.copyFileSync(file, targetPath);
            
                // Calculer le hash MD5 du fichier avant modification
                const beforeHash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
            
                // Calculer le hash MD5 du fichier après modification
                const afterHash = crypto.createHash('md5').update(fs.readFileSync(targetPath)).digest('hex');
            
                // Créer un dossier pour le diff entre les deux hashs
                const diffDir = path.join(checkpointDir, 'diff', beforeHash, afterHash);
                fs.mkdirSync(diffDir, { recursive: true });
            
                // Enregistrer les hashs dans le dossier diff
                fs.writeFileSync(path.join(diffDir, 'before.md5'), beforeHash);
                fs.writeFileSync(path.join(diffDir, 'after.md5'), afterHash);
            }
            
            // Copie chaque fichier supprimé dans le dossier du checkpoint
            for (const file of deletedFilesDir) {
                const relativePath = path.relative(this.workspaceRoot, file);
                const targetPath = path.join(deletedFilesDir, relativePath);
            
                // S'assurer que le dossier parent existe
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            
                // Calculer le hash MD5 du fichier avant suppression
                const beforeHash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
            
                // Créer un dossier pour le diff entre les deux hashs
                const diffDir = path.join(checkpointDir, 'diff', beforeHash, 'deleted');
                fs.mkdirSync(diffDir, { recursive: true });
            
                // Enregistrer le hash dans le dossier diff
                fs.writeFileSync(path.join(diffDir, 'before.md5'), beforeHash);
            }

            return {
                id: checkpointId,
                files: modifiedFiles.map(file => path.relative(checkpointDir, file))
            };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des modifications:', error);
            throw new Error(`Erreur lors de la sauvegarde: ${error}`);
        }
    }

    /**
     * Récupère la liste des fichiers modifiés dans l'espace de travail
     * À implémenter: intégration avec Git pour détecter les changements
     */
    private async getModifiedFiles(): Promise<string[]> {
        // Pour l'instant, retourne une liste vide
        // À implémenter: détection des fichiers modifiés via Git ou autres moyens
        return [];
    }

    /**
     * Récupère la liste des fichiers ajoutés
     */
    public getAddedFiles(): string[] {
        // À implémenter: détection des fichiers ajoutés
        return [];
    }

    /**
     * Récupère la liste des fichiers supprimés
     */
    public getRemovedFiles(): string[] {
        // À implémenter: détection des fichiers supprimés
        return [];
    }
}