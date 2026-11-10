import * as assert from 'assert';
import { afterEach, describe, it } from 'mocha';
import * as vscode from 'vscode';
import { nameOfExtension } from '../config';
import { clearAllPreviews, setPreviewColor } from '../preview';
import { PromptIo, promptForColor } from '../ui';

/** A reader who answers the box with a fixed reply, remembering what was asked and told. */
function answering(reply: string | undefined) {
  const asked: vscode.InputBoxOptions[] = [];
  const told: string[] = [];
  const io: PromptIo = {
    ask: async (options) => {
      asked.push(options);
      return reply;
    },
    tell: (message) => {
      told.push(message);
    },
  };
  return { io, asked, told };
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
    await promptForColor('errorForeground', 'error lines', 'user', box.io);
    assert.strictEqual(box.asked.length, 1);
    assert.strictEqual(box.asked[0].prompt, 'Please input color code at error lines');
    assert.strictEqual(box.asked[0].placeHolder, '#aa0000');
  });

  it('Must show the default when no color is saved, not one staged in the panel', async () => {
    setPreviewColor('centerColorOfRainbow', '#123456');
    const box = answering(undefined);
    await promptForColor('centerColorOfRainbow', 'center of rainbow', 'user', box.io);
    assert.strictEqual(box.asked[0].placeHolder, '#0000ff');
  });

  it('Must have written the entered color to the scope by the time it finishes', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering('#00bb00').io);
    assert.strictEqual(userValueOf('errorForeground'), '#00bb00');
  });

  it('Must write nothing when the box is dismissed', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering(undefined).io);
    assert.strictEqual(userValueOf('errorForeground'), undefined);
  });

  it('Must write nothing when nothing is entered', async () => {
    await promptForColor('errorForeground', 'error lines', 'user', answering('').io);
    assert.strictEqual(userValueOf('errorForeground'), undefined);
  });

  it('Must neither write nor announce a color the scope already holds', async () => {
    await saveForUser('errorForeground', '#aa0000');
    const box = answering('#aa0000');
    await promptForColor('errorForeground', 'error lines', 'user', box.io);
    assert.deepStrictEqual(box.told, []);
  });

  it('Must announce a color once it is written', async () => {
    const box = answering('#00bb00');
    await promptForColor('errorForeground', 'error lines', 'user', box.io);
    assert.deepStrictEqual(box.told, ['Color is updated by, #00bb00!']);
  });
});
