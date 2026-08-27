import * as vscode from "vscode";
import { getPreviewColor, getPreviewToggle } from "./preview";

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
  const preview = getPreviewColor("foreground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("foreground", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.foreground");
}

export function getActiveLineNumberColor() {
  const preview = getPreviewColor("activeForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("activeForeground", "");

  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.activeForeground");
}

export function getColorAtCenterOfRainbow() {
  return (
    getPreviewColor("centerColorOfRainbow") ??
    getConfig<string>("centerColorOfRainbow", defaultCenterColorOfRainbow)
  );
}

export function getColorAtActiveRowNumber() {
  return getConfig<string>("activeForeground", "");
}

export function getColorAtInactiveRowNumber() {
  return getConfig<string>("foreground", "");
}

export function getEnableRainbow() {
  return (
    getPreviewToggle("enableRainbow") ??
    getConfig<boolean>("enableRainbow", false)
  );
}

export function getEnableRepeatingDigits() {
  return (
    getPreviewToggle("enableRepeatingDigits") ??
    getConfig<boolean>("enableRepeatingDigits", false)
  );
}

export function getColorAtRepeatingDigits() {
  return (
    getPreviewColor("foregroundColorOfRepeatingDigits") ??
    getConfig<string>("foregroundColorOfRepeatingDigits", "")
  );
}

export function getEnableSequentialDigits() {
  return (
    getPreviewToggle("enableSequentialDigits") ??
    getConfig<boolean>("enableSequentialDigits", false)
  );
}

export function getColorAtSequentialDigits() {
  return (
    getPreviewColor("foregroundColorOfSequentialDigits") ??
    getConfig<string>("foregroundColorOfSequentialDigits", "")
  );
}

export function getEnableRelativeLine() {
  return (
    getPreviewToggle("enableRelativeLine") ??
    getConfig<boolean>("enableRelativeLine", true)
  );
}
