import * as vscode from "vscode";
import { ColorSetting, promptForColor, updateSetting } from "./ui";
import { updateRelativeLineNumbers } from "./core";
import {
  hideSettingsPanel,
  registerColorPanel,
  showSettingsPanel,
  toggleSettingsPanel,
} from "./panel";
import { throttleTrailing } from "./throttle";
import { LineNumberDeco } from "./generated/generated";

const decorationType = vscode.window.createTextEditorDecorationType({});

/**
 * One frame at 60 Hz. A held j or k key repeats faster than this, so updates
 * are coalesced to at most one per frame; an update costs about 0.15 ms on the
 * extension host (pnpm bench), which leaves no reason to wait longer.
 */
const UPDATE_DELAY_MS = 16;
const editorThrottles = new WeakMap<vscode.TextEditor, (editor: vscode.TextEditor) => void>();

function scheduleUpdate(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    return;
  }
  let throttled = editorThrottles.get(editor);
  if (!throttled) {
    throttled = throttleTrailing((target: vscode.TextEditor) => {
      if (vscode.window.visibleTextEditors.includes(target)) {
        updateRelativeLineNumbers(target, decorationType);
      }
    }, UPDATE_DELAY_MS);
    editorThrottles.set(editor, throttled);
  }
  throttled(editor);
}

/** Redraw every visible editor at once, bypassing the per-editor throttle. */
function refreshVisibleEditors() {
  for (const editor of vscode.window.visibleTextEditors) {
    updateRelativeLineNumbers(editor, decorationType);
  }
}

type RegisterCommand = (callback: Function) => vscode.Disposable;

/**
 * The commands that ask for a color, one row per setting: the registrars for
 * its workspace and user commands, and the subject the prompt names, worded
 * as the commands' titles word it.
 */
const colorCommands: {
  forWorkspace: RegisterCommand;
  forUser: RegisterCommand;
  setting: ColorSetting;
  subject: string;
}[] = [
  { forWorkspace: LineNumberDeco.updateColorAtCenterOfRainbow, forUser: LineNumberDeco.updateColorAtCenterOfRainbowForUser, setting: "centerColorOfRainbow", subject: "the rainbow center" },
  { forWorkspace: LineNumberDeco.updateColorAtActiveRowNumber, forUser: LineNumberDeco.updateColorAtActiveRowNumberForUser, setting: "activeForeground", subject: "the current line number" },
  { forWorkspace: LineNumberDeco.updateColorAtInactiveRowNumber, forUser: LineNumberDeco.updateColorAtInactiveRowNumberForUser, setting: "foreground", subject: "inactive line numbers" },
  { forWorkspace: LineNumberDeco.updateColorAtRepeatingDigits, forUser: LineNumberDeco.updateColorAtRepeatingDigitsForUser, setting: "foregroundColorOfRepeatingDigits", subject: "repeating digits" },
  { forWorkspace: LineNumberDeco.updateColorAtSequentialDigits, forUser: LineNumberDeco.updateColorAtSequentialDigitsForUser, setting: "foregroundColorOfSequentialDigits", subject: "sequential digits" },
  { forWorkspace: LineNumberDeco.updateColorAtMultiplesOfFive, forUser: LineNumberDeco.updateColorAtMultiplesOfFiveForUser, setting: "foregroundColorOfMultiplesOfFive", subject: "multiples of five" },
  { forWorkspace: LineNumberDeco.updateColorAtErrorLines, forUser: LineNumberDeco.updateColorAtErrorLinesForUser, setting: "errorForeground", subject: "error lines" },
  { forWorkspace: LineNumberDeco.updateColorAtWarningLines, forUser: LineNumberDeco.updateColorAtWarningLinesForUser, setting: "warningForeground", subject: "warning lines" },
];

const commands = [
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === vscode.window.activeTextEditor?.document) {
      // Update only if the change occurred in the currently active editor's document
      scheduleUpdate(vscode.window.activeTextEditor);
    }
  }),
  vscode.window.onDidChangeTextEditorSelection((e) => {
    // Update decoration when selection changes
    scheduleUpdate(e.textEditor);
  }),
  vscode.window.onDidChangeTextEditorVisibleRanges(event => {
    // Update the editor that scrolled, not just the active one: mouse-scrolling
    // an inactive pane must refresh that pane (issue #30)
    scheduleUpdate(event.textEditor);
  }),
  vscode.window.onDidChangeVisibleTextEditors((editors) => {
    for (const editor of editors) {
      updateRelativeLineNumbers(editor, decorationType);
    }
  }),
  // The rainbow is held to a contrast against the theme kind's background,
  // so a theme switch has to repaint it.
  vscode.window.onDidChangeActiveColorTheme(() => refreshVisibleEditors()),
  vscode.languages.onDidChangeDiagnostics((event) => {
    // A language server reports for documents nobody is looking at, so the
    // changed uris decide whether anything on screen could have moved.
    const changed = new Set(event.uris.map((uri) => uri.toString()));
    for (const editor of vscode.window.visibleTextEditors) {
      if (changed.has(editor.document.uri.toString())) {
        scheduleUpdate(editor);
      }
    }
  }),
  LineNumberDeco.enableRelativeLineNumbers(() => updateSetting("enableRelativeLine", true, "workspace")),
  LineNumberDeco.disableRelativeLineNumbers(() => updateSetting("enableRelativeLine", false, "workspace")),
  LineNumberDeco.enableRelativeLineNumbersForUser(() => updateSetting("enableRelativeLine", true, "user")),
  LineNumberDeco.disableRelativeLineNumbersForUser(() => updateSetting("enableRelativeLine", false, "user")),
  LineNumberDeco.enableRainbow(() => updateSetting("enableRainbow", true, "workspace")),
  LineNumberDeco.disableRainbow(() => updateSetting("enableRainbow", false, "workspace")),
  LineNumberDeco.enableRainbowForUser(() => updateSetting("enableRainbow", true, "user")),
  LineNumberDeco.disableRainbowForUser(() => updateSetting("enableRainbow", false, "user")),
  LineNumberDeco.enableRepeatingDigits(() => updateSetting("enableRepeatingDigits", true, "workspace")),
  LineNumberDeco.disableRepeatingDigits(() => updateSetting("enableRepeatingDigits", false, "workspace")),
  LineNumberDeco.enableRepeatingDigitsForUser(() => updateSetting("enableRepeatingDigits", true, "user")),
  LineNumberDeco.disableRepeatingDigitsForUser(() => updateSetting("enableRepeatingDigits", false, "user")),
  LineNumberDeco.enableSequentialDigits(() => updateSetting("enableSequentialDigits", true, "workspace")),
  LineNumberDeco.disableSequentialDigits(() => updateSetting("enableSequentialDigits", false, "workspace")),
  LineNumberDeco.enableSequentialDigitsForUser(() => updateSetting("enableSequentialDigits", true, "user")),
  LineNumberDeco.disableSequentialDigitsForUser(() => updateSetting("enableSequentialDigits", false, "user")),
  LineNumberDeco.enableMultiplesOfFive(() => updateSetting("enableMultiplesOfFive", true, "workspace")),
  LineNumberDeco.disableMultiplesOfFive(() => updateSetting("enableMultiplesOfFive", false, "workspace")),
  LineNumberDeco.enableMultiplesOfFiveForUser(() => updateSetting("enableMultiplesOfFive", true, "user")),
  LineNumberDeco.disableMultiplesOfFiveForUser(() => updateSetting("enableMultiplesOfFive", false, "user")),
  LineNumberDeco.enableDiagnostics(() => updateSetting("enableDiagnostics", true, "workspace")),
  LineNumberDeco.disableDiagnostics(() => updateSetting("enableDiagnostics", false, "workspace")),
  LineNumberDeco.enableDiagnosticsForUser(() => updateSetting("enableDiagnostics", true, "user")),
  LineNumberDeco.disableDiagnosticsForUser(() => updateSetting("enableDiagnostics", false, "user")),
  ...colorCommands.flatMap(({ forWorkspace, forUser, setting, subject }) => [
    forWorkspace(() => promptForColor(setting, subject, "workspace")),
    forUser(() => promptForColor(setting, subject, "user")),
  ]),
  LineNumberDeco.showSettingsPanel(showSettingsPanel),
  LineNumberDeco.hideSettingsPanel(hideSettingsPanel),
  LineNumberDeco.toggleSettingsPanel(toggleSettingsPanel),
];

/**
 * activate extension
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(...commands);
  registerColorPanel(context, refreshVisibleEditors);
  refreshVisibleEditors();
}

/**
 * deactivate extension
 */
export function deactivate() { }
