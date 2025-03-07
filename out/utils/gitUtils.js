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
exports.isGitRepository = isGitRepository;
exports.getGitStatus = getGitStatus;
exports.compareProblems = compareProblems;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
/**
 * Vérifie si le dossier de travail est un dépôt Git
 */
function isGitRepository(workspaceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const gitDir = path.join(workspaceRoot, '.git');
            return yield fs.pathExists(gitDir);
        }
        catch (error) {
            return false;
        }
    });
}
/**
 * Obtient le statut Git du dépôt actuel
 */
function getGitStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const gitExtension = (_a = vscode.extensions.getExtension('vscode.git')) === null || _a === void 0 ? void 0 : _a.exports;
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
                branch: (head === null || head === void 0 ? void 0 : head.name) || 'detached',
                modifiedFiles: repository.state.workingTreeChanges.length,
                untrackedFiles: repository.state.workingTreeChanges.length,
                lastCommitMessage: ((_b = head === null || head === void 0 ? void 0 : head.commit) === null || _b === void 0 ? void 0 : _b.message) || null,
                lastCommitDate: (head === null || head === void 0 ? void 0 : head.commit) ? new Date(head.commit.commitDate) : null
            };
        }
        catch (error) {
            const outputChannel = vscode.window.createOutputChannel('Copilot Checkpoints');
            outputChannel.appendLine(`Erreur lors de l'obtention du statut Git: ${error}`);
            return null;
        }
    });
}
/**
 * Compare les problèmes entre deux points dans le temps
 */
function compareProblems(previousCount, currentCount) {
    if (previousCount === currentCount) {
        return `Pas de changement (${currentCount})`;
    }
    else if (currentCount > previousCount) {
        return `⚠️ Augmentation: +${currentCount - previousCount} (${currentCount} total)`;
    }
    else {
        return `✅ Diminution: -${previousCount - currentCount} (${currentCount} total)`;
    }
}
//# sourceMappingURL=gitUtils.js.map