import * as assert from 'assert';
import { describe, it, before, after, afterEach } from 'mocha';
import * as vscode from 'vscode';
import { onDidPaint, Paint } from '../extension';
import { contrastRatio } from '../colors';
import { rainbowBackgroundOf } from '../decorations';

// Each event the extension subscribes to must redraw the editors it concerns,
// with line numbers that are right for the editor as it is after the event,
// and must leave every other editor alone. Redraws are observed through the
// onDidPaint event the extension module exports, since a TextEditor's
// decorations cannot be read back. The module has to be the instance VS Code
// activated, not a second copy.

/** How long a redraw that should happen may take: far above the 16 ms throttle. */
const WAIT_MS = 5000;
/** Longer than the per-editor throttle, so the redraws of the setup have landed. */
const SETTLE_MS = 200;
/** How long to watch for a redraw that must not happen, thirty times the throttle. */
const QUIET_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let paints: Paint[] = [];
let subscription: vscode.Disposable | undefined;

/** Let the setup's redraws land, then collect only what the trigger causes. */
async function afterSettling(trigger: () => Thenable<unknown> | void): Promise<void> {
  await sleep(SETTLE_MS);
  paints = [];
  await trigger();
}

/**
 * The last redraw of the target once the trigger has run, failing if none comes.
 * A document stands for whichever editor shows it; an editor, for itself alone,
 * when the document is shown in more than one.
 */
async function redrawOf(target: vscode.TextDocument | vscode.TextEditor, trigger: () => Thenable<unknown> | void, what: string): Promise<Paint> {
  const isTarget = (p: Paint) => p.editor === target || p.editor.document === target;
  await afterSettling(trigger);
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline && !paints.some(isTarget)) {
    await sleep(50);
  }
  await sleep(SETTLE_MS);
  const own = paints.filter(isTarget);
  assert.ok(own.length > 0, `${what} did not redraw the editor`);
  return own[own.length - 1];
}

/** The documents redrawn while the trigger runs and for QUIET_MS after it. */
async function documentsRedrawnBy(trigger: () => Thenable<unknown> | void): Promise<Set<vscode.TextDocument>> {
  await afterSettling(trigger);
  await sleep(QUIET_MS);
  return new Set(paints.map((p) => p.editor.document));
}

/** Lines of one width, so an edit above the last visible line cannot move the visible ranges. */
async function openDocument(lines: number): Promise<vscode.TextDocument> {
  return vscode.workspace.openTextDocument({ content: Array(lines).fill('xxxxxxxxxx').join('\n') });
}

async function openEditor(lines: number, viewColumn = vscode.ViewColumn.One, preserveFocus = false): Promise<vscode.TextEditor> {
  return vscode.window.showTextDocument(await openDocument(lines), { viewColumn, preserveFocus });
}

/** The editor that now shows the document, since showing it again may hand back a new object. */
function editorOf(document: vscode.TextDocument): vscode.TextEditor {
  const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
  assert.ok(editor, 'the document is not visible');
  return editor;
}

/**
 * Check a redraw against the editor as it stands: one decoration per visible
 * line plus the line below each visible range, labelled with the distance to
 * the cursor line and the cursor line with its own number, all in a column as
 * wide as the line count's digits.
 */
function assertDrawnFor(paint: Paint, editor: vscode.TextEditor): void {
  const lineCount = editor.document.lineCount;
  const active = editor.selection.active.line;
  const expectedLines = new Set<number>();
  for (const range of editor.visibleRanges) {
    for (let line = range.start.line; line <= Math.min(lineCount - 1, range.end.line + 1); line++) {
      expectedLines.add(line);
    }
  }
  const drawn = paint.decorations.map((d) => d.range.start.line);
  assert.deepStrictEqual(drawn, [...expectedLines].sort((a, b) => a - b), 'the redraw does not cover exactly the visible lines');
  const width = `${String(lineCount).length / 2 + 0.5}em`;
  for (const decoration of paint.decorations) {
    const line = decoration.range.start.line;
    const label = line === active ? String(active + 1) : String(Math.abs(line - active));
    assert.strictEqual(decoration.renderOptions?.before?.contentText, label, `line ${line} is labelled wrongly`);
    assert.strictEqual(decoration.renderOptions?.before?.width, width, `line ${line} has the wrong column width`);
  }
}

/** Change a user setting for the body, which may change it again, and put it back afterwards. */
async function withSetting<T>(section: string, key: string, value: unknown, body: (set: (value: unknown) => Thenable<void>) => Promise<T>): Promise<T> {
  const config = () => vscode.workspace.getConfiguration(section);
  const set = (next: unknown) => config().update(key, next, vscode.ConfigurationTarget.Global);
  const previous = config().inspect(key)?.globalValue;
  await set(value);
  try {
    return await body(set);
  } finally {
    await set(previous);
  }
}

describe('Test the redraws of the events the extension subscribes to', () => {
  before(async () => {
    await vscode.extensions.getExtension('ShortArrow.line-number-deco')!.activate();
    const copies = Object.keys(require.cache).filter((key) => /[\\/]out[\\/]extension\.js$/i.test(key));
    assert.strictEqual(copies.length, 1, `the extension module is loaded ${copies.length} times: ${copies.join(', ')}`);
    subscription = onDidPaint((paint) => paints.push(paint));
  });

  after(async () => {
    subscription?.dispose();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  describe('Test the redraw each subscribed event starts', () => {
    let collection: vscode.DiagnosticCollection | undefined;
    afterEach(async () => {
      collection?.dispose();
      collection = undefined;
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    // Typing Enter in a long file: a line is added above the bottom of the
    // screen while the cursor stays put. Crossing 999 to 1000 lines widens the
    // number column, which only a redraw after the edit can know. The edit is
    // made away from the cursor and the last visible line, so the selection and
    // the visible ranges stay as they were and only the edit can start it.
    it('Must redraw the active editor for an edit, widening the column when the line count gains a digit', async () => {
      const editor = await openEditor(999);
      const paint = await redrawOf(editor.document, () => editor.edit((edit) => edit.insert(new vscode.Position(3, 0), '\n')), 'an edit');
      assert.strictEqual(editor.document.lineCount, 1000);
      assertDrawnFor(paint, editor);
    });

    // One file split into two views, typing in one: the other shows the same
    // lines, so it must follow the edit too, though its cursor and view stay
    // where they were.
    it('Must redraw the other view of a split file for an edit in one, widening its column too', async () => {
      const typed = await openEditor(999);
      const beside = await vscode.window.showTextDocument(typed.document, { viewColumn: vscode.ViewColumn.Two, preserveFocus: true });
      assert.notStrictEqual(beside, typed);
      const paint = await redrawOf(beside, () => typed.edit((edit) => edit.insert(new vscode.Position(3, 0), '\n')), 'an edit in the other view');
      assertDrawnFor(paint, beside);
    });

    // Moving the cursor with a click or an arrow key: every label is a distance
    // from the cursor line, so all of them change.
    it('Must redraw an editor when its cursor moves, labelling each line by its distance to the new cursor line', async () => {
      const editor = await openEditor(10);
      const paint = await redrawOf(editor.document, () => {
        editor.selection = new vscode.Selection(5, 0, 5, 0);
      }, 'a cursor move');
      assertDrawnFor(paint, editor);
      assert.strictEqual(paint.decorations.find((d) => d.range.start.line === 5)?.renderOptions?.before?.contentText, '6');
    });

    // Scrolling with the wheel or the scroll bar, which moves the view and not
    // the cursor: the lines that come into view must be drawn.
    it('Must redraw an editor when it scrolls, drawing the lines that came into view', async () => {
      const editor = await openEditor(500);
      const paint = await redrawOf(editor.document, () => {
        editor.revealRange(new vscode.Range(400, 0, 400, 0), vscode.TextEditorRevealType.AtTop);
      }, 'a scroll');
      assertDrawnFor(paint, editor);
      assert.ok(paint.decorations.some((d) => d.range.start.line === 400), 'line 400 was not drawn');
    });

    // Opening a file beside the one being edited, the usual split: the new
    // editor has never been drawn, and gets no cursor or scroll event.
    it('Must draw an editor when it becomes visible beside another', async () => {
      await openEditor(10);
      const document = await openDocument(20);
      const paint = await redrawOf(document, () => vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }), 'showing an editor');
      assertDrawnFor(paint, editorOf(document));
    });

    // Switching between a dark and a light theme with the rainbow on: the
    // rainbow is kept readable against the theme kind's background, so its
    // colors must be worked out again against the new one.
    it('Must redraw the visible editors when the color theme changes, keeping the rainbow readable on the new background', async () => {
      await withSetting('LineNumberDeco', 'enableRainbow', true, async () => {
        const editor = await openEditor(10);
        editor.selection = new vscode.Selection(5, 0, 5, 0);
        const light = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
        await withSetting('workbench', 'colorTheme', undefined, async (setTheme) => {
          const paint = await redrawOf(editor.document, () => setTheme(light ? 'Default Dark Modern' : 'Default Light Modern'), 'a theme change');
          const background = rainbowBackgroundOf(vscode.window.activeColorTheme.kind);
          const rainbow = paint.decorations.map((d) => d.renderOptions?.before?.color).filter((c): c is string => typeof c === 'string');
          assert.ok(rainbow.length > 0, 'no line was drawn in a rainbow color');
          for (const color of rainbow) {
            assert.ok(contrastRatio(color, background) >= 4.5, `${color} is not readable on ${background}`);
          }
        });
      });
    });

    // Turning the line numbers off from the settings or the command palette:
    // what is on screen must go at once, not at the next cursor move.
    it("Must redraw the visible editors when the extension's settings change, clearing them when the numbers are turned off", async () => {
      const editor = await openEditor(10);
      await withSetting('LineNumberDeco', 'enableRelativeLine', true, async (setEnabled) => {
        const paint = await redrawOf(editor.document, () => setEnabled(false), 'a settings change');
        assert.deepStrictEqual(paint.decorations, []);
      });
    });

    // A language server reporting an error while the file is on screen: the
    // line it is on must take the error color without the cursor moving.
    it('Must redraw a visible editor when the diagnostics of its document change, coloring the error line', async () => {
      await withSetting('LineNumberDeco', 'enableDiagnostics', true, async () => {
        const editor = await openEditor(10);
        collection = vscode.languages.createDiagnosticCollection('lineNumberDecoRedrawTest');
        const paint = await redrawOf(editor.document, () => {
          collection!.set(editor.document.uri, [new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'marked', vscode.DiagnosticSeverity.Error)]);
        }, 'a diagnostics change');
        assertDrawnFor(paint, editor);
        const colorOf = (line: number) => (paint.decorations.find((d) => d.range.start.line === line)?.renderOptions?.before?.color as vscode.ThemeColor | undefined)?.id;
        assert.strictEqual(colorOf(2), 'editorError.foreground');
        assert.notStrictEqual(colorOf(3), 'editorError.foreground');
      });
    });
  });

  describe('Test the redraws no event may start', () => {
    let collection: vscode.DiagnosticCollection | undefined;
    afterEach(async () => {
      collection?.dispose();
      collection = undefined;
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    // Another extension's or the editor's own setting changing, which happens
    // whenever any setting is touched: nothing this extension draws depends on it.
    it('Must not redraw for a setting outside the extension and reduced motion', async () => {
      await openEditor(10);
      const redrawn = await withSetting('files', 'trimTrailingWhitespace', undefined, (set) => documentsRedrawnBy(() => set(true)));
      assert.strictEqual(redrawn.size, 0);
    });

    // A file being changed in the background, such as by a refactoring across
    // files, while it is in no editor.
    it('Must not redraw for an edit to a document no editor shows', async () => {
      await openEditor(10);
      const hidden = await openDocument(10);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(hidden.uri, new vscode.Position(3, 0), '!');
      const redrawn = await documentsRedrawnBy(() => vscode.workspace.applyEdit(edit));
      assert.strictEqual(redrawn.size, 0);
    });

    // A language server reporting on a file whose tab is in the background.
    it('Must not redraw for diagnostics of a document whose editor is hidden', async () => {
      const hidden = await openEditor(10);
      await openEditor(10);
      collection = vscode.languages.createDiagnosticCollection('lineNumberDecoQuietTest');
      const redrawn = await documentsRedrawnBy(() => {
        collection!.set(hidden.document.uri, [new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'marked', vscode.DiagnosticSeverity.Error)]);
      });
      assert.strictEqual(redrawn.size, 0);
    });

    // Two files side by side: moving the cursor in one leaves the other's
    // labels as they are.
    it('Must redraw only the editor whose cursor moved', async () => {
      const left = await openEditor(10);
      const right = await openEditor(10, vscode.ViewColumn.Two, true);
      const redrawn = await documentsRedrawnBy(() => {
        left.selection = new vscode.Selection(5, 0, 5, 0);
      });
      assert.ok(redrawn.has(left.document), 'the editor whose cursor moved was not redrawn');
      assert.ok(!redrawn.has(right.document), 'the editor beside it was redrawn');
    });

    // Two files side by side: scrolling one leaves the other as it is.
    it('Must redraw only the editor that scrolled', async () => {
      const left = await openEditor(500);
      const right = await openEditor(500, vscode.ViewColumn.Two, true);
      const redrawn = await documentsRedrawnBy(() => {
        left.revealRange(new vscode.Range(400, 0, 400, 0), vscode.TextEditorRevealType.AtTop);
      });
      assert.ok(redrawn.has(left.document), 'the editor that scrolled was not redrawn');
      assert.ok(!redrawn.has(right.document), 'the editor beside it was redrawn');
    });

    // Two files side by side: an error in one leaves the other as it is.
    it('Must redraw only the editor whose diagnostics changed', async () => {
      const left = await openEditor(10);
      const right = await openEditor(10, vscode.ViewColumn.Two, true);
      collection = vscode.languages.createDiagnosticCollection('lineNumberDecoQuietTest');
      const redrawn = await documentsRedrawnBy(() => {
        collection!.set(left.document.uri, [new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'marked', vscode.DiagnosticSeverity.Error)]);
      });
      assert.ok(redrawn.has(left.document), 'the editor whose diagnostics changed was not redrawn');
      assert.ok(!redrawn.has(right.document), 'the editor beside it was redrawn');
    });
  });

  describe('Test the redraws of a held key, a fold and reduced motion', () => {
    let collection: vscode.DiagnosticCollection | undefined;
    afterEach(async () => {
      collection?.dispose();
      collection = undefined;
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    /** The opacity a redraw gives the line, or undefined when it is drawn solid. */
    const opacityOf = (paint: Paint, line: number) =>
      /opacity: ([\d.]+)/.exec(String(paint.decorations.find((d) => d.range.start.line === line)?.renderOptions?.before?.textDecoration))?.[1];

    /** Run the body on an editor with an error on line 2, with the pulse on and reduced motion as given. */
    async function withPulsingError(reduceMotion: string, body: (editor: vscode.TextEditor, setReduceMotion: (value: unknown) => Thenable<void>) => Promise<void>): Promise<void> {
      await withSetting('LineNumberDeco', 'enableDiagnostics', true, () =>
        withSetting('LineNumberDeco', 'pulseDiagnostics', true, () =>
          withSetting('workbench', 'reduceMotion', reduceMotion, async (setReduceMotion) => {
            const editor = await openEditor(10);
            collection = vscode.languages.createDiagnosticCollection('lineNumberDecoMotionTest');
            collection.set(editor.document.uri, [new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'marked', vscode.DiagnosticSeverity.Error)]);
            await body(editor, setReduceMotion);
          })));
    }

    /** Fold the block that starts at the line, failing if the view has not split within WAIT_MS. */
    async function foldBlockAt(editor: vscode.TextEditor, line: number): Promise<void> {
      await vscode.commands.executeCommand('editor.fold', { selectionLines: [line], levels: 1 });
      const deadline = Date.now() + WAIT_MS;
      while (editor.visibleRanges.length < 2 && Date.now() < deadline) {
        await sleep(50);
      }
      assert.strictEqual(editor.visibleRanges.length, 2, 'the block did not fold');
    }

    /** The redraws of the editor over one second, room for ten frames of the pulse. */
    async function redrawsOverASecond(editor: vscode.TextEditor): Promise<Paint[]> {
      await afterSettling(() => undefined);
      await sleep(1000);
      return paints.filter((p) => p.editor === editor);
    }

    // Holding Enter in a long file: key repeat outpaces the 16 ms throttle, so
    // the keypresses are drawn together, and the last redraw must be of the
    // file after the last one. The fifth keypress takes 999 lines to 1000,
    // so only a redraw after it has the wider column. The lines go in away
    // from the cursor and the last visible line, so only the edits start redraws.
    it('Must end a burst of edits with a redraw of the editor as the last edit left it', async () => {
      const editor = await openEditor(995);
      await afterSettling(async () => {
        for (let i = 0; i < 5; i++) {
          await editor.edit((edit) => edit.insert(new vscode.Position(3, 0), '\n'));
        }
      });
      await sleep(QUIET_MS);
      const own = paints.filter((p) => p.editor === editor);
      assert.ok(own.length > 0, 'the edits did not redraw the editor');
      assert.strictEqual(editor.document.lineCount, 1000);
      assertDrawnFor(own[own.length - 1], editor);
    });

    // Folding a block from the gutter: the lines below it move up the screen
    // while their document lines stay the same. The numbers count document
    // lines, since vscode-neovim opens a fold that j or k crosses. The fold
    // command does nothing while the window lacks the focus of the desktop,
    // so a run on a desktop someone is using skips it. The Linux and Windows
    // CI runners give the window focus and must not skip it. The macOS runner
    // skips it too: its window had no focus in a CI run on 2026-11-22.
    it('Must redraw an editor when a block folds, drawing only the lines left in view, labelled by document line', async function () {
      if (!vscode.window.state.focused) {
        const runnerGivesFocus = !!process.env.CI && process.platform !== 'darwin';
        assert.ok(!runnerGivesFocus, 'the test window has no focus on a Linux or Windows CI runner, so the block cannot be folded');
        this.skip();
      }
      const lines = [...Array(10).fill('x'), 'block', ...Array(10).fill('  inner'), ...Array(39).fill('x')];
      const editor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ content: lines.join('\n') }));
      const paint = await redrawOf(editor, () => foldBlockAt(editor, 10), 'a fold');
      assertDrawnFor(paint, editor);
      const folded = paint.decorations.filter((d) => d.range.start.line >= 12 && d.range.start.line <= 20);
      assert.deepStrictEqual(folded, [], 'a line hidden in the fold was drawn');
      assert.strictEqual(paint.decorations.find((d) => d.range.start.line === 25)?.renderOptions?.before?.contentText, '25');
    });

    // Turning on reduced motion while an error line pulses, as someone made
    // uneasy by motion would: the pulse must stop at once, leaving the line solid.
    it('Must stop the pulse when reduced motion is turned on, drawing the error line solid', async () => {
      await withPulsingError('off', async (editor, setReduceMotion) => {
        const pulsing = await redrawsOverASecond(editor);
        assert.ok(pulsing.length >= 5, `the error line did not pulse: ${pulsing.length} redraws in a second`);
        assert.ok(pulsing.some((p) => opacityOf(p, 2) !== undefined), 'the error line was never dimmed');
        const paint = await redrawOf(editor, () => setReduceMotion('on'), 'turning reduced motion on');
        assertDrawnFor(paint, editor);
        assert.strictEqual(opacityOf(paint, 2), undefined, 'the error line is still drawn dimmed');
        const redrawn = await documentsRedrawnBy(() => undefined);
        assert.strictEqual(redrawn.size, 0, 'the pulse went on');
      });
    });

    // Turning reduced motion off again: the pulse comes back without the cursor
    // moving, and only on the error line.
    it('Must resume the pulse when reduced motion is turned off, dimming only the error line', async () => {
      await withPulsingError('on', async (editor, setReduceMotion) => {
        const still = await documentsRedrawnBy(() => undefined);
        assert.strictEqual(still.size, 0, 'the error line pulsed under reduced motion');
        await setReduceMotion('off');
        const pulsing = await redrawsOverASecond(editor);
        assert.ok(pulsing.length >= 5, `the pulse did not resume: ${pulsing.length} redraws in a second`);
        assert.ok(pulsing.some((p) => opacityOf(p, 2) !== undefined), 'the error line was never dimmed');
        assert.ok(pulsing.every((p) => opacityOf(p, 3) === undefined), 'a line without an error was dimmed');
      });
    });
  });
});
