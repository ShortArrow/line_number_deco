import * as vscode from "vscode";

const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

/**
 * get is dark theme
 * @returns if dark theme, return true
 */
function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

/**
 * shift hue of color code
 * @param colorCode color code (e.g. #ffffff)
 * @param shift shift value (0～11)
 * @returns shifted color code (e.g. #ffffff)
 */
function shiftHue(colorCode: string, shift: number) {
  const [r, g, b] = rgbFromColorCode(colorCode);
  const [h, s, l] = hslFromRgb(r, g, b);
  const huePerStep = 360 / 16;
  const hue = (((h + ( shift) * huePerStep) % 360) + 360) % 360;
  return colorCodeFromHsl(hue, s, l);
}

/**
 * get rgb value from color code
 * @param colorCode color code (e.g. #ffffff)
 * @returns RGB value array [r, g, b]
 */
function rgbFromColorCode(colorCode: string): number[] {
  const hex = colorCode.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * RGB value to HSL value conversion helper function
 * @param r red component (0～255)
 * @param g green component (0～255)
 * @param b blue component (0～255)
 * @returns HSL value array [h, s, l]
 */
function hslFromRgb(r: number, g: number, b: number): number[] {
  const min = Math.min(r, g, b) / 255;
  const max = Math.max(r, g, b) / 255;
  const delta = max - min;

  let h, s, l;

  if (delta === 0) {
    h = 0;
  } else if (max === r / 255) {
    h = 60 * ((g / 255 - b / 255) / delta);
  } else if (max === g / 255) {
    h = 60 * ((b / 255 - r / 255) / delta + 2);
  } else {
    h = 60 * ((r / 255 - g / 255) / delta + 4);
  }

  if (h < 0) {
    h += 360;
  }

  l = (max + min) / 2;

  if (delta === 0) {
    s = 0;
  } else {
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  return [h, s, l];
}

/**
 * Hsl to #?????? formatted string translation helper function
 * @param h hue
 * @param s saturation
 * @param l luminescence
 * @returns #?????? formatted string
 */
function colorCodeFromHsl(h: number, s: number, l: number): string {
  const [r, g, b] = rgbFromHsl(h, s, l);
  return rgbToColorCode(r, g, b);
}

/**
 * Hsl to rgb translation helper function 
 * @param h 
 * @param s 
 * @param l 
 * @returns HSL value array [h, s, l]
 */
function rgbFromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
      ? [x, c, 0]
      : hp < 3
      ? [0, c, x]
      : hp < 4
      ? [0, x, c]
      : hp < 5
      ? [x, 0, c]
      : [c, 0, x];
  const m = l - 0.5 * c;
  const [r, g, b] = [r1 + m, g1 + m, b1 + m];
  return [Math.round(255 * r), Math.round(255 * g), Math.round(255 * b)];
}

/**
 * rgb to #?????? formatted string translation helper function
 * @param r 
 * @param g 
 * @param b 
 * @returns 
 */
function rgbToColorCode(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * update relative line numbers
 * @param editor 
 * @param decorationType 
 * @returns 
 */
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
  const enableRainbow = getEnableRainbow();
  const centerColorOfRainbow = getCenterColorOfRainbow();

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
            : enableRainbow
            ? shiftHue(
                centerColorOfRainbow,
                Math.abs(lineIndex - activeLineNumber)
              )
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

function getEnableRainbow() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");
  return config.get<boolean>("enableRainbow", false);
}

function getCenterColorOfRainbow() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");
  return config.get<string>("centerColorOfRainbow", "#8888FF");
}

function getEnableRelativeLineDefault() {
  const config = vscode.workspace.getConfiguration("LineNumberDeco");
  return config.get<boolean>("enableRlativeLineOnDefault", true);
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

/**
 * enable relative line numbers 
 */
export function enableDeco() {
  const decorationType = vscode.window.createTextEditorDecorationType({});
  vscode.window.onDidChangeActiveTextEditor((e) => {
    updateRelativeLineNumbers(e, decorationType);
  });
  vscode.window.onDidChangeTextEditorSelection((ee) => {
    updateRelativeLineNumbers(ee.textEditor, decorationType);
  });
}

/**
 * activate extension
 * @param context 
 */
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

/**
 * deactivate extension
 */
export function deactivate() {}
