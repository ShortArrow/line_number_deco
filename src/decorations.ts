import { shiftHue } from "./colors";

/**
 * A color the editor can paint a line number with.
 *
 * Production passes a vscode.ThemeColor straight through this slot; the tests
 * pass a plain object. Nothing here inspects a non-string color, so the module
 * never needs to know which of the two it is holding — which is what keeps it
 * free of any vscode import.
 */
export type LineColor = string | { themeColor?: unknown; id?: unknown };

/** One line's decoration, decided but not yet handed to the editor. */
export interface LineDecorationSpec {
  lineIndex: number;
  label: string;
  color: LineColor;
}

/** Everything the computation reads, lifted out of the configuration. */
export interface DecorationSettings {
  enableRelativeLine: boolean;
  activeLineNumber: number;
  activeColor: LineColor;
  inactiveColor: LineColor;
  enableRainbow: boolean;
  centerColorOfRainbow: string;
  enableRepeatingDigits: boolean;
  repeatingDigitsColor: string;
  enableSequentialDigits: boolean;
  sequentialDigitsColor: string;
}

/**
 * check repeating digits
 * @param lineNumber line number
 * @returns boolean if repeating digits, return true
 */
export function isRepeatingDigits(lineNumber: string) {
  return lineNumber.match(/^(\d)\1+$/) !== null;
}

/**
 * check sequential digits (poker straights: 123, 543, 10)
 * @param lineNumber line number
 * @returns true when every adjacent digit steps by +1 or -1 in one direction
 */
export function isSequentialDigits(lineNumber: string): boolean {
  if (lineNumber.length < 2) {
    return false;
  }
  const step = Number(lineNumber[1]) - Number(lineNumber[0]);
  if (step !== 1 && step !== -1) {
    return false;
  }
  for (let i = 1; i < lineNumber.length; i++) {
    if (Number(lineNumber[i]) - Number(lineNumber[i - 1]) !== step) {
      return false;
    }
  }
  return true;
}

/**
 * The label and color of every line to decorate.
 *
 * The disabled case returns nothing rather than being gated at the call site,
 * so the decision of what a line shows lives in one place that no editor is
 * needed to test.
 *
 * @param lineIndexes zero-based lines to decorate, in the order to emit them
 * @param settings the configured colors and modes
 */
export function buildLineDecorationSpecs(
  lineIndexes: readonly number[],
  settings: DecorationSettings
): LineDecorationSpec[] {
  if (!settings.enableRelativeLine) {
    return [];
  }
  const specs: LineDecorationSpec[] = [];
  for (const lineIndex of lineIndexes) {
    const isCurrentLine = lineIndex === settings.activeLineNumber;
    const distance = Math.abs(lineIndex - settings.activeLineNumber);
    const label = isCurrentLine
      ? String(settings.activeLineNumber + 1)
      : String(distance);
    const color = isCurrentLine
      ? settings.activeColor
      : (settings.enableRepeatingDigits && isRepeatingDigits(label))
        ? settings.repeatingDigitsColor
        : (settings.enableSequentialDigits && isSequentialDigits(label))
          ? settings.sequentialDigitsColor
          : settings.enableRainbow
            ? shiftHue(settings.centerColorOfRainbow, distance)
            : settings.inactiveColor;
    specs.push({ lineIndex, label, color });
  }
  return specs;
}
