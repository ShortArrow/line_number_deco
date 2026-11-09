import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, it } from 'mocha';
import * as vscode from 'vscode';
import { nameOfExtension } from '../config';

// A color command asks for a color through the input box, so these tests
// answer the box in its place and run each command the manifest contributes.

const root = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);

/** The setting each color command writes, by the command's name without its scope. */
const settingOf: Record<string, string> = {
  updateColorAtCenterOfRainbow: 'centerColorOfRainbow',
  updateColorAtActiveRowNumber: 'activeForeground',
  updateColorAtInactiveRowNumber: 'foreground',
  updateColorAtRepeatingDigits: 'foregroundColorOfRepeatingDigits',
  updateColorAtSequentialDigits: 'foregroundColorOfSequentialDigits',
  updateColorAtMultiplesOfFive: 'foregroundColorOfMultiplesOfFive',
  updateColorAtErrorLines: 'errorForeground',
  updateColorAtWarningLines: 'warningForeground',
};

const titlePattern = /^LineNumberDeco: Update color of (.+) for (workspace|user)$/;

/** Every color command in the manifest, with what its title says it colors and where. */
const colorCommands: { command: string; base: string; subject: string; scope: string }[] =
  manifest.contributes.commands
    .filter((entry: { command: string }) => entry.command.startsWith(`line-number-deco.updateColorAt`))
    .map((entry: { command: string; title: string }) => {
      const [, subject, scope] = titlePattern.exec(entry.title) ?? [];
      const command = entry.command.replace('line-number-deco.', '');
      return { command, base: command.replace(/ForUser$/, ''), subject, scope };
    });

const showInputBox = vscode.window.showInputBox;

/** Make the input box answer with a fixed reply, remembering what it was asked. */
function answerInputBox(reply: string | undefined) {
  const asked: vscode.InputBoxOptions[] = [];
  (vscode.window as { showInputBox: unknown }).showInputBox = async (options: vscode.InputBoxOptions) => {
    asked.push(options);
    return reply;
  };
  return asked;
}

function userValueOf(setting: string): unknown {
  return vscode.workspace.getConfiguration(nameOfExtension).inspect(setting)?.globalValue;
}

describe('Test color commands', () => {
  afterEach(async () => {
    (vscode.window as { showInputBox: unknown }).showInputBox = showInputBox;
    for (const setting of Object.values(settingOf)) {
      await vscode.workspace
        .getConfiguration(nameOfExtension)
        .update(setting, undefined, vscode.ConfigurationTarget.Global);
    }
  });

  it('Must cover every color command the manifest contributes, once per scope', () => {
    assert.deepStrictEqual(
      colorCommands.map(({ command }) => command).sort(),
      Object.keys(settingOf).flatMap((base) => [base, `${base}ForUser`]).sort()
    );
    for (const { command, subject } of colorCommands) {
      assert.ok(subject, `${command} has a title that names no color`);
    }
  });

  for (const { command, subject } of colorCommands) {
    it(`${command} must ask for the color of ${subject}`, async () => {
      const asked = answerInputBox(undefined);
      await vscode.commands.executeCommand(`line-number-deco.${command}`);
      assert.strictEqual(asked.length, 1);
      assert.strictEqual(asked[0].prompt, `Please input color code at ${subject}`);
    });
  }

  for (const { command, base } of colorCommands.filter(({ scope }) => scope === 'user')) {
    it(`${command} must write ${settingOf[base]} to user settings`, async () => {
      answerInputBox('#00bb00');
      await vscode.commands.executeCommand(`line-number-deco.${command}`);
      assert.strictEqual(userValueOf(settingOf[base]), '#00bb00');
    });
  }

  // The test instance opens no folder, so a write to the workspace is refused,
  // and a command that wrote to the user's settings instead would not be.
  for (const { command, base } of colorCommands.filter(({ scope }) => scope === 'workspace')) {
    it(`${command} must write ${settingOf[base]} to the workspace, not to user settings`, async () => {
      answerInputBox('#00bb00');
      await assert.rejects(Promise.resolve(vscode.commands.executeCommand(`line-number-deco.${command}`)));
      assert.strictEqual(userValueOf(settingOf[base]), undefined);
    });
  }
});
