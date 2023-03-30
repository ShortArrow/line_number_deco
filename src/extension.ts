import * as vscode from "vscode";

const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

async function updateRelativeLineNumbers(
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

  const labelWidth = document.lineCount.toString().length;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const lineRange = document.lineAt(lineIndex).range;
    const isCurrentLine = lineIndex === activeLineNumber;

    const label = isCurrentLine
      ? String(activeLineNumber + 1)
      : String(Math.abs(lineIndex - activeLineNumber));

    const rangeScope = new vscode.Range(lineRange.start, lineRange.start);
    const decoration: vscode.DecorationOptions = {
      range: rangeScope,
      renderOptions: {
        before: {
          width: `${labelWidth}em`,
          align: "right",
          contentText: label,
          color: isCurrentLine
            ? activeLineNumberColor
            : inactiveLineNumberColor,
          textDecoration: `
            box-sizing: border-box;
            text-align: right;
            padding-right: 1em;
          `,
          fontWeight: "bold",
        } as vscode.DecorationRenderOptions,
      } as vscode.DecorationRenderOptions,
    };

    decorations.push(decoration);
  }
  const enableRlativeLine = getEnableRelativeLineDefault();

  editor.setDecorations(decorationType, enableRlativeLine ? decorations : []);
}

function getEnableRelativeLineDefault() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");
  return config.get<boolean>("enableRlativeLineOnDefault",true);
}

function updateEnableRelativeLineDefault(set: boolean) {
  const extensionConfigs = vscode.workspace.getConfiguration("LineNumberDeco");
  extensionConfigs.update("enableRlativeLineOnDefault", set);
}

function updateEnableRelativeLineDefaultGlobal(set: boolean) {
  const extensionConfigs = vscode.workspace.getConfiguration("LineNumberDeco");
  extensionConfigs.update("enableRlativeLineOnDefault", set, vsCodeGlobal);
}

function getInactiveLineNumberColor() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");

  return config.get<string>("foreground") !== ""
    ? config.get<string>("foreground")
    : new vscode.ThemeColor("LineNumberDeco.foreground");
}

function getActiveLineNumberColor() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");

  return config.get<string>("activeForeground") !== ""
    ? config.get<string>("activeForeground")
    : new vscode.ThemeColor("LineNumberDeco.activeForeground");
}

export function enableDeco() {
  const decorationType = vscode.window.createTextEditorDecorationType({});
  vscode.window.onDidChangeActiveTextEditor((e) => {
    updateRelativeLineNumbers(e, decorationType);
  });
  vscode.window.onDidChangeTextEditorSelection((ee) => {
    updateRelativeLineNumbers(ee.textEditor, decorationType);
  });
}

export function activate(context: vscode.ExtensionContext) {
  enableDeco();
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "line-number-doco.enableRelativeLineNumbers",
      () => updateEnableRelativeLineDefault(true)
    ),
    vscode.commands.registerCommand(
      "line-number-doco.enableRelativeLineNumbersGlobal",
      () => updateEnableRelativeLineDefaultGlobal(true)
    ),
    vscode.commands.registerCommand(
      "line-number-doco.disableRelativeLineNumbers",
      () => updateEnableRelativeLineDefault(false)
    ),
    vscode.commands.registerCommand(
      "line-number-doco.disableRelativeLineNumbersGlobal",
      () => updateEnableRelativeLineDefaultGlobal(false)
    )
  );
}

export function deactivate() {}
