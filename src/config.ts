import * as vscode from "vscode";

const nameOfExtension = "LineNumberDeco";
const defaultCenterColorOfRainbow = "#8888ff";
const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

/**
 * get is dark theme
 * @returns if dark theme, return true
 */
function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

function getConfig<T>(key: string, defaultValue: T) {
  const config = vscode.workspace.getConfiguration(nameOfExtension);
  return config.get<T>(key, defaultValue);
}

export function getColorAtCenterOfRainbow() {
  return getConfig<string>("centerColorOfRainbow", defaultCenterColorOfRainbow);
}

export function getColorAtActiveRowNumber() {
  return getConfig<string>("activeForeground", "");
}

export function getColorAtInactiveRowNumber() {
  return getConfig<string>("foreground", "");
}

export function getEnableRainbow() {
  return getConfig<boolean>("enableRainbow", false);
}

export function getEnableRepeatingDigits() {
  return getConfig<boolean>("enableRepeatingDigits", false);
}

export function getColorAtRepeatingDigits() {
  return getConfig<string>("repeatingDigitsColor", "");
}

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
  updateWorkspaceConfig("repeatingDigitsColor", set);
}

function updateColorAtRepeatingDigitsForUser(set: string) {
  updateUserConfig("repeatingDigitsColor", set);
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

export function getEnableRelativeLine() {
  return getConfig<boolean>("enableRelativeLine", true);
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

export function getInactiveLineNumberColor() {
  const config = getConfig<string>("foreground", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.foreground");
}

export function getActiveLineNumberColor() {
  const config = getConfig<string>("activeForeground", "");

  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.activeForeground");
}
