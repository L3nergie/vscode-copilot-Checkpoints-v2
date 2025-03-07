import * as vscode from 'vscode';

export interface AIProviderConfig {
    id: string;
    name: string;
    apiKey: string;
    apiUrl: string;
    endpoint?: string;
    model?: string;
    icon: string;
}

declare global {
    interface Window {
        acquireVsCodeApi(): { postMessage: (message: any) => void };
    }
}

export function getApiConfig(provider: string): AIProviderConfig | undefined {
    const config = vscode.workspace.getConfiguration('mscode');
    const apiKey = config.get<string>(`${provider}.apiKey`);
    
    if (!apiKey) {
        return undefined;
    }

    return {
        id: provider,
        name: provider,
        apiKey,
        apiUrl: config.get<string>(`${provider}.endpoint`) ?? '',
        endpoint: config.get<string>(`${provider}.endpoint`),
        model: config.get<string>(`${provider}.model`),
        icon: `media/${provider}-icon.svg`
    };
}
