"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceError = void 0;
/**
 * Error class for workspace related errors
 */
class WorkspaceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WorkspaceError';
    }
}
exports.WorkspaceError = WorkspaceError;
//# sourceMappingURL=WorkspaceError.js.map