"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Simple logger class that wraps VS Code output channel
 */
class Logger {
    /**
     * Initialize the logger with an output channel
     * @param outputChannel VS Code output channel to use for logging
     */
    static init(outputChannel) {
        this.outputChannel = outputChannel;
    }
    /**
     * Log an info message
     * @param message The message to log
     */
    static info(message) {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[INFO][${timestamp}] ${message}`);
        }
        else {
            console.log(`[INFO] ${message}`);
        }
    }
    /**
     * Log a warning message
     * @param message The message to log
     */
    static warn(message) {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[WARN][${timestamp}] ${message}`);
        }
        else {
            console.warn(`[WARN] ${message}`);
        }
    }
    /**
     * Log an error message
     * @param message The message to log
     */
    static error(message) {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[ERROR][${timestamp}] ${message}`);
        }
        else {
            console.error(`[ERROR] ${message}`);
        }
    }
    /**
     * Log an authentication error message
     * @param error The error to log
     */
    static logAuthError(error) {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[AUTH ERROR][${timestamp}] ${error.message || error}`);
        }
        else {
            console.error(`[AUTH ERROR] ${error.message || error}`);
        }
    }
    /**
     * Log a debug message
     * @param message The message to log
     */
    static debug(message) {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[DEBUG][${timestamp}] ${message}`);
        }
        else {
            console.debug(`[DEBUG] ${message}`);
        }
    }
}
exports.Logger = Logger;
Logger.outputChannel = null;
//# sourceMappingURL=logger.js.map