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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Gère l'historique des checkpoints
 */
class HistoryManager {
    constructor(workspaceRoot) {
        this.history = null;
        this.workspaceRoot = workspaceRoot;
        if (this.workspaceRoot) {
            this.historyFilePath = path.join(this.workspaceRoot, '.mscode', 'history.json');
            this.loadHistory();
        }
    }
    /**
     * Charge l'historique depuis le fichier
     */
    loadHistory() {
        if (!this.historyFilePath || !fs.existsSync(this.historyFilePath)) {
            this.history = {
                checkpoints: [],
                currentVersion: null,
                lastValidatedVersion: null,
                initialVersion: null
            };
            return;
        }
        try {
            const historyData = fs.readFileSync(this.historyFilePath, 'utf8');
            this.history = JSON.parse(historyData);
        }
        catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            this.history = {
                checkpoints: [],
                currentVersion: null,
                lastValidatedVersion: null,
                initialVersion: null
            };
        }
    }
    /**
     * Sauvegarde l'historique dans le fichier
     */
    saveHistory() {
        if (!this.historyFilePath || !this.history) {
            return;
        }
        try {
            fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2));
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }
    /**
     * Ajoute un nouveau checkpoint à l'historique
     */
    addCheckpoint(checkpoint) {
        if (!this.history) {
            this.loadHistory();
        }
        if (this.history) {
            this.history.checkpoints.push(checkpoint);
            this.history.currentVersion = checkpoint.id;
            this.saveHistory();
            // Ajouter le md5 avant et après la modification
            const md5Before = this.calculateMD5(checkpoint.files);
            const md5After = this.calculateMD5(checkpoint.files);
            this.saveMD5(checkpoint.id, md5Before, md5After);
        }
    }
    calculateMD5(files) {
        const crypto = require('crypto');
        const md5 = crypto.createHash('md5');
        files.forEach(file => {
            const fileContent = fs.readFileSync(file, 'utf8');
            md5.update(fileContent);
        });
        return md5.digest('hex');
    }
    saveMD5(checkpointId, md5Before, md5After) {
        const md5Dir = path.join(this.workspaceRoot, '.mscode', 'md5');
        if (!fs.existsSync(md5Dir)) {
            fs.mkdirSync(md5Dir, { recursive: true });
        }
        const md5FilePath = path.join(md5Dir, `${checkpointId}.json`);
        const md5Data = {
            before: md5Before,
            after: md5After
        };
        fs.writeFileSync(md5FilePath, JSON.stringify(md5Data, null, 2));
    }
    /**
     * Récupère tous les checkpoints
     */
    getCheckpoints() {
        var _a;
        if (!this.history) {
            this.loadHistory();
        }
        return ((_a = this.history) === null || _a === void 0 ? void 0 : _a.checkpoints) || [];
    }
    /**
     * Définit la version actuelle
     */
    setCurrentVersion(id) {
        if (!this.history) {
            this.loadHistory();
        }
        if (this.history) {
            this.history.currentVersion = id;
            this.saveHistory();
        }
    }
    /**
     * Définit la dernière version validée
     */
    setLastValidatedVersion(id) {
        if (!this.history) {
            this.loadHistory();
        }
        if (this.history) {
            this.history.lastValidatedVersion = id;
            this.saveHistory();
        }
    }
}
exports.HistoryManager = HistoryManager;
//# sourceMappingURL=historyManager.js.map