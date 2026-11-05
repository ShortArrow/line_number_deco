import * as vscode from "vscode";
import { getConfig, nameOfExtension, Setting, settingDefaults } from "./config";

/** Where a command writes: the user's settings or the open workspace's. */
export type Scope = "user" | "workspace";

/** The settings a command asks a color code for. */
type ColorSetting =
  | "centerColorOfRainbow"
  | "activeForeground"
  | "foreground"
  | "foregroundColorOfRepeatingDigits"
  | "foregroundColorOfSequentialDigits"
  | "foregroundColorOfMultiplesOfFive"
  | "errorForeground"
  | "warningForeground";

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

/**
 * Write one of this extension's settings to a scope, resolving once the write
 * has landed, so a failed write is the caller's error.
 */
export async function updateSetting<K extends Setting>(
  key: K,
  value: (typeof settingDefaults)[K],
  scope: Scope
) {
  if (scope === "user") {
    await updateUserConfig(key, value);
  } else {
    await updateWorkspaceConfig(key, value);
  }
}

/**
 * Ask for a color code and write it to a scope.
 *
 * The box shows the saved value, or the default when nothing is saved.
 * Dismissing it, or entering nothing or that same value, writes nothing.
 *
 * @param key the color setting to write
 * @param subject what the color paints, as the prompt names it
 * @param scope where the color is written
 */
export async function promptForColor(
  key: ColorSetting,
  subject: string,
  scope: Scope
) {
  const preValue = getConfig(key) || settingDefaults[key];
  const options: vscode.InputBoxOptions = {
    prompt: `Please input color code at ${subject}`,
    placeHolder: preValue,
  };
  const result = (await vscode.window.showInputBox(options)) || preValue;
  if (result === preValue || result === "") {
    return;
  }
  await updateSetting(key, result, scope);
  vscode.window.showInformationMessage(`Color is updated by, ${result}!`);
}
