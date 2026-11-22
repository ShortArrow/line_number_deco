import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { toDecorationOptions } from '../core';
import { buildLineDecorationSpecs, DecorationSettings, DiagnosticMark } from '../decorations';
import { isPulseActive, PULSE_PERIOD_MS, pulseOpacity } from '../pulse';

// Issue #97: error and warning line numbers breathe slowly when asked to,
// never fast enough to count as a flash, and not at all under reduced motion.

describe('Test the pulse of diagnostic line numbers', () => {
  it('Must take between one and two seconds per breath', () => {
    assert.ok(PULSE_PERIOD_MS >= 1000 && PULSE_PERIOD_MS <= 2000, `${PULSE_PERIOD_MS} ms`);
  });

  it('Must start each breath fully opaque and be dimmest halfway through it', () => {
    assert.strictEqual(pulseOpacity(0), 1);
    const dimmest = pulseOpacity(PULSE_PERIOD_MS / 2);
    for (let t = 0; t < PULSE_PERIOD_MS; t += 10) {
      assert.ok(pulseOpacity(t) >= dimmest && pulseOpacity(t) <= 1, `at ${t} ms`);
    }
    assert.ok(dimmest < 1, 'a breath that never dims is no pulse');
  });

  it('Must keep the dimmest point legible', () => {
    assert.ok(pulseOpacity(PULSE_PERIOD_MS / 2) >= 0.5);
  });

  it('Must step in hundredths, so a frame repeats a style already drawn', () => {
    for (let t = 0; t < PULSE_PERIOD_MS; t += 7) {
      assert.strictEqual(pulseOpacity(t), Math.round(pulseOpacity(t) * 100) / 100, `at ${t} ms`);
    }
  });

  it('Must repeat each breath exactly', () => {
    for (const t of [0, 123, 800, 1234]) {
      assert.strictEqual(pulseOpacity(t + PULSE_PERIOD_MS).toFixed(6), pulseOpacity(t).toFixed(6));
    }
  });

  // WCAG 2.3.1 allows at most three flashes in any one second.
  it('Must dim no more than three times in any one second', () => {
    for (let start = 0; start < 3 * PULSE_PERIOD_MS; start += 50) {
      // A dim begins wherever the opacity turns from rising, or from the
      // start of the second, to falling; a level step continues either.
      let dims = 0;
      let rising = true;
      for (let t = start; t < start + 1000; t += 5) {
        const step = pulseOpacity(t + 5) - pulseOpacity(t);
        if (step < 0 && rising) {
          dims++;
          rising = false;
        } else if (step > 0) {
          rising = true;
        }
      }
      assert.ok(dims <= 3, `${dims} dims in the second from ${start} ms`);
    }
  });

  it('Must pulse only when enabled and motion is not reduced', () => {
    assert.strictEqual(isPulseActive(false, 'off'), false);
    assert.strictEqual(isPulseActive(true, 'off'), true);
    assert.strictEqual(isPulseActive(true, 'on'), false);
  });

  it('Must pulse under the default reduced motion setting, which an extension cannot resolve', () => {
    assert.strictEqual(isPulseActive(true, 'auto'), true);
  });
});

const settingsWith = (overrides: Partial<DecorationSettings> = {}): DecorationSettings => ({
  enableRelativeLine: true,
  activeLineNumber: 0,
  activeColor: '#aaaaaa',
  inactiveColor: '#bbbbbb',
  enableRainbow: false,
  centerColorOfRainbow: '#0000ff',
  rainbowContrast: undefined,
  enableRepeatingDigits: false,
  repeatingDigitsColor: '#cccccc',
  enableSequentialDigits: false,
  sequentialDigitsColor: '#dddddd',
  enableMultiplesOfFive: false,
  multiplesOfFiveColor: '#abcdef',
  enableDiagnostics: true,
  errorColor: '#eeeeee',
  warningColor: '#ffffff',
  diagnosticOpacity: undefined,
  ...overrides,
});

const marks = new Map<number, DiagnosticMark>([
  [2, 'error'],
  [3, 'warning'],
]);

describe('Test the opacity diagnostic line numbers are drawn at', () => {
  it('Must give the pulse opacity to error and warning lines only', () => {
    const specs = buildLineDecorationSpecs([1, 2, 3], settingsWith({ diagnosticOpacity: 0.6 }), marks);
    assert.deepStrictEqual(specs.map((spec) => spec.opacity), [undefined, 0.6, 0.6]);
  });

  it('Must give no opacity while nothing pulses', () => {
    const specs = buildLineDecorationSpecs([1, 2, 3], settingsWith(), marks);
    assert.deepStrictEqual(specs.map((spec) => spec.opacity), [undefined, undefined, undefined]);
  });

  it('Must give no opacity while diagnostics are not colored', () => {
    const specs = buildLineDecorationSpecs(
      [1, 2, 3],
      settingsWith({ enableDiagnostics: false, diagnosticOpacity: 0.6 }),
      marks
    );
    assert.deepStrictEqual(specs.map((spec) => spec.opacity), [undefined, undefined, undefined]);
  });
});

describe('Test the opacity reaching the editor', () => {
  const styleOf = async (opacity: number | undefined) => {
    const document = await vscode.workspace.openTextDocument({ content: 'a\nb\n' });
    const [decoration] = toDecorationOptions([{ lineIndex: 0, label: '1', color: '#eeeeee', opacity }], document, 1);
    return decoration.renderOptions?.before?.textDecoration;
  };

  it('Must draw a pulsing number at its opacity', async () => {
    assert.strictEqual(
      await styleOf(0.6),
      'box-sizing: border-box; text-align: right; padding-right: 1em; opacity: 0.6;'
    );
  });

  it('Must draw a number with no opacity exactly as before the pulse existed', async () => {
    assert.strictEqual(await styleOf(undefined), 'box-sizing: border-box; text-align: right; padding-right: 1em;');
  });
});
