import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { outputChannel } from '../extension';

interface ServerStatus {
    running: boolean;
    startTime?: number;
    stopTime?: number;
    port?: number;
    dataSize?: number;
}

/**
 * Obtient le statut actuel du serveur MCP
 */
export async function getServerStatus(workspaceRoot: string): Promise<ServerStatus> {
    try {
        const mscodeDir = path.join(workspaceRoot, '.mscode');
        const serverDataDir = path.join(mscodeDir, 'server-data');
        const serverStatusFile = path.join(serverDataDir, 'server-status.json');

        if (await fs.pathExists(serverStatusFile)) {
            const statusData = JSON.parse(await fs.readFile(serverStatusFile, 'utf8'));
            return statusData;
        }

        return { running: false };
    } catch (error) {
        if (outputChannel) {
            outputChannel.appendLine(`Erreur lors de l'obtention du statut du serveur MCP: ${error}`);
        }
        return { running: false };
    }
}

/**
 * Calcule la taille des données stockées par le serveur MCP
 */
export async function calculateServerDataSize(workspaceRoot: string): Promise<number> {
    try {
        const mscodeDir = path.join(workspaceRoot, '.mscode');
        const serverDataDir = path.join(mscodeDir, 'server-data');

        if (!await fs.pathExists(serverDataDir)) {
            return 0;
        }

        // Fonction récursive pour calculer la taille des dossiers
        async function calculateDirSize(dirPath: string): Promise<number> {
            const files = await fs.readdir(dirPath);

            const sizes = await Promise.all(files.map(async file => {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    return calculateDirSize(filePath);
                } else {
                    return stats.size;
                }
            }));

            return sizes.reduce((acc, size) => acc + size, 0);
        }

        return calculateDirSize(serverDataDir);
    } catch (error) {
        if (outputChannel) {
            outputChannel.appendLine(`Erreur lors du calcul de la taille des données du serveur: ${error}`);
        }
        return 0;
    }
}

/**
 * Formate la taille des données en format lisible
 */
export function formatDataSize(bytes: number): string {
    const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Sauvegarde des données dans l'espace de stockage du serveur MCP
 */
export async function storeServerData(workspaceRoot: string, key: string, data: any): Promise<void> {
    try {
        const mscodeDir = path.join(workspaceRoot, '.mscode');
        const serverDataDir = path.join(mscodeDir, 'server-data');
        await fs.ensureDir(serverDataDir);

        // Utiliser un hachage du nom pour éviter les problèmes de caractères spéciaux
        const sanitizedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
        const dataFile = path.join(serverDataDir, `${sanitizedKey}.json`);

        await fs.writeFile(dataFile, JSON.stringify({
            key,
            timestamp: Date.now(),
            data
        }, null, 2));
    } catch (error) {
        if (outputChannel) {
            outputChannel.appendLine(`Erreur lors de la sauvegarde des données du serveur: ${error}`);
        }
        throw new Error(`Impossible de sauvegarder les données: ${error}`);
    }
}

/**
 * Récupère des données depuis l'espace de stockage du serveur MCP
 */
export async function retrieveServerData<T>(workspaceRoot: string, key: string): Promise<T | null> {
    try {
        const mscodeDir = path.join(workspaceRoot, '.mscode');
        const serverDataDir = path.join(mscodeDir, 'server-data');

        // Utiliser le même hachage que pour le stockage
        const sanitizedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
        const dataFile = path.join(serverDataDir, `${sanitizedKey}.json`);

        if (!await fs.pathExists(dataFile)) {
            return null;
        }

        const fileContent = await fs.readFile(dataFile, 'utf8');
        const parsedData = JSON.parse(fileContent);

        return parsedData.data as T;
    } catch (error) {
        if (outputChannel) {
            outputChannel.appendLine(`Erreur lors de la récupération des données du serveur: ${error}`);
        }
        return null;
    }
}
