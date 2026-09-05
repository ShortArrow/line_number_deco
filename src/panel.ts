import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { nameOfExtension } from "./config";
import {
  PanelRow,
  PanelSelect,
  PanelToggle,
  renderPanelHtml,
} from "./panelHtml";
import { ScopeValues } from "./panelState";
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

// No fallback beside the label: inspect() reports the package.json default
// itself, so a second copy here could only drift from it.
const toggles: { key: string; label: string }[] = [
  { key: "enableRelativeLine", label: "Relative line numbers" },
  { key: "enableRainbow", label: "Rainbow" },
  { key: "enableRepeatingDigits", label: "Repeating digits" },
  { key: "enableSequentialDigits", label: "Sequential digits" },
];

const selectSection = "editor";
const selectName = "lineNumbers";
const selectKey = `${selectSection}.${selectName}`;
const selectOptions = ["on", "off", "relative", "interval"] as const;

/**
 * What one setting holds in each scope it can be written to.
 *
 * The panel needs all three rather than the effective value, because the radio
 * decides which one a row shows: a user value hidden behind a workspace value
 * still has to be visible when the user scope is selected.
 *
 * @param section the configuration section the key belongs to
 * @param name the key within that section
 */
function scopeValuesOf<T>(section: string, name: string): ScopeValues<T> {
  const inspected = vscode.workspace.getConfiguration(section).inspect<T>(name);
  return {
    defaultValue: inspected?.defaultValue,
    userValue: inspected?.globalValue,
    workspaceValue: inspected?.workspaceValue,
  };
}

/** The saved state of every mode, in each scope that may hold one. */
function currentToggles(): PanelToggle[] {
  return toggles.map(({ key, label }) => ({
    key,
    label,
    values: scopeValuesOf<boolean>(nameOfExtension, key),
  }));
}

/**
 * The editor's own line number mode, read from VS Code rather than from this
 * extension: the panel offers it, but the setting is not ours.
 */
function currentSelects(): PanelSelect[] {
  return [
    {
      key: selectKey,
      label: "Built-in line numbers",
      values: scopeValuesOf<string>(selectSection, selectName),
      options: [...selectOptions],
    },
  ];
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
    values: scopeValuesOf<string>(nameOfExtension, key),
  }));
}

type PanelMessage =
  | { type: "preview"; key: string; value: string }
  | { type: "apply"; key: string; value: string; scope: string }
  | { type: "previewToggle"; key: string; value: boolean }
  | { type: "applyToggle"; key: string; value: boolean; scope: string }
  | { type: "applyAll"; scope: string }
  | { type: "resetRow"; key: string }
  | { type: "resetAll" };

function isKnownKey(key: string) {
  return labels.some((entry) => entry.key === key);
}

function isKnownToggle(key: string) {
  return toggles.some((entry) => entry.key === key);
}

function isKnownSelect(key: string) {
  return key === selectKey;
}

function isKnownSelectValue(key: string, value: string) {
  return (
    isKnownSelect(key) && (selectOptions as readonly string[]).includes(value)
  );
}

/**
 * The effects {@link handlePanelMessage} is allowed to have.
 *
 * Injecting them is what separates deciding from doing: the webview supplies
 * the real configuration writes, a test supplies recorders.
 */
export interface PanelMessageDeps {
  isColorKey(key: string): boolean;
  isToggleKey(key: string): boolean;
  isSelectKey(key: string): boolean;
  isValidSelectValue(key: string, value: string): boolean;
  save(key: string, value: string | boolean, scope: string): Promise<void>;
  refresh(): void;
  postState(): void;
}

/**
 * Act on one message from the settings webview.
 *
 * Unknown keys and malformed messages are dropped without any effect at all,
 * so a webview that has drifted from the extension cannot write a setting the
 * panel does not offer.
 *
 * @param message whatever the webview posted, which is not to be trusted
 * @param deps the key vocabulary and the effects to perform
 */
export async function handlePanelMessage(
  message: unknown,
  deps: PanelMessageDeps
): Promise<void> {
  if (!message || typeof message !== "object") {
    return;
  }
  const panelMessage = message as PanelMessage;
  if (panelMessage.type === "applyAll") {
    for (const { key, value } of getPendingPreviews()) {
      if (deps.isColorKey(key) || deps.isToggleKey(key) || deps.isSelectKey(key)) {
        await deps.save(key, value, panelMessage.scope);
      }
    }
    clearAllPreviews();
    deps.refresh();
    deps.postState();
    return;
  }
  if (panelMessage.type === "resetAll") {
    // Toggles go too: a pending switch is a preview like any other, and
    // "reset all" that left one standing would not have reset the panel.
    clearAllPreviews();
    deps.refresh();
    deps.postState();
    return;
  }
  if (panelMessage.type === "resetRow") {
    if (
      !deps.isColorKey(panelMessage.key) &&
      !deps.isSelectKey(panelMessage.key)
    ) {
      return;
    }
    clearPreview(panelMessage.key);
    deps.refresh();
    deps.postState();
    return;
  }
  if (
    panelMessage.type === "previewToggle" ||
    panelMessage.type === "applyToggle"
  ) {
    if (!deps.isToggleKey(panelMessage.key)) {
      return;
    }
    const value = panelMessage.value === true;
    if (panelMessage.type === "previewToggle") {
      setPreviewToggle(panelMessage.key, value);
      deps.refresh();
      return;
    }
    clearPreview(panelMessage.key);
    await deps.save(panelMessage.key, value, panelMessage.scope);
    deps.refresh();
    deps.postState();
    return;
  }
  if (deps.isSelectKey(panelMessage.key)) {
    // Nothing is repainted either way: VS Code renders these numbers itself,
    // so the panel can only stage the value and let a real write change it.
    if (!deps.isValidSelectValue(panelMessage.key, panelMessage.value)) {
      return;
    }
    if (panelMessage.type === "preview") {
      setPreviewColor(panelMessage.key, panelMessage.value);
      deps.postState();
      return;
    }
    if (panelMessage.type === "apply") {
      await deps.save(panelMessage.key, panelMessage.value, panelMessage.scope);
      clearPreview(panelMessage.key);
      deps.postState();
    }
    return;
  }
  if (!deps.isColorKey(panelMessage.key)) {
    return;
  }
  if (panelMessage.type === "preview") {
    setPreviewColor(panelMessage.key, panelMessage.value);
    deps.refresh();
    return;
  }
  if (panelMessage.type === "apply") {
    clearPreview(panelMessage.key);
    await deps.save(panelMessage.key, panelMessage.value, panelMessage.scope);
    deps.refresh();
    deps.postState();
  }
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

/**
 * The rows, switches and select a state message would carry right now.
 *
 * A test hook: the integration suite writes a setting in one scope and asks
 * what the panel would say about it, without a webview to post the message to.
 */
export function buildPanelStateForTest(): {
  toggles: PanelToggle[];
  selects: PanelSelect[];
  rows: PanelRow[];
} {
  return {
    toggles: currentToggles(),
    selects: currentSelects(),
    rows: currentRows(),
  };
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
 * The compiled conversions and the pending merge, as text to paste into the
 * webview script.
 *
 * A panel whose sliders cannot convert is still worth showing, so an unreadable
 * file costs the sliders and nothing else: the picker keeps working.
 */
function readInlineLib(extensionPath: string): string {
  return ["colorConvert.js", "panelState.js"]
    .map((file) => {
      try {
        return fs.readFileSync(path.join(extensionPath, "out", file), "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");
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
      currentSelects(),
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

  /**
   * Tell the webview what is saved and what is still only proposed.
   *
   * The pending map travels with the saved values because the script displays
   * one over the other: a state message posted while a row is staged used to
   * carry the saved value alone, and the row snapped back to it.
   *
   * Each setting travels as what all three scopes hold rather than as the one
   * value in force, so the radio can change what the rows show without asking
   * the extension again.
   */
  postState() {
    this.view?.webview.postMessage({
      type: "state",
      toggles: currentToggles(),
      selects: currentSelects(),
      rows: currentRows(),
      pending: Object.fromEntries(
        getPendingPreviews().map((entry) => [entry.key, entry.value])
      ),
    });
  }

  /**
   * Save one setting where the scope radio points.
   *
   * The select rows name a setting of the editor, so they are written to that
   * section rather than to this extension's: routing them through the
   * extension's own section would silently create a key nothing reads.
   */
  private async save(key: string, value: string | boolean, scope: string) {
    const target =
      scope === "user"
        ? vscode.ConfigurationTarget.Global
        : vscode.ConfigurationTarget.Workspace;
    if (isKnownSelect(key)) {
      await vscode.workspace
        .getConfiguration(selectSection)
        .update(selectName, value, target);
      return;
    }
    if (scope === "user") {
      await updateUserConfig(key, value);
    } else {
      await updateWorkspaceConfig(key, value);
    }
  }

  private async handle(message: PanelMessage) {
    await handlePanelMessage(message, {
      isColorKey: isKnownKey,
      isToggleKey: isKnownToggle,
      isSelectKey: isKnownSelect,
      isValidSelectValue: isKnownSelectValue,
      save: (key, value, scope) => this.save(key, value, scope),
      refresh: () => this.refresh(),
      postState: () => this.postState(),
    });
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
      if (
        event.affectsConfiguration(nameOfExtension) ||
        event.affectsConfiguration(selectKey)
      ) {
        provider.postState();
      }
    }),
  ];
  context.subscriptions.push(...disposables);
  return vscode.Disposable.from(...disposables);
}
