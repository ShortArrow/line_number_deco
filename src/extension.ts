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
import { LineNumberDeco } from "./generated/generated";

const decorationType = vscode.window.createTextEditorDecorationType({});

const commands = [
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === vscode.window.activeTextEditor?.document) {
      // Update only if the change occurred in the currently active editor's document
      updateRelativeLineNumbers(vscode.window.activeTextEditor, decorationType);
    }
  }),
  vscode.window.onDidChangeTextEditorSelection((e) => {
    // Update decoration when selection changes
    updateRelativeLineNumbers(e.textEditor, decorationType);
  }),
  vscode.window.onDidChangeTextEditorVisibleRanges(event => {
    if (event.textEditor === vscode.window.activeTextEditor) {
      // Update decoration when visible range changes
      updateRelativeLineNumbers(vscode.window.activeTextEditor, decorationType);
    }
  }),
  LineNumberDeco.enableRelativeLineNumbers(() => updateEnableRelativeLine(true)),
  LineNumberDeco.disableRelativeLineNumbers(() => updateEnableRelativeLine(false)),
  LineNumberDeco.enableRelativeLineNumbersForUser(() => updateEnableRelativeLineForUser(true)),
  LineNumberDeco.disableRelativeLineNumbersForUser(() => updateEnableRelativeLineForUser(false)),
  LineNumberDeco.enableRainbow(() => updateEnableRainbowForWorkspace(true)),
  LineNumberDeco.disableRainbow(() => updateEnableRainbowForWorkspace(false)),
  LineNumberDeco.enableRainbowForUser(() => updateEnableRainbowForUser(true)),
  LineNumberDeco.disableRainbowForUser(() => updateEnableRainbowForUser(false)),
  LineNumberDeco.enableRepeatingDigits(() => updateEnableRepeatingDigits(true)),
  LineNumberDeco.disableRepeatingDigits(() => updateEnableRepeatingDigits(false)),
  LineNumberDeco.enableRepeatingDigitsForUser(() => updateEnableRepeatingDigitsForUser(true)),
  LineNumberDeco.disableRepeatingDigitsForUser(() => updateEnableRepeatingDigitsForUser(false)),
  LineNumberDeco.updateColorAtRepeatingDigits(getColorCodeAtRepeatingDigits),
  LineNumberDeco.updateColorAtRepeatingDigitsForUser(getColorCodeAtRepeatingDigitsForUser),
  LineNumberDeco.updateColorAtCenterOfRainbow(getColorCodeAtCenterOfRainbow),
  LineNumberDeco.updateColorAtCenterOfRainbowForUser(getColorCodeAtCenterOfRainbowForUser),
  LineNumberDeco.updateColorAtInactiveRowNumberForUser(getColorCodeAtInactiveRowNumberForUser),
  LineNumberDeco.updateColorAtActiveRowNumberForUser(getColorCodeAtActiveRowNumberForUser),
  LineNumberDeco.updateColorAtInactiveRowNumber(getColorCodeAtInactiveRowNumber),
  LineNumberDeco.updateColorAtActiveRowNumber(getColorCodeAtActiveRowNumber),
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
export function deactivate() { }
