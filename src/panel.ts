import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getConfig, nameOfExtension } from "./config";
import { PanelRow, PanelToggle, renderPanelHtml } from "./panelHtml";
import {
  clearAllPreviews,
  clearPreview,
  getPendingPreviews,
  setPreviewColor,
  setPreviewToggle,
} from "./preview";
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
  | { type: "previewToggle"; key: string; value: boolean }
  | { type: "applyToggle"; key: string; value: boolean; scope: string }
  | { type: "applyAll"; scope: string };

function isKnownKey(key: string) {
  return labels.some((entry) => entry.key === key);
}

function isKnownToggle(key: string) {
  return toggles.some((entry) => entry.key === key);
}

let resolvedHtml: string | undefined;
let resolvedView: vscode.WebviewView | undefined;

/**
 * The html set at the most recent resolveWebviewView, or undefined when the
 * view has never resolved. A test hook: the integration suite focuses the
 * view and asserts the panel really rendered inside VS Code.
 */
export function getResolvedPanelHtml(): string | undefined {
  return resolvedHtml;
}

/** Whether the settings view exists and is currently showing. */
export function isSettingsPanelVisible(): boolean {
  return resolvedView?.visible === true;
}

/** Reveal the settings panel, opening its activity bar container. */
export async function showSettingsPanel(): Promise<void> {
  await vscode.commands.executeCommand(`${viewId}.focus`);
}

/**
 * Close the sidebar, but only while the settings panel is the view it holds:
 * hiding what is already hidden must never take somebody else's view with it.
 */
export async function hideSettingsPanel(): Promise<void> {
  if (!isSettingsPanelVisible()) {
    return;
  }
  await vscode.commands.executeCommand("workbench.action.closeSidebar");
}

/** Show the settings panel when it is hidden, hide it when it is showing. */
export async function toggleSettingsPanel(): Promise<void> {
  if (isSettingsPanelVisible()) {
    await hideSettingsPanel();
    return;
  }
  await showSettingsPanel();
}

/**
 * The compiled conversions, as text to paste into the webview script.
 *
 * A panel whose sliders cannot convert is still worth showing, so an unreadable
 * file costs the sliders and nothing else: the picker keeps working.
 */
function readInlineLib(extensionPath: string): string {
  try {
    return fs.readFileSync(
      path.join(extensionPath, "out", "colorConvert.js"),
      "utf8"
    );
  } catch {
    return "";
  }
}

class ColorPanelProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly refresh: () => void,
    private readonly extensionPath: string
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    resolvedView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    const nonce = crypto.randomBytes(16).toString("base64");
    webviewView.webview.html = renderPanelHtml(
      currentToggles(),
      currentRows(),
      nonce,
      webviewView.webview.cspSource,
      readInlineLib(this.extensionPath)
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
      resolvedView = undefined;
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

  /** Save one setting where the scope radio points. */
  private async save(key: string, value: string | boolean, scope: string) {
    if (scope === "user") {
      await updateUserConfig(key, value);
    } else {
      await updateWorkspaceConfig(key, value);
    }
  }

  private async handle(message: PanelMessage) {
    if (!message) {
      return;
    }
    if (message.type === "applyAll") {
      for (const { key, value } of getPendingPreviews()) {
        if (isKnownKey(key) || isKnownToggle(key)) {
          await this.save(key, value, message.scope);
        }
      }
      clearAllPreviews();
      this.refresh();
      this.postState();
      return;
    }
    if (message.type === "previewToggle" || message.type === "applyToggle") {
      if (!isKnownToggle(message.key)) {
        return;
      }
      const value = message.value === true;
      if (message.type === "previewToggle") {
        setPreviewToggle(message.key, value);
        this.refresh();
        return;
      }
      clearPreview(message.key);
      await this.save(message.key, value, message.scope);
      this.refresh();
      this.postState();
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
      clearPreview(message.key);
      await this.save(message.key, message.value, message.scope);
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
  const provider = new ColorPanelProvider(refresh, context.extensionPath);
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
