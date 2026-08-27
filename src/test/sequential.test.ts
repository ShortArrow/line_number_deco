import * as assert from 'assert';
import { describe,it } from 'mocha';
import { isSequentialDigits } from '../core';

// A label is sequential when it has at least two digits and every adjacent pair
// steps by exactly +1 or exactly -1 in one uniform direction.
// 90 is false (9 -> 0 is not a step of 1, there is no wraparound).
// 121 is false (the direction flips).
describe('Test check sequential digits', () => {
    const testCases = [
        { input: 12, expected: true },
        { input: 123, expected: true },
        { input: 1234, expected: true },
        { input: 21, expected: true },
        { input: 543, expected: true },
        { input: 10, expected: true },
        { input: 98, expected: true },
        { input: 89, expected: true },
        { input: 210, expected: true },
        { input: 9876, expected: true },
        { input: 345, expected: true },
        { input: 32, expected: true },
        { input: 1, expected: false },
        { input: 0, expected: false },
        { input: 11, expected: false },
        { input: 13, expected: false },
        { input: 122, expected: false },
        { input: 132, expected: false },
        { input: 121, expected: false },
        { input: 100, expected: false },
        { input: 1210, expected: false },
        { input: 102, expected: false },
        { input: 90, expected: false },
        { input: 19, expected: false },
    ];
    testCases.forEach(({ input, expected }) => {
		it(`Must become ${input} to ${expected}`, () => {
			assert.equal(isSequentialDigits(String(input)), expected);
		});
    });	
});
