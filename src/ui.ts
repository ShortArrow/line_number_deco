import * as vscode from "vscode";
import { nameOfExtension } from "./config";
import {
    getColorAtCenterOfRainbow,
    getColorAtActiveRowNumber,
    getColorAtInactiveRowNumber,
    getColorAtRepeatingDigits,
    getColorAtSequentialDigits,
    getColorAtMultiplesOfFive,
    getColorAtErrorLines,
    getColorAtWarningLines,
    settingDefaults,
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
  await updateUserConfig("enableRainbow", set);
}

export async function updateColorAtCenterOfRainbow(set: string) {
  await updateWorkspaceConfig("centerColorOfRainbow", set);
}

export async function updateColorAtCenterOfRainbowForUser(set: string) {
  await updateUserConfig("centerColorOfRainbow", set);
}

export async function updateColorAtActiveRowNumber(set: string) {
  await updateWorkspaceConfig("activeForeground", set);
}

export async function updateColorAtActiveRowNumberForUser(set: string) {
  await updateUserConfig("activeForeground", set);
}

export async function updateColorAtInactiveRowNumber(set: string) {
  await updateWorkspaceConfig("foreground", set);
}

export async function updateColorAtInactiveRowNumberForUser(set: string) {
  await updateUserConfig("foreground", set);
}

export async function updateColorAtRepeatingDigits(set: string) {
  await updateWorkspaceConfig("foregroundColorOfRepeatingDigits", set);
}

export async function updateColorAtRepeatingDigitsForUser(set: string) {
  await updateUserConfig("foregroundColorOfRepeatingDigits", set);
}

export async function updateColorAtSequentialDigits(set: string) {
  await updateWorkspaceConfig("foregroundColorOfSequentialDigits", set);
}

export async function updateColorAtSequentialDigitsForUser(set: string) {
  await updateUserConfig("foregroundColorOfSequentialDigits", set);
}

export async function updateColorAtMultiplesOfFive(set: string) {
  await updateWorkspaceConfig("foregroundColorOfMultiplesOfFive", set);
}

export async function updateColorAtMultiplesOfFiveForUser(set: string) {
  await updateUserConfig("foregroundColorOfMultiplesOfFive", set);
}

export async function updateColorAtErrorLines(set: string) {
  await updateWorkspaceConfig("errorForeground", set);
}

export async function updateColorAtErrorLinesForUser(set: string) {
  await updateUserConfig("errorForeground", set);
}

export async function updateColorAtWarningLines(set: string) {
  await updateWorkspaceConfig("warningForeground", set);
}

export async function updateColorAtWarningLinesForUser(set: string) {
  await updateUserConfig("warningForeground", set);
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

export async function getColorCodeAtMultiplesOfFive() {
  await getColorCode(
    "Please input color code at multiples of five",
    "",
    getColorAtMultiplesOfFive,
    updateColorAtMultiplesOfFive
  );
}

export async function getColorCodeAtMultiplesOfFiveForUser() {
  await getColorCode(
    "Please input color code at multiples of five",
    "",
    getColorAtMultiplesOfFive,
    updateColorAtMultiplesOfFiveForUser
  );
}

export async function getColorCodeAtErrorLines() {
  await getColorCode(
    "Please input color code at error lines",
    "",
    getColorAtErrorLines,
    updateColorAtErrorLines
  );
}

export async function getColorCodeAtErrorLinesForUser() {
  await getColorCode(
    "Please input color code at error lines",
    "",
    getColorAtErrorLines,
    updateColorAtErrorLinesForUser
  );
}

export async function getColorCodeAtWarningLines() {
  await getColorCode(
    "Please input color code at warning lines",
    "",
    getColorAtWarningLines,
    updateColorAtWarningLines
  );
}

export async function getColorCodeAtWarningLinesForUser() {
  await getColorCode(
    "Please input color code at warning lines",
    "",
    getColorAtWarningLines,
    updateColorAtWarningLinesForUser
  );
}

export async function getColorCodeAtCenterOfRainbow() {
  await getColorCode(
    "Please input color code at center of rainbow",
    settingDefaults.centerColorOfRainbow,
    getColorAtCenterOfRainbow,
    updateColorAtCenterOfRainbow
  );
}

export async function getColorCodeAtCenterOfRainbowForUser() {
  await getColorCode(
    "Please input color code at center of rainbow",
    settingDefaults.centerColorOfRainbow,
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
  await updateWorkspaceConfig("enableRelativeLine", set);
}

export async function updateEnableRelativeLineForUser(set: boolean) {
  await updateUserConfig("enableRelativeLine", set);
}

export async function updateEnableRepeatingDigits(set: boolean) {
  await updateWorkspaceConfig("enableRepeatingDigits", set);
}

export async function updateEnableRepeatingDigitsForUser(set: boolean) {
  await updateUserConfig("enableRepeatingDigits", set);
}

export async function updateEnableSequentialDigits(set: boolean) {
  await updateWorkspaceConfig("enableSequentialDigits", set);
}

export async function updateEnableSequentialDigitsForUser(set: boolean) {
  await updateUserConfig("enableSequentialDigits", set);
}

export async function updateEnableMultiplesOfFive(set: boolean) {
  await updateWorkspaceConfig("enableMultiplesOfFive", set);
}

export async function updateEnableMultiplesOfFiveForUser(set: boolean) {
  await updateUserConfig("enableMultiplesOfFive", set);
}

export async function updateEnableDiagnostics(set: boolean) {
  await updateWorkspaceConfig("enableDiagnostics", set);
}

export async function updateEnableDiagnosticsForUser(set: boolean) {
  await updateUserConfig("enableDiagnostics", set);
}