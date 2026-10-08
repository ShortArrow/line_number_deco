import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { buildPanelStateForTest, getResolvedPanelHtml, isSettingsPanelVisible } from '../panel';
import { clearPreview, getPendingPreview, setPreviewColor } from '../preview';

const colorKeys = [
  'centerColorOfRainbow',
  'foregroundColorOfRepeatingDigits',
  'foregroundColorOfSequentialDigits',
  'foregroundColorOfMultiplesOfFive',
  'activeForeground',
  'foreground',
  'errorForeground',
  'warningForeground',
];

const toggleKeys = [
  'enableRelativeLine',
  'enableRainbow',
  'enableRepeatingDigits',
  'enableSequentialDigits',
  'enableMultiplesOfFive',
  'enableDiagnostics',
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
      !(html as string).includes('data-slider-for='),
      'resolved panel html still carries the custom sliders'
    );
    assert.ok(
      (html as string).includes('isHexColor'),
      'resolved panel html does not carry the hex validation'
    );
    assert.ok(
      (html as string).includes('displayForScope'),
      'resolved panel html does not carry the pending merge'
    );
    assert.ok(
      !(html as string).includes('data-plane-for='),
      'resolved panel html still carries the custom picking plane'
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

  it('Must offer every color row and switch the panel claims to carry', () => {
    const state = buildPanelStateForTest();
    for (const key of colorKeys) {
      assert.ok(
        state.rows.some((row) => row.key === key),
        `the panel state carries no row for ${key}`
      );
    }
    for (const key of toggleKeys) {
      assert.ok(
        state.toggles.some((toggle) => toggle.key === key),
        `the panel state carries no switch for ${key}`
      );
    }
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

  it('Must keep a staged value when the view is hidden', async () => {
    await vscode.commands.executeCommand('lineNumberDeco.settings.focus');
    await waitFor(() => isSettingsPanelVisible(), 'the settings view never showed');
    setPreviewColor('foreground', '#123456');
    try {
      await vscode.commands.executeCommand('workbench.view.explorer');
      await waitFor(() => !isSettingsPanelVisible(), 'the settings view never hid');
      assert.strictEqual(getPendingPreview('foreground'), '#123456', 'hiding the view discarded the staged color');
    } finally {
      clearPreview('foreground');
    }
  });

  it('Must open on User with the Workspace radio disabled when no folder is open', async function () {
    if ((vscode.workspace.workspaceFolders ?? []).length > 0) {
      this.skip();
    }
    await vscode.commands.executeCommand('lineNumberDeco.settings.focus');
    await waitFor(() => getResolvedPanelHtml() !== undefined, 'the color panel view never resolved');
    const html = getResolvedPanelHtml() as string;
    const workspace = html.match(/<input[^>]*name="scope"[^>]*value="workspace"[^>]*>/)?.[0] ?? '';
    const user = html.match(/<input[^>]*name="scope"[^>]*value="user"[^>]*>/)?.[0] ?? '';
    assert.ok(/\sdisabled\b/.test(workspace), `the Workspace radio is not disabled: ${workspace}`);
    assert.ok(/\schecked\b/.test(user), `the User radio is not checked: ${user}`);
  });
});

/** Poll a condition for up to 5 s, the budget the other view tests use. */
async function waitFor(condition: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(condition(), message);
}
