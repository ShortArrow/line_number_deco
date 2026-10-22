import * as vscode from "vscode";
import { getPreviewColor, getPreviewToggle } from "./preview";

export const nameOfExtension = "LineNumberDeco";

/**
 * What each setting falls back to when the manifest does not supply it. The
 * manifest test holds these to the defaults the manifest declares.
 */
export const settingDefaults = {
  enableRelativeLine: true,
  centerColorOfRainbow: "#0000ff",
  foregroundColorOfRepeatingDigits: "",
  foregroundColorOfSequentialDigits: "",
  foregroundColorOfMultiplesOfFive: "",
  enableRainbow: false,
  rainbowMinimumContrast: "4.5",
  enableRepeatingDigits: false,
  enableSequentialDigits: false,
  enableMultiplesOfFive: false,
  activeForeground: "",
  foreground: "",
  enableDiagnostics: false,
  errorForeground: "",
  warningForeground: "",
};

type Setting = keyof typeof settingDefaults;

/**
 * get is dark theme
 * @returns if dark theme, return true
 */
function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

export function getConfig<K extends Setting>(key: K) {
  const config = vscode.workspace.getConfiguration(nameOfExtension);
  return config.get(key, settingDefaults[key]);
}

export function getInactiveLineNumberColor() {
  const preview = getPreviewColor("foreground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("foreground");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.foreground");
}

export function getActiveLineNumberColor() {
  const preview = getPreviewColor("activeForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("activeForeground");

  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.activeForeground");
}

export function getColorAtCenterOfRainbow() {
  return (
    getPreviewColor("centerColorOfRainbow") ??
    getConfig("centerColorOfRainbow")
  );
}

export function getColorAtActiveRowNumber() {
  return getConfig("activeForeground");
}

export function getColorAtInactiveRowNumber() {
  return getConfig("foreground");
}

export function getEnableRainbow() {
  return (
    getPreviewToggle("enableRainbow") ??
    getConfig("enableRainbow")
  );
}

/**
 * The rainbow's minimum contrast option. The panel stages it as a select, under
 * the full key its row carries.
 */
export function getRainbowMinimumContrast() {
  return (
    getPreviewColor(`${nameOfExtension}.rainbowMinimumContrast`) ??
    getConfig("rainbowMinimumContrast")
  );
}

export function getEnableRepeatingDigits() {
  return (
    getPreviewToggle("enableRepeatingDigits") ??
    getConfig("enableRepeatingDigits")
  );
}

export function getRepeatingDigitsLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfRepeatingDigits");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("foregroundColorOfRepeatingDigits");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.repeatingDigitsForeground");
}

export function getColorAtRepeatingDigits() {
  return getConfig("foregroundColorOfRepeatingDigits");
}

export function getEnableSequentialDigits() {
  return (
    getPreviewToggle("enableSequentialDigits") ??
    getConfig("enableSequentialDigits")
  );
}

export function getSequentialDigitsLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfSequentialDigits");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("foregroundColorOfSequentialDigits");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.sequentialDigitsForeground");
}

export function getColorAtSequentialDigits() {
  return getConfig("foregroundColorOfSequentialDigits");
}

export function getEnableMultiplesOfFive() {
  return (
    getPreviewToggle("enableMultiplesOfFive") ??
    getConfig("enableMultiplesOfFive")
  );
}

export function getMultiplesOfFiveLineNumberColor() {
  const preview = getPreviewColor("foregroundColorOfMultiplesOfFive");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("foregroundColorOfMultiplesOfFive");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.multiplesOfFiveForeground");
}

export function getColorAtMultiplesOfFive() {
  return getConfig("foregroundColorOfMultiplesOfFive");
}

export function getEnableDiagnostics() {
  return (
    getPreviewToggle("enableDiagnostics") ??
    getConfig("enableDiagnostics")
  );
}

export function getErrorLineNumberColor() {
  const preview = getPreviewColor("errorForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("errorForeground");
  return config !== ""
    ? config
    : new vscode.ThemeColor("editorError.foreground");
}

export function getWarningLineNumberColor() {
  const preview = getPreviewColor("warningForeground");
  if (preview !== undefined) {
    return preview;
  }
  const config = getConfig("warningForeground");
  return config !== ""
    ? config
    : new vscode.ThemeColor("editorWarning.foreground");
}

export function getColorAtErrorLines() {
  return getConfig("errorForeground");
}

export function getColorAtWarningLines() {
  return getConfig("warningForeground");
}

export function getEnableRelativeLine() {
  return (
    getPreviewToggle("enableRelativeLine") ??
    getConfig("enableRelativeLine")
  );
}
