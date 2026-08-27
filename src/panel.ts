import * as crypto from "crypto";
import * as vscode from "vscode";
import { getConfig, nameOfExtension } from "./config";
import { PanelRow, renderPanelHtml } from "./panelHtml";
import { clearAllPreviews, clearPreviewColor, setPreviewColor } from "./preview";
import { updateUserConfig, updateWorkspaceConfig } from "./ui";

const viewId = "lineNumberDeco.colors";

const labels: { key: string; label: string }[] = [
  { key: "centerColorOfRainbow", label: "Rainbow center" },
  { key: "foregroundColorOfRepeatingDigits", label: "Repeating digits" },
  { key: "foregroundColorOfSequentialDigits", label: "Sequential digits" },
  { key: "activeForeground", label: "Active line number" },
  { key: "foreground", label: "Inactive line number" },
];

/**
 * The saved colors, read straight from the configuration.
 *
 * Previews deliberately do not show up here: the swatch is what Apply would
 * replace, so it has to keep showing the value that is actually stored.
 */
function currentRows(): PanelRow[] {
  return labels.map(({ key, label }) => ({
    key,
    label,
    savedColor: getConfig<string>(key, ""),
  }));
}

type PanelMessage =
  | { type: "preview"; key: string; value: string }
  | { type: "apply"; key: string; value: string; scope: string };

function isKnownKey(key: string) {
  return labels.some((entry) => entry.key === key);
}

class ColorPanelProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;

  constructor(private readonly refresh: () => void) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    const nonce = crypto.randomBytes(16).toString("base64");
    webviewView.webview.html = renderPanelHtml(
      currentRows(),
      nonce,
      webviewView.webview.cspSource
    );
    webviewView.webview.onDidReceiveMessage((message: PanelMessage) =>
      this.handle(message)
    );
    webviewView.onDidChangeVisibility(() => {
      if (!webviewView.visible) {
        clearAllPreviews();
        this.refresh();
      }
    });
    webviewView.onDidDispose(() => {
      this.view = undefined;
      clearAllPreviews();
      this.refresh();
    });
  }

  postState() {
    this.view?.webview.postMessage({ type: "state", rows: currentRows() });
  }

  private async handle(message: PanelMessage) {
    if (!message || !isKnownKey(message.key)) {
      return;
    }
    if (message.type === "preview") {
      setPreviewColor(message.key, message.value);
      this.refresh();
      return;
    }
    if (message.type === "apply") {
      clearPreviewColor(message.key);
      if (message.scope === "user") {
        await updateUserConfig(message.key, message.value);
      } else {
        await updateWorkspaceConfig(message.key, message.value);
      }
      this.refresh();
      this.postState();
    }
  }
}

/**
 * Register the activity bar color panel.
 *
 * @param context extension context the provider registration is tied to
 * @param refresh redraws the decorations of every visible editor, so a preview
 *   or a saved color is visible without waiting for an edit
 */
export function registerColorPanel(
  context: vscode.ExtensionContext,
  refresh: () => void
): vscode.Disposable {
  const provider = new ColorPanelProvider(refresh);
  const disposables = [
    vscode.window.registerWebviewViewProvider(viewId, provider),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(nameOfExtension)) {
        provider.postState();
      }
    }),
  ];
  context.subscriptions.push(...disposables);
  return vscode.Disposable.from(...disposables);
}
