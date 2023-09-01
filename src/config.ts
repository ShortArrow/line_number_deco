import * as vscode from "vscode";

export const nameOfExtension = "LineNumberDeco";
export const defaultCenterColorOfRainbow = "#8888ff";

/**
 * get is dark theme
 * @returns if dark theme, return true
 */
function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

export function getConfig<T>(key: string, defaultValue: T) {
  const config = vscode.workspace.getConfiguration(nameOfExtension);
  return config.get<T>(key, defaultValue);
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

export function getEnableRelativeLine() {
  return getConfig<boolean>("enableRelativeLine", true);
}
