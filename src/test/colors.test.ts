import * as assert from 'assert';
import { describe,it } from 'mocha';
import { colorCodeFromHsl, shiftHue } from '../colors';

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
   