import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
//import { outputChannel } from '../extension';

interface GitStatus {
    branch: string;
    modifiedFiles: number;
    untrackedFiles: number;
    lastCommitMessage: string | null;
    lastCommitDate: Date | null;
}

/**
 * Vérifie si le dossier de travail est un dépôt Git
 */
export async function isGitRepository(workspaceRoot: string): Promise<boolean> {
    try {
        const gitDir = path.join(workspaceRoot, '.git');
        return await fs.pathExists(gitDir);
    } catch (error) {
        return false;
    }
}

/**
 * Obtient le statut Git du dépôt actuel
 */
export async function getGitStatus(): Promise<GitStatus | null> {
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        if (!gitExtension) {
            return null;
        }

        const api = gitExtension.getAPI(1);
        if (!api) {
            return null;
        }

        // Get the repository
        const repositories = api.repositories;
        if (!repositories.length) {
            return null;
        }

        const repository = repositories[0];
        const head = repository.state.HEAD;

        return {
            branch: head?.name || 'detached',
            modifiedFiles: repository.state.workingTreeChanges.length,
            untrackedFiles: repository.state.workingTreeChanges.length,
            lastCommitMessage: head?.commit?.message || null,
            lastCommitDate: head?.commit ? new Date(head.commit.commitDate) : null
        };
    } catch (error) {
        const outputChannel = vscode.window.createOutputChannel('Copilot Checkpoints');
        outputChannel.appendLine(`Erreur lors de l'obtention du statut Git: ${error}`);
        return null;
    }
}

/**
 * Compare les problèmes entre deux points dans le temps
 */
export function compareProblems(previousCount: number, currentCount: number): string {
    if (previousCount === currentCount) {
        return `Pas de changement (${currentCount})`;
    } else if (currentCount > previousCount) {
        return `⚠️ Augmentation: +${currentCount - previousCount} (${currentCount} total)`;
    } else {
        return `✅ Diminution: -${previousCount - currentCount} (${currentCount} total)`;
    }
}
