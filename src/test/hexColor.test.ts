import * as assert from 'assert';
import { describe, it } from 'mocha';
import { isHexColor, pickerColor } from '../hexColor';

describe('Test the hex field accepts what the native picker produces', () => {
  for (const value of ['#a1b2c3', '#A1B2C3', '#a1b2c3d4']) {
    it(`Must accept ${value}`, () => {
      assert.strictEqual(isHexColor(value), true);
    });
  }

  for (const value of ['#abc', 'a1b2c3', '#a1b2c3d', '', '#a1b2c3d4e5', '#g1b2c3']) {
    it(`Must reject ${JSON.stringify(value)}`, () => {
      assert.strictEqual(isHexColor(value), false);
    });
  }
});

describe('Test the value a native color input can hold', () => {
  it('Must pass an opaque hex through unchanged', () => {
    assert.strictEqual(pickerColor('#A1b2C3'), '#A1b2C3');
  });

  it('Must fall back to black for an empty value, an alpha hex or a css name', () => {
    assert.strictEqual(pickerColor(''), '#000000');
    assert.strictEqual(pickerColor('#a1b2c3d4'), '#a1b2c3');
    assert.strictEqual(pickerColor('red'), '#000000');
  });
});
