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

export function getRepeatingDigitsLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfRepeatingDigits");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("foregroundColorOfRepeatingDigits", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.repeatingDigitsForeground");
}

export function getColorAtRepeatingDigits() {
  return getConfig<string>("foregroundColorOfRepeatingDigits", "");
}

export function getEnableSequentialDigits() {
  return (
    getPreviewToggle("enableSequentialDigits") ??
    getConfig<boolean>("enableSequentialDigits", false)
  );
}

export function getSequentialDigitsLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfSequentialDigits");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("foregroundColorOfSequentialDigits", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.sequentialDigitsForeground");
}

export function getColorAtSequentialDigits() {
  return getConfig<string>("foregroundColorOfSequentialDigits", "");
}

export function getEnableMultiplesOfFive() {
  return (
    getPreviewToggle("enableMultiplesOfFive") ??
    getConfig<boolean>("enableMultiplesOfFive", false)
  );
}

export function getMultiplesOfFiveLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfMultiplesOfFive");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("foregroundColorOfMultiplesOfFive", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.multiplesOfFiveForeground");
}

export function getColorAtMultiplesOfFive() {
  return getConfig<string>("foregroundColorOfMultiplesOfFive", "");
}

export function getEnableDiagnostics() {
  return (
    getPreviewToggle("enableDiagnostics") ??
    getConfig<boolean>("enableDiagnostics", false)
  );
}

export function getErrorLineNumberColor() {
  const preview = getPreviewColor("errorForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("errorForeground", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("editorError.foreground");
}

export function getWarningLineNumberColor() {
  const preview = getPreviewColor("warningForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig<string>("warningForeground", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("editorWarning.foreground");
}

export function getColorAtErrorLines() {
  return getConfig<string>("errorForeground", "");
}

export function getColorAtWarningLines() {
  return getConfig<string>("warningForeground", "");
}

export function getEnableRelativeLine() {
  return (
    getPreviewToggle("enableRelativeLine") ??
    getConfig<boolean>("enableRelativeLine", true)
  );
}
