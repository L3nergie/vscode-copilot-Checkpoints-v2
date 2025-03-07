"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseResponsibility = void 0;
class BaseResponsibility {
    constructor(outputChannel, workspaceRoot) {
        this.outputChannel = outputChannel;
        this.workspaceRoot = workspaceRoot;
    }
    getPriority() {
        return 0;
    }
}
exports.BaseResponsibility = BaseResponsibility;
//# sourceMappingURL=types.js.map