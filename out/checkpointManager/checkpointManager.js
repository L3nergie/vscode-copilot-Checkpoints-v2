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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const crypto = __importStar(require("crypto"));
const fileStorage_1 = require("./fileStorage");
const historyManager_1 = require("./historyManager");
const types_1 = require("util/types");
/**
 * Gestionnaire principal des checkpoints
 */
class CheckpointManager {
    constructor(context) {
        var _a;
        this.isInitialized = false;
        this.context = context;
        this.workspaceRoot = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0].uri.fsPath;
        // Initialiser les gestionnaires
        this.fileStorage = new fileStorage_1.FileStorage(this.workspaceRoot);
        this.historyManager = new historyManager_1.HistoryManager(this.workspaceRoot);
        // Initialiser le dossier .mscode si nécessaire
        this.initMSCodeFolder();
        this.checkInitialization();
    }
    /**
     * Initialise la structure de dossiers nécessaire
     */
    initMSCodeFolder() {
        return __awaiter(this, void 0, void 0, function* () {
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
                        checkpoints: types_1.isAnyArrayBuffer, // Changed 'any []' to empty array notation
                        branches: {}
                    }
                };
                fs.writeFileSync(branchesFile, JSON.stringify(initialBranchStructure, null, 2));
            }
        });
    }
    /**
     * Crée une sauvegarde initiale du projet
     */
    createInitialBackup(backupPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = new adm_zip_1.default();
            const excludedDirs = ['.mscode', 'node_modules', '.git'];
            const addFilesToZip = (dirPath, zip) => {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const fullPath = path.join(dirPath, file);
                    if (excludedDirs.some(dir => fullPath.includes(dir))) {
                        continue;
                    }
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        addFilesToZip(fullPath, zip);
                    }
                    else {
                        const zipPath = path.relative(this.workspaceRoot, fullPath);
                        zip.addLocalFile(fullPath, path.dirname(zipPath));
                    }
                }
            };
            addFilesToZip(this.workspaceRoot, zip);
            zip.writeZip(backupPath);
        });
    }
    /**
     * Vérifie si le projet est déjà initialisé
     */
    checkInitialization() {
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
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized) {
                vscode.window.showInformationMessage('Le projet est déjà initialisé');
                return true;
            }
            try {
                this.initMSCodeFolder();
                this.isInitialized = true;
                vscode.window.showInformationMessage('Projet initialisé avec succès');
                return true;
            }
            catch (error) {
                vscode.window.showErrorMessage(`Erreur lors de l'initialisation: ${error}`);
                return false;
            }
        });
    }
    /**
     * Vérifie si le projet est initialisé
     */
    isProjectInitialized() {
        return this.isInitialized;
    }
    /**
     * Crée un nouveau checkpoint avec gestion des branches
     */
    createCheckpoint(name_1, description_1) {
        return __awaiter(this, arguments, void 0, function* (name, description, branchName = 'main') {
            if (!this.isInitialized) {
                throw new Error('Le projet doit être initialisé avant de créer un checkpoint');
            }
            try {
                const branchesPath = path.join(this.workspaceRoot, '.mscode', 'branches.json');
                const branches = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));
                // Création du checkpoint
                const checkpoint = yield this.fileStorage.saveChanges(name);
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
                const md5HashesPath = path.join(this.workspaceRoot, '.mscode', 'md5hashes.json');
                fs.writeFileSync(md5HashesPath, JSON.stringify(md5Hashes, null, 2));
                // Enregistrement des fichiers ajoutés et supprimés
                const addedFiles = this.fileStorage.getAddedFiles();
                const removedFiles = this.fileStorage.getRemovedFiles();
                const changesPath = path.join(this.workspaceRoot, '.mscode', 'changes.json');
                const changes = {
                    added: addedFiles,
                    removed: removedFiles,
                    timestamp: new Date().toISOString()
                };
                fs.writeFileSync(changesPath, JSON.stringify(changes, null, 2));
                vscode.window.showInformationMessage(`Checkpoint "${name}" créé dans la branche "${branchName}"`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Erreur lors de la création du checkpoint: ${error}`);
            }
        });
    }
    generateMD5Hashes(files) {
        const md5Hashes = {};
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const hash = crypto.createHash('md5').update(fileContent).digest('hex');
            md5Hashes[file] = hash;
        }
        return md5Hashes;
    }
    /**
     * Récupère tous les checkpoints
     */
    getCheckpoints() {
        return this.historyManager.getCheckpoints();
    }
}
exports.CheckpointManager = CheckpointManager;
//# sourceMappingURL=checkpointManager.js.map