import * as vscode from 'vscode';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import * as os from 'os';

export interface LineHistory {
    lineNumber: number;
    content: string;
    timestamp: number;
    action: 'added' | 'modified' | 'deleted' | 'restored';
    previousContent?: string;
    previousLineNumber?: number;
}

export interface FileChangeLog {
    lineNumber: number;
    content: string;
    type: 'added' | 'modified' | 'deleted';
    timestamp: number;
    author?: string;
    lineHistory: LineHistory[];
}

export interface FileTimeline {
    filePath: string;
    changes: LineHistory[];
    snapshots: Array<{
        timestamp: number;
        content: string;
    }>;
}

interface MiniMapPoint {
    x: number;
    y: number;
    type: 'add' | 'delete' | 'modify';
    timestamp: number;
    lineNumber: number;
}

interface MiniMapData {
    points: MiniMapPoint[];
    startTime: number;
    endTime: number;
    filePath: string;
    dimensions: {
        width: number;
        height: number;
    };
}

export interface CheckpointLog {
    id: string;
    timestamp: number;
    checkpoint: {
        id: string;
        files: Record<string, any>;
    };
    files: {
        [filePath: string]: {
            changes: FileChangeLog[];
            snapshot: string;
            timeline: FileTimeline;
            miniMap: MiniMapData;
        };
    };
    metadata: {
        description: string;
        isAutomatic: boolean;
        isInitialState?: boolean;
        vscodeLogs?: any[];
        status?: 'initial' | 'current' | 'intermediate';  // Status rendu optionnel
    };
}

export class CheckpointManager {
    [x: string]: any;
    private readonly historyFile: string;
    private readonly checkpointsDir: string;
    private readonly timelineDir: string;
    private readonly activeModifications: Map<string, {
        startTime: number,
        changes: FileChangeLog[],
        miniMap: MiniMapData
    }> = new Map();
    private readonly fileTimelines: Map<string, FileTimeline> = new Map();
    private readonly activeMiniMaps: Map<string, MiniMapData> = new Map();
    private readonly modificationCount: number = 0;
    private readonly AUTO_CHECKPOINT_THRESHOLD = 10;
    private lastCheckpointTime: number = Date.now();
    private readonly MIN_CHECKPOINT_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly CHECKPOINT_INTERVAL = 60 * 1000; // 1 minute
    private currentCheckpointStartTime: number = Date.now();
    private readonly pendingChanges: Map<string, FileChangeLog[]> = new Map();
    private readonly activeChanges: Map<string, FileChangeLog[]> = new Map();
    private readonly fileProcessingQueue: Map<string, Promise<void>> = new Map();
    private readonly config = {
        maxSnapshotsPerFile: 100,
        maxRecursionDepth: 5,
        chunkSize: 1024 * 1024, // 1MB
        ignoredPaths: ['.git', 'node_modules', 'out', 'dist', '.DS_Store']
    };

    constructor(
        private readonly workspaceRoot: string,
        private readonly outputChannel: vscode.OutputChannel
    ) {
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

    private async initialize(): Promise<void> {
        await this.loadExistingTimelines();
        await this.ensureInitialState();

        // Charger l'historique au démarrage
        const history = await this.loadHistory();
        this.outputChannel.appendLine(`${history.length} checkpoints chargés\n`);

        this.setupFileWatchers();
        this.outputChannel.appendLine('FileWatchers configurés');
    }

    private ensureDirectories() {
        const dirs = [
            path.join(this.workspaceRoot, '.mscode'),
            this.checkpointsDir,
            this.timelineDir
        ];

        for (const dir of dirs) {
            if (!fsExtra.existsSync(dir)) {
                this.outputChannel.appendLine(`Création du dossier: ${dir}`);
                fsExtra.mkdirpSync(dir);
            } else {
                this.outputChannel.appendLine(`Dossier existant: ${dir}`);
            }
        }
    }

    private async loadExistingTimelines(): Promise<void> {
        if (fsExtra.existsSync(this.timelineDir)) {
            const files = fsExtra.readdirSync(this.timelineDir);
            for (const file of files) {
                if (file.endsWith('.timeline.json')) {
                    const filePath = file.replace('.timeline.json', '');
                    const timelinePath = path.join(this.timelineDir, file);
                    try {
                        const timeline = JSON.parse(fsExtra.readFileSync(timelinePath, 'utf-8'));
                        this.fileTimelines.set(filePath, timeline);
                    } catch (error) {
                        console.error(`Erreur lors du chargement de la timeline ${file}:`, error);
                    }
                }
            }
        }
    }

    private async ensureInitialState(): Promise<void> {
        // Cette méthode doit être implémentée pour charger l'état initial
    }

    private async loadHistory(): Promise<any[]> {
        try {
            if (fsExtra.existsSync(this.historyFile)) {
                const content = await fsExtra.readFile(this.historyFile, 'utf-8');
                return JSON.parse(content);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors du chargement de l'historique: ${error}`);
        }
        return [];
    }

    private setupFileWatchers(): void {
        // Implémentation des FileWatchers
    }

    private getTimelineFilePath(filePath: string): string {
        const sanitizedPath = filePath.replace(/[/\\]/g, '_');
        return path.join(this.timelineDir, sanitizedPath, 'timeline.json');
    }

    private async saveTimeline(filePath: string, timeline: FileTimeline): Promise<void> {
        const timelineFile = this.getTimelineFilePath(filePath);
        await fsExtra.writeFile(timelineFile, JSON.stringify(timeline, null, 2));
        this.fileTimelines.set(filePath, timeline);
    }

    private async saveTimelineSnapshot(filePath: string, change: FileChangeLog): Promise<void> {
        const timestamp = change.timestamp;
        const sanitizedPath = filePath.replace(/[/\\]/g, '_');
        const snapshotDir = path.join(this.timelineDir, sanitizedPath);

        if (!fsExtra.existsSync(snapshotDir)) {
            await fsExtra.mkdirp(snapshotDir);
        }

        // Inclure la mini-map dans le snapshot
        const miniMap = this.activeMiniMaps.get(filePath);
        const snapshotFile = path.join(snapshotDir, `${timestamp}.json`);
        const snapshot = {
            timestamp,
            change,
            lineHistory: change.lineHistory,
            fullContent: await this.getCurrentFileContent(filePath),
            miniMap: miniMap ? { ...miniMap, endTime: timestamp } : null
        };

        await fsExtra.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
    }

    private async cleanupTimestampFiles(filePath: string): Promise<void> {
        const userConfig = vscode.workspace.getConfiguration('mscode');
        const maxSnapshots = userConfig.get<number>('maxSnapshotsPerFile') ?? this.config.maxSnapshotsPerFile;

        const sanitizedPath = filePath.replace(/[/\\]/g, '_');
        const snapshotDir = path.join(this.timelineDir, sanitizedPath);

        if (!fsExtra.existsSync(snapshotDir)) return;

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
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors du nettoyage des fichiers timeline: ${error}`);
        }
    }

    private removeOldSnapshots(files: Array<{ name: string, timestamp: number, path: string }>, maxSnapshots: number): void {
        if (files.length > maxSnapshots) {
            const filesToRemove = files.slice(0, files.length - maxSnapshots);
            filesToRemove.forEach(file => {
                try {
                    fsExtra.unlinkSync(file.path);
                    this.outputChannel.appendLine(`Nettoyage: suppression de ${file.path}`);
                } catch (error) {
                    this.outputChannel.appendLine(`Erreur lors de la suppression de ${file.path}: ${error}`);
                }
            });
        }
    }

    private async saveModificationBatch(filePath: string, force: boolean = false): Promise<void> {
        const modification = this.activeModifications.get(filePath);
        if (!modification) return;

        const now = Date.now();
        if (force || now - modification.startTime >= this.CHECKPOINT_INTERVAL) {
            await this.saveModificationToCheckpoint(filePath, modification, now);
        }
    }

    private async saveModificationToCheckpoint(
        filePath: string,
        modification: { startTime: number, changes: FileChangeLog[], miniMap: MiniMapData },
        timestamp: number
    ): Promise<void> {
        // Créer le dossier de checkpoint
        const checkpointId = `checkpoint_${timestamp}`;
        const checkpointDir = path.join(this.checkpointsDir, checkpointId);
        await fsExtra.ensureDir(checkpointDir);

        // Sauvegarder les modifications
        const fileDir = path.join(checkpointDir, this.sanitizeFileName(filePath));
        await fsExtra.ensureDir(fileDir);

        // Sauvegarder le contenu et les changements
        const currentContent = await this.getCurrentFileContent(filePath);
        if (currentContent) {
            await fsExtra.writeFile(path.join(fileDir, 'content.txt'), currentContent);
            await fsExtra.writeJson(path.join(fileDir, 'changes.json'), modification.changes, { spaces: 2 });
            this.outputChannel.appendLine(`Modifications sauvegardées pour ${filePath} dans ${checkpointDir}`);
        }
    }

    private async handlePendingChanges(): Promise<void> {
        const now = Date.now();
        if (now - this.currentCheckpointStartTime >= this.CHECKPOINT_INTERVAL) {
            if (this.pendingChanges.size > 0) {
                this.outputChannel.appendLine('\n=== Création d\'un checkpoint temporel ===');
                const isAutomatic = true;
                const description = `Checkpoint automatique - ${new Date().toLocaleTimeString()}`;
                await this.createCheckpoint(isAutomatic, description);
                this.pendingChanges.clear();
            }
            this.currentCheckpointStartTime = now;
        }
    }

    private async checkAndCreateCheckpoint(): Promise<void> {
        const now = Date.now();
        if (now - this.lastCheckpointTime >= this.CHECKPOINT_INTERVAL) {
            if (this.activeChanges.size > 0) {
                this.outputChannel.appendLine('\nCréation d\'un checkpoint temporel');
                const isAutomatic = true;
                const desc = `Checkpoint automatique - ${new Date().toLocaleTimeString()}`;
                await this.createCheckpoint(isAutomatic, desc);
                // Forcer un rafraîchissement de la vue
                await vscode.commands.executeCommand('mscode.refreshView');
            }
            this.lastCheckpointTime = now;
        }
    }

    private initializeMiniMap(filePath: string): MiniMapData {
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

    private async getCurrentFileContent(filePath: string): Promise<string | null> {
        try {
            if (fsExtra.existsSync(filePath)) {
                return await fsExtra.readFile(filePath, 'utf-8');
            }
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la lecture du contenu de ${filePath}: ${error}`);
        }
        return null;
    }

    private sanitizeFileName(filePath: string): string {
        return filePath.replace(/[/\\?%*:|"<>]/g, '_');
    }

    private async manageHistory(checkpoint: CheckpointLog): Promise<void> {
        try {
            let history: CheckpointLog[] = [];
            if (fsExtra.existsSync(this.historyFile)) {
                const content = await fsExtra.readFile(this.historyFile, 'utf-8');
                history = JSON.parse(content);
            }

            history.push(checkpoint);
            await fsExtra.writeFile(this.historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la gestion de l'historique: ${error}`);
        }
    }

    async logChange(filePath: string, change: FileChangeLog): Promise<void> {
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
        const modification = this.activeModifications.get(filePath)!;
        modification.changes.push(change);

        await this.handleCheckpointTimeInterval();
        await this.saveModificationBatch(filePath, true);
        await this.addChangesToPending(filePath, change);
        await this.handlePendingChanges();
        await this.updateActiveChanges(filePath, change);
        await this.checkAndCreateCheckpoint();
    }

    private async handleCheckpointTimeInterval(): Promise<void> {
        const now = Date.now();
        if (now - this.lastCheckpointTime >= this.CHECKPOINT_INTERVAL) {
            this.outputChannel.appendLine('\nCréation forcée d\'un checkpoint après intervalle...');
            await this.createCheckpoint(true, `Checkpoint automatique - ${new Date(now).toLocaleTimeString()}`);
            this.lastCheckpointTime = now;
        }
    }

    private async addChangesToPending(filePath: string, change: FileChangeLog): Promise<void> {
        const changes = this.pendingChanges.get(filePath) ?? [];
        changes.push(change);
        this.pendingChanges.set(filePath, changes);
    }

    private async updateActiveChanges(filePath: string, change: FileChangeLog): Promise<void> {
        const activeChanges = this.activeChanges.get(filePath) ?? [];
        activeChanges.push(change);
        this.activeChanges.set(filePath, activeChanges);
    }

    public async createCheckpoint(
        docOrAuto: vscode.TextDocument | boolean,
        contentChangesOrDesc?: readonly vscode.TextDocumentContentChangeEvent[] | string
    ): Promise<CheckpointLog> {
        const { isAutomatic, description, document, contentChanges } = this.parseCheckpointParams(docOrAuto, contentChangesOrDesc);

        this.outputChannel.appendLine('\n=== Création d\'un nouveau checkpoint ===');
        const timestamp = Date.now();
        const checkpointId = `checkpoint_${timestamp}`;

        // Créer le dossier du checkpoint
        const checkpointDir = path.join(this.checkpointsDir, checkpointId);
        await fsExtra.ensureDir(checkpointDir);
        this.outputChannel.appendLine(`Dossier créé: ${checkpointDir}`);

        // Préparer les données du checkpoint
        const files = await this.prepareCheckpointFiles(timestamp);

        const checkpoint: CheckpointLog = {
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
        await fsExtra.writeJson(checkpointPath, checkpoint, { spaces: 2 });

        // Mettre à jour l'historique
        await this.manageHistory(checkpoint);

        // Réinitialiser les modifications actives
        this.activeModifications.clear();

        return checkpoint;
    }

    private parseCheckpointParams(
        docOrAuto: vscode.TextDocument | boolean,
        contentChangesOrDesc?: readonly vscode.TextDocumentContentChangeEvent[] | string
    ): { isAutomatic: boolean; description: string; document?: vscode.TextDocument; contentChanges?: readonly vscode.TextDocumentContentChangeEvent[] } {
        let isAutomatic = false;
        let description = '';
        let document: vscode.TextDocument | undefined;
        let contentChanges: readonly vscode.TextDocumentContentChangeEvent[] | undefined;

        if (typeof docOrAuto === 'boolean') {
            isAutomatic = docOrAuto;
            description = (contentChangesOrDesc as string) ?? '';
        } else {
            document = docOrAuto;
            contentChanges = contentChangesOrDesc as readonly vscode.TextDocumentContentChangeEvent[];
        }

        return { isAutomatic, description, document, contentChanges };
    }

    private async prepareCheckpointFiles(timestamp: number): Promise<Record<string, any>> {
        const files: Record<string, any> = {};

        for (const [filePath, modification] of this.activeModifications.entries()) {
            if (modification.changes.length === 0) continue;

            const currentContent = await this.getCurrentFileContent(filePath);
            if (!currentContent) continue;

            await this.saveCheckpointFile(filePath, modification, timestamp, currentContent);

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
    }

    private async saveCheckpointFile(
        filePath: string,
        modification: { changes: FileChangeLog[], miniMap: MiniMapData },
        timestamp: number,
        content: string
    ): Promise<void> {
        const fileCheckpointId = `checkpoint_${this.sanitizeFileName(filePath)}_${timestamp}`;
        const fileCheckpointDir = path.join(this.checkpointsDir, fileCheckpointId);
        await fsExtra.ensureDir(fileCheckpointDir);

        const fileDir = path.join(fileCheckpointDir, this.sanitizeFileName(filePath));
        await fsExtra.ensureDir(fileDir);
        await fsExtra.writeFile(path.join(fileDir, 'content.txt'), content);
        await fsExtra.writeJson(path.join(fileDir, 'changes.json'), modification.changes, { spaces: 2 });
    }
}
