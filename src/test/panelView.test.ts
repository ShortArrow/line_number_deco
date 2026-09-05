import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { buildPanelStateForTest, getResolvedPanelHtml } from '../panel';

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
    assert.ok(
      (html as string).includes('data-source='),
      'resolved panel html does not say which scope a row is showing'
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

  /**
   * The reported bug, as far as this host can express it.
   *
   * A window with no workspace folder open has no workspace store to write to,
   * so ConfigurationTarget.Workspace may land in the same place as Global. The
   * test finds out which happened rather than assuming: where the two scopes
   * are genuinely separate it pins the whole triple, and where they are not it
   * still pins the user value the panel must show, and says why that is all.
   */
  it('Must carry what each scope holds for a color key', async () => {
    const key = 'centerColorOfRainbow';
    const config = () => vscode.workspace.getConfiguration('LineNumberDeco');
    const hasFolder = (vscode.workspace.workspaceFolders ?? []).length > 0;
    try {
      await config().update(key, '#222222', vscode.ConfigurationTarget.Global);
      if (hasFolder) {
        await config().update(key, '#111111', vscode.ConfigurationTarget.Workspace);
      }
      const inspected = config().inspect<string>(key);
      const row = buildPanelStateForTest().rows.find((entry) => entry.key === key);
      assert.ok(row, `the panel state carries no row for ${key}`);
      assert.strictEqual(
        row.values.userValue,
        '#222222',
        'the panel state does not carry the user value'
      );
      if (inspected?.workspaceValue === undefined) {
        // Recorded, not skipped: with no folder open there is no second store,
        // so the two-scope case is proven by the unit tests and the ui-test.
        assert.strictEqual(
          row.values.workspaceValue,
          undefined,
          'the panel state invented a workspace value this host cannot hold'
        );
        return;
      }
      assert.strictEqual(
        row.values.workspaceValue,
        '#111111',
        'the panel state does not carry the workspace value beside the user one'
      );
    } finally {
      await config().update(key, undefined, vscode.ConfigurationTarget.Global);
      if (hasFolder) {
        await config().update(key, undefined, vscode.ConfigurationTarget.Workspace);
      }
    }
  });
});
