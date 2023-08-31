import * as assert from 'assert';
import { describe,it } from 'mocha';
import { isRepeatingDigits } from '../core';

describe('Test check repeating digits', () => {
    const testCases = [
        { input: 223, expected: false },
        { input: 222, expected: true },
        { input: 221, expected: false },
        { input: 112, expected: false },
        { input: 111, expected: true },
        { input: 100, expected: false },
        { input: 99, expected: true },
        { input: 98, expected: false },
        { input: 34, expected: false },
        { input: 33, expected: true },
        { input: 32, expected: false },
        { input: 23, expected: false },
        { input: 22, expected: true },
        { input: 21, expected: false },
        { input: 12, expected: false },
        { input: 11, expected: true },
        { input: 10, expected: false },
        { input: 1, expected: false },
        { input: 0, expected: false },
    ];
    testCases.forEach(({ input, expected }) => {
		it(`Must become ${input} to ${expected}`, () => {
			assert.equal(isRepeatingDigits(String(input)), expected);
		});
    });	
});
