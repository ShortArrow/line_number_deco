import * as assert from 'assert';
import { colorCodeFromHsl } from '../colors';

suite('Test make color code from hsl value', () => {
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
		test(`Must become ${JSON.stringify(input)} to ${expected}`, () => {
			assert.strictEqual(colorCodeFromHsl(input.h,input.s,input.l), expected);
		});
    });	
});
   