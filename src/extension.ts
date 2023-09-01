import * as vscode from "vscode";
import { 
  getColorCodeAtActiveRowNumber,
  getColorCodeAtActiveRowNumberForUser,
  getColorCodeAtCenterOfRainbow,
  getColorCodeAtCenterOfRainbowForUser,
  getColorCodeAtInactiveRowNumber,
  getColorCodeAtInactiveRowNumberForUser,
  getColorCodeAtRepeatingDigits,
  getColorCodeAtRepeatingDigitsForUser,
  updateEnableRainbowForUser,
  updateEnableRainbowForWorkspace,
  updateEnableRelativeLine,
  updateEnableRelativeLineForUser,
  updateEnableRepeatingDigits,
  updateEnableRepeatingDigitsForUser,
} from "./ui";
import { updateRelativeLineNumbers } from "./core";

const decorationType = vscode.window.createTextEditorDecorationType({});

function cmdAssign(command: string, callback: Function) {
  return vscode.commands.registerCommand(`line-number-deco.${command}`, () =>
    callback()
  );
}

const commands = [
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === vscode.window.activeTextEditor?.document) {
      // Update only if the change occurred in the currently active editor's document
      updateRelativeLineNumbers(vscode.window.activeTextEditor, decorationType);
    }
  }),
  vscode.window.onDidChangeTextEditorSelection((e) => {
    // Update on selection change
    updateRelativeLineNumbers(e.textEditor, decorationType);
  }),
  cmdAssign("enableRelativeLineNumbers", () => updateEnableRelativeLine(true)),
  cmdAssign("enableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(true)
  ),
  cmdAssign("disableRelativeLineNumbers", () => updateEnableRelativeLine(false)),
  cmdAssign("disableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(false)
  ),
  cmdAssign("enableRainbow", () => updateEnableRainbowForWorkspace(true)),
  cmdAssign("enableRainbowForUser", () => updateEnableRainbowForUser(true)),
  cmdAssign("disableRainbow", () => updateEnableRainbowForWorkspace(false)),
  cmdAssign("disableRainbowForUser", () => updateEnableRainbowForUser(false)),
  cmdAssign("enableRepeatingDigits", () => updateEnableRepeatingDigits(true)),
  cmdAssign("disableRepeatingDigits", () => updateEnableRepeatingDigits(false)),
  cmdAssign("enableRepeatingDigitsForUser", () => updateEnableRepeatingDigitsForUser(true)),
  cmdAssign("disableRepeatingDigitsForUser", () => updateEnableRepeatingDigitsForUser(false)),
  cmdAssign("updateColorAtRepeatingDigits", () => getColorCodeAtRepeatingDigits()),
  cmdAssign("updateColorAtRepeatingDigitsForUser", () => getColorCodeAtRepeatingDigitsForUser()),
  cmdAssign("updateColorAtCenterOfRainbow", () =>
    getColorCodeAtCenterOfRainbow()
  ),
  cmdAssign("updateColorAtCenterOfRainbowForUser", () =>
    getColorCodeAtCenterOfRainbowForUser()
  ),
  cmdAssign("updateColorAtActiveRowNumber", () => getColorCodeAtActiveRowNumber()),
  cmdAssign("updateColorAtActiveRowNumberForUser", () => getColorCodeAtActiveRowNumberForUser()),
  cmdAssign("updateColorAtInactiveRowNumber", () => getColorCodeAtInactiveRowNumber()),
  cmdAssign("updateColorAtInactiveRowNumberForUser", () => getColorCodeAtInactiveRowNumberForUser()),
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
