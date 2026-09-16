import * as assert from 'assert';
import { describe, it, afterEach } from 'mocha';
import * as vscode from 'vscode';

// core.ts reads the diagnostics of the open document straight from VS Code, so
// what has to be pinned inside the host is that API's contract: a collection
// this extension does not own still shows up in getDiagnostics for the uri.

let collection: vscode.DiagnosticCollection | undefined;

/** Poll a condition every 50 ms until it holds or the budget runs out. */
async function until(cond: () => boolean, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (!cond() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return cond();
}

const WAIT_MS = 5000;

describe('Test the diagnostics the decorations read', () => {
  afterEach(() => {
    collection?.dispose();
    collection = undefined;
  });

  it('Must report an error diagnostic for the document it was set on', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'one\ntwo\nthree\n',
    });
    await vscode.window.showTextDocument(document);
    collection = vscode.languages.createDiagnosticCollection('lineNumberDecoTest');
    const range = new vscode.Range(1, 0, 1, 3);
    collection.set(document.uri, [
      new vscode.Diagnostic(range, 'marked', vscode.DiagnosticSeverity.Error),
    ]);

    const found = () =>
      vscode.languages
        .getDiagnostics(document.uri)
        .some(
          (diagnostic) =>
            diagnostic.severity === vscode.DiagnosticSeverity.Error &&
            diagnostic.range.start.line === 1
        );
    assert.strictEqual(
      await until(found, WAIT_MS),
      true,
      'getDiagnostics does not report the error set on the document'
    );
  });
});
