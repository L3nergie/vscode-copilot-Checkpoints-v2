import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ViewProvider, TreeItem } from './providers/ViewProvider';
import { ensureWorkspaceStructure, createSimpleZip } from './utils/fileUtils';
import { AssistantPanel } from './panels/AssistantPanel';

// Store for global state
let globalContext: vscode.ExtensionContext;
export let outputChannel: vscode.OutputChannel;
let mcpServerRunning = false;

// Function to create the initial backup
async function createInitialBackup(): Promise<boolean> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return false;
    }

    try {
        const { initialBackupDir } = await ensureWorkspaceStructure(globalContext);

        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating initial backup...",
            cancellable: true
        }, async (progress) => {
            // Check if initial backup folder exists
            progress.report({ message: "Preparing initial backup" });

            try {
                const backupZipPath = path.join(initialBackupDir, `backup_${Date.now()}.zip`);

                progress.report({
                    message: "Creating backup zip file...",
                    increment: 20
                });

                await createSimpleZip(workspaceRoot, backupZipPath, '.mscode');

                progress.report({
                    message: "Initial backup created successfully!",
                    increment: 80
                });

                vscode.window.showInformationMessage("Initial workspace backup created successfully!");
                return true;
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating initial backup: ${error}`);
                outputChannel.appendLine(`Error creating initial backup: ${error}`);
                return false;
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error setting up backup: ${error}`);
        outputChannel.appendLine(`Error setting up backup: ${error}`);
        return false;
    }
}

// Function to create a checkpoint
async function createCheckpoint(): Promise<boolean> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return false;
    }

    try {
        const { checkpointsDir } = await ensureWorkspaceStructure(globalContext);

        const checkpointName = await vscode.window.showInputBox({
            prompt: "Name your checkpoint",
            placeHolder: "my-checkpoint-name"
        });

        if (!checkpointName) {
            return false; // User cancelled
        }

        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating checkpoint...",
            cancellable: true
        }, async (progress) => {
            progress.report({ message: "Preparing checkpoint" });

            const timestamp = Date.now();
            const checkpointZipPath = path.join(
                checkpointsDir,
                `checkpoint_${checkpointName.replace(/\s+/g, '_')}_${timestamp}.zip`
            );

            try {
                progress.report({
                    message: "Creating checkpoint zip file...",
                    increment: 20
                });

                await createSimpleZip(workspaceRoot, checkpointZipPath, '.mscode');

                progress.report({
                    message: "Checkpoint created successfully!",
                    increment: 80
                });

                vscode.window.showInformationMessage(`Checkpoint "${checkpointName}" created successfully!`);
                return true;
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating checkpoint: ${error}`);
                outputChannel.appendLine(`Error creating checkpoint: ${error}`);
                return false;
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error setting up checkpoint: ${error}`);
        outputChannel.appendLine(`Error setting up checkpoint: ${error}`);
        return false;
    }
}

// Function to create a timeline point
async function createTimelinePoint(): Promise<boolean> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return false;
    }

    try {
        const { timelinesDir } = await ensureWorkspaceStructure(globalContext);

        const timelinePointName = await vscode.window.showInputBox({
            prompt: "Nommez ce point dans la timeline",
            placeHolder: "mon-point-important"
        });

        if (!timelinePointName) {
            return false; // User cancelled
        }

        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Création d'un point dans la timeline...",
            cancellable: true
        }, async (progress) => {
            progress.report({ message: "Préparation du point dans la timeline" });

            const timestamp = Date.now();
            const timelineZipPath = path.join(
                timelinesDir,
                `timeline_${timelinePointName.replace(/\s+/g, '_')}_${timestamp}.zip`
            );

            try {
                progress.report({
                    message: "Création du fichier zip pour la timeline...",
                    increment: 20
                });

                await createSimpleZip(workspaceRoot, timelineZipPath, '.mscode');

                progress.report({
                    message: "Point créé avec succès dans la timeline!",
                    increment: 80
                });

                vscode.window.showInformationMessage(`Point "${timelinePointName}" créé avec succès dans la timeline!`);
                return true;
            } catch (error) {
                vscode.window.showErrorMessage(`Erreur lors de la création du point dans la timeline: ${error}`);
                outputChannel.appendLine(`Erreur lors de la création du point dans la timeline: ${error}`);
                return false;
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors de la préparation du point dans la timeline: ${error}`);
        outputChannel.appendLine(`Erreur lors de la préparation du point dans la timeline: ${error}`);
        return false;
    }
}

// Function to handle Git commit
async function handleGitCommit(): Promise<boolean> {
    try {
        const commitMessage = await vscode.window.showInputBox({
            prompt: "Entrez votre message de commit",
            placeHolder: "feat: ajout de nouvelles fonctionnalités"
        });

        if (!commitMessage) {
            return false; // User cancelled
        }

        // Execute Git commit command using the VS Code API
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
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
        await repository.add(['.']);

        // Commit changes
        await repository.commit(commitMessage);

        vscode.window.showInformationMessage(`Commit effectué avec succès: "${commitMessage}"`);
        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors du commit Git: ${error}`);
        outputChannel.appendLine(`Erreur lors du commit Git: ${error}`);
        return false;
    }
}

// Function to create a Git branch
async function handleGitCreateBranch(): Promise<boolean> {
    try {
        const branchName = await vscode.window.showInputBox({
            prompt: "Entrez le nom de la nouvelle branche",
            placeHolder: "feature/ma-nouvelle-fonctionnalite"
        });

        if (!branchName) {
            return false; // User cancelled
        }

        // Execute Git branch command using the VS Code API
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
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
        await repository.createBranch(branchName, true);

        vscode.window.showInformationMessage(`Branche "${branchName}" créée et activée avec succès`);
        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors de la création de la branche Git: ${error}`);
        outputChannel.appendLine(`Erreur lors de la création de la branche Git: ${error}`);
        return false;
    }
}

// Function to refresh problem statistics
async function refreshProblemStats(): Promise<void> {
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
            const { mscodeDir } = await ensureWorkspaceStructure(globalContext);
            const statsFile = path.join(mscodeDir, 'problem-stats.json');

            // Read existing stats if available
            let history = [];
            if (await fs.pathExists(statsFile)) {
                history = JSON.parse(await fs.readFile(statsFile, 'utf8'));
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
            await fs.writeFile(statsFile, JSON.stringify(history, null, 2));

            vscode.window.showInformationMessage(`Statistiques des problèmes mises à jour: ${totalProblems} problèmes (${errors} erreurs, ${warnings} avertissements, ${infos} informations)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la sauvegarde des statistiques: ${error}`);
            outputChannel.appendLine(`Erreur lors de la sauvegarde des statistiques: ${error}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors de l'actualisation des statistiques: ${error}`);
        outputChannel.appendLine(`Erreur lors de l'actualisation des statistiques: ${error}`);
    }
}

// Function to start MCP server
async function startMCPServer(): Promise<void> {
    if (mcpServerRunning) {
        vscode.window.showInformationMessage('Le serveur MCP est déjà en cours d\'exécution');
        return;
    }

    try {
        // Simulation de démarrage d'un serveur (dans une vraie extension, vous pourriez utiliser un serveur réel)
        mcpServerRunning = true;

        const { mscodeDir } = await ensureWorkspaceStructure(globalContext);
        const serverDataDir = path.join(mscodeDir, 'server-data');
        await fs.ensureDir(serverDataDir);

        // Create a file to indicate the server is running
        await fs.writeFile(path.join(serverDataDir, 'server-status.json'), JSON.stringify({
            running: true,
            startTime: Date.now(),
            port: 3000
        }));

        vscode.window.showInformationMessage('Serveur MCP démarré avec succès');
        outputChannel.appendLine('Serveur MCP démarré');
    } catch (error) {
        mcpServerRunning = false;
        vscode.window.showErrorMessage(`Erreur lors du démarrage du serveur MCP: ${error}`);
        outputChannel.appendLine(`Erreur lors du démarrage du serveur MCP: ${error}`);
    }
}

// Function to stop MCP server
async function stopMCPServer(): Promise<void> {
    if (!mcpServerRunning) {
        vscode.window.showInformationMessage('Le serveur MCP n\'est pas en cours d\'exécution');
        return;
    }

    try {
        // Simulation d'arrêt d'un serveur
        mcpServerRunning = false;

        const { mscodeDir } = await ensureWorkspaceStructure(globalContext);
        const serverStatusFile = path.join(mscodeDir, 'server-data', 'server-status.json');

        if (await fs.pathExists(serverStatusFile)) {
            await fs.writeFile(serverStatusFile, JSON.stringify({
                running: false,
                stopTime: Date.now()
            }));
        }

        vscode.window.showInformationMessage('Serveur MCP arrêté avec succès');
        outputChannel.appendLine('Serveur MCP arrêté');
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors de l'arrêt du serveur MCP: ${error}`);
        outputChannel.appendLine(`Erreur lors de l'arrêt du serveur MCP: ${error}`);
    }
}

export async function activate(extContext: vscode.ExtensionContext) {
    // Store context globally
    globalContext = extContext;

    // Create output channel
    outputChannel = vscode.window.createOutputChannel('Copilot Checkpoints');
    outputChannel.appendLine('Copilot Checkpoints extension activated');

    // Register the start command
    const startCommand = vscode.commands.registerCommand('mscode.checkpoints.start', () => {
        vscode.window.showInformationMessage('Copilot Checkpoints started');
        setupViews(extContext);
    });

    extContext.subscriptions.push(startCommand);

    // Setup views
    setupViews(extContext);

    // Set context to enable views
    await vscode.commands.executeCommand('setContext', 'mscode:viewsEnabled', true);
}

function setupViews(context: vscode.ExtensionContext) {
    // Create view providers for each view
    const accountProvider = new ViewProvider(context, 'mscode-account');
    const assistantsProvider = new ViewProvider(context, 'mscode-assistants');
    const initialBackupProvider = new ViewProvider(context, 'mscode-initial-backup');
    const checkpointsProvider = new ViewProvider(context, 'mscode-checkpoints');
    const statisticsProvider = new ViewProvider(context, 'mscode-statistics');
    const changesProvider = new ViewProvider(context, 'mscode-changes');
    const timelinesProvider = new ViewProvider(context, 'mscode-timelines');
    const settingsProvider = new ViewProvider(context, 'mscode-settings');
    const donationsProvider = new ViewProvider(context, 'mscode-donations');
    const gitStatusProvider = new ViewProvider(context, 'mscode-git-status');
    const problemStatsProvider = new ViewProvider(context, 'mscode-problem-stats');
    const serverProvider = new ViewProvider(context, 'mscode-server');
    const structureProvider = new ViewProvider(context, 'mscode-structure');
    const toolsProvider = new ViewProvider(context, 'mscode-tools');
    const tasksProvider = new ViewProvider(context, 'mscode-tasks');

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
    context.subscriptions.push(
        accountView,
        initialBackupView,
        checkpointsView,
        statisticsView,
        changesView,
        timelinesView,
        settingsView,
        donationsView,
        gitStatusView,
        problemStatsView,
        serverView,
        assistantsView,
        structureView,
        toolsView,
        tasksView
    );

    // Register commands for each view
    const accountEnterEmailCommand = vscode.commands.registerCommand('mscode.account.enterEmail', async () => {
        const email = await vscode.window.showInputBox({
            prompt: "Entrez votre adresse courriel",
            placeHolder: "exemple@domaine.com"
        });

        if (email) {
            // Appeler l'endpoint sur murraydev.com pour obtenir la clé unique
            // et mettre à jour le statut de connexion
            vscode.window.showInformationMessage(`Adresse courriel saisie: ${email}`);
        }
    });
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
    const changeLanguageCommand = vscode.commands.registerCommand('mscode.settings.changeLanguage', async () => {
        // ...existing code...
    });

    let chatPanel: AssistantPanel | undefined;
    const openAssistantPanelCommand = vscode.commands.registerCommand('mscode.assistant.openPanel', (assistantName: string) => {
        if (!chatPanel) {
            chatPanel = AssistantPanel.render(context.extensionUri);
        }
        chatPanel.addTab(assistantName);
        chatPanel._panel.reveal(vscode.ViewColumn.Two);
    });

    context.subscriptions.push(
        accountEnterEmailCommand,
        initialBackupCommand,
        checkpointCommand,
        timelinePointCommand,
        gitCommitCommand,
        gitCreateBranchCommand,
        problemsRefreshCommand,
        startServerCommand,
        stopServerCommand,
        assistantsCommand,
        assistantsManagerCommand,
        openAssistantPanelCommand
    );
}

// Fonctions pour gérer les assistants
async function configureAssistants(): Promise<void> {
    try {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'mscode.assistants');
    } catch (error) {
        vscode.window.showErrorMessage(`Erreur lors de la configuration des assistants : ${error}`);
    }
}

async function manageAssistants(): Promise<void> {
    const options = ['Ajouter un assistant Network', 'Ajouter un assistant Local'];

    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Sélectionnez le type d\'assistant à ajouter'
    });

    if (selection) {
        const name = await vscode.window.showInputBox({
            prompt: 'Entrez le nom du nouvel assistant'
        });

        if (name) {
            vscode.window.showInformationMessage(`Assistant '${name}' créé avec succès`);
            // Ici, vous pouvez ajouter la logique pour créer et configurer l'assistant
            // En fonction du type sélectionné (Network ou Local)
        }
    }
}

export function deactivate() {
    // Si le serveur est en cours d'exécution, assurez-vous de l'arrêter proprement
    if (mcpServerRunning) {
        stopMCPServer().catch(error => {
            console.error('Erreur lors de l\'arrêt du serveur MCP: ', error);
        });
    }

    outputChannel.appendLine('Copilot Checkpoints extension deactivated');
    outputChannel.dispose();
}