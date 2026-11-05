import * as assert from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as vscode from 'vscode';
import { nameOfExtension } from '../config';

/** The user-scope switch commands, each named by the setting it writes. */
const userSwitches: { setting: string; enable: string; disable: string }[] = [
  { setting: 'enableRelativeLine', enable: 'enableRelativeLineNumbersForUser', disable: 'disableRelativeLineNumbersForUser' },
  { setting: 'enableRainbow', enable: 'enableRainbowForUser', disable: 'disableRainbowForUser' },
  { setting: 'enableRepeatingDigits', enable: 'enableRepeatingDigitsForUser', disable: 'disableRepeatingDigitsForUser' },
  { setting: 'enableSequentialDigits', enable: 'enableSequentialDigitsForUser', disable: 'disableSequentialDigitsForUser' },
  { setting: 'enableMultiplesOfFive', enable: 'enableMultiplesOfFiveForUser', disable: 'disableMultiplesOfFiveForUser' },
  { setting: 'enableDiagnostics', enable: 'enableDiagnosticsForUser', disable: 'disableDiagnosticsForUser' },
];

function userValueOf(setting: string): unknown {
  return vscode.workspace.getConfiguration(nameOfExtension).inspect(setting)?.globalValue;
}

describe('Test setting commands', () => {
  afterEach(async () => {
    for (const { setting } of userSwitches) {
      await vscode.workspace
        .getConfiguration(nameOfExtension)
        .update(setting, undefined, vscode.ConfigurationTarget.Global);
    }
  });

  for (const { setting, enable, disable } of userSwitches) {
    it(`Must have written ${setting} to user settings by the time ${enable} and ${disable} finish`, async () => {
      await vscode.commands.executeCommand(`line-number-deco.${enable}`);
      assert.strictEqual(userValueOf(setting), true, `${enable} finished before ${setting} was true`);
      await vscode.commands.executeCommand(`line-number-deco.${disable}`);
      assert.strictEqual(userValueOf(setting), false, `${disable} finished before ${setting} was false`);
    });
  }
});
