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
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("centerColorOfRainbow", set);
}

function updateColorAtCenterOfRainbowForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("centerColorOfRainbow", set, vsCodeGlobal);
}

function updateColorAtActiveRowNumber(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("activeForeground", set);
}

function updateColorAtActiveRowNumberForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("activeForeground", set, vsCodeGlobal);
}

function updateColorAtInactiveRowNumber(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("foreground", set);
}

function updateColorAtInactiveRowNumberForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("foreground", set, vsCodeGlobal);
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

export function getEnableRelativeLineDefault() {
  return getConfig<boolean>("enableRlativeLineOnDefault", true);
}

export function updateEnableRelativeLine(set: boolean) {
  updateWorkspaceConfig("enableRlativeLineOnDefault", set);
}

export function updateEnableRelativeLineForUser(set: boolean) {
  updateUserConfig("enableRlativeLineOnDefault", set);
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
