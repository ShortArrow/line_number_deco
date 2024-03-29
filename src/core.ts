import * as vscode from "vscode";
import { shiftHue } from "./colors";
import {
  getColorAtCenterOfRainbow,
  getEnableRainbow,
  getEnableRelativeLine,
  getEnableRepeatingDigits,
  getColorAtRepeatingDigits,
  getInactiveLineNumberColor,
  getActiveLineNumberColor,
} from "./config";

/**
 * check repeating digits
 * @param lineNumber line number
 * @returns boolean if repeating digits, return true
 */
export function isRepeatingDigits(lineNumber: string) {
  return lineNumber.match(/^(\d)\1+$/) !== null;
}

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

  const activeLineNumber = editor.selection.active.line;
  const document = editor.document;
  const activeLineNumberColor = getActiveLineNumberColor();
  const inactiveLineNumberColor = getInactiveLineNumberColor();
  const enableRainbow = getEnableRainbow();
  const enableRepeatingDigits = getEnableRepeatingDigits();
  const repeatingDigitsColor = getColorAtRepeatingDigits();
  const centerColorOfRainbow = getColorAtCenterOfRainbow();
  const labelWidth = document.lineCount.toString().length;
  const endLine = document.lineCount < editor.visibleRanges[0].end.line + 2 ? document.lineCount : editor.visibleRanges[0].end.line + 2;
  const startLine = editor.visibleRanges[0].start.line - 1 < 0 ? 0 : editor.visibleRanges[0].start.line;
  for (let lineIndex = startLine; lineIndex < endLine; lineIndex++) {
    try {
      const lineRange = document.lineAt(lineIndex).range;
      const isCurrentLine = lineIndex === activeLineNumber;

      const label = isCurrentLine
        ? String(activeLineNumber + 1)
        : String(Math.abs(lineIndex - activeLineNumber));

      const rangeScope = new vscode.Range(lineRange.start, lineRange.start);
      const lineNumberStyle = {
        width: `${labelWidth / 2 + 0.5}em`,
        align: "right",
        contentText: label,
        color: isCurrentLine
          ? activeLineNumberColor
          : (enableRepeatingDigits && isRepeatingDigits(label))
            ? repeatingDigitsColor
            : enableRainbow
              ? shiftHue(centerColorOfRainbow, Math.abs(lineIndex - activeLineNumber))
              : inactiveLineNumberColor,
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
  const enableRelativeLine = getEnableRelativeLine();

  editor.setDecorations(decorationType, enableRelativeLine ? decorations : []);
}
