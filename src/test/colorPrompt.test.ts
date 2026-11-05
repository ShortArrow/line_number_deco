import * as assert from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as vscode from 'vscode';
import { nameOfExtension } from '../config';
import { clearAllPreviews, setPreviewColor } from '../preview';
import { promptForColor } from '../ui';

/** An input box that answers with a fixed reply and remembers what it was asked. */
function answering(reply: string | undefined) {
  const asked: vscode.InputBoxOptions[] = [];
  const ask = async (options: vscode.InputBoxOptions) => {
    asked.push(options);
    return reply;
  };
  return { ask, asked };
}

function userValueOf(setting: string): unknown {
  return vscode.workspace.getConfiguration(nameOfExtension).inspect(setting)?.globalValue;
}

async function saveForUser(setting: string, value: string | undefined) {
  await vscode.workspace
    .getConfiguration(nameOfExtension)
    .update(setting, value, vscode.ConfigurationTarget.Global);
}

describe('Test color prompt', () => {
  afterEach(async () => {
    clearAllPreviews();
    await saveForUser('errorForeground', undefined);
    await saveForUser('centerColorOfRainbow', undefined);
  });

  it('Must name what the color paints and show the saved color', async () => {
    await saveForUser('errorForeground', '#aa0000');
    const box = answering(undefined);
    await promptForColor('errorForeground', 'error lines', 'user', box.ask);
    assert.strictEqual(box.asked.length, 1);
    assert.strictEqual(box.asked[0].prompt, 'Please input color code at error lines');
    assert.strictEqual(box.asked[0].placeHolder, '#aa0000');
  });

  it('Must show the default when no color is saved, not one staged in the panel', async () => {
    setPreviewColor('centerColorOfRainbow', '#123456');
    const box = answering(undefined);
    await promptForColor('centerColorOfRainbow', 'center of rainbow', 'user', box.ask);
    assert.strictEqual(box.asked[0].placeHolder, '#0000ff');
  });

  it('Must have written the entered color to the scope by the time it finishes', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering('#00bb00').ask);
    assert.strictEqual(userValueOf('errorForeground'), '#00bb00');
  });

  it('Must write nothing when the box is dismissed', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering(undefined).ask);
    assert.strictEqual(userValueOf('errorForeground'), undefined);
  });

  it('Must write nothing when nothing is entered', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering('').ask);
    assert.strictEqual(userValueOf('errorForeground'), undefined);
  });
});
