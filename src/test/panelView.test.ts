import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { getResolvedPanelHtml } from '../panel';

const colorKeys = [
  'centerColorOfRainbow',
  'foregroundColorOfRepeatingDigits',
  'foregroundColorOfSequentialDigits',
  'activeForeground',
  'foreground',
];

const toggleKeys = [
  'enableRelativeLine',
  'enableRainbow',
  'enableRepeatingDigits',
  'enableSequentialDigits',
];

describe('Test color panel view', () => {
  it('Must resolve the color panel with a picker per color when focused', async () => {
    await vscode.commands.executeCommand('lineNumberDeco.settings.focus');
    const deadline = Date.now() + 5000;
    while (getResolvedPanelHtml() === undefined && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const html = getResolvedPanelHtml();
    assert.notStrictEqual(html, undefined, 'the color panel view never resolved');
    for (const key of colorKeys) {
      assert.ok(
        (html as string).includes(`data-key="${key}"`),
        `resolved panel html has no picker for ${key}`
      );
    }
    for (const key of toggleKeys) {
      assert.ok(
        (html as string).includes(`data-toggle="${key}"`),
        `resolved panel html has no switch for ${key}`
      );
    }
    assert.ok(
      (html as string).includes('data-apply-all='),
      'resolved panel html has no apply all control'
    );
  });
});
