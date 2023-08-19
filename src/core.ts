import * as vscode from "vscode";
import { shiftHue } from "./colors";
import { 
    getActiveLineNumberColor,
    getColorAtCenterOfRainbow,
    getEnableRainbow,
    getEnableRelativeLineDefault,
    getInactiveLineNumberColor,
} from "./config";

const decorations: vscode.DecorationOptions[] = [];

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

  const activeLineNumber = editor.selection.active.line;
  const document = editor.document;
  const activeLineNumberColor = getActiveLineNumberColor();
  const inactiveLineNumberColor = getInactiveLineNumberColor();
  const enableRainbow = getEnableRainbow();
  const centerColorOfRainbow = getColorAtCenterOfRainbow();
  const labelWidth = document.lineCount.toString().length;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
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
  const enableRlativeLine = getEnableRelativeLineDefault();

  editor.setDecorations(decorationType, enableRlativeLine ? decorations : []);
}