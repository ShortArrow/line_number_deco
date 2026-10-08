import * as assert from 'assert';
import { beforeEach, describe, it } from 'mocha';
import { PanelMessageDeps, handlePanelMessage } from '../panel';
import {
  PendingPreview,
  clearAllPreviews,
  getPendingPreviews,
  getPreviewColor,
  getPreviewToggle,
  setPreviewColor,
  setPreviewToggle,
} from '../preview';

const colorKeys = ['centerColorOfRainbow', 'foreground'];
const toggleKeys = ['enableRainbow'];
const selectKeys = ['editor.lineNumbers'];
const selectValues = ['on', 'off', 'relative', 'interval'];

interface SaveCall {
  key: string;
  value: string | boolean;
  scope: string;
}

/** Deps that record every effect instead of performing one. */
function recordingDeps() {
  const saves: SaveCall[] = [];
  const counts = { refresh: 0, postState: 0 };
  const errors: string[] = [];
  const deps: PanelMessageDeps = {
    isColorKey: (key) => colorKeys.includes(key),
    isToggleKey: (key) => toggleKeys.includes(key),
    isSelectKey: (key) => selectKeys.includes(key),
    isValidSelectValue: (key, value) =>
      selectKeys.includes(key) && selectValues.includes(value),
    save: async (key, value, scope) => {
      saves.push({ key, value, scope });
    },
    refresh: () => {
      counts.refresh += 1;
    },
    postState: () => {
      counts.postState += 1;
    },
    showError: (message) => {
      errors.push(message);
    },
    saving: new Set<string>(),
  };
  return { deps, saves, counts, errors };
}

const byKey = (calls: SaveCall[]) =>
  [...calls].sort((a, b) => a.key.localeCompare(b.key));

describe('Test panel message handling', () => {
  beforeEach(() => {
    clearAllPreviews();
  });

  it('Must become a pending preview without saving anything', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage(
      { type: 'preview', key: 'centerColorOfRainbow', value: '#123456' },
      deps
    );
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), '#123456');
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 1);
  });

  it('Must save the applied color once and clear that row', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('centerColorOfRainbow', '#123456');
    await handlePanelMessage(
      {
        type: 'apply',
        key: 'centerColorOfRainbow',
        value: '#123456',
        scope: 'user',
      },
      deps
    );
    assert.deepStrictEqual(saves, [
      { key: 'centerColorOfRainbow', value: '#123456', scope: 'user' },
    ]);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
  });

  it('Must save every pending preview to the user scope on apply all', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewToggle('enableRainbow', true);
    await handlePanelMessage({ type: 'applyAll', scope: 'user' }, deps);
    assert.deepStrictEqual(byKey(saves), [
      { key: 'centerColorOfRainbow', value: '#123456', scope: 'user' },
      { key: 'enableRainbow', value: true, scope: 'user' },
    ]);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
    assert.strictEqual(getPreviewToggle('enableRainbow'), undefined);
  });

  it('Must save every pending preview to the workspace scope on apply all', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewToggle('enableRainbow', true);
    await handlePanelMessage({ type: 'applyAll', scope: 'workspace' }, deps);
    assert.deepStrictEqual(byKey(saves), [
      { key: 'centerColorOfRainbow', value: '#123456', scope: 'workspace' },
      { key: 'enableRainbow', value: true, scope: 'workspace' },
    ]);
  });

  it('Must reset only the named row, leaving the other preview standing', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewColor('foreground', '#654321');
    await handlePanelMessage(
      { type: 'resetRow', key: 'centerColorOfRainbow' },
      deps
    );
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
    assert.strictEqual(getPreviewColor('foreground'), '#654321');
    assert.deepStrictEqual(saves, []);
  });

  it('Must reset every pending preview without saving anything', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewColor('foreground', '#654321');
    setPreviewToggle('enableRainbow', true);
    await handlePanelMessage({ type: 'resetAll' }, deps);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
    assert.strictEqual(getPreviewColor('foreground'), undefined);
    assert.strictEqual(getPreviewToggle('enableRainbow'), undefined);
    assert.deepStrictEqual(saves, []);
  });

  it('Must answer a ready message with the state and nothing else', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage({ type: 'ready' }, deps);
    assert.strictEqual(counts.postState, 1);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
  });

  it('Must ignore a preview of a key the panel does not offer', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage(
      { type: 'preview', key: 'evil', value: '#000000' },
      deps
    );
    assert.strictEqual(getPreviewColor('evil'), undefined);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
    assert.strictEqual(counts.postState, 0);
  });

  it('Must ignore a malformed message without throwing', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage({ type: 'toggle-ish garbage' }, deps);
    await handlePanelMessage(undefined, deps);
    await handlePanelMessage('not an object', deps);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
    assert.strictEqual(counts.postState, 0);
  });

  it('Must stage a select without saving or repainting anything', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage(
      { type: 'preview', key: 'editor.lineNumbers', value: 'relative' },
      deps
    );
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), 'relative');
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
    assert.strictEqual(counts.postState, 1);
  });

  it('Must have the staged select pending while that state is posted', async () => {
    const staged: PendingPreview[][] = [];
    const { deps } = recordingDeps();
    await handlePanelMessage(
      { type: 'preview', key: 'editor.lineNumbers', value: 'relative' },
      { ...deps, postState: () => staged.push(getPendingPreviews()) }
    );
    assert.deepStrictEqual(staged, [
      [{ key: 'editor.lineNumbers', value: 'relative' }],
    ]);
  });

  it('Must ignore a select value the setting does not offer', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage(
      { type: 'preview', key: 'editor.lineNumbers', value: 'sideways' },
      deps
    );
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
    assert.strictEqual(counts.postState, 0);
  });

  it('Must save an applied select once and clear that row', async () => {
    const { deps, saves, counts } = recordingDeps();
    setPreviewColor('editor.lineNumbers', 'relative');
    await handlePanelMessage(
      { type: 'apply', key: 'editor.lineNumbers', scope: 'user' },
      deps
    );
    assert.deepStrictEqual(saves, [
      { key: 'editor.lineNumbers', value: 'relative', scope: 'user' },
    ]);
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
    assert.strictEqual(counts.refresh, 0);
  });

  it('Must write nothing for an Apply of a row that is not staged', async () => {
    const { deps, saves, counts } = recordingDeps();
    await handlePanelMessage(
      { type: 'apply', key: 'editor.lineNumbers', scope: 'user' },
      deps
    );
    await handlePanelMessage(
      { type: 'applyToggle', key: 'enableRainbow', scope: 'user' },
      deps
    );
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.postState, 2);
  });

  it('Must write the staged value, not the one an Apply message names', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('foreground', '#123456');
    await handlePanelMessage(
      { type: 'apply', key: 'foreground', value: '#000000', scope: 'user' },
      deps
    );
    assert.deepStrictEqual(saves, [{ key: 'foreground', value: '#123456', scope: 'user' }]);
  });

  it('Must leave a row staged and name it in an error when its save fails', async () => {
    const { deps, errors, counts } = recordingDeps();
    setPreviewToggle('enableRainbow', true);
    await handlePanelMessage(
      { type: 'applyToggle', key: 'enableRainbow', scope: 'workspace' },
      { ...deps, save: async () => { throw new Error('no folder'); } }
    );
    assert.strictEqual(getPreviewToggle('enableRainbow'), true);
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('enableRainbow') && errors[0].includes('no folder'), errors[0]);
    assert.strictEqual(counts.postState, 1);
  });

  it('Must write nothing for a row whose save is already in flight', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('foreground', '#123456');
    deps.saving.add('foreground');
    await handlePanelMessage({ type: 'apply', key: 'foreground', scope: 'user' }, deps);
    await handlePanelMessage({ type: 'applyAll', scope: 'user' }, deps);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(getPreviewColor('foreground'), '#123456');
  });

  it('Must save a pending select along with the colors on apply all', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('editor.lineNumbers', 'interval');
    setPreviewColor('centerColorOfRainbow', '#123456');
    await handlePanelMessage({ type: 'applyAll', scope: 'workspace' }, deps);
    assert.strictEqual(saves.length, 2);
    assert.deepStrictEqual(byKey(saves), [
      { key: 'centerColorOfRainbow', value: '#123456', scope: 'workspace' },
      { key: 'editor.lineNumbers', value: 'interval', scope: 'workspace' },
    ]);
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
  });

  it('Must discard a staged switch on a reset of its row without saving', async () => {
    const { deps, saves, counts } = recordingDeps();
    setPreviewToggle('enableRainbow', true);
    setPreviewColor('centerColorOfRainbow', '#123456');
    await handlePanelMessage({ type: 'resetRow', key: 'enableRainbow' }, deps);
    assert.strictEqual(getPreviewToggle('enableRainbow'), undefined);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), '#123456');
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 1);
    assert.strictEqual(counts.postState, 1);
  });

  it('Must ignore a reset of a key the panel does not offer', async () => {
    const { deps, saves, counts } = recordingDeps();
    setPreviewToggle('evil', true);
    await handlePanelMessage({ type: 'resetRow', key: 'evil' }, deps);
    assert.strictEqual(getPreviewToggle('evil'), true);
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(counts.refresh, 0);
    assert.strictEqual(counts.postState, 0);
  });

  it('Must reset only the select row, leaving the other preview standing', async () => {
    const { deps, saves } = recordingDeps();
    setPreviewColor('editor.lineNumbers', 'interval');
    setPreviewColor('centerColorOfRainbow', '#123456');
    await handlePanelMessage({ type: 'resetRow', key: 'editor.lineNumbers' }, deps);
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), '#123456');
    assert.deepStrictEqual(saves, []);
  });
});
