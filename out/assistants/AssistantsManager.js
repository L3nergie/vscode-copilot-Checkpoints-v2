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
exports.AssistantsManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class AssistantsManager {
    constructor(workspaceRoot, outputChannel) {
        this.assistants = [];
        this.workspaceRoot = workspaceRoot;
        this.outputChannel = outputChannel;
        if (this.workspaceRoot) {
            // Définir le chemin vers le fichier de configuration des assistants
            const mscodeDir = path.join(this.workspaceRoot, '.mscode');
            this.assistantsFilePath = path.join(mscodeDir, 'assistants.json');
            // Créer le dossier .mscode s'il n'existe pas
            if (!fs.existsSync(mscodeDir)) {
                fs.mkdirSync(mscodeDir, { recursive: true });
            }
            // Charger les assistants existants ou créer un fichier par défaut
            this.loadAssistants();
        }
    }
    loadAssistants() {
        if (!this.assistantsFilePath)
            return;
        try {
            if (fs.existsSync(this.assistantsFilePath)) {
                const assistantsData = fs.readFileSync(this.assistantsFilePath, 'utf8');
                this.assistants = JSON.parse(assistantsData);
            }
            else {
                // Créer un assistant par défaut
                this.assistants = [{
                        id: 'default',
                        name: 'Assistant par défaut',
                        description: 'Assistant principal configuré avec les paramètres par défaut',
                        apiProvider: 'openai',
                        isDefault: true,
                        created: new Date().toISOString()
                    }];
                // Sauvegarder l'assistant par défaut
                this.saveAssistants();
            }
        }
        catch (error) {
            this.outputChannel.appendLine(`Erreur lors du chargement des assistants: ${error}`);
            // En cas d'erreur, initialiser avec un tableau vide
            this.assistants = [];
        }
    }
    saveAssistants() {
        if (!this.assistantsFilePath)
            return;
        try {
            fs.writeFileSync(this.assistantsFilePath, JSON.stringify(this.assistants, null, 2));
        }
        catch (error) {
            this.outputChannel.appendLine(`Erreur lors de la sauvegarde des assistants: ${error}`);
        }
    }
    getAssistants() {
        return [...this.assistants];
    }
    getDefaultAssistant() {
        return this.assistants.find(assistant => assistant.isDefault);
    }
    addAssistant(assistant) {
        const newAssistant = Object.assign(Object.assign({}, assistant), { id: `assistant_${Date.now()}`, created: new Date().toISOString() });
        // Si le nouvel assistant est défini comme par défaut, désactiver l'assistant par défaut actuel
        if (newAssistant.isDefault) {
            this.assistants.forEach(a => {
                if (a.isDefault) {
                    a.isDefault = false;
                }
            });
        }
        this.assistants.push(newAssistant);
        this.saveAssistants();
        return newAssistant;
    }
    updateAssistant(id, updates) {
        const assistantIndex = this.assistants.findIndex(a => a.id === id);
        if (assistantIndex === -1) {
            return undefined;
        }
        // Si l'assistant est mis à jour comme par défaut, désactiver l'assistant par défaut actuel
        if (updates.isDefault) {
            this.assistants.forEach(a => {
                if (a.isDefault) {
                    a.isDefault = false;
                }
            });
        }
        // Mettre à jour l'assistant
        this.assistants[assistantIndex] = Object.assign(Object.assign({}, this.assistants[assistantIndex]), updates);
        this.saveAssistants();
        return this.assistants[assistantIndex];
    }
    deleteAssistant(id) {
        const initialLength = this.assistants.length;
        this.assistants = this.assistants.filter(a => a.id !== id);
        if (this.assistants.length < initialLength) {
            this.saveAssistants();
            return true;
        }
        return false;
    }
}
exports.AssistantsManager = AssistantsManager;
//# sourceMappingURL=AssistantsManager.js.map