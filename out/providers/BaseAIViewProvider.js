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
exports.BaseAIViewProvider = void 0;
/**
 * Base class for AI view providers
 */
class BaseAIViewProvider {
    constructor(extensionUri, outputChannel) {
        this.extensionUri = extensionUri;
        this.responsibilities = [];
        this._outputChannel = outputChannel;
    }
    /**
     * Assigns a responsibility to this AI provider
     * @param responsibility The responsibility to assign
     */
    assignResponsibility(responsibility) {
        return __awaiter(this, void 0, void 0, function* () {
            this.responsibilities.push(responsibility);
            // Notify the webview about the new responsibility
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'responsibilityAdded',
                    name: responsibility.getName(),
                    description: responsibility.getDescription()
                });
            }
        });
    }
    /**
     * Gets the list of assigned responsibilities
     * @returns List of responsibilities
     */
    getResponsibilities() {
        return [...this.responsibilities];
    }
}
exports.BaseAIViewProvider = BaseAIViewProvider;
//# sourceMappingURL=BaseAIViewProvider.js.map