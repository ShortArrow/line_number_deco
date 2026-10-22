import * as assert from 'assert';
import { describe,it } from 'mocha';
import { colorCodeFromHsl, contrastRatio, hslFromRgb, relativeLuminance, rgbFromColorCode, shiftHue, withMinimumContrast } from '../colors';

describe('Test make color code from hsl value', () => {
    const testCases = [
        { input: { h: 0, s: 1, l: 0.5 }, expected: "#ff0000" },
        { input: { h: 60, s: 1, l: 0.5 }, expected: "#ffff00" },
        { input: { h: 120, s: 1, l: 0.5 }, expected: "#00ff00" },
        { input: { h: 180, s: 1, l: 0.5 }, expected: "#00ffff" },
        { input: { h: 240, s: 1, l: 0.5 }, expected: "#0000ff" },
        { input: { h: 300, s: 1, l: 0.5 }, expected: "#ff00ff" },
        { input: { h: 360, s: 1, l: 0.5 }, expected: "#ff0000" },
        { input: { h: 0, s: 0, l: 1 }, expected: "#ffffff" },
        { input: { h: 0, s: 0, l: 0 }, expected: "#000000" },
        { input: { h: 0, s: 0, l: 0.5 }, expected: "#808080" },
		{ input: { h: 1, s: 1, l: 1 }, expected: "#ffffff" },
    ];
    testCases.forEach(({ input, expected }) => {
		it(`Must become ${JSON.stringify(input)} to ${expected}`, () => {
			assert.strictEqual(colorCodeFromHsl(input.h,input.s,input.l), expected);
		});
    });	
});

describe('Test make color code from hsl value with shift', () => {
  [
    { input: {color: '#ff0000', row: -4},actual: '#8000ff'},
    { input: {color: '#ff0000', row: -3},actual: '#df00ff'},
    { input: {color: '#ff0000', row: -2},actual: '#ff00bf'},
    { input: {color: '#ff0000', row: -1},actual: '#ff0060'},
    { input: {color: '#ff0000', row: 0},actual: '#ff0000'},
    { input: {color: '#ff0000', row: 1},actual: '#ff6000'},
    { input: {color: '#ff0000', row: 2},actual: '#ffbf00'},
    { input: {color: '#ff0000', row: 3},actual: '#dfff00'},
    { input: {color: '#ff0000', row: 4},actual: '#80ff00'},
    { input: {color: '#ff0000', row: 5},actual: '#20ff00'},
    { input: {color: '#ff0000', row: 6},actual: '#00ff40'},
    { input: {color: '#ff0000', row: 7},actual: '#00ff9f'},
    { input: {color: '#ff0000', row: 8},actual: '#00ffff'},
    { input: {color: '#ff0000', row: 9},actual: '#009fff'},
    { input: {color: '#ff0000', row: 10},actual: '#0040ff'},
    { input: {color: '#ff0000', row: 11},actual: '#2000ff'},
  ].forEach(({ input, actual }) => {
    it(`Must become ${JSON.stringify(input)} to ${actual}`, () => {
        assert.equal(shiftHue(input.color, input.row), actual);
    });
  });
});
   
describe('Test keep a color readable against a background', () => {
  const hueOf = (color: string) => hslFromRgb(...(rgbFromColorCode(color) as [number, number, number]))[0];

  it('Must leave a color that already reaches the ratio untouched', () => {
    assert.strictEqual(withMinimumContrast('#0000ff', '#ffffff', 4.5), '#0000ff');
  });

  it('Must darken yellow on white just enough, keeping its hue', () => {
    const adjusted = withMinimumContrast('#ffff00', '#ffffff', 4.5);
    const ratio = contrastRatio(adjusted, '#ffffff');
    assert.ok(ratio >= 4.5 && ratio < 4.8, `${adjusted} is ${ratio.toFixed(2)}:1`);
    assert.ok(Math.abs(hueOf(adjusted) - 60) < 2, `${adjusted} has hue ${hueOf(adjusted)}`);
  });

  it('Must lighten blue on a dark background rather than darken it', () => {
    const adjusted = withMinimumContrast('#0000ff', '#1e1e1e', 4.5);
    assert.ok(contrastRatio(adjusted, '#1e1e1e') >= 4.5, `${adjusted}`);
    assert.ok(relativeLuminance(adjusted) > relativeLuminance('#0000ff'), `${adjusted} is not lighter`);
  });

  for (const background of ['#ffffff', '#1e1e1e', '#000000']) {
    it(`Must bring every step of the default rainbow to 4.5:1 on ${background}`, () => {
      for (let step = 0; step < 16; step++) {
        const adjusted = withMinimumContrast(shiftHue('#0000ff', step), background, 4.5);
        const ratio = contrastRatio(adjusted, background);
        assert.ok(ratio >= 4.5, `step ${step}: ${adjusted} is ${ratio.toFixed(2)}:1`);
      }
    });
  }
});
