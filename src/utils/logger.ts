import * as vscode from 'vscode';

/**
 * Simple logger class that wraps VS Code output channel
 */
export class Logger {
    private static outputChannel: vscode.OutputChannel | null = null;
    
    /**
     * Initialize the logger with an output channel
     * @param outputChannel VS Code output channel to use for logging
     */
    public static init(outputChannel: vscode.OutputChannel): void {
        this.outputChannel = outputChannel;
    }
    
    /**
     * Log an info message
     * @param message The message to log
     */
    public static info(message: string): void {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[INFO][${timestamp}] ${message}`);
        } else {
            console.log(`[INFO] ${message}`);
        }
    }
    
    /**
     * Log a warning message
     * @param message The message to log
     */
    public static warn(message: string): void {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[WARN][${timestamp}] ${message}`);
        } else {
            console.warn(`[WARN] ${message}`);
        }
    }
    
    /**
     * Log an error message
     * @param message The message to log
     */
    public static error(message: string): void {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[ERROR][${timestamp}] ${message}`);
        } else {
            console.error(`[ERROR] ${message}`);
        }
    }

    /**
     * Log an authentication error message
     * @param error The error to log
     */
    public static logAuthError(error: any): void {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[AUTH ERROR][${timestamp}] ${error.message || error}`);
        } else {
            console.error(`[AUTH ERROR] ${error.message || error}`);
        }
    }
    
    /**
     * Log a debug message
     * @param message The message to log
     */
    public static debug(message: string): void {
        if (this.outputChannel) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[DEBUG][${timestamp}] ${message}`);
        } else {
            console.debug(`[DEBUG] ${message}`);
        }
    }
}
