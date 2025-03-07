"use strict";
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
exports.CheckpointConformity = void 0;
const types_1 = require("./types");
const logger_1 = require("../utils/logger");
class CheckpointConformity extends types_1.BaseResponsibility {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.info('Checking checkpoint conformity...');
                // Implementation for checkpoint conformity check
            }
            catch (error) {
                logger_1.Logger.error(`Error in checkpoint conformity check: ${error}`);
                throw error;
            }
        });
    }
    getName() {
        return "Checkpoint Conformity";
    }
    getDescription() {
        return "Vérifie la conformité des checkpoints et leur intégrité";
    }
    getPriority() {
        return 1;
    }
}
exports.CheckpointConformity = CheckpointConformity;
// ... other responsibility implementations ...
//# sourceMappingURL=CheckpointResponsibilities.js.map