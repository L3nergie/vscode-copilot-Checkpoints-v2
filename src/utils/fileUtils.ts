import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import AdmZip = require('adm-zip');  // Changé la façon d'importer pour être compatible

export interface WorkspaceStructure {
    mscodeDir: string;
    checkpointsDir: string;
    changesDir: string;
    timelinesDir: string;
    initialBackupDir: string;
}

export async function ensureWorkspaceStructure(context: vscode.ExtensionContext): Promise<WorkspaceStructure> {
    // Get workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        throw new Error('No workspace folder open');
    }

    // Create main .mscode directory
    const mscodeDir = path.join(workspaceRoot, '.mscode');
    const checkpointsDir = path.join(mscodeDir, 'checkpoints');
    const changesDir = path.join(mscodeDir, 'changes');
    const timelinesDir = path.join(mscodeDir, 'timelines');
    const initialBackupDir = path.join(mscodeDir, 'initial-backup');

    // Ensure all directories exist
    await fs.ensureDir(mscodeDir);
    await fs.ensureDir(checkpointsDir);
    await fs.ensureDir(changesDir);
    await fs.ensureDir(timelinesDir);
    await fs.ensureDir(initialBackupDir);

    return {
        mscodeDir,
        checkpointsDir,
        changesDir,
        timelinesDir,
        initialBackupDir
    };
}

export async function createSimpleZip(sourceDir: string, zipFilePath: string, excludeDir?: string): Promise<void> {
    try {
        const zip = new AdmZip();

        // Get list of all files in the source directory
        const files = await fs.readdir(sourceDir, { withFileTypes: true });

        for (const file of files) {
            const sourcePath = path.join(sourceDir, file.name);

            // Skip the exclude directory
            if (excludeDir && file.name === excludeDir) {
                continue;
            }

            // If a directory, add its contents recursively
            if (file.isDirectory()) {
                const relativePath = file.name;
                zip.addLocalFolder(sourcePath, relativePath, null);
            } else {
                // Add file to the root of the zip
                // Ajout du 3ème paramètre manquant (metadataPath qui peut être null)
                zip.addLocalFile(sourcePath, "");
            }
        }

        // Write the zip to disk
        zip.writeZip(zipFilePath);
    } catch (error) {
        throw new Error(`Error creating zip: ${error}`);
    }
}
