import * as assert from 'assert';
import { describe, it } from 'mocha';
import { savedSwatchFill, savedSwatchLabel } from '../savedSwatch';

describe('Test the fill of the saved-color swatch', () => {
  it('Must fill with a saved opaque hex as written', () => {
    assert.strictEqual(savedSwatchFill('#123abc', '--vscode-x'), '#123abc');
  });

  it('Must keep the alpha of a saved #rrggbbaa', () => {
    assert.strictEqual(savedSwatchFill('#123abc80'), '#123abc80');
  });

  it('Must fill with a saved css color name as written', () => {
    assert.strictEqual(savedSwatchFill('red'), 'red');
  });

  it('Must fill an empty setting with the theme color it falls back to', () => {
    assert.strictEqual(
      savedSwatchFill('', '--vscode-LineNumberDeco-foreground'),
      'var(--vscode-LineNumberDeco-foreground)'
    );
  });

  it('Must leave an empty setting without a theme color transparent', () => {
    assert.strictEqual(savedSwatchFill(''), 'transparent');
  });
});

describe('Test the words the saved-color swatch is read out as', () => {
  it('Must name a saved value', () => {
    assert.strictEqual(savedSwatchLabel('#123abc80', '--vscode-x'), 'Saved: #123abc80');
  });

  it('Must name the theme color behind an empty setting', () => {
    assert.strictEqual(savedSwatchLabel('', '--vscode-x'), 'Saved: theme color');
  });

  it('Must say an empty setting without a theme color is not set', () => {
    assert.strictEqual(savedSwatchLabel(''), 'Saved: not set');
  });
});
