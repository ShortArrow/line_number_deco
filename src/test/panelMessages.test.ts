import * as assert from 'assert';
import { beforeEach, describe, it } from 'mocha';
import { PanelMessageDeps, handlePanelMessage } from '../panel';
import {
  clearAllPreviews,
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
  };
  return { deps, saves, counts };
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
      { type: 'apply', key: 'editor.lineNumbers', value: 'off', scope: 'user' },
      deps
    );
    assert.deepStrictEqual(saves, [
      { key: 'editor.lineNumbers', value: 'off', scope: 'user' },
    ]);
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
    assert.strictEqual(counts.refresh, 0);
  });

  it('Must refuse to apply a select value the setting does not offer', async () => {
    const { deps, saves } = recordingDeps();
    await handlePanelMessage(
      { type: 'apply', key: 'editor.lineNumbers', value: 'diagonal', scope: 'user' },
      deps
    );
    assert.deepStrictEqual(saves, []);
    assert.strictEqual(getPreviewColor('editor.lineNumbers'), undefined);
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
