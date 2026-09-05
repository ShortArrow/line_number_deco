import * as assert from 'assert';
import { describe, it } from 'mocha';
import { displayToggle, displayValue } from '../panelState';

describe('Test panel display values', () => {
  it('Must show the saved value while nothing is pending', () => {
    assert.deepStrictEqual(displayValue('on', 'editor.lineNumbers', {}), {
      value: 'on',
      pending: false,
    });
  });

  it('Must show the pending value over the saved one', () => {
    assert.deepStrictEqual(
      displayValue('on', 'editor.lineNumbers', {
        'editor.lineNumbers': 'relative',
      }),
      { value: 'relative', pending: true }
    );
  });

  it('Must ignore a pending entry that is not a string', () => {
    assert.deepStrictEqual(displayValue('on', 'k', { k: true }), {
      value: 'on',
      pending: false,
    });
  });

  it('Must show a pending switch over its saved state', () => {
    assert.deepStrictEqual(displayToggle(false, 'enableRainbow', { enableRainbow: true }), {
      value: true,
      pending: true,
    });
    assert.deepStrictEqual(displayToggle(false, 'enableRainbow', {}), {
      value: false,
      pending: false,
    });
  });

  it('Must ignore a pending entry that is not a boolean', () => {
    assert.deepStrictEqual(displayToggle(true, 'k', { k: '#fff' }), {
      value: true,
      pending: false,
    });
  });

  it('Must leave a row alone while another key is pending', () => {
    assert.deepStrictEqual(displayValue('on', 'a', { b: 'off' }), {
      value: 'on',
      pending: false,
    });
  });
});
