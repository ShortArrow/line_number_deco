import * as vscode from "vscode";
import { 
  getColorCodeAtActiveRowNumber,
  getColorCodeAtActiveRowNumberForUser,
  getColorCodeAtCenterOfRainbow,
  getColorCodeAtCenterOfRainbowForUser,
  getColorCodeAtInactiveRowNumber,
  getColorCodeAtInactiveRowNumberForUser,
  updateEnableRainbowForUser,
  updateEnableRainbowForWorkspace,
  updateEnableRelativeLine,
  updateEnableRelativeLineForUser,
} from "./config";
import { updateRelativeLineNumbers } from "./core";

const decorationType = vscode.window.createTextEditorDecorationType({});

function cmdCurry(command: string, callback: Function) {
  return vscode.commands.registerCommand(`line-number-deco.${command}`, () =>
    callback()
  );
}

const commands = [
  vscode.window.onDidChangeActiveTextEditor((e) => {
    updateRelativeLineNumbers(e, decorationType);
  }),
  vscode.window.onDidChangeTextEditorSelection((e) => {
    updateRelativeLineNumbers(e.textEditor, decorationType);
  }),
  cmdCurry("enableRelativeLineNumbers", () => updateEnableRelativeLine(true)),
  cmdCurry("enableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(true)
  ),
  cmdCurry("disableRelativeLineNumbers", () => updateEnableRelativeLine(false)),
  cmdCurry("disableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(false)
  ),
  cmdCurry("enableRainbow", () => updateEnableRainbowForWorkspace(true)),
  cmdCurry("enableRainbowForUser", () => updateEnableRainbowForUser(true)),
  cmdCurry("disableRainbow", () => updateEnableRainbowForWorkspace(false)),
  cmdCurry("disableRainbowForUser", () => updateEnableRainbowForUser(false)),
  cmdCurry("updateColorAtCenterOfRainbow", () =>
    getColorCodeAtCenterOfRainbow()
  ),
  cmdCurry("updateColorAtCenterOfRainbowForUser", () =>
    getColorCodeAtCenterOfRainbowForUser()
  ),
  cmdCurry("updateColorAtActiveRowNumber", () => getColorCodeAtActiveRowNumber()),
  cmdCurry("updateColorAtActiveRowNumberForUser", () => getColorCodeAtActiveRowNumberForUser()),
  cmdCurry("updateColorAtInactiveRowNumber", () => getColorCodeAtInactiveRowNumber()),
  cmdCurry("updateColorAtInactiveRowNumberForUser", () => getColorCodeAtInactiveRowNumberForUser()),
];

/**
 * activate extension
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(...commands);
}

/**
 * deactivate extension
 */
export function deactivate() {}
