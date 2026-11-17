import * as vscode from "vscode";
import {
  buildLineDecorationSpecs,
  markDiagnosticLines,
  minimumContrastOf,
  rainbowBackgroundOf,
  DecorationSettings,
  DiagnosticMark,
  LineDecorationSpec,
} from "./decorations";
import { visibleLineIndexes } from "./visibleLines";
import {
  getEnableDiagnostics,
  getErrorLineNumberColor,
  getWarningLineNumberColor,
  getColorAtCenterOfRainbow,
  getEnableRainbow,
  getRainbowMinimumContrast,
  getEnableRelativeLine,
  getEnableRepeatingDigits,
  getRepeatingDigitsLineNumberColor,
  getEnableSequentialDigits,
  getSequentialDigitsLineNumberColor,
  getEnableMultiplesOfFive,
  getMultiplesOfFiveLineNumberColor,
  getInactiveLineNumberColor,
  getActiveLineNumberColor,
} from "./config";

export { isRepeatingDigits, isSequentialDigits } from "./decorations";

/**
 * Read every setting the decoration computation depends on, preview-aware,
 * together with the editor's current cursor line.
 * @param editor the editor whose cursor line is the origin of relative numbers
 * @param diagnosticOpacity where error and warning lines are in their pulse, or undefined while nothing pulses
 */
export function readDecorationSettings(
  editor: vscode.TextEditor,
  diagnosticOpacity?: number
): DecorationSettings {
  return {
    enableRelativeLine: getEnableRelativeLine(),
    activeLineNumber: editor.selection.active.line,
    activeColor: getActiveLineNumberColor(),
    inactiveColor: getInactiveLineNumberColor(),
    enableRainbow: getEnableRainbow(),
    centerColorOfRainbow: getColorAtCenterOfRainbow(),
    rainbowContrast: rainbowContrastOf(minimumContrastOf(getRainbowMinimumContrast())),
    enableRepeatingDigits: getEnableRepeatingDigits(),
    repeatingDigitsColor: getRepeatingDigitsLineNumberColor(),
    enableSequentialDigits: getEnableSequentialDigits(),
    sequentialDigitsColor: getSequentialDigitsLineNumberColor(),
    enableMultiplesOfFive: getEnableMultiplesOfFive(),
    multiplesOfFiveColor: getMultiplesOfFiveLineNumberColor(),
    enableDiagnostics: getEnableDiagnostics(),
    errorColor: getErrorLineNumberColor(),
    warningColor: getWarningLineNumberColor(),
    diagnosticOpacity,
  };
}

/** The minimum contrast against the current theme kind's background, or undefined for off. */
function rainbowContrastOf(ratio: number | undefined): DecorationSettings["rainbowContrast"] {
  return ratio === undefined
    ? undefined
    : { background: rainbowBackgroundOf(vscode.window.activeColorTheme.kind), ratio };
}

/**
 * The worst error/warning mark per line among the document's current diagnostics.
 * @param uri the document whose diagnostics are read
 */
export function readDiagnosticMarks(uri: vscode.Uri): Map<number, DiagnosticMark> {
  return markDiagnosticLines(
    vscode.languages.getDiagnostics(uri).map((diagnostic) => ({
      line: diagnostic.range.start.line,
      severity: diagnostic.severity,
    }))
  );
}

/**
 * CSS smuggled into each number through `textDecoration`, which VS Code
 * appends to the generated style attribute. The API takes only a string, so
 * the rules live here once instead of being rebuilt for every line.
 */
const lineNumberCss =
  "box-sizing: border-box; text-align: right; padding-right: 1em;";

/**
 * Turn decided line specs into editor decorations drawn before each line's text.
 * A spec whose line no longer exists in the document is logged and skipped.
 * @param specs one per line to decorate
 * @param document the document the line indexes refer to
 * @param labelWidth the label column width, in digits
 */
export function toDecorationOptions(
  specs: readonly LineDecorationSpec[],
  document: vscode.TextDocument,
  labelWidth: number
): vscode.DecorationOptions[] {
  const decorations: vscode.DecorationOptions[] = [];
  for (const { lineIndex, label, color, opacity } of specs) {
    try {
      const lineRange = document.lineAt(lineIndex).range;

      const rangeScope = new vscode.Range(lineRange.start, lineRange.start);
      const lineNumberStyle = {
        width: `${labelWidth / 2 + 0.5}em`,
        align: "right",
        contentText: label,
        color,
        textDecoration: opacity === undefined ? lineNumberCss : `${lineNumberCss} opacity: ${opacity};`,
        fontWeight: "bold",
      } as vscode.DecorationInstanceRenderOptions;
      const lineNumberAreaStyle: vscode.DecorationInstanceRenderOptions = {
        before: lineNumberStyle,
      } as vscode.DecorationInstanceRenderOptions;
      const decoration: vscode.DecorationOptions = {
        range: rangeScope,
        renderOptions: lineNumberAreaStyle,
      };
      decorations.push(decoration);
    }
    catch (error) {
      console.error(error);
    }
  }
  return decorations;
}

/**
 * The visible line indexes of an editor.
 * @param editor the editor whose visible ranges are read
 */
export function editorVisibleLineIndexes(editor: vscode.TextEditor): number[] {
  return visibleLineIndexes(
    editor.visibleRanges.map((r) => ({ startLine: r.start.line, endLine: r.end.line })),
    editor.document.lineCount
  );
}

/**
 * update relative line numbers
 * @param editor
 * @param decorationType
 * @param diagnosticOpacity where error and warning lines are in their pulse, or undefined while nothing pulses
 * @returns void
 */
export async function updateRelativeLineNumbers(
  editor: vscode.TextEditor | undefined,
  decorationType: vscode.TextEditorDecorationType,
  diagnosticOpacity?: number
) {
  if (!editor) {
    return;
  }
  const document = editor.document;
  const labelWidth = document.lineCount.toString().length;
  const lineIndexes = editorVisibleLineIndexes(editor);
  const diagnosticMarks = readDiagnosticMarks(document.uri);
  const specs = buildLineDecorationSpecs(lineIndexes, readDecorationSettings(editor, diagnosticOpacity), diagnosticMarks);
  editor.setDecorations(decorationType, toDecorationOptions(specs, document, labelWidth));
}
