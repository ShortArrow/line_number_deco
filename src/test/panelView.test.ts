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
    assert.ok(
      (html as string).includes('data-slider-for="foreground"'),
      'resolved panel html has no sliders for foreground'
    );
    assert.ok(
      (html as string).includes('hexToHsl'),
      'resolved panel html does not inline the color conversions'
    );
    assert.ok(
      (html as string).includes('displayValue'),
      'resolved panel html does not inline the pending merge'
    );
    assert.ok(
      (html as string).includes('data-plane-for="foreground"'),
      'resolved panel html has no picking plane for foreground'
    );
    assert.ok(
      (html as string).includes('data-hex-for="foreground"'),
      'resolved panel html has no hex field for foreground'
    );
    assert.ok(
      (html as string).includes('data-reset-all='),
      'resolved panel html has no reset all control'
    );
    assert.ok(
      (html as string).includes('data-select-for="editor.lineNumbers"'),
      'resolved panel html has no built-in line number control'
    );
    // Read, never written: the panel must show what the editor is really set
    // to, and a test that wrote it would leak into the next run.
    const lineNumbers = vscode.workspace
      .getConfiguration('editor')
      .get<string>('lineNumbers', 'on');
    const marked = new RegExp(
      '<[a-z]+[^>]*data-select-for="editor.lineNumbers"[^>]*data-value="' +
        lineNumbers +
        '"[^>]*data-current="true"'
    );
    assert.ok(
      marked.test(html as string),
      `the marked option is not the configured ${lineNumbers}`
    );
  });
});
