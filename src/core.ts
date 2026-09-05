import * as vscode from "vscode";
import { buildLineDecorationSpecs } from "./decorations";
import { visibleLineIndexes } from "./visibleLines";
import {
  getColorAtCenterOfRainbow,
  getEnableRainbow,
  getEnableRelativeLine,
  getEnableRepeatingDigits,
  getColorAtRepeatingDigits,
  getEnableSequentialDigits,
  getColorAtSequentialDigits,
  getInactiveLineNumberColor,
  getActiveLineNumberColor,
} from "./config";

export { isRepeatingDigits, isSequentialDigits } from "./decorations";

/**
 * update relative line numbers
 * @param editor
 * @param decorationType
 * @returns void
 */
export async function updateRelativeLineNumbers(
  editor: vscode.TextEditor | undefined,
  decorationType: vscode.TextEditorDecorationType
) {
  if (!editor) {
    return;
  }
  const decorations: vscode.DecorationOptions[] = [];

  const document = editor.document;
  const labelWidth = document.lineCount.toString().length;
  const lineIndexes = visibleLineIndexes(
    editor.visibleRanges.map((r) => ({ startLine: r.start.line, endLine: r.end.line })),
    document.lineCount
  );
  const specs = buildLineDecorationSpecs(lineIndexes, {
    enableRelativeLine: getEnableRelativeLine(),
    activeLineNumber: editor.selection.active.line,
    activeColor: getActiveLineNumberColor(),
    inactiveColor: getInactiveLineNumberColor(),
    enableRainbow: getEnableRainbow(),
    centerColorOfRainbow: getColorAtCenterOfRainbow(),
    enableRepeatingDigits: getEnableRepeatingDigits(),
    repeatingDigitsColor: getColorAtRepeatingDigits(),
    enableSequentialDigits: getEnableSequentialDigits(),
    sequentialDigitsColor: getColorAtSequentialDigits(),
  });
  for (const { lineIndex, label, color } of specs) {
    try {
      const lineRange = document.lineAt(lineIndex).range;

      const rangeScope = new vscode.Range(lineRange.start, lineRange.start);
      const lineNumberStyle = {
        width: `${labelWidth / 2 + 0.5}em`,
        align: "right",
        contentText: label,
        color,
        textDecoration: `
            box-sizing: border-box;
            text-align: right;
            padding-right: 1em;
          `,
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

  editor.setDecorations(decorationType, decorations);
}
