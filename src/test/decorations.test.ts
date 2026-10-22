import * as assert from 'assert';
import { describe, it } from 'mocha';
import { contrastRatio, shiftHue } from '../colors';
import {
  DecorationSettings,
  DiagnosticMark,
  LineColor,
  buildLineDecorationSpecs,
  isMultipleOfFive,
  minimumContrastOf,
  rainbowBackgroundOf,
  markDiagnosticLines,
} from '../decorations';

const activeColor = '#aaaaaa';
const inactiveColor = '#bbbbbb';
const repeatingColor = '#cccccc';
const sequentialColor = '#dddddd';
const centerColor = '#0000ff';
const errorColor = '#eeeeee';
const warningColor = '#ffffff';
const multiplesOfFiveColor = '#abcdef';

/** The settings every case starts from: one active line, every mode off. */
const settingsWith = (overrides: Partial<DecorationSettings> = {}): DecorationSettings => ({
  enableRelativeLine: true,
  activeLineNumber: 10,
  activeColor,
  inactiveColor,
  enableRainbow: false,
  centerColorOfRainbow: centerColor,
  rainbowContrast: undefined,
  enableRepeatingDigits: false,
  repeatingDigitsColor: repeatingColor,
  enableSequentialDigits: false,
  sequentialDigitsColor: sequentialColor,
  enableMultiplesOfFive: false,
  multiplesOfFiveColor,
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

  it('Must keep every rainbow line readable against the background it is given', () => {
    const lineIndexes = Array.from({ length: 16 }, (_, index) => index + 1);
    const colors = colorsOf(lineIndexes, { activeLineNumber: 0, enableRainbow: true, rainbowContrast: { background: '#ffffff', ratio: 4.5 } });
    colors.forEach((color, index) => {
      const ratio = contrastRatio(color as string, '#ffffff');
      assert.ok(ratio >= 4.5, `line ${index + 1}: ${color} is ${ratio.toFixed(2)}:1`);
    });
  });

  it('Must let a lower minimum leave the rainbow fainter than 4.5:1', () => {
    const lineIndexes = Array.from({ length: 16 }, (_, index) => index + 1);
    const ratios = colorsOf(lineIndexes, { activeLineNumber: 0, enableRainbow: true, rainbowContrast: { background: '#ffffff', ratio: 3 } })
      .map((color) => contrastRatio(color as string, '#ffffff'));
    assert.ok(ratios.every((ratio) => ratio >= 3), ratios.map((ratio) => ratio.toFixed(2)).join(' '));
    assert.ok(ratios.some((ratio) => ratio < 4.5), ratios.map((ratio) => ratio.toFixed(2)).join(' '));
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

  const highlightCases: {
    rule: string;
    lineIndex: number;
    label: string;
    overrides: (color: LineColor) => Partial<DecorationSettings>;
  }[] = [
    {
      rule: 'repeating',
      lineIndex: 11,
      label: '11',
      overrides: (color) => ({ enableRepeatingDigits: true, repeatingDigitsColor: color }),
    },
    {
      rule: 'sequential',
      lineIndex: 12,
      label: '12',
      overrides: (color) => ({ enableSequentialDigits: true, sequentialDigitsColor: color }),
    },
    {
      rule: 'multiples of five',
      lineIndex: 5,
      label: '5',
      overrides: (color) => ({ enableMultiplesOfFive: true, multiplesOfFiveColor: color }),
    },
  ];

  for (const { rule, lineIndex, label, overrides } of highlightCases) {
    it(`Must pass a ${rule} theme color through by identity`, () => {
      const themeColor = { themeColor: rule };
      const [spec] = buildLineDecorationSpecs(
        [lineIndex],
        settingsWith({ activeLineNumber: 0, ...overrides(themeColor) })
      );
      assert.strictEqual(spec.label, label);
      assert.strictEqual(spec.color, themeColor);
    });
  }
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

describe('Test check multiples of five', () => {
  const cases: [number, boolean][] = [
    [0, false],
    [1, false],
    [4, false],
    [5, true],
    [10, true],
    [15, true],
    [23, false],
    [100, true],
  ];
  cases.forEach(([distance, expected]) => {
    it(`Must judge distance ${distance} as ${expected ? '' : 'not '}a multiple of five`, () => {
      assert.strictEqual(isMultipleOfFive(distance), expected);
    });
  });
});

describe('Test multiples of five colors on line numbers', () => {
  const fromTop = { activeLineNumber: 0, enableMultiplesOfFive: true };

  it('Must color a line five away with the multiples of five color', () => {
    assert.deepStrictEqual(colorsOf([5], fromTop), [multiplesOfFiveColor]);
  });

  it('Must let sequential digits win over a multiple of five', () => {
    assert.deepStrictEqual(
      colorsOf([10], { ...fromTop, enableSequentialDigits: true }),
      [sequentialColor]
    );
    assert.deepStrictEqual(
      colorsOf([10], { ...fromTop, enableSequentialDigits: false }),
      [multiplesOfFiveColor]
    );
  });

  it('Must let repeating digits win over a multiple of five', () => {
    assert.deepStrictEqual(
      colorsOf([55], { ...fromTop, enableRepeatingDigits: true }),
      [repeatingColor]
    );
  });

  it('Must let a multiple of five win over the rainbow', () => {
    assert.deepStrictEqual(
      colorsOf([15], { ...fromTop, enableRainbow: true }),
      [multiplesOfFiveColor]
    );
  });

  it('Must leave a line that is not a multiple of five to the rainbow', () => {
    assert.deepStrictEqual(
      colorsOf([7], { ...fromTop, enableRainbow: true }),
      [shiftHue(centerColor, 7)]
    );
  });

  it('Must keep the active color on the active line whose own label is a multiple of five', () => {
    const [spec] = buildLineDecorationSpecs(
      [9],
      settingsWith({ activeLineNumber: 9, enableMultiplesOfFive: true })
    );
    assert.strictEqual(spec.label, '10');
    assert.strictEqual(spec.color, activeColor);
  });

  it('Must color exactly as before while multiples of five are disabled', () => {
    const lineIndexes = [0, 5, 7, 10, 15, 20];
    const disabled = { activeLineNumber: 0, enableMultiplesOfFive: false };
    assert.deepStrictEqual(
      colorsOf(lineIndexes, disabled),
      [activeColor, inactiveColor, inactiveColor, inactiveColor, inactiveColor, inactiveColor]
    );
    assert.deepStrictEqual(
      colorsOf(lineIndexes, { ...disabled, enableRainbow: true }),
      [activeColor, ...[5, 7, 10, 15, 20].map((distance) => shiftHue(centerColor, distance))]
    );
  });

  it('Must let an error win over a multiple of five', () => {
    const [spec] = buildLineDecorationSpecs(
      [5],
      settingsWith({ ...fromTop, enableDiagnostics: true }),
      marks([[5, 'error']])
    );
    assert.strictEqual(spec.color, errorColor);
  });
});

describe('Test the background the rainbow is kept readable against', () => {
  const cases: [string, number, string][] = [
    ['light', 1, '#ffffff'],
    ['dark', 2, '#1f1f1f'],
    ['high contrast', 3, '#000000'],
    ['high contrast light', 4, '#ffffff'],
  ];
  for (const [name, kind, background] of cases) {
    it(`Must become ${background} for a ${name} theme`, () => {
      assert.strictEqual(rainbowBackgroundOf(kind), background);
    });
  }
});

describe('Test the minimum contrast a rainbow option names', () => {
  const cases: [string, number | undefined][] = [
    ['off', undefined],
    ['3', 3],
    ['4.5', 4.5],
    ['7', 7],
    ['sideways', 4.5],
  ];
  for (const [option, ratio] of cases) {
    it(`Must become ${ratio} for ${option}`, () => {
      assert.strictEqual(minimumContrastOf(option), ratio);
    });
  }
});
