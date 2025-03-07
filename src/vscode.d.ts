declare module 'vscode' {
  export interface WebviewView {
    readonly webview: Webview;
    readonly onDidDispose: Event<void>;
    readonly onDidChangeVisibility: Event<void>;
    readonly visible: boolean;
    show(preserveFocus?: boolean): void;
  }

  export interface WebviewViewProvider {
    resolveWebviewView(
      webviewView: WebviewView,
      context: WebviewViewResolveContext,
      token: CancellationToken
    ): Thenable<void> | void;
  }

  export interface WebviewViewResolveContext {
    readonly state: any;
  }

  export namespace window {
    export function registerWebviewViewProvider(
      viewId: string,
      provider: WebviewViewProvider,
      options?: {
        readonly webviewOptions?: {
          readonly retainContextWhenHidden?: boolean;
        };
      }
    ): Disposable;
  }
}
