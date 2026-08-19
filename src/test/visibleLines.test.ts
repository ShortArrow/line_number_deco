import * as assert from 'assert';
import { describe, it } from 'mocha';
import { visibleLineIndexes } from '../visibleLines';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, offset) => from + offset);

describe('Test visible line indexes', () => {
  [
    {
      name: 'single range at top',
      input: { ranges: [{ startLine: 0, endLine: 10 }], lineCount: 100 },
      expected: range(0, 11),
    },
    {
      name: 'single range mid-file',
      input: { ranges: [{ startLine: 5, endLine: 10 }], lineCount: 100 },
      expected: range(5, 11),
    },
    {
      name: 'clamped at EOF',
      input: { ranges: [{ startLine: 95, endLine: 99 }], lineCount: 100 },
      expected: range(95, 99),
    },
    {
      name: 'range ending exactly 2 before EOF',
      input: { ranges: [{ startLine: 0, endLine: 98 }], lineCount: 100 },
      expected: range(0, 99),
    },
    {
      name: 'folded: two disjoint ranges',
      input: {
        ranges: [{ startLine: 0, endLine: 3 }, { startLine: 20, endLine: 30 }],
        lineCount: 100,
      },
      expected: range(0, 4).concat(range(20, 31)),
    },
    {
      name: 'folded: three ranges',
      input: {
        ranges: [
          { startLine: 0, endLine: 0 },
          { startLine: 10, endLine: 10 },
          { startLine: 50, endLine: 60 },
        ],
        lineCount: 100,
      },
      expected: [0, 1].concat([10, 11]).concat(range(50, 61)),
    },
    {
      name: 'adjacent after padding merge without duplicates',
      input: {
        ranges: [{ startLine: 0, endLine: 10 }, { startLine: 12, endLine: 20 }],
        lineCount: 100,
      },
      expected: range(0, 21),
    },
    {
      name: 'overlapping ranges deduplicate',
      input: {
        ranges: [{ startLine: 0, endLine: 10 }, { startLine: 8, endLine: 15 }],
        lineCount: 100,
      },
      expected: range(0, 16),
    },
    {
      name: 'no ranges',
      input: { ranges: [], lineCount: 100 },
      expected: [],
    },
    {
      name: 'empty document',
      input: { ranges: [{ startLine: 0, endLine: 0 }], lineCount: 0 },
      expected: [],
    },
    {
      name: 'negative start is clamped to the first line',
      input: { ranges: [{ startLine: -2, endLine: 3 }], lineCount: 100 },
      expected: range(0, 4),
    },
  ].forEach(({ name, input, expected }) => {
    it(`Must become ${name} to ${JSON.stringify(expected)}`, () => {
      assert.deepStrictEqual(visibleLineIndexes(input.ranges, input.lineCount), expected);
    });
  });
});
