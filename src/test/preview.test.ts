import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
  setPreviewColor,
  clearPreviewColor,
  clearAllPreviews,
  getPreviewColor,
  setPreviewToggle,
  getPreviewToggle,
  getPendingPreviews,
} from '../preview';
import {
  getColorAtCenterOfRainbow,
  getActiveLineNumberColor,
  getEnableRainbow,
} from '../config';

describe('Test preview color overrides', () => {
  it('Must become an unset key to undefined', () => {
    clearAllPreviews();
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
  });

  it('Must become a set key to the previewed value', () => {
    clearAllPreviews();
    setPreviewColor('centerColorOfRainbow', '#123456');
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), '#123456');
  });

  it('Must clear one key and keep the others', () => {
    clearAllPreviews();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewColor('foreground', '#abcdef');
    clearPreviewColor('centerColorOfRainbow');
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
    assert.strictEqual(getPreviewColor('foreground'), '#abcdef');
  });

  it('Must clear every key at once', () => {
    clearAllPreviews();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewColor('foreground', '#abcdef');
    clearAllPreviews();
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), undefined);
    assert.strictEqual(getPreviewColor('foreground'), undefined);
  });

  it('Must become the latest value when a key is set twice', () => {
    clearAllPreviews();
    setPreviewColor('centerColorOfRainbow', '#123456');
    setPreviewColor('centerColorOfRainbow', '#654321');
    assert.strictEqual(getPreviewColor('centerColorOfRainbow'), '#654321');
  });
});

describe('Test config getters read previews first', () => {
  it('Must become the previewed rainbow center, then the configured value again', () => {
    clearAllPreviews();
    const before = getColorAtCenterOfRainbow();
    setPreviewColor('centerColorOfRainbow', '#0fa1b2');
    assert.strictEqual(getColorAtCenterOfRainbow(), '#0fa1b2');
    clearAllPreviews();
    assert.strictEqual(getColorAtCenterOfRainbow(), before);
  });

  it('Must become the previewed active line color as a raw string', () => {
    clearAllPreviews();
    const before = getActiveLineNumberColor();
    setPreviewColor('activeForeground', '#0fa1b2');
    assert.strictEqual(getActiveLineNumberColor(), '#0fa1b2');
    clearAllPreviews();
    assert.deepStrictEqual(getActiveLineNumberColor(), before);
  });
});

describe('Test preview toggle overrides', () => {
  it('Must become an unset toggle to undefined', () => {
    clearAllPreviews();
    assert.strictEqual(getPreviewToggle('enableRainbow'), undefined);
  });

  it('Must keep false apart from an unset toggle', () => {
    clearAllPreviews();
    setPreviewToggle('enableRainbow', true);
    assert.strictEqual(getPreviewToggle('enableRainbow'), true);
    setPreviewToggle('enableRainbow', false);
    assert.strictEqual(getPreviewToggle('enableRainbow'), false);
  });

  it('Must clear a previewed toggle with every other preview', () => {
    clearAllPreviews();
    setPreviewToggle('enableRainbow', false);
    clearAllPreviews();
    assert.strictEqual(getPreviewToggle('enableRainbow'), undefined);
  });

  it('Must enumerate every pending preview, colors and toggles alike', () => {
    clearAllPreviews();
    assert.deepStrictEqual(getPendingPreviews(), []);
    setPreviewColor('foreground', '#111111');
    setPreviewToggle('enableRainbow', true);
    const pending = getPendingPreviews().sort((a, b) => a.key.localeCompare(b.key));
    assert.deepStrictEqual(pending, [
      { key: 'enableRainbow', value: true },
      { key: 'foreground', value: '#111111' },
    ]);
  });
});

describe('Test enable getters read previews first', () => {
  it('Must become the previewed rainbow switch, then the configured value again', () => {
    clearAllPreviews();
    const before = getEnableRainbow();
    assert.strictEqual(before, false);
    setPreviewToggle('enableRainbow', true);
    assert.strictEqual(getEnableRainbow(), true);
    clearAllPreviews();
    assert.strictEqual(getEnableRainbow(), before);
  });
});
