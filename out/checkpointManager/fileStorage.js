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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
/**
 * Gère le stockage des fichiers pour les checkpoints
 */
class FileStorage {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Sauvegarde les changements actuels dans un nouveau checkpoint
     */
    saveChanges(name) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const modifiedFiles = yield this.getModifiedFiles();
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
            }
            catch (error) {
                console.error('Erreur lors de la sauvegarde des modifications:', error);
                throw new Error(`Erreur lors de la sauvegarde: ${error}`);
            }
        });
    }
    /**
     * Récupère la liste des fichiers modifiés dans l'espace de travail
     * À implémenter: intégration avec Git pour détecter les changements
     */
    getModifiedFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            // Pour l'instant, retourne une liste vide
            // À implémenter: détection des fichiers modifiés via Git ou autres moyens
            return [];
        });
    }
    /**
     * Récupère la liste des fichiers ajoutés
     */
    getAddedFiles() {
        // À implémenter: détection des fichiers ajoutés
        return [];
    }
    /**
     * Récupère la liste des fichiers supprimés
     */
    getRemovedFiles() {
        // À implémenter: détection des fichiers supprimés
        return [];
    }
}
exports.FileStorage = FileStorage;
//# sourceMappingURL=fileStorage.js.map