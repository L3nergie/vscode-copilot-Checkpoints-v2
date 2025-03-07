/**
 * Error class for workspace related errors
 */
export class WorkspaceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkspaceError';
    }
}
