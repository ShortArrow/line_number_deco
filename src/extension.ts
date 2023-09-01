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
  ...[
    {name: "enableRelativeLineNumbers", func: updateEnableRelativeLine, value: true},
    {name: "disableRelativeLineNumbers", func: updateEnableRelativeLine, value: false},
    {name: "enableRelativeLineNumbersForUser", func: updateEnableRelativeLineForUser, value: true},
    {name: "disableRelativeLineNumbersForUser", func: updateEnableRelativeLineForUser, value: false},
    {name: "enableRainbow", func: updateEnableRainbowForWorkspace, value: true},
    {name: "disableRainbow", func: updateEnableRainbowForWorkspace, value: false},
    {name: "enableRainbowForUser", func: updateEnableRainbowForUser, value: true},
    {name: "disableRainbowForUser", func: updateEnableRainbowForUser, value: false},
    {name: "enableRepeatingDigits", func: updateEnableRepeatingDigits, value: true},
    {name: "disableRepeatingDigits", func: updateEnableRepeatingDigits, value: false},
    {name: "enableRepeatingDigitsForUser", func: updateEnableRepeatingDigitsForUser, value: true},
    {name: "disableRepeatingDigitsForUser", func: updateEnableRepeatingDigitsForUser, value: false},
    {name: "updateColorAtRepeatingDigitsForUser", func: getColorCodeAtRepeatingDigits, value: undefined},
    {name: "updateColorAtCenterOfRainbow", func: getColorCodeAtCenterOfRainbow, value: undefined},
    {name: "updateColorAtCenterOfRainbowForUser", func: getColorCodeAtCenterOfRainbowForUser, value: undefined},
    {name: "updateColorAtInactiveRowNumberForUser", func: getColorCodeAtInactiveRowNumberForUser, value: undefined},
    {name: "updateColorAtActiveRowNumberForUser", func: getColorCodeAtActiveRowNumberForUser, value: undefined},
    {name: "updateColorAtAInactiveRowNumber", func: getColorCodeAtInactiveRowNumber, value: undefined},
    {name: "updateColorAtActiveRowNumber", func: getColorCodeAtActiveRowNumber, value: undefined},
  ].map(({name, func, value}) => {
    return cmdAssign(name, () => value === undefined ? func() : func(value));
  }),
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
