import * as vscode from "vscode";
import { shiftHue } from "./colors";
import { visibleLineIndexes } from "./visibleLines";
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
  const lineIndexes = visibleLineIndexes(
    editor.visibleRanges.map((r) => ({ startLine: r.start.line, endLine: r.end.line })),
    document.lineCount
  );
  for (const lineIndex of lineIndexes) {
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
