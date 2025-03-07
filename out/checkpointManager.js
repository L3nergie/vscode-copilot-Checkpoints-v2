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
exports.CheckpointManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fsExtra = __importStar(require("fs-extra"));
const os = __importStar(require("os"));
class CheckpointManager {
    constructor(workspaceRoot, outputChannel) {
        this.workspaceRoot = workspaceRoot;
        this.outputChannel = outputChannel;
        this.activeModifications = new Map();
        this.fileTimelines = new Map();
        this.activeMiniMaps = new Map();
        this.modificationCount = 0;
        this.AUTO_CHECKPOINT_THRESHOLD = 10;
        this.lastCheckpointTime = Date.now();
        this.MIN_CHECKPOINT_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.CHECKPOINT_INTERVAL = 60 * 1000; // 1 minute
        this.currentCheckpointStartTime = Date.now();
        this.pendingChanges = new Map();
        this.activeChanges = new Map();
        this.fileProcessingQueue = new Map();
        this.config = {
            maxSnapshotsPerFile: 100,
            maxRecursionDepth: 5,
            chunkSize: 1024 * 1024, // 1MB
            ignoredPaths: ['.git', 'node_modules', 'out', 'dist', '.DS_Store']
        };
        this.outputChannel.appendLine(`=== Initialisation du CheckpointManager ===`);
        this.outputChannel.appendLine(`Workspace: ${workspaceRoot}`);
        this.historyFile = path.join(workspaceRoot, '.mscode', 'history.json');
        this.checkpointsDir = path.join(os.homedir(), 'mscode-checkpoints');
        this.timelineDir = path.join(workspaceRoot, '.mscode', 'timelines');
        this.outputChannel.appendLine(`Fichier historique: ${this.historyFile}`);
        this.outputChannel.appendLine(`Dossier checkpoints: ${this.checkpointsDir}`);
        this.outputChannel.appendLine(`Dossier timelines: ${this.timelineDir}`);
        this.ensureDirectories();
        // Déplacer les opérations asynchrones hors du constructeur
        this.initialize();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadExistingTimelines();
            yield this.ensureInitialState();
            // Charger l'historique au démarrage
            const history = yield this.loadHistory();
            this.outputChannel.appendLine(`${history.length} checkpoints chargés\n`);
            this.setupFileWatchers();
            this.outputChannel.appendLine('FileWatchers configurés');
        });
    }
    ensureDirectories() {
        const dirs = [
            path.join(this.workspaceRoot, '.mscode'),
            this.checkpointsDir,
            this.timelineDir
        ];
        for (const dir of dirs) {
            if (!fsExtra.existsSync(dir)) {
                this.outputChannel.appendLine(`Création du dossier: ${dir}`);
                fsExtra.mkdirpSync(dir);
            }
            else {
                this.outputChannel.appendLine(`Dossier existant: ${dir}`);
            }
        }
    }
    loadExistingTimelines() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fsExtra.existsSync(this.timelineDir)) {
                const files = fsExtra.readdirSync(this.timelineDir);
                for (const file of files) {
                    if (file.endsWith('.timeline.json')) {
                        const filePath = file.replace('.timeline.json', '');
                        const timelinePath = path.join(this.timelineDir, file);
                        try {
                            const timeline = JSON.parse(fsExtra.readFileSync(timelinePath, 'utf-8'));
                            this.fileTimelines.set(filePath, timeline);
                        }
                        catch (error) {
                            console.error(`Erreur lors du chargement de la timeline ${file}:`, error);
                        }
                    }
                }
            }
        });
    }
    ensureInitialState() {
        return __awaiter(this, void 0, void 0, function* () {
            // Cette méthode doit être implémentée pour charger l'état initial
        });
    }
    loadHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fsExtra.existsSync(this.historyFile)) {
                    const content = yield fsExtra.readFile(this.historyFile, 'utf-8');
                    return JSON.parse(content);
                }
            }
            catch (error) {
                this.outputChannel.appendLine(`Erreur lors du chargement de l'historique: ${error}`);
            }
            return [];
        });
    }
    setupFileWatchers() {
        // Implémentation des FileWatchers
    }
    getTimelineFilePath(filePath) {
        const sanitizedPath = filePath.replace(/[/\\]/g, '_');
        return path.join(this.timelineDir, sanitizedPath, 'timeline.json');
    }
    saveTimeline(filePath, timeline) {
        return __awaiter(this, void 0, void 0, function* () {
            const timelineFile = this.getTimelineFilePath(filePath);
            yield fsExtra.writeFile(timelineFile, JSON.stringify(timeline, null, 2));
            this.fileTimelines.set(filePath, timeline);
        });
    }
    saveTimelineSnapshot(filePath, change) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = change.timestamp;
            const sanitizedPath = filePath.replace(/[/\\]/g, '_');
            const snapshotDir = path.join(this.timelineDir, sanitizedPath);
            if (!fsExtra.existsSync(snapshotDir)) {
                yield fsExtra.mkdirp(snapshotDir);
            }
            // Inclure la mini-map dans le snapshot
            const miniMap = this.activeMiniMaps.get(filePath);
            const snapshotFile = path.join(snapshotDir, `${timestamp}.json`);
            const snapshot = {
                timestamp,
                change,
                lineHistory: change.lineHistory,
                fullContent: yield this.getCurrentFileContent(filePath),
                miniMap: miniMap ? Object.assign(Object.assign({}, miniMap), { endTime: timestamp }) : null
            };
            yield fsExtra.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
        });
    }
    cleanupTimestampFiles(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userConfig = vscode.workspace.getConfiguration('mscode');
            const maxSnapshots = (_a = userConfig.get('maxSnapshotsPerFile')) !== null && _a !== void 0 ? _a : this.config.maxSnapshotsPerFile;
            const sanitizedPath = filePath.replace(/[/\\]/g, '_');
            const snapshotDir = path.join(this.timelineDir, sanitizedPath);
            if (!fsExtra.existsSync(snapshotDir))
                return;
            const now = Date.now();
            try {
                const files = fsExtra.readdirSync(snapshotDir)
                    .filter(file => file.endsWith('.json'))
                    .map(file => ({
                    name: file,
                    timestamp: parseInt(file.replace('.json', '')),
                    path: path.join(snapshotDir, file)
                }))
                    .sort((a, b) => a.timestamp - b.timestamp);
                // Ne garder que les fichiers les plus récents
                this.removeOldSnapshots(files, maxSnapshots);
            }
            catch (error) {
                this.outputChannel.appendLine(`Erreur lors du nettoyage des fichiers timeline: ${error}`);
            }
        });
    }
    removeOldSnapshots(files, maxSnapshots) {
        if (files.length > maxSnapshots) {
            const filesToRemove = files.slice(0, files.length - maxSnapshots);
            filesToRemove.forEach(file => {
                try {
                    fsExtra.unlinkSync(file.path);
                    this.outputChannel.appendLine(`Nettoyage: suppression de ${file.path}`);
                }
                catch (error) {
                    this.outputChannel.appendLine(`Erreur lors de la suppression de ${file.path}: ${error}`);
                }
            });
        }
    }
    saveModificationBatch(filePath_1) {
        return __awaiter(this, arguments, void 0, function* (filePath, force = false) {
            const modification = this.activeModifications.get(filePath);
            if (!modification)
                return;
            const now = Date.now();
            if (force || now - modification.startTime >= this.CHECKPOINT_INTERVAL) {
                yield this.saveModificationToCheckpoint(filePath, modification, now);
            }
        });
    }
    saveModificationToCheckpoint(filePath, modification, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            // Créer le dossier de checkpoint
            const checkpointId = `checkpoint_${timestamp}`;
            const checkpointDir = path.join(this.checkpointsDir, checkpointId);
            yield fsExtra.ensureDir(checkpointDir);
            // Sauvegarder les modifications
            const fileDir = path.join(checkpointDir, this.sanitizeFileName(filePath));
            yield fsExtra.ensureDir(fileDir);
            // Sauvegarder le contenu et les changements
            const currentContent = yield this.getCurrentFileContent(filePath);
            if (currentContent) {
                yield fsExtra.writeFile(path.join(fileDir, 'content.txt'), currentContent);
                yield fsExtra.writeJson(path.join(fileDir, 'changes.json'), modification.changes, { spaces: 2 });
                this.outputChannel.appendLine(`Modifications sauvegardées pour ${filePath} dans ${checkpointDir}`);
            }
        });
    }
    handlePendingChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            if (now - this.currentCheckpointStartTime >= this.CHECKPOINT_INTERVAL) {
                if (this.pendingChanges.size > 0) {
                    this.outputChannel.appendLine('\n=== Création d\'un checkpoint temporel ===');
                    const isAutomatic = true;
                    const description = `Checkpoint automatique - ${new Date().toLocaleTimeString()}`;
                    yield this.createCheckpoint(isAutomatic, description);
                    this.pendingChanges.clear();
                }
                this.currentCheckpointStartTime = now;
            }
        });
    }
    checkAndCreateCheckpoint() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            if (now - this.lastCheckpointTime >= this.CHECKPOINT_INTERVAL) {
                if (this.activeChanges.size > 0) {
                    this.outputChannel.appendLine('\nCréation d\'un checkpoint temporel');
                    const isAutomatic = true;
                    const desc = `Checkpoint automatique - ${new Date().toLocaleTimeString()}`;
                    yield this.createCheckpoint(isAutomatic, desc);
                    // Forcer un rafraîchissement de la vue
                    yield vscode.commands.executeCommand('mscode.refreshView');
                }
                this.lastCheckpointTime = now;
            }
        });
    }
    initializeMiniMap(filePath) {
        // Cette méthode doit être implémentée pour initialiser les données de mini-map
        return {
            points: [],
            startTime: Date.now(),
            endTime: Date.now(),
            filePath,
            dimensions: {
                width: 100,
                height: 100
            }
        };
    }
    getCurrentFileContent(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fsExtra.existsSync(filePath)) {
                    return yield fsExtra.readFile(filePath, 'utf-8');
                }
            }
            catch (error) {
                this.outputChannel.appendLine(`Erreur lors de la lecture du contenu de ${filePath}: ${error}`);
            }
            return null;
        });
    }
    sanitizeFileName(filePath) {
        return filePath.replace(/[/\\?%*:|"<>]/g, '_');
    }
    manageHistory(checkpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let history = [];
                if (fsExtra.existsSync(this.historyFile)) {
                    const content = yield fsExtra.readFile(this.historyFile, 'utf-8');
                    history = JSON.parse(content);
                }
                history.push(checkpoint);
                yield fsExtra.writeFile(this.historyFile, JSON.stringify(history, null, 2));
            }
            catch (error) {
                this.outputChannel.appendLine(`Erreur lors de la gestion de l'historique: ${error}`);
            }
        });
    }
    logChange(filePath, change) {
        return __awaiter(this, void 0, void 0, function* () {
            this.outputChannel.appendLine(`\n=== Changement détecté dans ${filePath} ===`);
            this.outputChannel.appendLine(`Type: ${change.type}`);
            this.outputChannel.appendLine(`Ligne: ${change.lineNumber}`);
            this.outputChannel.appendLine(`Contenu: ${change.content.substring(0, 50)}${change.content.length > 50 ? '...' : ''}`);
            // Initialiser les modifications actives si nécessaire
            if (!this.activeModifications.has(filePath)) {
                this.activeModifications.set(filePath, {
                    startTime: Date.now(),
                    changes: [],
                    miniMap: this.initializeMiniMap(filePath)
                });
            }
            // Ajouter le changement aux modifications actives
            const modification = this.activeModifications.get(filePath);
            modification.changes.push(change);
            yield this.handleCheckpointTimeInterval();
            yield this.saveModificationBatch(filePath, true);
            yield this.addChangesToPending(filePath, change);
            yield this.handlePendingChanges();
            yield this.updateActiveChanges(filePath, change);
            yield this.checkAndCreateCheckpoint();
        });
    }
    handleCheckpointTimeInterval() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            if (now - this.lastCheckpointTime >= this.CHECKPOINT_INTERVAL) {
                this.outputChannel.appendLine('\nCréation forcée d\'un checkpoint après intervalle...');
                yield this.createCheckpoint(true, `Checkpoint automatique - ${new Date(now).toLocaleTimeString()}`);
                this.lastCheckpointTime = now;
            }
        });
    }
    addChangesToPending(filePath, change) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const changes = (_a = this.pendingChanges.get(filePath)) !== null && _a !== void 0 ? _a : [];
            changes.push(change);
            this.pendingChanges.set(filePath, changes);
        });
    }
    updateActiveChanges(filePath, change) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const activeChanges = (_a = this.activeChanges.get(filePath)) !== null && _a !== void 0 ? _a : [];
            activeChanges.push(change);
            this.activeChanges.set(filePath, activeChanges);
        });
    }
    createCheckpoint(docOrAuto, contentChangesOrDesc) {
        return __awaiter(this, void 0, void 0, function* () {
            const { isAutomatic, description, document, contentChanges } = this.parseCheckpointParams(docOrAuto, contentChangesOrDesc);
            this.outputChannel.appendLine('\n=== Création d\'un nouveau checkpoint ===');
            const timestamp = Date.now();
            const checkpointId = `checkpoint_${timestamp}`;
            // Créer le dossier du checkpoint
            const checkpointDir = path.join(this.checkpointsDir, checkpointId);
            yield fsExtra.ensureDir(checkpointDir);
            this.outputChannel.appendLine(`Dossier créé: ${checkpointDir}`);
            // Préparer les données du checkpoint
            const files = yield this.prepareCheckpointFiles(timestamp);
            const checkpoint = {
                id: `checkpoint_${timestamp}`,
                timestamp,
                checkpoint: {
                    id: `checkpoint_${timestamp}`,
                    files
                },
                files,
                metadata: {
                    description: description || `Checkpoint ${isAutomatic ? 'automatique' : 'manuel'} - ${new Date(timestamp).toLocaleString()}`,
                    isAutomatic,
                    isInitialState: false,
                    status: 'intermediate'
                }
            };
            // Sauvegarder le checkpoint.json
            const checkpointPath = path.join(checkpointDir, 'checkpoint.json');
            yield fsExtra.writeJson(checkpointPath, checkpoint, { spaces: 2 });
            // Mettre à jour l'historique
            yield this.manageHistory(checkpoint);
            // Réinitialiser les modifications actives
            this.activeModifications.clear();
            return checkpoint;
        });
    }
    parseCheckpointParams(docOrAuto, contentChangesOrDesc) {
        var _a;
        let isAutomatic = false;
        let description = '';
        let document;
        let contentChanges;
        if (typeof docOrAuto === 'boolean') {
            isAutomatic = docOrAuto;
            description = (_a = contentChangesOrDesc) !== null && _a !== void 0 ? _a : '';
        }
        else {
            document = docOrAuto;
            contentChanges = contentChangesOrDesc;
        }
        return { isAutomatic, description, document, contentChanges };
    }
    prepareCheckpointFiles(timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = {};
            for (const [filePath, modification] of this.activeModifications.entries()) {
                if (modification.changes.length === 0)
                    continue;
                const currentContent = yield this.getCurrentFileContent(filePath);
                if (!currentContent)
                    continue;
                yield this.saveCheckpointFile(filePath, modification, timestamp, currentContent);
                files[filePath] = {
                    changes: modification.changes,
                    snapshot: currentContent,
                    timeline: {
                        filePath,
                        changes: modification.changes.flatMap(c => c.lineHistory),
                        snapshots: [{ timestamp, content: currentContent }]
                    },
                    miniMap: modification.miniMap
                };
            }
            return files;
        });
    }
    saveCheckpointFile(filePath, modification, timestamp, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileCheckpointId = `checkpoint_${this.sanitizeFileName(filePath)}_${timestamp}`;
            const fileCheckpointDir = path.join(this.checkpointsDir, fileCheckpointId);
            yield fsExtra.ensureDir(fileCheckpointDir);
            const fileDir = path.join(fileCheckpointDir, this.sanitizeFileName(filePath));
            yield fsExtra.ensureDir(fileDir);
            yield fsExtra.writeFile(path.join(fileDir, 'content.txt'), content);
            yield fsExtra.writeJson(path.join(fileDir, 'changes.json'), modification.changes, { spaces: 2 });
        });
    }
}
exports.CheckpointManager = CheckpointManager;
//# sourceMappingURL=checkpointManager.js.map