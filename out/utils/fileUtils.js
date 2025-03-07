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
exports.ensureWorkspaceStructure = ensureWorkspaceStructure;
exports.createSimpleZip = createSimpleZip;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const AdmZip = require("adm-zip"); // Changé la façon d'importer pour être compatible
function ensureWorkspaceStructure(context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Get workspace root
        const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
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
        yield fs.ensureDir(mscodeDir);
        yield fs.ensureDir(checkpointsDir);
        yield fs.ensureDir(changesDir);
        yield fs.ensureDir(timelinesDir);
        yield fs.ensureDir(initialBackupDir);
        return {
            mscodeDir,
            checkpointsDir,
            changesDir,
            timelinesDir,
            initialBackupDir
        };
    });
}
function createSimpleZip(sourceDir, zipFilePath, excludeDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const zip = new AdmZip();
            // Get list of all files in the source directory
            const files = yield fs.readdir(sourceDir, { withFileTypes: true });
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
                }
                else {
                    // Add file to the root of the zip
                    // Ajout du 3ème paramètre manquant (metadataPath qui peut être null)
                    zip.addLocalFile(sourcePath, "");
                }
            }
            // Write the zip to disk
            zip.writeZip(zipFilePath);
        }
        catch (error) {
            throw new Error(`Error creating zip: ${error}`);
        }
    });
}
//# sourceMappingURL=fileUtils.js.map