import * as vscode from "vscode";
import { nameOfExtension } from "./config";
import {
    getColorAtCenterOfRainbow,
    getColorAtActiveRowNumber,
    getColorAtInactiveRowNumber,
    getColorAtRepeatingDigits,
    getColorAtSequentialDigits,
    defaultCenterColorOfRainbow,
} from "./config";
    
const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

export async function updateUserConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  await extensionConfigs.update(key, set, vsCodeGlobal);
}

export async function updateWorkspaceConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  await extensionConfigs.update(key, set);
}

export async function updateEnableRainbowForWorkspace(set: boolean) {
  await updateWorkspaceConfig("enableRainbow", set);
}

export async function updateEnableRainbowForUser(set: boolean) {
  updateUserConfig("enableRainbow", set);
}

export async function updateColorAtCenterOfRainbow(set: string) {
  updateWorkspaceConfig("centerColorOfRainbow", set);
}

export async function updateColorAtCenterOfRainbowForUser(set: string) {
  updateUserConfig("centerColorOfRainbow", set);
}

export async function updateColorAtActiveRowNumber(set: string) {
  updateWorkspaceConfig("activeForeground", set);
}

export async function updateColorAtActiveRowNumberForUser(set: string) {
  updateUserConfig("activeForeground", set);
}

export async function updateColorAtInactiveRowNumber(set: string) {
  updateWorkspaceConfig("foreground", set);
}

export async function updateColorAtInactiveRowNumberForUser(set: string) {
  updateUserConfig("foreground", set);
}

export async function updateColorAtRepeatingDigits(set: string) {
  updateWorkspaceConfig("foregroundColorOfRepeatingDigits", set);
}

export async function updateColorAtRepeatingDigitsForUser(set: string) {
  updateUserConfig("foregroundColorOfRepeatingDigits", set);
}

export async function updateColorAtSequentialDigits(set: string) {
  updateWorkspaceConfig("foregroundColorOfSequentialDigits", set);
}

export async function updateColorAtSequentialDigitsForUser(set: string) {
  updateUserConfig("foregroundColorOfSequentialDigits", set);
}

async function getColorCode(
  prompt: string,
  defaultValue: string,
  preValueGetter: () => string | undefined,
  setter: (set: string) => Promise<void>
) {
  const preValue = preValueGetter() || defaultValue;
  const options: vscode.InputBoxOptions = {
    prompt: prompt,
    placeHolder: preValue,
  };
  const result = (await vscode.window.showInputBox(options)) || preValue;
  if (result === preValue || result === "") {
    return;
  }
  await setter(result);
  vscode.window.showInformationMessage(`Color is updated by, ${result}!`);
}

export async function getColorCodeAtRepeatingDigits() {
  await getColorCode(
    "Please input color code at repeating digits",
    "",
    getColorAtRepeatingDigits,
    updateColorAtRepeatingDigits
  );
}

export async function getColorCodeAtRepeatingDigitsForUser() {
  await getColorCode(
    "Please input color code at repeating digits",
    "",
    getColorAtRepeatingDigits,
    updateColorAtRepeatingDigitsForUser
  );
}

export async function getColorCodeAtSequentialDigits() {
  await getColorCode(
    "Please input color code at sequential digits",
    "",
    getColorAtSequentialDigits,
    updateColorAtSequentialDigits
  );
}

export async function getColorCodeAtSequentialDigitsForUser() {
  await getColorCode(
    "Please input color code at sequential digits",
    "",
    getColorAtSequentialDigits,
    updateColorAtSequentialDigitsForUser
  );
}

export async function getColorCodeAtCenterOfRainbow() {
  await getColorCode(
    "Please input color code at center of rainbow",
    defaultCenterColorOfRainbow,
    getColorAtCenterOfRainbow,
    updateColorAtCenterOfRainbow
  );
}

export async function getColorCodeAtCenterOfRainbowForUser() {
  await getColorCode(
    "Please input color code at center of rainbow",
    defaultCenterColorOfRainbow,
    getColorAtCenterOfRainbow,
    updateColorAtCenterOfRainbowForUser
  );
}

export async function getColorCodeAtActiveRowNumber() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtActiveRowNumber,
    updateColorAtActiveRowNumber
  );
}

export async function getColorCodeAtActiveRowNumberForUser() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtActiveRowNumber,
    updateColorAtActiveRowNumberForUser
  );
}

export async function getColorCodeAtInactiveRowNumber() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtInactiveRowNumber,
    updateColorAtInactiveRowNumber
  );
}

export async function getColorCodeAtInactiveRowNumberForUser() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtInactiveRowNumber,
    updateColorAtInactiveRowNumberForUser
  );
}

export async function updateEnableRelativeLine(set: boolean) {
  updateWorkspaceConfig("enableRelativeLine", set);
}

export async function updateEnableRelativeLineForUser(set: boolean) {
  updateUserConfig("enableRelativeLine", set);
}

export async function updateEnableRepeatingDigits(set: boolean) {
  updateWorkspaceConfig("enableRepeatingDigits", set);
}

export async function updateEnableRepeatingDigitsForUser(set: boolean) {
  updateUserConfig("enableRepeatingDigits", set);
}

export async function updateEnableSequentialDigits(set: boolean) {
  updateWorkspaceConfig("enableSequentialDigits", set);
}

export async function updateEnableSequentialDigitsForUser(set: boolean) {
  updateUserConfig("enableSequentialDigits", set);
}