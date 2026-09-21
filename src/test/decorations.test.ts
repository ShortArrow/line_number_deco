import * as assert from 'assert';
import { describe, it } from 'mocha';
import { shiftHue } from '../colors';
import {
  DecorationSettings,
  DiagnosticMark,
  LineColor,
  buildLineDecorationSpecs,
  markDiagnosticLines,
} from '../decorations';

const activeColor = '#aaaaaa';
const inactiveColor = '#bbbbbb';
const repeatingColor = '#cccccc';
const sequentialColor = '#dddddd';
const centerColor = '#0000ff';
const errorColor = '#eeeeee';
const warningColor = '#ffffff';

/** The settings every case starts from: one active line, every mode off. */
const settingsWith = (overrides: Partial<DecorationSettings> = {}): DecorationSettings => ({
  enableRelativeLine: true,
  activeLineNumber: 10,
  activeColor,
  inactiveColor,
  enableRainbow: false,
  centerColorOfRainbow: centerColor,
  enableRepeatingDigits: false,
  repeatingDigitsColor: repeatingColor,
  enableSequentialDigits: false,
  sequentialDigitsColor: sequentialColor,
  enableDiagnostics: false,
  errorColor,
  warningColor,
  ...overrides,
});

const colorsOf = (lineIndexes: number[], overrides: Partial<DecorationSettings>): LineColor[] =>
  buildLineDecorationSpecs(lineIndexes, settingsWith(overrides)).map((spec) => spec.color);

const marks = (entries: [number, DiagnosticMark][]): Map<number, DiagnosticMark> =>
  new Map(entries);

describe('Test build line decoration specs', () => {
  it('Must become nothing when relative lines are disabled', () => {
    const specs = buildLineDecorationSpecs(
      [0, 1, 2],
      settingsWith({
        enableRelativeLine: false,
        enableRainbow: true,
        enableRepeatingDigits: true,
        enableSequentialDigits: true,
      })
    );
    assert.deepStrictEqual(specs, []);
  });

  it('Must label the distance to the active line, and the active line itself absolutely', () => {
    const specs = buildLineDecorationSpecs([8, 9, 10, 11, 12], settingsWith());
    assert.deepStrictEqual(
      specs.map((spec) => spec.label),
      ['2', '1', '11', '1', '2']
    );
  });

  it('Must keep the active color on the active line whose own label repeats', () => {
    const [spec] = buildLineDecorationSpecs([10], settingsWith({ enableRepeatingDigits: true }));
    assert.strictEqual(spec.label, '11');
    assert.strictEqual(spec.color, activeColor);
  });

  it('Must color a repeating label with the repeating color', () => {
    const specs = buildLineDecorationSpecs(
      [11],
      settingsWith({ activeLineNumber: 0, enableRepeatingDigits: true })
    );
    assert.strictEqual(specs[0].label, '11');
    assert.strictEqual(specs[0].color, repeatingColor);
  });

  it('Must color a sequential label with the sequential color', () => {
    const specs = buildLineDecorationSpecs(
      [12],
      settingsWith({ activeLineNumber: 0, enableSequentialDigits: true })
    );
    assert.strictEqual(specs[0].label, '12');
    assert.strictEqual(specs[0].color, sequentialColor);
  });

  it('Must let repeating win over sequential and rainbow, and sequential over rainbow', () => {
    const everyMode = {
      activeLineNumber: 0,
      enableRepeatingDigits: true,
      enableSequentialDigits: true,
      enableRainbow: true,
    };
    assert.deepStrictEqual(colorsOf([11], everyMode), [repeatingColor]);
    assert.deepStrictEqual(colorsOf([12], everyMode), [sequentialColor]);
  });

  it('Must color a plain label from the rainbow when only the rainbow is on', () => {
    const specs = buildLineDecorationSpecs(
      [3],
      settingsWith({ activeLineNumber: 0, enableRainbow: true })
    );
    assert.strictEqual(specs[0].color, shiftHue(centerColor, 3));
  });

  it('Must fall back to the inactive color, passing a theme color through by identity', () => {
    assert.deepStrictEqual(colorsOf([3], { activeLineNumber: 0 }), [inactiveColor]);
    const themeColor = { themeColor: 'inactive' };
    const [spec] = buildLineDecorationSpecs(
      [3],
      settingsWith({ activeLineNumber: 0, inactiveColor: themeColor })
    );
    assert.strictEqual(spec.color, themeColor);
  });
});

describe('Test mark diagnostic lines', () => {
  it('Must keep errors and warnings only, letting an error win its line', () => {
    const marked = markDiagnosticLines([
      { line: 3, severity: 1 },
      { line: 3, severity: 0 },
      { line: 7, severity: 2 },
      { line: 9, severity: 3 },
      { line: 4, severity: 1 },
    ]);
    assert.deepStrictEqual(
      marked,
      marks([
        [3, 'error'],
        [4, 'warning'],
      ])
    );
  });
});

describe('Test diagnostic colors on line numbers', () => {
  it('Must color an error line over the active line itself', () => {
    const [spec] = buildLineDecorationSpecs(
      [2],
      settingsWith({
        activeLineNumber: 2,
        enableDiagnostics: true,
        errorColor: '#ff0000',
      }),
      marks([[2, 'error']])
    );
    assert.strictEqual(spec.color, '#ff0000');
  });

  it('Must color a warning line over its repeating digits', () => {
    const [spec] = buildLineDecorationSpecs(
      [11],
      settingsWith({
        activeLineNumber: 0,
        enableRepeatingDigits: true,
        enableDiagnostics: true,
        warningColor: '#123456',
      }),
      marks([[11, 'warning']])
    );
    assert.strictEqual(spec.label, '11');
    assert.strictEqual(spec.color, '#123456');
  });

  it('Must pass a diagnostic theme color through by identity', () => {
    const themeColor = { themeColor: 'warning' };
    const [spec] = buildLineDecorationSpecs(
      [3],
      settingsWith({
        activeLineNumber: 0,
        enableDiagnostics: true,
        warningColor: themeColor,
      }),
      marks([[3, 'warning']])
    );
    assert.strictEqual(spec.color, themeColor);
  });

  it('Must ignore the marks entirely while diagnostics are disabled', () => {
    const lineIndexes = [0, 2, 11, 12];
    const settings = settingsWith({
      activeLineNumber: 0,
      enableDiagnostics: false,
      enableRepeatingDigits: true,
      enableSequentialDigits: true,
    });
    const withMarks = buildLineDecorationSpecs(
      lineIndexes,
      settings,
      marks([
        [0, 'error'],
        [2, 'warning'],
        [11, 'error'],
        [12, 'warning'],
      ])
    );
    const withoutMarks = buildLineDecorationSpecs(lineIndexes, settings, new Map());
    assert.deepStrictEqual(withMarks, withoutMarks);
  });
});
