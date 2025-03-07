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
exports.outputChannel = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const ViewProvider_1 = require("./providers/ViewProvider");
const fileUtils_1 = require("./utils/fileUtils");
const AssistantPanel_1 = require("./panels/AssistantPanel");
// Store for global state
let globalContext;
let mcpServerRunning = false;
// Function to create the initial backup
function createInitialBackup() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder open');
            return false;
        }
        try {
            const { initialBackupDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creating initial backup...",
                cancellable: true
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                // Check if initial backup folder exists
                progress.report({ message: "Preparing initial backup" });
                try {
                    const backupZipPath = path.join(initialBackupDir, `backup_${Date.now()}.zip`);
                    progress.report({
                        message: "Creating backup zip file...",
                        increment: 20
                    });
                    yield (0, fileUtils_1.createSimpleZip)(workspaceRoot, backupZipPath, '.mscode');
                    progress.report({
                        message: "Initial backup created successfully!",
                        increment: 80
                    });
                    vscode.window.showInformationMessage("Initial workspace backup created successfully!");
                    return true;
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error creating initial backup: ${error}`);
                    exports.outputChannel.appendLine(`Error creating initial backup: ${error}`);
                    return false;
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error setting up backup: ${error}`);
            exports.outputChannel.appendLine(`Error setting up backup: ${error}`);
            return false;
        }
    });
}
// Function to create a checkpoint
function createCheckpoint() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder open');
            return false;
        }
        try {
            const { checkpointsDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
            const checkpointName = yield vscode.window.showInputBox({
                prompt: "Name your checkpoint",
                placeHolder: "my-checkpoint-name"
            });
            if (!checkpointName) {
                return false; // User cancelled
            }
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creating checkpoint...",
                cancellable: true
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                progress.report({ message: "Preparing checkpoint" });
                const timestamp = Date.now();
                const checkpointZipPath = path.join(checkpointsDir, `checkpoint_${checkpointName.replace(/\s+/g, '_')}_${timestamp}.zip`);
                try {
                    progress.report({
                        message: "Creating checkpoint zip file...",
                        increment: 20
                    });
                    yield (0, fileUtils_1.createSimpleZip)(workspaceRoot, checkpointZipPath, '.mscode');
                    progress.report({
                        message: "Checkpoint created successfully!",
                        increment: 80
                    });
                    vscode.window.showInformationMessage(`Checkpoint "${checkpointName}" created successfully!`);
                    return true;
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error creating checkpoint: ${error}`);
                    exports.outputChannel.appendLine(`Error creating checkpoint: ${error}`);
                    return false;
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error setting up checkpoint: ${error}`);
            exports.outputChannel.appendLine(`Error setting up checkpoint: ${error}`);
            return false;
        }
    });
}
// Function to create a timeline point
function createTimelinePoint() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder open');
            return false;
        }
        try {
            const { timelinesDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
            const timelinePointName = yield vscode.window.showInputBox({
                prompt: "Nommez ce point dans la timeline",
                placeHolder: "mon-point-important"
            });
            if (!timelinePointName) {
                return false; // User cancelled
            }
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Création d'un point dans la timeline...",
                cancellable: true
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                progress.report({ message: "Préparation du point dans la timeline" });
                const timestamp = Date.now();
                const timelineZipPath = path.join(timelinesDir, `timeline_${timelinePointName.replace(/\s+/g, '_')}_${timestamp}.zip`);
                try {
                    progress.report({
                        message: "Création du fichier zip pour la timeline...",
                        increment: 20
                    });
                    yield (0, fileUtils_1.createSimpleZip)(workspaceRoot, timelineZipPath, '.mscode');
                    progress.report({
                        message: "Point créé avec succès dans la timeline!",
                        increment: 80
                    });
                    vscode.window.showInformationMessage(`Point "${timelinePointName}" créé avec succès dans la timeline!`);
                    return true;
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Erreur lors de la création du point dans la timeline: ${error}`);
                    exports.outputChannel.appendLine(`Erreur lors de la création du point dans la timeline: ${error}`);
                    return false;
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la préparation du point dans la timeline: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors de la préparation du point dans la timeline: ${error}`);
            return false;
        }
    });
}
// Function to handle Git commit
function handleGitCommit() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const commitMessage = yield vscode.window.showInputBox({
                prompt: "Entrez votre message de commit",
                placeHolder: "feat: ajout de nouvelles fonctionnalités"
            });
            if (!commitMessage) {
                return false; // User cancelled
            }
            // Execute Git commit command using the VS Code API
            const gitExtension = (_a = vscode.extensions.getExtension('vscode.git')) === null || _a === void 0 ? void 0 : _a.exports;
            if (!gitExtension) {
                vscode.window.showErrorMessage("L'extension Git n'est pas disponible");
                return false;
            }
            const api = gitExtension.getAPI(1);
            if (!api) {
                vscode.window.showErrorMessage("Impossible d'accéder à l'API Git");
                return false;
            }
            // Get the repository
            const repositories = api.repositories;
            if (!repositories.length) {
                vscode.window.showErrorMessage("Aucun dépôt Git trouvé dans cet espace de travail");
                return false;
            }
            const repository = repositories[0];
            // Stage all changes
            yield repository.add(['.']);
            // Commit changes
            yield repository.commit(commitMessage);
            vscode.window.showInformationMessage(`Commit effectué avec succès: "${commitMessage}"`);
            return true;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors du commit Git: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors du commit Git: ${error}`);
            return false;
        }
    });
}
// Function to create a Git branch
function handleGitCreateBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const branchName = yield vscode.window.showInputBox({
                prompt: "Entrez le nom de la nouvelle branche",
                placeHolder: "feature/ma-nouvelle-fonctionnalite"
            });
            if (!branchName) {
                return false; // User cancelled
            }
            // Execute Git branch command using the VS Code API
            const gitExtension = (_a = vscode.extensions.getExtension('vscode.git')) === null || _a === void 0 ? void 0 : _a.exports;
            if (!gitExtension) {
                vscode.window.showErrorMessage("L'extension Git n'est pas disponible");
                return false;
            }
            const api = gitExtension.getAPI(1);
            if (!api) {
                vscode.window.showErrorMessage("Impossible d'accéder à l'API Git");
                return false;
            }
            // Get the repository
            const repositories = api.repositories;
            if (!repositories.length) {
                vscode.window.showErrorMessage("Aucun dépôt Git trouvé dans cet espace de travail");
                return false;
            }
            const repository = repositories[0];
            // Create and checkout the new branch
            yield repository.createBranch(branchName, true);
            vscode.window.showInformationMessage(`Branche "${branchName}" créée et activée avec succès`);
            return true;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la création de la branche Git: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors de la création de la branche Git: ${error}`);
            return false;
        }
    });
}
// Function to refresh problem statistics
function refreshProblemStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const diagnostics = vscode.languages.getDiagnostics();
            let totalProblems = 0;
            let errors = 0;
            let warnings = 0;
            let infos = 0;
            // Count by severity
            for (const [uri, fileDiagnostics] of diagnostics) {
                totalProblems += fileDiagnostics.length;
                for (const diag of fileDiagnostics) {
                    switch (diag.severity) {
                        case vscode.DiagnosticSeverity.Error:
                            errors++;
                            break;
                        case vscode.DiagnosticSeverity.Warning:
                            warnings++;
                            break;
                        case vscode.DiagnosticSeverity.Information:
                            infos++;
                            break;
                    }
                }
            }
            // Store this data in the workspace folder
            try {
                const { mscodeDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
                const statsFile = path.join(mscodeDir, 'problem-stats.json');
                // Read existing stats if available
                let history = [];
                if (yield fs.pathExists(statsFile)) {
                    history = JSON.parse(yield fs.readFile(statsFile, 'utf8'));
                }
                // Add current stats
                history.push({
                    timestamp: Date.now(),
                    total: totalProblems,
                    errors,
                    warnings,
                    infos
                });
                // Keep only the last 50 records
                if (history.length > 50) {
                    history = history.slice(history.length - 50);
                }
                // Save to file
                yield fs.writeFile(statsFile, JSON.stringify(history, null, 2));
                vscode.window.showInformationMessage(`Statistiques des problèmes mises à jour: ${totalProblems} problèmes (${errors} erreurs, ${warnings} avertissements, ${infos} informations)`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Erreur lors de la sauvegarde des statistiques: ${error}`);
                exports.outputChannel.appendLine(`Erreur lors de la sauvegarde des statistiques: ${error}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'actualisation des statistiques: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors de l'actualisation des statistiques: ${error}`);
        }
    });
}
// Function to start MCP server
function startMCPServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (mcpServerRunning) {
            vscode.window.showInformationMessage('Le serveur MCP est déjà en cours d\'exécution');
            return;
        }
        try {
            // Simulation de démarrage d'un serveur (dans une vraie extension, vous pourriez utiliser un serveur réel)
            mcpServerRunning = true;
            const { mscodeDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
            const serverDataDir = path.join(mscodeDir, 'server-data');
            yield fs.ensureDir(serverDataDir);
            // Create a file to indicate the server is running
            yield fs.writeFile(path.join(serverDataDir, 'server-status.json'), JSON.stringify({
                running: true,
                startTime: Date.now(),
                port: 3000
            }));
            vscode.window.showInformationMessage('Serveur MCP démarré avec succès');
            exports.outputChannel.appendLine('Serveur MCP démarré');
        }
        catch (error) {
            mcpServerRunning = false;
            vscode.window.showErrorMessage(`Erreur lors du démarrage du serveur MCP: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors du démarrage du serveur MCP: ${error}`);
        }
    });
}
// Function to stop MCP server
function stopMCPServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mcpServerRunning) {
            vscode.window.showInformationMessage('Le serveur MCP n\'est pas en cours d\'exécution');
            return;
        }
        try {
            // Simulation d'arrêt d'un serveur
            mcpServerRunning = false;
            const { mscodeDir } = yield (0, fileUtils_1.ensureWorkspaceStructure)(globalContext);
            const serverStatusFile = path.join(mscodeDir, 'server-data', 'server-status.json');
            if (yield fs.pathExists(serverStatusFile)) {
                yield fs.writeFile(serverStatusFile, JSON.stringify({
                    running: false,
                    stopTime: Date.now()
                }));
            }
            vscode.window.showInformationMessage('Serveur MCP arrêté avec succès');
            exports.outputChannel.appendLine('Serveur MCP arrêté');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'arrêt du serveur MCP: ${error}`);
            exports.outputChannel.appendLine(`Erreur lors de l'arrêt du serveur MCP: ${error}`);
        }
    });
}
function activate(extContext) {
    return __awaiter(this, void 0, void 0, function* () {
        // Store context globally
        globalContext = extContext;
        // Create output channel
        exports.outputChannel = vscode.window.createOutputChannel('Copilot Checkpoints');
        exports.outputChannel.appendLine('Copilot Checkpoints extension activated');
        // Register the start command
        const startCommand = vscode.commands.registerCommand('mscode.checkpoints.start', () => {
            vscode.window.showInformationMessage('Copilot Checkpoints started');
            setupViews(extContext);
        });
        extContext.subscriptions.push(startCommand);
        // Setup views
        setupViews(extContext);
        // Set context to enable views
        yield vscode.commands.executeCommand('setContext', 'mscode:viewsEnabled', true);
    });
}
function setupViews(context) {
    // Create view providers for each view
    const accountProvider = new ViewProvider_1.ViewProvider(context, 'mscode-account');
    const assistantsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-assistants');
    const initialBackupProvider = new ViewProvider_1.ViewProvider(context, 'mscode-initial-backup');
    const checkpointsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-checkpoints');
    const statisticsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-statistics');
    const changesProvider = new ViewProvider_1.ViewProvider(context, 'mscode-changes');
    const timelinesProvider = new ViewProvider_1.ViewProvider(context, 'mscode-timelines');
    const settingsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-settings');
    const donationsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-donations');
    const gitStatusProvider = new ViewProvider_1.ViewProvider(context, 'mscode-git-status');
    const problemStatsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-problem-stats');
    const serverProvider = new ViewProvider_1.ViewProvider(context, 'mscode-server');
    const structureProvider = new ViewProvider_1.ViewProvider(context, 'mscode-structure');
    const toolsProvider = new ViewProvider_1.ViewProvider(context, 'mscode-tools');
    const tasksProvider = new ViewProvider_1.ViewProvider(context, 'mscode-tasks');
    // Register the tree data providers
    const accountView = vscode.window.createTreeView('mscode-account', {
        treeDataProvider: accountProvider
    });
    const assistantsView = vscode.window.createTreeView('mscode-assistants', {
        treeDataProvider: assistantsProvider
    });
    const initialBackupView = vscode.window.createTreeView('mscode-initial-backup', {
        treeDataProvider: initialBackupProvider
    });
    const checkpointsView = vscode.window.createTreeView('mscode-checkpoints', {
        treeDataProvider: checkpointsProvider
    });
    const statisticsView = vscode.window.createTreeView('mscode-statistics', {
        treeDataProvider: statisticsProvider
    });
    const changesView = vscode.window.createTreeView('mscode-changes', {
        treeDataProvider: changesProvider
    });
    const timelinesView = vscode.window.createTreeView('mscode-timelines', {
        treeDataProvider: timelinesProvider
    });
    const settingsView = vscode.window.createTreeView('mscode-settings', {
        treeDataProvider: settingsProvider
    });
    const donationsView = vscode.window.createTreeView('mscode-donations', {
        treeDataProvider: donationsProvider
    });
    const gitStatusView = vscode.window.createTreeView('mscode-git-status', {
        treeDataProvider: gitStatusProvider
    });
    const problemStatsView = vscode.window.createTreeView('mscode-problem-stats', {
        treeDataProvider: problemStatsProvider
    });
    const serverView = vscode.window.createTreeView('mscode-server', {
        treeDataProvider: serverProvider
    });
    const structureView = vscode.window.createTreeView('mscode-structure', {
        treeDataProvider: structureProvider
    });
    const toolsView = vscode.window.createTreeView('mscode-tools', {
        treeDataProvider: toolsProvider
    });
    const tasksView = vscode.window.createTreeView('mscode-tasks', {
        treeDataProvider: tasksProvider
    });
    // Add views to subscriptions
    context.subscriptions.push(accountView, initialBackupView, checkpointsView, statisticsView, changesView, timelinesView, settingsView, donationsView, gitStatusView, problemStatsView, serverView, assistantsView, structureView, toolsView, tasksView);
    // Register commands for each view
    const accountEnterEmailCommand = vscode.commands.registerCommand('mscode.account.enterEmail', () => __awaiter(this, void 0, void 0, function* () {
        const email = yield vscode.window.showInputBox({
            prompt: "Entrez votre adresse courriel",
            placeHolder: "exemple@domaine.com"
        });
        if (email) {
            // Appeler l'endpoint sur murraydev.com pour obtenir la clé unique
            // et mettre à jour le statut de connexion
            vscode.window.showInformationMessage(`Adresse courriel saisie: ${email}`);
        }
    }));
    const initialBackupCommand = vscode.commands.registerCommand('mscode.initialBackup.create', createInitialBackup);
    const checkpointCommand = vscode.commands.registerCommand('mscode.checkpoint.create', createCheckpoint);
    const timelinePointCommand = vscode.commands.registerCommand('mscode.timeline.createPoint', createTimelinePoint);
    const gitCommitCommand = vscode.commands.registerCommand('mscode.git.commit', handleGitCommit);
    const gitCreateBranchCommand = vscode.commands.registerCommand('mscode.git.createBranch', handleGitCreateBranch);
    const problemsRefreshCommand = vscode.commands.registerCommand('mscode.problems.refresh', refreshProblemStats);
    const startServerCommand = vscode.commands.registerCommand('mscode.server.start', startMCPServer);
    const stopServerCommand = vscode.commands.registerCommand('mscode.server.stop', stopMCPServer);
    const assistantsCommand = vscode.commands.registerCommand('mscode.assistants.configure', configureAssistants);
    const assistantsManagerCommand = vscode.commands.registerCommand('mscode.assistants.manage', manageAssistants);
    const changeLanguageCommand = vscode.commands.registerCommand('mscode.settings.changeLanguage', () => __awaiter(this, void 0, void 0, function* () {
        // ...existing code...
    }));
    let chatPanel;
    const openAssistantPanelCommand = vscode.commands.registerCommand('mscode.assistant.openPanel', (assistantName) => {
        if (!chatPanel) {
            chatPanel = AssistantPanel_1.AssistantPanel.render(context.extensionUri);
        }
        chatPanel.addTab(assistantName);
        chatPanel._panel.reveal(vscode.ViewColumn.Two);
    });
    context.subscriptions.push(accountEnterEmailCommand, initialBackupCommand, checkpointCommand, timelinePointCommand, gitCommitCommand, gitCreateBranchCommand, problemsRefreshCommand, startServerCommand, stopServerCommand, assistantsCommand, assistantsManagerCommand, openAssistantPanelCommand);
}
// Fonctions pour gérer les assistants
function configureAssistants() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vscode.commands.executeCommand('workbench.action.openSettings', 'mscode.assistants');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la configuration des assistants : ${error}`);
        }
    });
}
function manageAssistants() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = ['Ajouter un assistant Network', 'Ajouter un assistant Local'];
        const selection = yield vscode.window.showQuickPick(options, {
            placeHolder: 'Sélectionnez le type d\'assistant à ajouter'
        });
        if (selection) {
            const name = yield vscode.window.showInputBox({
                prompt: 'Entrez le nom du nouvel assistant'
            });
            if (name) {
                vscode.window.showInformationMessage(`Assistant '${name}' créé avec succès`);
                // Ici, vous pouvez ajouter la logique pour créer et configurer l'assistant
                // En fonction du type sélectionné (Network ou Local)
            }
        }
    });
}
function deactivate() {
    // Si le serveur est en cours d'exécution, assurez-vous de l'arrêter proprement
    if (mcpServerRunning) {
        stopMCPServer().catch(error => {
            console.error('Erreur lors de l\'arrêt du serveur MCP: ', error);
        });
    }
    exports.outputChannel.appendLine('Copilot Checkpoints extension deactivated');
    exports.outputChannel.dispose();
}
//# sourceMappingURL=extension.js.map