import * as vscode from "vscode";
import { nameOfExtension } from "./config";
import {
    getColorAtCenterOfRainbow,
    getColorAtActiveRowNumber,
    getColorAtInactiveRowNumber,
    getColorAtRepeatingDigits,
    defaultCenterColorOfRainbow,
} from "./config"; 
    
const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

export function updateUserConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update(key, set, vsCodeGlobal);
}

export function updateWorkspaceConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update(key, set);
}

export function updateEnableRainbowForWorkspace(set: boolean) {
  updateWorkspaceConfig("enableRainbow", set);
}

export function updateEnableRainbowForUser(set: boolean) {
  updateUserConfig("enableRainbow", set);
}

function updateColorAtCenterOfRainbow(set: string) {
  updateWorkspaceConfig("centerColorOfRainbow", set);
}

function updateColorAtCenterOfRainbowForUser(set: string) {
  updateUserConfig("centerColorOfRainbow", set);
}

function updateColorAtActiveRowNumber(set: string) {
  updateWorkspaceConfig("activeForeground", set);
}

function updateColorAtActiveRowNumberForUser(set: string) {
  updateUserConfig("activeForeground", set);
}

function updateColorAtInactiveRowNumber(set: string) {
  updateWorkspaceConfig("foreground", set);
}

function updateColorAtInactiveRowNumberForUser(set: string) {
  updateUserConfig("foreground", set);
}

function updateColorAtRepeatingDigits(set: string) {
  updateWorkspaceConfig("foregroundColorOfRepeatingDigits", set);
}

function updateColorAtRepeatingDigitsForUser(set: string) {
  updateUserConfig("foregroundColorOfRepeatingDigits", set);
}

async function getColorCode(
  prompt: string,
  defaultValue: string,
  preValueGetter: () => string | undefined,
  setter: (set: string) => void
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
  setter(result);
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

export function updateEnableRelativeLine(set: boolean) {
  updateWorkspaceConfig("enableRelativeLine", set);
}

export function updateEnableRelativeLineForUser(set: boolean) {
  updateUserConfig("enableRelativeLine", set);
}

export function updateEnableRepeatingDigits(set: boolean) {
  updateWorkspaceConfig("enableRepeatingDigits", set);
}

export function updateEnableRepeatingDigitsForUser(set: boolean) {
  updateUserConfig("enableRepeatingDigits", set);
}