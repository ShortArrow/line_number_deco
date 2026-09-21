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
  enableDiagnostics: boolean;
  errorColor: LineColor;
  warningColor: LineColor;
}

/** The worst diagnostic a line carries, among the two severities that color it. */
export type DiagnosticMark = "error" | "warning";

/**
 * Which lines carry an error and which only a warning.
 *
 * Severity is vscode's numbering (0 Error, 1 Warning, 2 Information, 3 Hint)
 * passed as a plain number, which is what keeps this module free of vscode.
 * Information and Hint are dropped rather than marked, because nothing colors
 * them; an error on a line already marked as a warning takes the line.
 *
 * @param entries one per diagnostic, at the line its range starts on
 */
export function markDiagnosticLines(
  entries: readonly { line: number; severity: number }[]
): Map<number, DiagnosticMark> {
  const marks = new Map<number, DiagnosticMark>();
  for (const { line, severity } of entries) {
    if (severity === 0) {
      marks.set(line, "error");
      continue;
    }
    if (severity === 1 && marks.get(line) !== "error") {
      marks.set(line, "warning");
    }
  }
  return marks;
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
 * The color one line's number is painted, by the first rule that claims it.
 *
 * A diagnostic outranks everything including the current line: a line the
 * editor is already flagging is worth more than knowing where the cursor is,
 * and the cursor is visible anyway.
 *
 * @param label the text the line will show, which the digit rules read
 * @param distance lines between this one and the active one
 * @param isCurrentLine whether this is the line the cursor is on
 * @param mark the worst diagnostic on this line, when there is one
 * @param settings the configured colors and modes
 */
function colorOfLine(
  label: string,
  distance: number,
  isCurrentLine: boolean,
  mark: DiagnosticMark | undefined,
  settings: DecorationSettings
): LineColor {
  if (settings.enableDiagnostics && mark === "error") {
    return settings.errorColor;
  }
  if (settings.enableDiagnostics && mark === "warning") {
    return settings.warningColor;
  }
  if (isCurrentLine) {
    return settings.activeColor;
  }
  if (settings.enableRepeatingDigits && isRepeatingDigits(label)) {
    return settings.repeatingDigitsColor;
  }
  if (settings.enableSequentialDigits && isSequentialDigits(label)) {
    return settings.sequentialDigitsColor;
  }
  if (settings.enableRainbow) {
    return shiftHue(settings.centerColorOfRainbow, distance);
  }
  return settings.inactiveColor;
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
 * @param diagnosticSeverities the worst diagnostic per line, from
 *   {@link markDiagnosticLines}; empty when nothing is flagged
 */
export function buildLineDecorationSpecs(
  lineIndexes: readonly number[],
  settings: DecorationSettings,
  diagnosticSeverities: ReadonlyMap<number, DiagnosticMark> = new Map()
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
    const color = colorOfLine(
      label,
      distance,
      isCurrentLine,
      diagnosticSeverities.get(lineIndex),
      settings
    );
    specs.push({ lineIndex, label, color });
  }
  return specs;
}
