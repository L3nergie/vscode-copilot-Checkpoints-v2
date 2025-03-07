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
exports.getServerStatus = getServerStatus;
exports.calculateServerDataSize = calculateServerDataSize;
exports.formatDataSize = formatDataSize;
exports.storeServerData = storeServerData;
exports.retrieveServerData = retrieveServerData;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const extension_1 = require("../extension");
/**
 * Obtient le statut actuel du serveur MCP
 */
function getServerStatus(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mscodeDir = path.join(workspaceRoot, '.mscode');
            const serverDataDir = path.join(mscodeDir, 'server-data');
            const serverStatusFile = path.join(serverDataDir, 'server-status.json');
            if (yield fs.pathExists(serverStatusFile)) {
                const statusData = JSON.parse(yield fs.readFile(serverStatusFile, 'utf8'));
                return statusData;
            }
            return { running: false };
        }
        catch (error) {
            if (extension_1.outputChannel) {
                extension_1.outputChannel.appendLine(`Erreur lors de l'obtention du statut du serveur MCP: ${error}`);
            }
            return { running: false };
        }
    });
}
/**
 * Calcule la taille des données stockées par le serveur MCP
 */
function calculateServerDataSize(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mscodeDir = path.join(workspaceRoot, '.mscode');
            const serverDataDir = path.join(mscodeDir, 'server-data');
            if (!(yield fs.pathExists(serverDataDir))) {
                return 0;
            }
            // Fonction récursive pour calculer la taille des dossiers
            function calculateDirSize(dirPath) {
                return __awaiter(this, void 0, void 0, function* () {
                    const files = yield fs.readdir(dirPath);
                    const sizes = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filePath = path.join(dirPath, file);
                        const stats = yield fs.stat(filePath);
                        if (stats.isDirectory()) {
                            return calculateDirSize(filePath);
                        }
                        else {
                            return stats.size;
                        }
                    })));
                    return sizes.reduce((acc, size) => acc + size, 0);
                });
            }
            return calculateDirSize(serverDataDir);
        }
        catch (error) {
            if (extension_1.outputChannel) {
                extension_1.outputChannel.appendLine(`Erreur lors du calcul de la taille des données du serveur: ${error}`);
            }
            return 0;
        }
    });
}
/**
 * Formate la taille des données en format lisible
 */
function formatDataSize(bytes) {
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
function storeServerData(workspaceRoot, key, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mscodeDir = path.join(workspaceRoot, '.mscode');
            const serverDataDir = path.join(mscodeDir, 'server-data');
            yield fs.ensureDir(serverDataDir);
            // Utiliser un hachage du nom pour éviter les problèmes de caractères spéciaux
            const sanitizedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
            const dataFile = path.join(serverDataDir, `${sanitizedKey}.json`);
            yield fs.writeFile(dataFile, JSON.stringify({
                key,
                timestamp: Date.now(),
                data
            }, null, 2));
        }
        catch (error) {
            if (extension_1.outputChannel) {
                extension_1.outputChannel.appendLine(`Erreur lors de la sauvegarde des données du serveur: ${error}`);
            }
            throw new Error(`Impossible de sauvegarder les données: ${error}`);
        }
    });
}
/**
 * Récupère des données depuis l'espace de stockage du serveur MCP
 */
function retrieveServerData(workspaceRoot, key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mscodeDir = path.join(workspaceRoot, '.mscode');
            const serverDataDir = path.join(mscodeDir, 'server-data');
            // Utiliser le même hachage que pour le stockage
            const sanitizedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
            const dataFile = path.join(serverDataDir, `${sanitizedKey}.json`);
            if (!(yield fs.pathExists(dataFile))) {
                return null;
            }
            const fileContent = yield fs.readFile(dataFile, 'utf8');
            const parsedData = JSON.parse(fileContent);
            return parsedData.data;
        }
        catch (error) {
            if (extension_1.outputChannel) {
                extension_1.outputChannel.appendLine(`Erreur lors de la récupération des données du serveur: ${error}`);
            }
            return null;
        }
    });
}
//# sourceMappingURL=mcpServerUtils.js.map