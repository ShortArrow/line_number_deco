import * as crypto from "crypto";
import * as vscode from "vscode";
import { getConfig, nameOfExtension } from "./config";
import { PanelRow, PanelToggle, renderPanelHtml } from "./panelHtml";
import { clearAllPreviews, clearPreviewColor, setPreviewColor } from "./preview";
import { updateUserConfig, updateWorkspaceConfig } from "./ui";

const viewId = "lineNumberDeco.settings";

const labels: { key: string; label: string }[] = [
  { key: "centerColorOfRainbow", label: "Rainbow center" },
  { key: "foregroundColorOfRepeatingDigits", label: "Repeating digits" },
  { key: "foregroundColorOfSequentialDigits", label: "Sequential digits" },
  { key: "activeForeground", label: "Active line number" },
  { key: "foreground", label: "Inactive line number" },
];

const toggles: { key: string; label: string; fallback: boolean }[] = [
  { key: "enableRelativeLine", label: "Relative line numbers", fallback: true },
  { key: "enableRainbow", label: "Rainbow", fallback: false },
  { key: "enableRepeatingDigits", label: "Repeating digits", fallback: false },
  { key: "enableSequentialDigits", label: "Sequential digits", fallback: false },
];

/** The saved state of every mode, each with its package.json default. */
function currentToggles(): PanelToggle[] {
  return toggles.map(({ key, label, fallback }) => ({
    key,
    label,
    value: getConfig<boolean>(key, fallback),
  }));
}

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
  | { type: "apply"; key: string; value: string; scope: string }
  | { type: "toggle"; key: string; value: boolean; scope: string };

function isKnownKey(key: string) {
  return labels.some((entry) => entry.key === key);
}

function isKnownToggle(key: string) {
  return toggles.some((entry) => entry.key === key);
}

let resolvedHtml: string | undefined;

/**
 * The html set at the most recent resolveWebviewView, or undefined when the
 * view has never resolved. A test hook: the integration suite focuses the
 * view and asserts the panel really rendered inside VS Code.
 */
export function getResolvedPanelHtml(): string | undefined {
  return resolvedHtml;
}

class ColorPanelProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;

  constructor(private readonly refresh: () => void) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    const nonce = crypto.randomBytes(16).toString("base64");
    webviewView.webview.html = renderPanelHtml(
      currentToggles(),
      currentRows(),
      nonce,
      webviewView.webview.cspSource
    );
    resolvedHtml = webviewView.webview.html;
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
    this.view?.webview.postMessage({
      type: "state",
      toggles: currentToggles(),
      rows: currentRows(),
    });
  }

  private async handle(message: PanelMessage) {
    if (!message) {
      return;
    }
    if (message.type === "toggle") {
      if (!isKnownToggle(message.key)) {
        return;
      }
      const value = message.value === true;
      if (message.scope === "user") {
        await updateUserConfig(message.key, value);
      } else {
        await updateWorkspaceConfig(message.key, value);
      }
      this.refresh();
      return;
    }
    if (!isKnownKey(message.key)) {
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
