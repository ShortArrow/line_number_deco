import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { isSettingsPanelVisible } from '../panel';

/** Poll a condition every 100 ms until it holds or the budget runs out. */
async function until(cond: () => boolean, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (!cond() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return cond();
}

const WAIT_MS = 5000;

describe('Test settings panel commands', () => {
  it('Must show the settings panel', async () => {
    await vscode.commands.executeCommand('line-number-deco.showSettingsPanel');
    assert.strictEqual(
      await until(isSettingsPanelVisible, WAIT_MS),
      true,
      'the settings panel is not visible after show'
    );
  });

  it('Must hide the settings panel', async () => {
    await vscode.commands.executeCommand('line-number-deco.hideSettingsPanel');
    assert.strictEqual(
      await until(() => !isSettingsPanelVisible(), WAIT_MS),
      true,
      'the settings panel is still visible after hide'
    );
  });

  it('Must do nothing when hiding an already hidden settings panel', async () => {
    await vscode.commands.executeCommand('line-number-deco.hideSettingsPanel');
    assert.strictEqual(
      await until(() => !isSettingsPanelVisible(), WAIT_MS),
      true,
      'the settings panel became visible after hiding it twice'
    );
  });

  it('Must toggle the settings panel on and off', async () => {
    await vscode.commands.executeCommand('line-number-deco.toggleSettingsPanel');
    assert.strictEqual(
      await until(isSettingsPanelVisible, WAIT_MS),
      true,
      'the settings panel is not visible after the first toggle'
    );
    await vscode.commands.executeCommand('line-number-deco.toggleSettingsPanel');
    assert.strictEqual(
      await until(() => !isSettingsPanelVisible(), WAIT_MS),
      true,
      'the settings panel is still visible after the second toggle'
    );
  });
});
