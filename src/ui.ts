import * as vscode from "vscode";
import { getConfig, nameOfExtension, Setting, settingDefaults } from "./config";

/** Where a command writes: the user's settings or the open workspace's. */
export type Scope = "user" | "workspace";

/** The settings a command asks a color code for. */
export type ColorSetting =
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

/** How a color prompt talks to the reader: VS Code's input box and notifications, or a test's stand-ins. */
export interface PromptIo {
  ask(options: vscode.InputBoxOptions): Thenable<string | undefined>;
  tell(message: string): void;
}

const vsCodeIo: PromptIo = {
  ask: (options) => vscode.window.showInputBox(options),
  tell: (message) => {
    void vscode.window.showInformationMessage(message);
  },
};

/**
 * Ask for a color code and write it to a scope.
 *
 * The box shows the saved value, or the default when nothing is saved.
 * Dismissing it, or entering nothing or that same value, neither writes nor
 * announces anything; a written color is announced once it has landed.
 *
 * @param key the color setting to write
 * @param subject what the color paints, as the prompt names it
 * @param scope where the color is written
 * @param io how the prompt asks and tells, which a test answers in place of a reader
 */
export async function promptForColor(
  key: ColorSetting,
  subject: string,
  scope: Scope,
  io: PromptIo = vsCodeIo
) {
  const preValue = getConfig(key) || settingDefaults[key];
  const options: vscode.InputBoxOptions = {
    prompt: `Please input color code at ${subject}`,
    placeHolder: preValue,
  };
  const result = (await io.ask(options)) || preValue;
  if (result === preValue || result === "") {
    return;
  }
  await updateSetting(key, result, scope);
  io.tell(`Color is updated by, ${result}!`);
}
