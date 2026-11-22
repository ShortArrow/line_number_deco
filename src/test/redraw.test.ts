import * as assert from 'assert';
import { describe, it, before, after, afterEach } from 'mocha';
import * as vscode from 'vscode';
import type { LineNumberDecoApi } from '../extension';

// Each event the extension subscribes to must end in a redraw of the editor it
// concerns. A redraw is observed through the onDidPaint event the extension
// returns from activate, since a TextEditor's decorations cannot be read back.

const WAIT_MS = 5000;
/** Longer than the per-editor throttle, so the redraws of the setup have landed. */
const SETTLE_MS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let api: LineNumberDecoApi;
let painted: vscode.TextEditor[] = [];
let subscription: vscode.Disposable | undefined;

/** Clear what was painted so far, run the trigger, and wait for a redraw of the editor. */
async function redrawnBy(editor: () => vscode.TextEditor | undefined, trigger: () => Thenable<unknown> | void): Promise<boolean> {
  await sleep(SETTLE_MS);
  painted = [];
  await trigger();
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const target = editor();
    if (target && painted.some((p) => p.document === target.document)) {
      return true;
    }
    await sleep(50);
  }
  return false;
}

async function openEditor(lines: number, column = vscode.ViewColumn.One, preserveFocus = false): Promise<vscode.TextEditor> {
  const content = Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join('\n');
  const document = await vscode.workspace.openTextDocument({ content });
  return vscode.window.showTextDocument(document, { viewColumn: column, preserveFocus });
}

describe('Test the redraw each subscribed event starts', () => {
  before(async () => {
    const extension = vscode.extensions.getExtension<LineNumberDecoApi>('ShortArrow.line-number-deco')!;
    api = await extension.activate();
    subscription = api.onDidPaint((editor) => painted.push(editor));
  });

  after(async () => {
    subscription?.dispose();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  let collection: vscode.DiagnosticCollection | undefined;
  afterEach(() => {
    collection?.dispose();
    collection = undefined;
  });

  it('Must redraw the active editor when its document is edited', async () => {
    const editor = await openEditor(10);
    // Off the last line and the cursor, so neither the visible ranges nor the
    // selection move, and only the document change can start the redraw.
    assert.ok(await redrawnBy(() => editor, () => editor.edit((edit) => edit.insert(new vscode.Position(2, 0), '!'))), 'an edit did not redraw the editor');
  });

  it('Must redraw an editor when its selection moves', async () => {
    const editor = await openEditor(10);
    assert.ok(await redrawnBy(() => editor, () => {
      editor.selection = new vscode.Selection(5, 0, 5, 0);
    }), 'a selection change did not redraw the editor');
  });

  it('Must redraw an editor when it scrolls', async () => {
    const editor = await openEditor(500);
    assert.ok(await redrawnBy(() => editor, () => {
      editor.revealRange(new vscode.Range(400, 0, 400, 0), vscode.TextEditorRevealType.AtTop);
    }), 'a scroll did not redraw the editor');
  });

  it('Must redraw an editor when it becomes visible', async () => {
    await openEditor(10);
    const document = await vscode.workspace.openTextDocument({ content: 'one\ntwo\nthree' });
    assert.ok(await redrawnBy(
      () => vscode.window.visibleTextEditors.find((e) => e.document === document),
      () => vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }),
    ), 'a newly visible editor was not drawn');
  });

  it('Must redraw the visible editors when the color theme changes', async () => {
    const editor = await openEditor(10);
    const workbench = () => vscode.workspace.getConfiguration('workbench');
    const previous = workbench().inspect<string>('colorTheme')?.globalValue;
    const next = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'Default Dark Modern' : 'Default Light Modern';
    try {
      assert.ok(await redrawnBy(() => editor, () => workbench().update('colorTheme', next, vscode.ConfigurationTarget.Global)), 'a theme change did not redraw the editor');
    } finally {
      await workbench().update('colorTheme', previous, vscode.ConfigurationTarget.Global);
    }
  });

  it("Must redraw the visible editors when the extension's settings change", async () => {
    const editor = await openEditor(10);
    const config = () => vscode.workspace.getConfiguration('LineNumberDeco');
    const previous = config().inspect<boolean>('enableRainbow')?.globalValue;
    try {
      assert.ok(await redrawnBy(() => editor, () => config().update('enableRainbow', !config().get<boolean>('enableRainbow'), vscode.ConfigurationTarget.Global)), 'a settings change did not redraw the editor');
    } finally {
      await config().update('enableRainbow', previous, vscode.ConfigurationTarget.Global);
    }
  });

  it('Must redraw a visible editor when the diagnostics of its document change', async () => {
    const editor = await openEditor(10);
    collection = vscode.languages.createDiagnosticCollection('lineNumberDecoRedrawTest');
    assert.ok(await redrawnBy(() => editor, () => {
      collection!.set(editor.document.uri, [new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'marked', vscode.DiagnosticSeverity.Error)]);
    }), 'a diagnostics change did not redraw the editor');
  });
});
